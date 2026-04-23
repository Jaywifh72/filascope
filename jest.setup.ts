import { TextEncoder, TextDecoder } from 'util';

Object.assign(globalThis, { TextEncoder, TextDecoder });

// Shim import.meta.env for Vite-based source files loaded under Jest
// @ts-ignore
globalThis.importMetaEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key',
};
