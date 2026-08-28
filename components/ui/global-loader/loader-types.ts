export type LoaderType =
  | 'loading'
  | 'saving'
  | 'updating'
  | 'creating'
  | 'deleting'
  | 'fetching'
  | 'processing'
  | 'authenticating'
  | 'uploading'
  | 'syncing'
  | 'generating'
  | 'waiting';

export const LOADER_TYPE_MESSAGES: Record<LoaderType, string> = {
  loading: 'Loading...',
  saving: 'Saving changes...',
  updating: 'Updating record...',
  creating: 'Creating record...',
  deleting: 'Removing record...',
  fetching: 'Loading data...',
  processing: 'Processing...',
  authenticating: 'Signing you in...',
  uploading: 'Uploading...',
  syncing: 'Syncing data...',
  generating: 'Generating...',
  waiting: 'Please wait...',
};

export type LoaderShowInput = LoaderType | { type?: LoaderType; message?: string } | string;

export function resolveLoaderMessage(input?: LoaderShowInput): string {
  if (!input) return LOADER_TYPE_MESSAGES.loading;
  if (typeof input === 'string') {
    return (LOADER_TYPE_MESSAGES as Record<string, string>)[input] ?? input;
  }
  if (input.message) return input.message;
  return input.type ? LOADER_TYPE_MESSAGES[input.type] : LOADER_TYPE_MESSAGES.loading;
}
