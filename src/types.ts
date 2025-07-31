export interface StorageRequest {
  method: string;
  params: any;
}

export interface StorageResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface StoreParams {
  pubkey: string;
  timestamp: number;
  ttl: number;
  data: string;
  namespace?: number;
  signature?: string;
  sig_timestamp?: number;
  pubkey_ed25519?: string;
  subaccount?: string;
  subaccount_sig?: string;
}

export interface RetrieveParams {
  pubkey: string;
  namespace?: number;
  last_hash?: string;
  max_count?: number;
  max_size?: number;
  timestamp?: number;
  signature?: string;
  pubkey_ed25519?: string;
  subaccount?: string;
  subaccount_sig?: string;
}

export interface DeleteParams {
  pubkey: string;
  messages: string[];
  required?: boolean;
  signature: string;
  pubkey_ed25519?: string;
  subaccount?: string;
  subaccount_sig?: string;
}

export interface DeleteAllParams {
  pubkey: string;
  namespace?: number | string;
  timestamp: number;
  signature: string;
  pubkey_ed25519?: string;
  subaccount?: string;
  subaccount_sig?: string;
}

export interface UpdateParams {
  pubkey: string;
  messages: string[];
  data: string;
  signature: string;
  pubkey_ed25519?: string;
  subaccount?: string;
  subaccount_sig?: string;
}

export interface SwarmParams {
  pubkey: string;
}

export interface OxendRequestParams {
  endpoint: string;
  params?: any;
}

export interface BatchRequest {
  requests: Array<{
    method: string;
    params: any;
  }>;
}

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface TestConfig {
  baseUrl: string;
  testPubkey: string;
  testNamespace: number;
  timeout: number;
} 