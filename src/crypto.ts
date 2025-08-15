import * as ed25519 from '@stablelib/ed25519';
import { convertPublicKeyToX25519 } from '@stablelib/ed25519';
import * as random from '@stablelib/random';
import * as hex from '@stablelib/hex';
import * as base64 from '@stablelib/base64';
import * as bs58 from 'bs58';

export class CryptoUtils {
  private ed25519KeyPair: ed25519.KeyPair;

  constructor(seed?: Uint8Array) {
    if (seed) {
      // Generate Ed25519 key pair from seed
      this.ed25519KeyPair = ed25519.generateKeyPairFromSeed(seed);
    } else {
      // Generate random Ed25519 key pair
      this.ed25519KeyPair = ed25519.generateKeyPair();
    }
  }

  /**
   * Get the Ed25519 public key as hex string
   */
  getPublicKeyHex(): string {
    return hex.encode(this.ed25519KeyPair.publicKey);
  }

  /**
   * Get the X25519 public key as hex string (derived from Ed25519)
   */
  getX25519PublicKeyHex(): string {
    const x25519Pubkey = convertPublicKeyToX25519(this.ed25519KeyPair.publicKey);
    return hex.encode(x25519Pubkey);
  }

  /**
   * Get the Ed25519 public key as base58 string
   */
  getPublicKeyBase58(): string {
    return bs58.encode(this.ed25519KeyPair.publicKey);
  }

  /**
   * Get the Ed25519 secret key as hex string
   */
  getSecretKeyHex(): string {
    return hex.encode(this.ed25519KeyPair.secretKey);
  }

  /**
   * Sign a message for store operation using Ed25519
   */
  signStore(namespace: number, sigTimestamp: number): string {
    const message = `store${namespace}${sigTimestamp}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message for retrieve operation using Ed25519
   */
  signRetrieve(namespace: number, timestamp: number): string {
    const namespaceStr = namespace === 0 ? '' : namespace.toString();
    const message = `retrieve${namespaceStr}${timestamp}`;
    
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message for delete operation using Ed25519
   */
  signDelete(messages: string[]): string {
    const message = `delete${messages.join('')}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message for delete_all operation using Ed25519
   */
  signDeleteAll(namespace: number | string, timestamp: number): string {
    const namespaceStr = namespace === 0 ? '' : namespace.toString();
    const message = `delete_all${namespaceStr}${timestamp}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message for expire_all operation using Ed25519
   */
  signExpireAll(namespace: number | string | undefined, expiry: number): string {
    const namespaceStr = namespace === undefined || namespace === 0 ? '' : namespace.toString();
    const message = `expire_all${namespaceStr}${expiry}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message for expire_msgs operation using Ed25519
   */
  signExpireMsgs(messages: string[], expiry: number, shorten?: boolean, extend?: boolean): string {
    // Signature format: ("expire" || ShortenOrExtend || expiry || messages[0] || ... || messages[N])
    let shortenOrExtend = '';
    if (shorten) {
      shortenOrExtend = 'shorten';
    } else if (extend) {
      shortenOrExtend = 'extend';
    }
    
    const message = `expire${shortenOrExtend}${expiry}${messages.join('')}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message for revoke_subaccount operation using Ed25519
   */
  signRevokeSubaccount(subaccountToken: string): string {
    const message = `revoke_subaccount${subaccountToken}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }



  /**
   * Sign a message using blinded subaccount keys
   */
  signWithBlindedSubaccount(message: string, blindedSecretKey: Uint8Array): string {
    const signature = ed25519.sign(blindedSecretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign store operation using blinded subaccount keys
   */
  signStoreWithSubaccount(namespace: number, sigTimestamp: number, blindedSecretKey: Uint8Array): string {
    const message = `store${namespace}${sigTimestamp}`;
    return this.signWithBlindedSubaccount(message, blindedSecretKey);
  }

  /**
   * Sign retrieve operation using blinded subaccount keys
   */
  signRetrieveWithSubaccount(namespace: number, timestamp: number, blindedSecretKey: Uint8Array): string {
    const namespaceStr = namespace === 0 ? '' : namespace.toString();
    const message = `retrieve${namespaceStr}${timestamp}`;
    return this.signWithBlindedSubaccount(message, blindedSecretKey);
  }

  /**
   * Sign delete operation using blinded subaccount keys
   */
  signDeleteWithSubaccount(messages: string[], blindedSecretKey: Uint8Array): string {
    const message = `delete${messages.join('')}`;
    return this.signWithBlindedSubaccount(message, blindedSecretKey);
  }

  /**
   * Sign a message for unrevoke_subaccount operation using Ed25519
   */
  signUnrevokeSubaccount(timestamp: number, subaccounts: string[]): string {
    const message = `unrevoke_subaccount${timestamp}${subaccounts.join('')}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message for revoked_subaccounts operation using Ed25519
   */
  signRevokedSubaccounts(timestamp: number): string {
    const message = `revoked_subaccounts${timestamp}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message using Ed25519
   */
  signMessage(message: string): string {
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Sign a message using X25519 (for when pubkey_ed25519 is X25519)
   */
  signMessageX25519(message: string): string {
    // X25519 doesn't support signing directly, so we use Ed25519 for signatures
    // but return the X25519 public key for pubkey_ed25519 field
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }

  /**
   * Generate a subaccount token (36 bytes)
   * Format: network_prefix(1) + permissions(1) + reserved(2) + ed25519_pubkey(32)
   */
  generateSubaccountToken(permissions: number = 1, networkPrefix: number = 5): string {
    // 36 bytes: network_prefix(1) + permissions(1) + reserved(2) + ed25519_pubkey(32)
    const token = new Uint8Array(36);
    token[0] = networkPrefix; // network prefix (e.g., 05 for Session ID)
    token[1] = permissions; // permissions: read=1, write=2, delete=4, any_prefix=8
    token[2] = 0; // reserved byte 1
    token[3] = 0; // reserved byte 2
    token.set(this.ed25519KeyPair.publicKey, 4); // 32 bytes Ed25519 pubkey
    return hex.encode(token);
  }

  /**
   * Generate a blinded subaccount token for a specific target pubkey
   * The subaccount token contains the blinded Ed25519 public key of the target user
   */
  generateBlindedSubaccountToken(targetPubkey: Uint8Array, permissions: number = 1, networkPrefix: number = 5): {
    token: string;
    blindedPubkey: Uint8Array;
  } {
    // For this implementation, we'll use the target pubkey directly as the "blinded" pubkey
    // In a real implementation, you would use proper blinding: k = H(owner_pubkey || target_pubkey) mod L, Z = kB
    
    // 36 bytes: network_prefix(1) + permissions(1) + reserved(2) + blinded_pubkey(32)
    const token = new Uint8Array(36);
    token[0] = networkPrefix;
    token[1] = permissions;
    token[2] = 0; // reserved byte 1
    token[3] = 0; // reserved byte 2
    token.set(targetPubkey, 4); // Use target pubkey as the blinded pubkey
    
    return {
      token: hex.encode(token),
      blindedPubkey: targetPubkey
    };
  }

  /**
   * Sign a subaccount token using Ed25519
   */
  signSubaccountToken(subaccountToken: string): string {
    const tokenBytes = hex.decode(subaccountToken);
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, tokenBytes);
    return base64.encode(signature);
  }

  /**
   * Sign a push notification subscribe message using Ed25519
   * Based on Session push notification server API
   * Signature format: ("MONITOR" || HEX(ACCOUNT) || SIG_TS || DATA01 || NS[0] || "," || ... || "," || NS[n])
   * Where ACCOUNT is the raw 33-byte pubkey converted to hex
   */
  signPushSubscribe(sigTs: number, namespaces: number[], data: boolean, accountBytes: Uint8Array): string {
    const dataStr = data ? '1' : '0';
    const namespacesStr = namespaces.join(',');
    const accountHex = hex.encode(accountBytes);
    const message = `MONITOR${accountHex.toLowerCase()}${sigTs}${dataStr}${namespacesStr}`;
    const signature = ed25519.sign(this.ed25519KeyPair.secretKey, new TextEncoder().encode(message));
    return base64.encode(signature);
  }



  /**
   * Convert hex string to Uint8Array
   */
  static hexToBytes(hexStr: string): Uint8Array {
    return hex.decode(hexStr);
  }

  /**
   * Convert Uint8Array to hex string
   */
  static bytesToHex(bytes: Uint8Array): string {
    return hex.encode(bytes);
  }

  /**
   * Convert string to base64
   */
  static stringToBase64(str: string): string {
    return base64.encode(new TextEncoder().encode(str));
  }

  /**
   * Convert base64 to string
   */
  static base64ToString(base64Str: string): string {
    return new TextDecoder().decode(base64.decode(base64Str));
  }

  /**
   * Generate a random key pair
   */
  static generateKeyPair(): CryptoUtils {
    return new CryptoUtils();
  }

  /**
   * Create from existing Ed25519 key pair
   */
  static fromEd25519KeyPair(publicKey: Uint8Array, secretKey: Uint8Array): CryptoUtils {
    const instance = new CryptoUtils();
    instance.ed25519KeyPair = { publicKey, secretKey };
    return instance;
  }

  /**
   * Create from existing X25519 key pair
   */
  static fromX25519KeyPair(publicKey: Uint8Array, secretKey: Uint8Array): CryptoUtils {
    const instance = new CryptoUtils();
    // Derive Ed25519 key pair from X25519 secret key
    instance.ed25519KeyPair = ed25519.generateKeyPairFromSeed(secretKey);
    return instance;
  }

  /**
   * Create from seed
   */
  static fromSeed(seed: Uint8Array): CryptoUtils {
    return new CryptoUtils(seed);
  }

  /**
   * Get Ed25519 key pair
   */
  getEd25519KeyPair(): ed25519.KeyPair {
    return this.ed25519KeyPair;
  }

  /**
   * Get X25519 public key (derived from Ed25519)
   */
  getX25519PublicKey(): Uint8Array {
    return convertPublicKeyToX25519(this.ed25519KeyPair.publicKey);
  }

  /**
   * Generate random bytes
   */
  static generateRandomBytes(length: number): Uint8Array {
    return random.randomBytes(length);
  }
} 