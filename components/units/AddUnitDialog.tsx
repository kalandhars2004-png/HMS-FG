'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Unit } from '@/types';
import { UnitsAPI } from '@/lib/api';
import GlobalModal from '@/components/ui/GlobalModal';
import {
  Box,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Sparkles,
  Weight,
  Beaker,
  Ruler,
  Package,
  Syringe,
  Gauge,
  ArrowLeftRight,
  Hash,
  LayoutList,
  SlidersHorizontal,
  Star,
  Barcode,
  Stethoscope,
  BarChart3,
  ShoppingCart,
  Receipt,
  Boxes,
  Factory,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   PRE-DEFINED UNIT TEMPLATES
   ════════════════════════════════════════════════════════════════ */

interface UnitTemplate {
  name: string;
  symbol: string;
  plural: string;
  base: string;
  conversion: number;
}

const UNIT_TEMPLATES: { group: string; unitType: string; icon: typeof Weight; items: UnitTemplate[] }[] = [
  {
    group: 'Weight', unitType: 'Weight', icon: Weight,
    items: [
      { name: 'Gram', symbol: 'g', plural: 'Grams', base: 'Gram', conversion: 1 },
      { name: 'Kilogram', symbol: 'kg', plural: 'Kilograms', base: 'Gram', conversion: 1000 },
      { name: 'Milligram', symbol: 'mg', plural: 'Milligrams', base: 'Gram', conversion: 0.001 },
      { name: 'Microgram', symbol: 'mcg', plural: 'Micrograms', base: 'Gram', conversion: 0.000001 },
    ],
  },
  {
    group: 'Volume', unitType: 'Volume', icon: Beaker,
    items: [
      { name: 'Millilitre', symbol: 'ml', plural: 'Millilitres', base: 'Millilitre', conversion: 1 },
      { name: 'Litre', symbol: 'L', plural: 'Litres', base: 'Millilitre', conversion: 1000 },
      { name: 'Drops', symbol: 'drp', plural: 'Drops', base: 'Millilitre', conversion: 0.05 },
    ],
  },
  {
    group: 'Length', unitType: 'Length', icon: Ruler,
    items: [
      { name: 'Centimetre', symbol: 'cm', plural: 'Centimetres', base: 'Centimetre', conversion: 1 },
      { name: 'Metre', symbol: 'm', plural: 'Metres', base: 'Centimetre', conversion: 100 },
    ],
  },
  {
    group: 'Quantity', unitType: 'Quantity', icon: Package,
    items: [
      { name: 'Piece', symbol: 'pc', plural: 'Pieces', base: 'Piece', conversion: 1 },
      { name: 'Tablet', symbol: 'tab', plural: 'Tablets', base: 'Tablet', conversion: 1 },
      { name: 'Capsule', symbol: 'cap', plural: 'Capsules', base: 'Capsule', conversion: 1 },
      { name: 'Strip', symbol: 'stp', plural: 'Strips', base: 'Strip', conversion: 1 },
      { name: 'Box', symbol: 'bx', plural: 'Boxes', base: 'Box', conversion: 1 },
      { name: 'Bottle', symbol: 'btl', plural: 'Bottles', base: 'Bottle', conversion: 1 },
      { name: 'Tube', symbol: 'tb', plural: 'Tubes', base: 'Tube', conversion: 1 },
      { name: 'Packet', symbol: 'pkt', plural: 'Packets', base: 'Packet', conversion: 1 },
      { name: 'Carton', symbol: 'ctn', plural: 'Cartons', base: 'Carton', conversion: 1 },
      { name: 'Tray', symbol: 'try', plural: 'Trays', base: 'Tray', conversion: 1 },
    ],
  },
  {
    group: 'Medical', unitType: 'Medical', icon: Syringe,
    items: [
      { name: 'Ampoule', symbol: 'amp', plural: 'Ampoules', base: 'Ampoule', conversion: 1 },
      { name: 'Vial', symbol: 'vl', plural: 'Vials', base: 'Vial', conversion: 1 },
      { name: 'Injection', symbol: 'inj', plural: 'Injections', base: 'Injection', conversion: 1 },
      { name: 'Sachet', symbol: 'sct', plural: 'Sachets', base: 'Sachet', conversion: 1 },
      { name: 'Pouch', symbol: 'pch', plural: 'Pouches', base: 'Pouch', conversion: 1 },
      { name: 'Roll', symbol: 'rl', plural: 'Rolls', base: 'Roll', conversion: 1 },
      { name: 'Jar', symbol: 'jr', plural: 'Jars', base: 'Jar', conversion: 1 },
      { name: 'Can', symbol: 'cn', plural: 'Cans', base: 'Can', conversion: 1 },
    ],
  },
];

const BASE_UNIT_OPTIONS = Array.from(new Set(
  UNIT_TEMPLATES.flatMap(g => g.items.flatMap(i => [i.base, i.name]))
)).sort((a, b) => a.localeCompare(b));

const UNIT_TYPES = ['Weight', 'Volume', 'Length', 'Quantity', 'Package', 'Medical', 'Liquid', 'Custom'];
const MEASUREMENT_SYSTEMS = ['Metric', 'Imperial', 'Medical Standard', 'Custom'];
const DISPLAY_FORMATS = ['12 Kg', '12kg', '12 Kilogram', 'Kg 12'];
const DECIMAL_OPTIONS = [0, 1, 2, 3, 4];

const USAGE_OPTIONS = [
  { key: 'usesPurchases', label: 'Purchases', icon: ShoppingCart },
  { key: 'usesSales', label: 'Sales', icon: Receipt },
  { key: 'usesInventory', label: 'Inventory', icon: Boxes },
  { key: 'usesManufacturing', label: 'Manufacturing', icon: Factory },
  { key: 'usesPrescriptions', label: 'Prescriptions', icon: Stethoscope },
  { key: 'usesReports', label: 'Reports', icon: BarChart3 },
  { key: 'usesBarcodePrinting', label: 'Barcode Printing', icon: Barcode },
] as const;

type UsageKey = (typeof USAGE_OPTIONS)[number]['key'];

interface UnitFormState {
  name: string;
  shortName: string;
  pluralName: string;
  symbol: string;
  description: string;
  unitType: string;
  measurementSystem: string;
  baseUnit: string;
  conversionValue: string;
  decimalPlaces: number;
  displayFormat: string;
  usesPurchases: boolean;
  usesSales: boolean;
  usesInventory: boolean;
  usesManufacturing: boolean;
  usesPrescriptions: boolean;
  usesReports: boolean;
  usesBarcodePrinting: boolean;
  status: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: UnitFormState = {
  name: '',
  shortName: '',
  pluralName: '',
  symbol: '',
  description: '',
  unitType: '',
  measurementSystem: '',
  baseUnit: '',
  conversionValue: '1',
  decimalPlaces: 0,
  displayFormat: '12 Kg',
  usesPurchases: true,
  usesSales: true,
  usesInventory: true,
  usesManufacturing: false,
  usesPrescriptions: false,
  usesReports: true,
  usesBarcodePrinting: false,
  status: true,
  isDefault: false,
};

const formFromUnit = (u: Unit | null | undefined): UnitFormState => {
  if (!u) return { ...EMPTY_FORM };
  return {
    name: u.name || '',
    shortName: u.shortName || '',
    pluralName: u.pluralName || '',
    symbol: u.symbol || '',
    description: u.description || '',
    unitType: u.unitType || '',
    measurementSystem: u.measurementSystem || '',
    baseUnit: u.baseUnit || '',
    conversionValue: u.conversionValue != null ? String(u.conversionValue) : u.conversionRate != null ? String(u.conversionRate) : '1',
    decimalPlaces: u.decimalPlaces ?? 0,
    displayFormat: u.displayFormat || '12 Kg',
    usesPurchases: u.usesPurchases ?? false,
    usesSales: u.usesSales ?? false,
    usesInventory: u.usesInventory ?? false,
    usesManufacturing: u.usesManufacturing ?? false,
    usesPrescriptions: u.usesPrescriptions ?? false,
    usesReports: u.usesReports ?? false,
    usesBarcodePrinting: u.usesBarcodePrinting ?? false,
    status: u.status ?? true,
    isDefault: u.isDefault ?? false,
  };
};

/* ════════════════════════════════════════════════════════════════
   ADD / EDIT UNIT — ENTERPRISE GLOBAL DIALOG
   ════════════════════════════════════════════════════════════════ */

interface AddUnitDialogProps {
  open: boolean;
  unit?: Unit | null;
  existingUnits?: Unit[];
  onClose: () => void;
  onSaved: (createdName?: string) => void;
}

export default function AddUnitDialog({ open, unit, existingUnits = [], onClose, onSaved }: AddUnitDialogProps) {
  const isEdit = Boolean(unit);
  const [form, setForm] = useState<UnitFormState>(() => formFromUnit(unit));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [showCreated, setShowCreated] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const createdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof UnitFormState>(key: K, value: UnitFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'name' || key === 'shortName' || key === 'symbol' || key === 'conversionValue') {
      setErrors(prev => ({ ...prev, [key]: '' }));
      setServerError('');
    }
  };

  const syncFromUnit = useCallback(() => setForm(formFromUnit(unit)), [unit]);

  useEffect(() => {
    if (open) {
      syncFromUnit();
      setErrors({});
      setServerError('');
      setSaving(false);
      setShowCreated(false);
      const t = setTimeout(() => nameRef.current?.focus(), 60);
      return () => {
        clearTimeout(t);
      };
    }
  }, [open, syncFromUnit]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        save('another');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, saving, form, errors, unit, existingUnits, onClose, onSaved]);

  if (!open) return null;

  const duplicateName = form.name.trim().toLowerCase() !== '' &&
    existingUnits.some(u => u.name?.toLowerCase() === form.name.trim().toLowerCase() && u.id !== unit?.id);

  const duplicateShortName = form.shortName.trim().toLowerCase() !== '' &&
    existingUnits.some(u => u.shortName?.toLowerCase() === form.shortName.trim().toLowerCase() && u.id !== unit?.id);

  const symbolTooLong = form.symbol.length > 10;
  const conversionInvalid = form.conversionValue.trim() !== '' && Number(form.conversionValue) <= 0;
  const fieldError = (key: string) => errors[key] || '';

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Unit name is required';
    else if (duplicateName) errs.name = 'Unit name cannot duplicate existing units';
    if (!form.shortName.trim()) errs.shortName = 'Short name is required';
    else if (duplicateShortName) errs.shortName = 'Short name must be unique';
    if (symbolTooLong) errs.symbol = 'Symbol maximum 10 characters';
    if (!form.conversionValue.trim() || Number(form.conversionValue) <= 0) errs.conversionValue = 'Conversion cannot be zero';
    if (!form.unitType) errs.unitType = 'Select a unit type';
    setErrors(errs);
    return errs;
  };

  const buildPayload = () => {
    const conversion = Number(form.conversionValue);
    const usageLabels = USAGE_OPTIONS.filter(o => form[o.key]).map(o => o.label);
    return {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      pluralName: form.pluralName.trim(),
      symbol: form.symbol.trim(),
      description: form.description.trim(),
      category: form.unitType,
      unitType: form.unitType,
      measurementSystem: form.measurementSystem,
      baseUnit: form.baseUnit,
      conversionValue: conversion,
      conversionRate: conversion,
      decimalPlaces: form.decimalPlaces,
      displayFormat: form.displayFormat,
      applicableFor: usageLabels.join(','),
      isDefault: form.isDefault,
      status: form.status,
      usesPurchases: form.usesPurchases,
      usesSales: form.usesSales,
      usesInventory: form.usesInventory,
      usesManufacturing: form.usesManufacturing,
      usesPrescriptions: form.usesPrescriptions,
      usesReports: form.usesReports,
      usesBarcodePrinting: form.usesBarcodePrinting,
    };
  };

  const save = async (mode: 'close' | 'another') => {
    const errs = validate();
    if (Object.keys(errs).length > 0 || saving) {
      if (errs.name) nameRef.current?.focus();
      return;
    }
    setSaving(true);
    setServerError('');
    try {
      if (unit) await UnitsAPI.update(unit.id, buildPayload());
      else await UnitsAPI.create(buildPayload());
      onSaved(form.name.trim());
      if (mode === 'another') {
        setForm({ ...EMPTY_FORM });
        setErrors({});
        setShowCreated(true);
        if (createdTimer.current) clearTimeout(createdTimer.current);
        createdTimer.current = setTimeout(() => setShowCreated(false), 2200);
        setTimeout(() => nameRef.current?.focus(), 60);
      } else {
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save unit. Please try again.';
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(formFromUnit(unit));
    setErrors({});
    setServerError('');
    nameRef.current?.focus();
  };

  const applyTemplate = (t: UnitTemplate, groupUnitType: string) => {
    setForm(prev => ({
      ...prev,
      name: t.name,
      shortName: t.symbol,
      symbol: t.symbol,
      pluralName: t.plural,
      unitType: groupUnitType,
      measurementSystem: groupUnitType === 'Medical' ? 'Medical Standard' : 'Metric',
      baseUnit: t.base,
      conversionValue: String(t.conversion),
      description: '',
    }));
    setErrors({});
    setServerError('');
    nameRef.current?.focus();
  };

  const conversionMeaning =
    form.name && form.baseUnit && form.conversionValue.trim() && !conversionInvalid
      ? `1 ${form.name} = ${form.conversionValue} ${form.baseUnit}`
      : 'Define how this unit relates to its base unit.';

  const inputCls = (hasError?: boolean) =>
    `w-full h-12 px-4 text-base rounded-xl border bg-white dark:bg-[#151D2E] text-gray-900 dark:text-[#F8FAFC] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ${
      hasError
        ? 'border-red-300 dark:border-red-500/50 focus:border-red-400 focus:ring-red-500/10'
        : 'border-gray-200 dark:border-[#263046] focus:border-[#0F9291] focus:ring-[#0F9291]/10 hover:border-gray-300 dark:hover:border-[#33405C]'
    }`;

  const selectCls = (hasError?: boolean) =>
    `${inputCls(hasError)} appearance-none pr-10 cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2214%22%20height=%2214%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%2394a3b8%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_16px_center]`;

  const labelCls = 'block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2';
  const hintCls = 'mt-1.5 text-xs text-gray-400 dark:text-gray-500';

  const SectionTitle = ({ icon: Icon, title, hint, delay }: { icon: typeof Box; title: string; hint?: string; delay: number }) => (
    <div className="flex items-center gap-3 animate-dialog-field" style={{ animationDelay: `${delay}ms` }}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#0F9291]/10 text-[#0F9291] dark:bg-[#0F9291]/15">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] leading-tight">{title}</h3>
        {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{hint}</p>}
      </div>
    </div>
  );

  const FieldError = ({ message }: { message: string }) =>
    message ? (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500 animate-fadeIn">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {message}
      </p>
    ) : null;

  return (
    <GlobalModal
      open={open}
      onClose={() => !saving && onClose()}
      title={isEdit ? 'Edit Unit' : 'Add New Unit'}
      subtitle="Units are used throughout purchases, inventory and billing."
      icon={<Box className="w-5 h-5" />}
      size="lg"
      formId="add-unit-form"
      initialFocusRef={nameRef}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1F1F1F] ring-1 ring-gray-200 dark:ring-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#232323] disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <XIcon /> Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1F1F1F] ring-1 ring-gray-200 dark:ring-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#232323] disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>

          <div className="flex-1" />

          {showCreated && (
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-500 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" /> Unit created
            </span>
          )}

          {!isEdit && (
            <button
              type="button"
              onClick={() => save('another')}
              disabled={saving}
              title="Ctrl + Enter"
              className="hidden sm:inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-[#0F9291] dark:text-[#4FD1C5] bg-white dark:bg-[#1F1F1F] ring-1 ring-[#0F9291]/30 hover:bg-[#0F9291]/[0.06] disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Create &amp; Add Another
            </button>
          )}

          <button
            type="submit"
            form="add-unit-form"
            disabled={saving}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-[#0F9291] to-teal-600 text-white text-sm font-bold shadow-lg shadow-[#0F9291]/25 hover:shadow-[#0F9291]/35 disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Unit'}
          </button>
        </>
      }
    >
      <form
        id="add-unit-form"
        onSubmit={e => { e.preventDefault(); save('close'); }}
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            save('another');
          }
        }}
        noValidate
      >
            {/* ── Quick templates ── */}
            <section className="animate-dialog-field" style={{ animationDelay: '20ms' }}>
              <button
                type="button"
                onClick={() => setTemplatesOpen(o => !o)}
                className="flex w-full items-center justify-between py-3 text-left"
              >
                <span className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-[#F8FAFC]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/15 text-amber-500 dark:text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  Predefined Templates
                </span>
                <span className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                  Click a template to pre-fill
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${templatesOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {templatesOpen && (
                <div className="mt-2 space-y-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] p-4 ring-1 ring-gray-100 dark:ring-white/[0.05] animate-slideDown">
                  {UNIT_TEMPLATES.map(group => (
                    <div key={group.group}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <group.icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">{group.group}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map(item => {
                          const active = form.name === item.name;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => applyTemplate(item, group.unitType)}
                              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium transition-all duration-200 active:scale-95 ${
                                active
                                  ? 'bg-[#0F9291] text-white shadow-sm shadow-[#0F9291]/30'
                                  : 'bg-white dark:bg-[#151D2E] text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-[#263046] hover:ring-[#0F9291]/40 hover:text-[#0F9291] dark:hover:text-[#4FD1C5]'
                              }`}
                            >
                              {item.name}
                              <span className={`text-[11px] ${active ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>({item.symbol})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── 1. Basic Information ── */}
            <section className="mt-5 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
              <SectionTitle icon={Gauge} title="Basic Information" hint="Core identity of the unit used across the system." delay={40} />
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                <div className="animate-dialog-field" style={{ animationDelay: '60ms' }}>
                  <label className={labelCls}>Unit Name <span className="text-red-500">*</span></label>
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="e.g. Kilogram"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className={inputCls(Boolean(fieldError('name')) || duplicateName)}
                    maxLength={60}
                  />
                  <FieldError message={fieldError('name') || (duplicateName ? 'Unit name cannot duplicate existing units' : '')} />
                </div>
                <div className="animate-dialog-field" style={{ animationDelay: '80ms' }}>
                  <label className={labelCls}>Short Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Kg"
                    value={form.shortName}
                    onChange={e => set('shortName', e.target.value)}
                    className={inputCls(Boolean(fieldError('shortName')) || duplicateShortName)}
                    maxLength={20}
                  />
                  <FieldError message={fieldError('shortName') || (duplicateShortName ? 'Short name must be unique' : '')} />
                </div>
                <div className="animate-dialog-field" style={{ animationDelay: '100ms' }}>
                  <label className={labelCls}>Plural Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kilograms"
                    value={form.pluralName}
                    onChange={e => set('pluralName', e.target.value)}
                    className={inputCls()}
                    maxLength={60}
                  />
                </div>
                <div className="animate-dialog-field" style={{ animationDelay: '120ms' }}>
                  <label className={labelCls}>Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. kg"
                    value={form.symbol}
                    onChange={e => set('symbol', e.target.value)}
                    className={inputCls(Boolean(fieldError('symbol')) || symbolTooLong)}
                    maxLength={10}
                  />
                  <FieldError message={fieldError('symbol') || (symbolTooLong ? 'Symbol maximum 10 characters' : '')} />
                  <p className={hintCls}>Maximum 10 characters.</p>
                </div>
                <div className="sm:col-span-2 animate-dialog-field" style={{ animationDelay: '140ms' }}>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Used for weight-based medicines."
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    className={`${inputCls()} h-auto min-h-[72px] py-3 resize-none`}
                    maxLength={300}
                  />
                </div>
              </div>
            </section>

            {/* ── 2. Classification ── */}
            <section className="mt-5 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
              <SectionTitle icon={SlidersHorizontal} title="Classification" hint="Type and measurement system for reporting." delay={160} />
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                <div className="animate-dialog-field" style={{ animationDelay: '180ms' }}>
                  <label className={labelCls}>Unit Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.unitType}
                    onChange={e => set('unitType', e.target.value)}
                    className={selectCls(Boolean(fieldError('unitType')))}
                  >
                    <option value="">Select unit type</option>
                    {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <FieldError message={fieldError('unitType')} />
                </div>
                <div className="animate-dialog-field" style={{ animationDelay: '200ms' }}>
                  <label className={labelCls}>Measurement System</label>
                  <select
                    value={form.measurementSystem}
                    onChange={e => set('measurementSystem', e.target.value)}
                    className={selectCls()}
                  >
                    <option value="">Select system</option>
                    {MEASUREMENT_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* ── 3. Conversion ── */}
            <section className="mt-5 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
              <SectionTitle icon={ArrowLeftRight} title="Conversion" hint="Relate this unit to its base unit." delay={220} />
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                <div className="animate-dialog-field" style={{ animationDelay: '240ms' }}>
                  <label className={labelCls}>Base Unit</label>
                  <select
                    value={form.baseUnit}
                    onChange={e => set('baseUnit', e.target.value)}
                    className={selectCls()}
                  >
                    <option value="">Select base unit</option>
                    {BASE_UNIT_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="animate-dialog-field" style={{ animationDelay: '260ms' }}>
                  <label className={labelCls}>Conversion Value</label>
                  <input
                    type="number"
                    min="0.000000001"
                    step="any"
                    placeholder="e.g. 1000"
                    value={form.conversionValue}
                    onChange={e => set('conversionValue', e.target.value)}
                    className={inputCls(Boolean(fieldError('conversionValue')) || conversionInvalid)}
                  />
                  <FieldError message={fieldError('conversionValue') || (conversionInvalid ? 'Conversion cannot be zero' : '')} />
                </div>
                <div className="sm:col-span-2 animate-dialog-field" style={{ animationDelay: '280ms' }}>
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3.5 ${conversionInvalid ? 'bg-red-50 dark:bg-red-500/10' : 'bg-[#0F9291]/[0.06] dark:bg-[#0F9291]/[0.08]'}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${conversionInvalid ? 'bg-red-100 text-red-500 dark:bg-red-500/20' : 'bg-[#0F9291]/15 text-[#0F9291]'}`}>
                      <ArrowLeftRight className="w-4 h-4" />
                    </span>
                    <p className={`text-sm font-medium ${conversionInvalid ? 'text-red-500' : 'text-[#0F9291] dark:text-[#4FD1C5]'}`}>{conversionMeaning}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 4. Precision ── */}
            <section className="mt-5 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
              <SectionTitle icon={Hash} title="Precision" hint="Decimal places shown when this unit is displayed." delay={300} />
              <div className="mt-5 animate-dialog-field" style={{ animationDelay: '320ms' }}>
                <div className="inline-flex rounded-xl bg-gray-100 dark:bg-white/[0.05] p-1 ring-1 ring-gray-200 dark:ring-white/[0.06]">
                  {DECIMAL_OPTIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set('decimalPlaces', d)}
                      className={`h-9 min-w-[52px] px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        form.decimalPlaces === d
                          ? 'bg-white dark:bg-[#151D2E] text-[#0F9291] shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className={`${hintCls} mt-2`}>Example: {form.decimalPlaces === 0 ? '12 Kg' : form.decimalPlaces === 1 ? '12.5 Kg' : `12.${'0'.repeat(form.decimalPlaces - 1)}5 Kg`}</p>
              </div>
            </section>

            {/* ── 5. Display Format ── */}
            <section className="mt-5 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
              <SectionTitle icon={LayoutList} title="Display Format" hint="How quantities appear on labels and reports." delay={340} />
              <div className="mt-5 max-w-sm animate-dialog-field" style={{ animationDelay: '360ms' }}>
                <select
                  value={form.displayFormat}
                  onChange={e => set('displayFormat', e.target.value)}
                  className={selectCls()}
                >
                  {DISPLAY_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </section>

            {/* ── 6. Usage ── */}
            <section className="mt-5 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
              <SectionTitle icon={Boxes} title="Usage" hint="Enable wherever this unit should appear." delay={380} />
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-dialog-field" style={{ animationDelay: '400ms' }}>
                {USAGE_OPTIONS.map(opt => {
                  const active = form[opt.key];
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => set(opt.key, !active)}
                      aria-pressed={active}
                      className={`flex items-center gap-3 h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                        active
                          ? 'bg-[#0F9291]/[0.08] dark:bg-[#0F9291]/[0.12] text-[#0F9291] dark:text-[#4FD1C5] ring-1 ring-[#0F9291]/30'
                          : 'bg-white dark:bg-[#151D2E] text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-[#263046] hover:ring-gray-300 dark:hover:ring-[#33405C]'
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all ${active ? 'bg-[#0F9291] text-white' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500'}`}>
                        <opt.icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="flex-1 text-left">{opt.label}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full transition-all ${active ? 'bg-[#0F9291] text-white' : 'ring-1.5 ring-gray-300 dark:ring-[#33405C]'}`}>
                        {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 7. Status & Default ── */}
            <section className="mt-5 pt-6 pb-4 border-t border-gray-100 dark:border-white/[0.06]">
              <SectionTitle icon={Star} title="Status" hint="Control availability and default behaviour." delay={420} />
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 animate-dialog-field" style={{ animationDelay: '440ms' }}>
                {/* Toggle */}
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold w-14 ${form.status ? 'text-gray-900 dark:text-[#F8FAFC]' : 'text-gray-400'}`}>{form.status ? 'Active' : 'Inactive'}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.status}
                    onClick={() => set('status', !form.status)}
                    className={`relative inline-flex h-7 shrink-0 items-center rounded-full transition-colors duration-200 ${form.status ? 'bg-[#0F9291]' : 'bg-gray-300 dark:bg-[#263046]'}`}
                    style={{ width: '52px' }}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${form.status ? 'translate-x-[26px]' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Divider */}
                <span className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-white/[0.08]" />

                {/* Default unit checkbox */}
                <label className="flex items-center gap-3 cursor-pointer select-none group">
                  <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${form.isDefault ? 'bg-[#0F9291] ring-2 ring-[#0F9291]/30' : 'bg-white dark:bg-[#151D2E] ring-1 ring-gray-300 dark:ring-[#33405C] group-hover:ring-gray-400 dark:group-hover:ring-[#33405C]'}`}>
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={e => set('isDefault', e.target.checked)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {form.isDefault && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Make this the default unit
                    <span className="block text-xs font-normal text-gray-400 dark:text-gray-500 mt-0.5">for future medicines.</span>
                  </span>
                </label>
              </div>
            </section>

            {/* ── Server error ── */}
            {serverError && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 ring-1 ring-red-200 dark:ring-red-500/30 animate-fadeIn mb-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{serverError}</p>
              </div>
            )}
          </form>
    </GlobalModal>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
