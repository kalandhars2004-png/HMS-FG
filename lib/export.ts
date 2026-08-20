/**
 * Report writers — CSV, XLSX and print-to-PDF with no third-party dependencies.
 *
 * The XLSX path builds a real OOXML workbook (a ZIP of XML parts) rather than
 * renaming a CSV, so Excel opens it without the "format does not match" warning
 * and numbers arrive as numbers. Entries are ZIP-stored (method 0) because that
 * needs no DEFLATE implementation and report-sized sheets do not warrant one.
 */

export interface Column<T = any> {
  header: string;
  /** Cell value. Return a number to keep it numeric in Excel. */
  value: (row: T) => string | number | null | undefined;
}

const enc = new TextEncoder();

/* ------------------------------------------------------------------ CSV */

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  // Guard against CSV injection: spreadsheet apps execute leading =, +, -, @
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCSV<T>(columns: Column<T>[], rows: T[]): Blob {
  const lines = [
    columns.map(c => csvCell(c.header)).join(','),
    ...rows.map(r => columns.map(c => csvCell(c.value(r))).join(',')),
  ];
  // BOM so Excel reads UTF-8 (₹ and accented names survive)
  return new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
}

/* ----------------------------------------------------------------- ZIP */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Detach a view into a standalone ArrayBuffer — TS will not accept a
 *  Uint8Array over an unknown buffer type as a BlobPart. */
const part = (u: Uint8Array): ArrayBuffer =>
  u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

function zip(entries: { name: string; data: Uint8Array }[], mime: string): Blob {
  const parts: ArrayBuffer[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  // Fixed DOS timestamp keeps output byte-identical between runs
  const time = 0;
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1;

  for (const e of entries) {
    const name = enc.encode(e.name);
    const crc = crc32(e.data);
    const size = e.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(8, 0, true); // stored, no compression
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(part(local), part(e.data));

    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    cd.set(name, 46);
    central.push(cd);

    offset += local.length + size;
  }

  const cdSize = central.reduce((s, b) => s + b.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central.map(part), part(eocd)], { type: mime });
}

/* ---------------------------------------------------------------- XLSX */

const xmlEsc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
   // Control characters are illegal in XML 1.0 and corrupt the workbook
   .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

function colName(index: number): string {
  let s = '';
  let n = index + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function toXLSX<T>(sheetName: string, columns: Column<T>[], rows: T[]): Blob {
  const cell = (ci: number, ri: number, v: string | number | null | undefined) => {
    const ref = `${colName(ci)}${ri}`;
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(String(v))}</t></is></c>`;
  };

  const body = [
    `<row r="1">${columns.map((c, i) => cell(i, 1, c.header)).join('')}</row>`,
    ...rows.map((r, ri) =>
      `<row r="${ri + 2}">${columns.map((c, ci) => cell(ci, ri + 2, c.value(r))).join('')}</row>`),
  ].join('');

  // Freeze the header and give every column room; a sheet that needs manual
  // widening on open is not a finished export.
  const cols = `<cols>${columns.map((_, i) =>
    `<col min="${i + 1}" max="${i + 1}" width="20" customWidth="1"/>`).join('')}</cols>`;

  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>${cols}<sheetData>${body}</sheetData></worksheet>`;

  // Excel rejects sheet names over 31 chars or containing : \ / ? * [ ]
  const safeName = xmlEsc(sheetName.replace(/[:\\\/?*\[\]]/g, ' ').slice(0, 31)) || 'Sheet1';

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="${safeName}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const wbRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `</Relationships>`;

  return zip([
    { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { name: '_rels/.rels', data: enc.encode(rootRels) },
    { name: 'xl/workbook.xml', data: enc.encode(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(wbRels) },
    { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheet) },
  ], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/* ------------------------------------------------------------ delivery */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Renders the report into a hidden iframe and opens the print dialog, where the
 * browser's own "Save as PDF" produces the file. An iframe rather than a popup
 * because popup blockers silently kill window.open during a click handler.
 */
export function printReport<T>(
  title: string,
  meta: string,
  columns: Column<T>[],
  rows: T[],
) {
  const head = columns.map(c => `<th>${xmlEsc(c.header)}</th>`).join('');
  const body = rows.map(r =>
    `<tr>${columns.map(c => {
      const v = c.value(r);
      const num = typeof v === 'number';
      return `<td class="${num ? 'n' : ''}">${v === null || v === undefined ? '' : xmlEsc(String(v))}</td>`;
    }).join('')}</tr>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${xmlEsc(title)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font: 11px -apple-system, "Segoe UI", Roboto, sans-serif; color: #101828; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { font-size: 11px; color: #667085; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em;
       color: #475467; background: #F3F4F6; padding: 7px 8px; border-bottom: 1px solid #D0D5DD; }
  td { padding: 6px 8px; border-bottom: 1px solid #EAECF0; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  .empty { padding: 28px; text-align: center; color: #98A2B3; }
</style></head><body>
<h1>${xmlEsc(title)}</h1>
<div class="meta">${xmlEsc(meta)}</div>
${rows.length
    ? `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
    : `<p class="empty">No records in this period.</p>`}
</body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); return; }
  doc.open();
  doc.write(html);
  doc.close();
  // Let the iframe lay out before printing, or the dialog opens on a blank page
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  }, 300);
}
