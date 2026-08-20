/**
 * Modal keyboard-priority registry.
 *
 * Rule: when ANY GlobalModal is open, the modal owns the keyboard — every
 * document/window level shortcut handler must immediately return. Also,
 * global shortcuts must never fire while the user is typing inside an
 * input / textarea / select / contenteditable element.
 */

let openModals = 0;

export function isAnyModalOpen(): boolean {
  return openModals > 0;
}

export function registerModal(): void {
  openModals++;
}

export function unregisterModal(): void {
  if (openModals > 0) openModals--;
}

export function isTypingTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/** Global keyboard handlers must return early when this is true. */
export function shouldIgnoreGlobalKey(e: KeyboardEvent): boolean {
  return isAnyModalOpen() || isTypingTarget(e);
}