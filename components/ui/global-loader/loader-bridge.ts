// Module-level bridge so non-React code (lib/api.ts) can drive the loader
// without importing React or creating circular dependencies.

type LoaderBridge = {
  begin: () => void;
  end: () => void;
};

let bridge: LoaderBridge | null = null;

export function registerLoaderBridge(next: LoaderBridge | null) {
  bridge = next;
}

export function notifyLoaderBegin() {
  try { bridge?.begin(); } catch { /* never break an API call over the overlay */ }
}

export function notifyLoaderEnd() {
  try { bridge?.end(); } catch { /* never break an API call over the overlay */ }
}

// Silent scopes let callers mark a whole operation (e.g. background polling,
// focus refetches) as non-user-facing so no overlay is shown for it.
let silentDepth = 0;

export function beginSilentScope() {
  silentDepth += 1;
}

export function endSilentScope() {
  silentDepth = Math.max(0, silentDepth - 1);
}

export function isSilentScopeActive(): boolean {
  return silentDepth > 0;
}
