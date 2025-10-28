/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHELBY_API_KEY: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_APTOS_NETWORK?: 'devnet' | 'testnet' | 'mainnet';
  readonly VITE_SHELBY_BASE_URL?: string;
  readonly VITE_SHELBY_DOWNLOAD_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

