import { CryptoUtils } from './crypto';
import * as hex from '@stablelib/hex';
import { 
  StoreParams, 
  RetrieveParams, 
  DeleteParams, 
  DeleteAllParams,
  UpdateParams,
  SwarmParams,
  OxendRequestParams,
  TestConfig
} from './types';

// Define the response type for all parameter functions
interface ApiRequest<T = any> {
  method: string;
  params: T;
}

// Define missing types
interface GetMessagesParams {
  pubkey: string;
  signature: string;
  pubkey_ed25519?: string;
}

interface GetExpiriesParams {
  pubkey: string;
  messages: string[];
  timestamp: number;
  signature: string;
  pubkey_ed25519?: string;
}

interface ExpireAllParams {
  pubkey: string;
  namespace?: number | string;
  expiry: number;
  signature: string;
  pubkey_ed25519?: string;
}

interface ExpireMsgsParams {
  pubkey: string;
  messages: string[];
  expiry: number;
  signature: string;
  shorten?: boolean;
  extend?: boolean;
  pubkey_ed25519?: string;
}

interface SubaccountParams {
  subaccount: string;
  subaccount_sig: string;
}

interface RevokeSubaccountParams {
  pubkey: string;
  revoke: string;
  signature: string;
  timestamp?: number;
  pubkey_ed25519?: string;
}

interface GetStatsParams {
  [key: string]: any;
}

interface GetBStatsParams {
  [key: string]: any;
}

interface GetVersionParams {
  [key: string]: any;
}

interface GetTestParams {
  testing: number;
}

interface GetTestRetrieveParams {
  pubkey: string;
}

interface GetTestDeleteParams {
  pubkey: string;
  messages: string[];
}

interface GetTestUpdateParams {
  pubkey: string;
  messages: string[];
  data: string;
}

interface GetTestExpireParams {
  pubkey: string;
  messages: string[];
}

interface GetTestExpire2Params {
  pubkey: string;
  messages: string[];
}

interface GetTestExpire3Params {
  pubkey: string;
  messages: string[];
}

interface GetTestExpire4Params {
  pubkey: string;
  messages: string[];
}

interface GetTestExpire5Params {
  pubkey: string;
  messages: string[];
}

interface GetTestExpire6Params {
  pubkey: string;
  messages: string[];
}

export class PostmanParamsGenerator {
  private crypto: CryptoUtils;
  private isSessionId: boolean = false;

  constructor(seed?: Uint8Array, isSessionId: boolean = false) {
    this.crypto = new CryptoUtils(seed);
    this.isSessionId = isSessionId;
  }

  setCrypto(seed:Uint8Array) {
    this.crypto = new CryptoUtils(seed);
  }

  /**
   * Set the Session ID mode
   */
  setSessionIdMode(isSessionId: boolean) {
    this.isSessionId = isSessionId;
  }

  /**
   * Get the current Session ID mode
   */
  getSessionIdMode(): boolean {
    return this.isSessionId;
  }

  /**
   * Get the public key for testing (default - testnet/localdev prefix, 66 hex characters)
   * Oxen Storage API requires 66 hex digits (33 bytes) with network prefix
   */
  getPublicKey(): string {
    const ed25519PubkeyHex = this.crypto.getPublicKeyHex();
    return `00${ed25519PubkeyHex}`; // 00 prefix for testnet/localdev
  }

  /**
   * Get the public key with testnet/localdev prefix (00)
   * For testnet/localdev environments (66 hex characters)
   */
  getPublicKeyTestnet(): string {
    const ed25519PubkeyHex = this.crypto.getPublicKeyHex();
    return `00${ed25519PubkeyHex}`;
  }

  /**
   * Get the public key with mainnet prefix (05)
   * For Session Ed25519 pubkey IDs on mainnet (66 hex characters)
   */
  getPublicKeyMainnet(): string {
    const ed25519PubkeyHex = this.crypto.getPublicKeyHex();
    return `05${ed25519PubkeyHex}`;
  }

  /**
   * Get the public key without network prefix (64 hex characters)
   * Raw Ed25519 public key - useful for pubkey_ed25519 field
   */
  getPublicKeyNoPrefix(): string {
    return this.crypto.getPublicKeyHex();
  }

  /**
   * Get the X25519 public key without network prefix (64 hex characters)
   * Raw X25519 public key - useful for pubkey_ed25519 field when using X25519
   */
  getX25519PublicKeyNoPrefix(): string {
    return this.crypto.getX25519PublicKeyHex();
  }

  /**
   * Generate signature for a message using Ed25519
   */
  generateSignature(message: string): string {
    return this.crypto.signMessage(message);
  }

  /**
   * Generate signature for a message using X25519
   * Note: X25519 doesn't support signing directly, so we use Ed25519 for signatures
   * but return the X25519 public key for pubkey_ed25519 field
   */
  generateSignatureX25519(message: string): string {
    return this.crypto.signMessageX25519(message);
  }

  /**
   * Generate base64 encoded data
   */
  encodeData(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  /**
   * Generate store parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getStoreParams(data: string = "Hello World!", ttl: number = 86400000, namespace: number = 0): ApiRequest<StoreParams> {
    const timestamp = Date.now();
    const encodedData = this.encodeData(data);
    
    // For all namespaces except -10, signature is required
    let signature: string | undefined;
    
    if (namespace !== -10) {
      // Use the specific signStore method from CryptoUtils
      signature = this.crypto.signStore(namespace, timestamp);
    }

    const params: StoreParams = {
      pubkey: this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey(), // 05 + X25519 for Session ID, 00 + Ed25519 for regular
      timestamp,
      ttl,
      data: encodedData,
      namespace,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() }) // Only include if isSessionId is true
    };

    return {
      method: 'store',
      params
    };
  }

  /**
   * Generate store parameters for Postman using X25519 keys
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   * When pubkey_ed25519 is X25519, the signature should be generated using X25519
   */
  getStoreParamsX25519(data: string = "Hello World!", ttl: number = 86400000, namespace: number = 0): ApiRequest<StoreParams> {
    const timestamp = Date.now();
    const encodedData = this.encodeData(data);
    
    // For all namespaces except -10, signature is required
    let signature: string | undefined;
    
    if (namespace !== -10) {
      // Use X25519 signature method
      signature = this.crypto.signStore(namespace, timestamp);
    }

    const params: StoreParams = {
      pubkey: this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey(), // 05 + X25519 for Session ID, 00 + Ed25519 for regular
      timestamp,
      ttl,
      data: encodedData,
      namespace,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() }) // Only include if isSessionId is true
    };

    return {
      method: 'store',
      params
    };
  }

  /**
   * Generate retrieve parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getRetrieveParams(lastHash?: string, namespace: number = 0, maxCount: number = 100, maxSize: number = -5): ApiRequest<RetrieveParams> {
    const timestamp = Date.now();
    
    // For all namespaces except -10, signature is required
    let signature: string | undefined;
    
    if (namespace !== -10) {
      // Use the specific signRetrieve method from CryptoUtils
      signature = this.crypto.signRetrieve(namespace, timestamp);
    }

    const params: RetrieveParams = {
      pubkey: this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey(), // 05 + X25519 for Session ID, 00 + Ed25519 for regular
      namespace,
      last_hash: lastHash,
      max_count: maxCount,
      max_size: maxSize, // -5 means 1/5 of network max transmission size
      timestamp,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() }) // Only include if isSessionId is true
    };

    return {
      method: 'retrieve',
      params
    };
  }

  /**
   * Generate retrieve parameters for Postman using X25519 keys
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   * When pubkey_ed25519 is X25519, the signature should be generated using X25519
   */
  getRetrieveParamsX25519(lastHash?: string, namespace: number = 0, maxCount: number = 100, maxSize: number = -5): ApiRequest<RetrieveParams> {
    const timestamp = Date.now();
    
    // For all namespaces except -10, signature is required
    let signature: string | undefined;
    
    if (namespace !== -10) {
      // Use X25519 signature method
      signature = this.crypto.signRetrieve(namespace, timestamp);
    }

    const params: RetrieveParams = {
      pubkey: this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey(), // 05 + X25519 for Session ID, 00 + Ed25519 for regular
      namespace,
      last_hash: lastHash,
      max_count: maxCount,
      max_size: maxSize,
      timestamp,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() }) // Only include if isSessionId is true
    };

    return {
      method: 'retrieve',
      params
    };
  }

  /**
   * Generate delete parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getDeleteParams(messages: string[] = ["test_hash_1", "test_hash_2"], required: boolean = true): ApiRequest<DeleteParams> {
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    
    // Use the specific signDelete method from CryptoUtils
    const signature = this.crypto.signDelete(messages);

    const params: DeleteParams = {
      pubkey,
      messages,
      required,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() })
    };

    return {
      method: 'delete',
      params
    };
  }

  /**
   * Generate delete_all parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getDeleteAllParams(namespace: number = 0): ApiRequest<DeleteAllParams> {
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    const timestamp = Date.now();
    
    // Use the specific signDeleteAll method from CryptoUtils
    const signature = this.crypto.signDeleteAll(namespace, timestamp);

    const params: DeleteAllParams = {
      pubkey,
      namespace,
      timestamp,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() })
    };

    return {
      method: 'delete_all',
      params
    };
  }

  /**
   * Generate update parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getUpdateParams(newData: string = "Updated data!", messageHash: string = "test_hash"): ApiRequest<UpdateParams> {
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    const timestamp = Date.now();
    const encodedData = this.encodeData(newData);
    
    // Signature format: ("update" || timestamp || messages[0] || ... || messages[N] || data)
    const message = `update${timestamp}${messageHash}${encodedData}`;
    const signature = this.generateSignature(message);

    const params: UpdateParams = {
      pubkey,
      messages: [messageHash],
      data: encodedData,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() })
    };

    return {
      method: 'update',
      params
    };
  }

  /**
   * Generate get_swarm parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getSwarmParams(): ApiRequest<{pubkey: string}> {
    const pubkey = this.getPublicKey();
    
    // get_swarm only requires pubkey, no signature needed
    const params = {
      pubkey
    };

    return {
      method: 'get_swarm',
      params
    };
  }

  /**
   * Generate get_messages parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getMessagesParams(): ApiRequest<GetMessagesParams> {
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    const timestamp = Date.now();
    
    // Signature format: ("get_messages" || timestamp)
    const message = `get_messages${timestamp}`;
    const signature = this.generateSignature(message);

    const params: GetMessagesParams = {
      pubkey,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() })
    };

    return {
      method: 'get_messages',
      params
    };
  }

  /**
   * Generate get_expiries parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getExpiriesParams(messages: string[] = ["test_hash_1"]): ApiRequest<GetExpiriesParams> {
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    const timestamp = Date.now();
    
    // Signature format: ("get_expiries" || timestamp || messages[0] || ... || messages[N])
    const message = `get_expiries${timestamp}${messages.join('')}`;
    const signature = this.generateSignature(message);

    const params: GetExpiriesParams = {
      pubkey,
      messages,
      timestamp,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() })
    };

    return {
      method: 'get_expiries',
      params
    };
  }

  /**
   * Generate expire_all parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   * Updates (shortens) the expiry of all stored messages
   */
  getExpireAllParams(expiry: number = Date.now() + 86400000, namespace?: number | string): ApiRequest<ExpireAllParams> {
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    
    // Use the specific signExpireAll method from CryptoUtils
    const signature = this.crypto.signExpireAll(namespace, expiry);

    const params: ExpireAllParams = {
      pubkey,
      expiry,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() }),
      ...(namespace !== undefined && { namespace })
    };

    return {
      method: 'expire_all',
      params
    };
  }

  /**
   * Generate expire_msgs parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   * Updates (shortens or extends) the expiry of one or more stored messages
   */
  getExpireMsgsParams(messages: string[] = ["test_hash_1"], expiry: number = Date.now() + 86400000, shorten?: boolean, extend?: boolean): ApiRequest<ExpireMsgsParams> {
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    
    // Use the specific signExpireMsgs method from CryptoUtils
    const signature = this.crypto.signExpireMsgs(messages, expiry, shorten, extend);

    const params: ExpireMsgsParams = {
      pubkey,
      messages,
      expiry,
      signature,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() }),
      ...(shorten !== undefined && { shorten }),
      ...(extend !== undefined && { extend })
    };

    return {
      method: 'expire',
      params
    };
  }

  /**
   * Generate revoke_subaccount parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   * Revokes a subaccount by adding it to the revocation list
   */
  getRevokeSubaccountParams(subaccountToken: string): ApiRequest<RevokeSubaccountParams> {
    const timestamp = Date.now();
    const pubkey = this.isSessionId ? `05${this.getX25519PublicKeyNoPrefix()}` : this.getPublicKey();
    
    // Owner signs: "revoke_subaccount" || subaccount_token
    const signature = this.crypto.signRevokeSubaccount(subaccountToken);

    const params: RevokeSubaccountParams = {
      pubkey,
      revoke: subaccountToken,
      signature,
      timestamp,
      ...(this.isSessionId && { pubkey_ed25519: this.getPublicKeyNoPrefix() })
    };

    return {
      method: 'revoke_subaccount',
      params
    };
  }

  /**
   * Generate subaccount token and signature for delegation
   * Creates a subaccount token that can be used by another pubkey to access this account
   */
  generateSubaccountDelegation(targetPubkeyHex: string, permissions: number = 1, networkPrefix: number = 5): {
    subaccountToken: string;
    subaccountSignature: string;
  } {
    const targetPubkey = hex.decode(targetPubkeyHex);
    const result = this.crypto.generateBlindedSubaccountToken(targetPubkey, permissions, networkPrefix);
    const subaccountSignature = this.crypto.signSubaccountToken(result.token);
    
    return {
      subaccountToken: result.token,
      subaccountSignature
    };
  }

  /**
   * Create a subaccount user with a specific Ed25519 key pair
   * This represents the target user who will use the subaccount
   */
  static createSubaccountUser(seed?: Uint8Array): CryptoUtils {
    return new CryptoUtils(seed);
  }

  /**
   * Generate store parameters with subaccount authentication
   */
  getStoreParamsWithSubaccount(data: string, ttl: number, namespace: number, subaccountToken: string, subaccountSignature: string, subaccountCrypto: CryptoUtils): ApiRequest<StoreParams> {
    const timestamp = Date.now();
    const encodedData = this.encodeData(data);
    
    // For all namespaces except -10, signature is required
    let signature: string | undefined;
    
    if (namespace !== -10) {
      // Use the subaccount's Ed25519 key to sign the request
      signature = subaccountCrypto.signStore(namespace, timestamp);
    }

    const params: StoreParams = {
      pubkey: this.getPublicKey(),
      timestamp,
      ttl,
      data: encodedData,
      namespace,
      signature,
      subaccount: subaccountToken,
      subaccount_sig: subaccountSignature
    };

    return {
      method: 'store',
      params
    };
  }

  /**
   * Generate retrieve parameters with subaccount authentication
   */
  getRetrieveParamsWithSubaccount(lastHash: string | undefined, namespace: number, maxCount: number, maxSize: number, subaccountToken: string, subaccountSignature: string, subaccountCrypto: CryptoUtils): ApiRequest<RetrieveParams> {
    const timestamp = Date.now();
    
    // For all namespaces except -10, signature is required
    let signature: string | undefined;
    
    if (namespace !== -10) {
      // Use the subaccount's Ed25519 key to sign the request
      signature = subaccountCrypto.signRetrieve(namespace, timestamp);
    }

    const params: RetrieveParams = {
      pubkey: this.getPublicKey(),
      namespace,
      last_hash: lastHash,
      max_count: maxCount,
      max_size: maxSize,
      timestamp,
      signature,
      subaccount: subaccountToken,
      subaccount_sig: subaccountSignature
    };

    return {
      method: 'retrieve',
      params
    };
  }

  /**
   * Generate delete parameters with subaccount authentication
   */
  getDeleteParamsWithSubaccount(messages: string[], required: boolean, subaccountToken: string, subaccountSignature: string, subaccountCrypto: CryptoUtils): ApiRequest<DeleteParams> {
    const pubkey = this.getPublicKey();
    
    // Use the subaccount's Ed25519 key to sign the request
    const signature = subaccountCrypto.signDelete(messages);

    const params: DeleteParams = {
      pubkey,
      messages,
      required,
      signature,
      subaccount: subaccountToken,
      subaccount_sig: subaccountSignature
    };

    return {
      method: 'delete',
      params
    };
  }

  /**
   * Generate get_stats parameters for Postman
   */
  getStatsParams(): ApiRequest<GetStatsParams> {
    const params: GetStatsParams = {};

    return {
      method: 'get_stats',
      params
    };
  }

  /**
   * Generate get_bstats parameters for Postman
   */
  getBStatsParams(): ApiRequest<GetBStatsParams> {
    const params: GetBStatsParams = {};

    return {
      method: 'get_bstats',
      params
    };
  }

  /**
   * Generate get_version parameters for Postman
   */
  getVersionParams(): ApiRequest<GetVersionParams> {
    const params: GetVersionParams = {};

    return {
      method: 'get_version',
      params
    };
  }

  /**
   * Generate oxend_request parameters for Postman
   * Based on official API: https://api.oxen.io/storage-rpc/#/storage
   */
  getOxendRequestParams(endpoint: string = "get_service_nodes", params: any = {}): ApiRequest<OxendRequestParams> {
    // Only whitelisted endpoints are supported:
    // - get_service_nodes
    // - ons_resolve
    const requestParams: OxendRequestParams = {
      endpoint,
      params
    };

    return {
      method: 'oxend_request',
      params: requestParams
    };
  }

  /**
   * Generate test parameters for Postman
   */
  getTestParams(): GetTestParams {
    return {
      testing: 42
    };
  }

  /**
   * Generate test_retrieve parameters for Postman
   */
  getTestRetrieveParams(): GetTestRetrieveParams {
    return {
      pubkey: this.getPublicKey()
    };
  }

  /**
   * Generate test_delete parameters for Postman
   */
  getTestDeleteParams(): GetTestDeleteParams {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1", "test_hash_2"]
    };
  }

  /**
   * Generate test_update parameters for Postman
   */
  getTestUpdateParams(): GetTestUpdateParams {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1"],
      data: this.encodeData("Test update data")
    };
  }

  /**
   * Generate test_expire parameters for Postman
   */
  getTestExpireParams(): GetTestExpireParams {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1"]
    };
  }

  /**
   * Generate test_expire2 parameters for Postman
   */
  getTestExpire2Params(): GetTestExpire2Params {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1"]
    };
  }

  /**
   * Generate test_expire3 parameters for Postman
   */
  getTestExpire3Params(): GetTestExpire3Params {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1"]
    };
  }

  /**
   * Generate test_expire4 parameters for Postman
   */
  getTestExpire4Params(): GetTestExpire4Params {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1"]
    };
  }

  /**
   * Generate test_expire5 parameters for Postman
   */
  getTestExpire5Params(): GetTestExpire5Params {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1"]
    };
  }

  /**
   * Generate test_expire6 parameters for Postman
   */
  getTestExpire6Params(): GetTestExpire6Params {
    return {
      pubkey: this.getPublicKey(),
      messages: ["test_hash_1"]
    };
  }

  /**
   * Generate complete request body for any method
   */
  generateRequestBody(method: string, customParams?: any): any {
    let params: any = {};

    switch (method) {
      case 'store':
        params = this.getStoreParams();
        break;
      case 'retrieve':
        params = this.getRetrieveParams();
        break;
      case 'delete':
        params = this.getDeleteParams();
        break;
      case 'delete_all':
        params = this.getDeleteAllParams();
        break;
      case 'get_swarm':
        params = this.getSwarmParams();
        break;
      case 'get_expiries':
        params = this.getExpiriesParams();
        break;
      case 'get_stats':
        params = this.getStatsParams();
        break;
      default:
        params = customParams || {};
    }

    return {
      method,
      params
    };
  }

  /**
   * Print all parameters for Postman collection
   */
  printAllParams(): void {
    console.log('\n=== Postman Parameters for All APIs ===\n');
    
    const methods = [
      'store', 'retrieve', 'delete', 'delete_all', 'update', 'get_swarm', 
      'get_messages', 'get_expiries', 'get_stats', 'get_bstats', 
      'get_version', 'oxend_request', 'test', 'test_retrieve', 
      'test_delete', 'test_update', 'test_expire', 'test_expire2', 
      'test_expire3', 'test_expire4', 'test_expire5', 'test_expire6'
    ];

    methods.forEach(method => {
      const requestBody = this.generateRequestBody(method);
      console.log(`\n--- ${method.toUpperCase()} ---`);
      console.log('URL: POST https://localhost:22021/storage_rpc/v1');
      console.log('Headers: Content-Type: application/json');
      console.log('Body:');
      console.log(JSON.stringify(requestBody, null, 2));
    });
  }
} 