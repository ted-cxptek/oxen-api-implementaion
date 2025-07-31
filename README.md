# Oxen Storage API TypeScript Library

A TypeScript library for interacting with the Oxen Storage API, providing easy-to-use methods for generating API request parameters and handling cryptographic operations.

## Features

- ✅ **Complete API Support**: All Oxen Storage API endpoints
- ✅ **Cryptographic Operations**: Ed25519/X25519 signing with stablelib
- ✅ **Subaccount Support**: Delegated access with permission-based authentication
- 🔄 **Session ID Support**: Support for both regular and Session ID pubkey formats (coming soon)
- ✅ **Type Safety**: Full TypeScript support with proper interfaces
- ✅ **Postman Integration**: Generate request parameters for Postman testing

## Installation

```bash
npm install
npm run build
```

## Quick Start

### Basic Usage

```typescript
import { PostmanParamsGenerator } from './src/postman-params';
import { CryptoUtils } from './src/crypto';

// Create a generator with a seed (optional)
const seed = Buffer.from("610987A8DFB79BCFE635A14CFA1F22D9D4BF2A28A9A707D19CF2FFC03AA59F16", "hex");
const generator = new PostmanParamsGenerator(seed);

// Generate store parameters
const storeParams = generator.getStoreParams("Hello World!", 86400000, 0);
console.log(JSON.stringify(storeParams, null, 2));

// Generate retrieve parameters
const retrieveParams = generator.getRetrieveParams(undefined, 0, 100, -5);
console.log(JSON.stringify(retrieveParams, null, 2));
```

### Public Key Formats

The library supports multiple public key formats:

```typescript
// Default (00 prefix, 66 chars) - for testnet/localdev
console.log(generator.getPublicKey());
// Output: 0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75

// Mainnet (05 prefix, 66 chars) - for Session ID
console.log(generator.getPublicKeyMainnet());
// Output: 0574C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75

// Raw Ed25519 (64 chars) - for pubkey_ed25519 field
console.log(generator.getPublicKeyNoPrefix());
// Output: 74C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75

// Raw X25519 (64 chars) - for X25519 operations
console.log(generator.getX25519PublicKeyNoPrefix());
// Output: 1D87974E1637F380987943E8C13E0C63FFC2882A1F1A299A2658C9D970DE6179
```

### Session ID Mode (Coming Soon)

Toggle between regular and Session ID modes:

```typescript
// Regular mode (default)
generator.setSessionIdMode(false);
const regularParams = generator.getStoreParams("Hello World!");
// pubkey: 0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75
// pubkey_ed25519: not included

// Session ID mode (coming soon)
generator.setSessionIdMode(true);
const sessionParams = generator.getStoreParams("Hello World!");
// pubkey: 0574C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75
// pubkey_ed25519: 74C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75
```

## API Methods

### Core Storage Operations

#### Store
```typescript
const storeParams = generator.getStoreParams(
    "Hello World!",    // data
    86400000,          // ttl (24 hours)
    0                  // namespace
);
```

#### Retrieve
```typescript
const retrieveParams = generator.getRetrieveParams(
    "last_hash_here",  // last_hash (optional)
    0,                 // namespace
    100,               // max_count
    -5                 // max_size
);
```

#### Delete
```typescript
const deleteParams = generator.getDeleteParams(
    ["hash1", "hash2"], // messages
    true                // required
);
```

#### Delete All
```typescript
const deleteAllParams = generator.getDeleteAllParams(0); // namespace
```

#### Update
```typescript
const updateParams = generator.getUpdateParams(
    "Updated data!",   // new data
    "message_hash"     // message hash
);
```

### Expiry Management

#### Get Expiries
```typescript
const expiriesParams = generator.getExpiriesParams([
    "hash1", "hash2"
]);
```

#### Expire All
```typescript
const expireAllParams = generator.getExpireAllParams(
    Date.now() + 3600000, // expiry timestamp
    0                     // namespace
);
```

#### Expire Messages
```typescript
const expireMsgsParams = generator.getExpireMsgsParams(
    ["hash1", "hash2"],   // messages
    Date.now() + 7200000, // expiry timestamp
    false,                // shorten
    true                  // extend
);
```

### Utility Operations

#### Get Swarm
```typescript
const swarmParams = generator.getSwarmParams();
```

#### Get Version
```typescript
const versionParams = generator.getVersionParams();
```

## Subaccount Support

### Creating Subaccount Delegation

```typescript
// Account owner creates subaccount delegation
const targetUserPubkey = "2FE86F0D8587DE9604853185DF2E18350BAECF95360B2CB0493CFCE5C6A8AB55";
const delegation = generator.generateSubaccountDelegation(
    targetUserPubkey,  // Target user's Ed25519 pubkey
    1,                 // Read permission
    0                  // Testnet prefix
);

console.log('Subaccount Token:', delegation.subaccountToken);
console.log('Subaccount Signature:', delegation.subaccountSignature);
```

### Using Subaccount Authentication

```typescript
// Subaccount user creates their own CryptoUtils instance
const subaccountUser = PostmanParamsGenerator.createSubaccountUser();

// Use subaccount for API requests
const retrieveWithSubaccount = generator.getRetrieveParamsWithSubaccount(
    undefined,                    // last_hash
    0,                           // namespace
    100,                         // max_count
    -5,                          // max_size
    delegation.subaccountToken,  // Subaccount token
    delegation.subaccountSignature, // Owner's signature of token
    subaccountUser               // Subaccount user's Ed25519 keys
);
```

### Subaccount Permissions

| Value | Permissions | Description |
|-------|-------------|-------------|
| `01` | Read only | Can retrieve messages and view expiries |
| `02` | Write only | Can store messages and extend expiries |
| `03` | Read + Write | Can read and write, but not delete |
| `04` | Delete only | Can delete messages and shorten expiries |
| `07` | Read + Write + Delete | Full access |
| `0F` | Read + Write + Delete + AnyPrefix | Full access across all prefixes |

### Revoking Subaccounts

```typescript
const revokeParams = generator.getRevokeSubaccountParams(delegation.subaccountToken);
```

## Cryptographic Operations

### Direct CryptoUtils Usage

```typescript
import { CryptoUtils } from './src/crypto';

// Create from seed
const crypto = new CryptoUtils(seed);

// Generate random key pair
const randomCrypto = CryptoUtils.generateKeyPair();

// Create from existing key pair
const fromKeyPair = CryptoUtils.fromEd25519KeyPair(publicKey, secretKey);

// Sign messages
const signature = crypto.signMessage("Hello World!");

// Generate signatures for specific operations
const storeSignature = crypto.signStore(0, Date.now());
const retrieveSignature = crypto.signRetrieve(0, Date.now());
const deleteSignature = crypto.signDelete(["hash1", "hash2"]);
```

### Utility Functions

```typescript
// Hex encoding/decoding
const bytes = CryptoUtils.hexToBytes("deadbeef");
const hex = CryptoUtils.bytesToHex(bytes);

// Base64 encoding/decoding
const base64 = CryptoUtils.stringToBase64("Hello World!");
const string = CryptoUtils.base64ToString(base64);

// Generate random bytes
const randomBytes = CryptoUtils.generateRandomBytes(32);
```

## Running Examples

### Basic Demo
```bash
npm run build
node dist/postman-demo.js
```

### Subaccount Demo
```bash
npm run build
node dist/subaccount-example.js
```

## API Reference

### PostmanParamsGenerator

#### Constructor
```typescript
constructor(seed?: Uint8Array, isSessionId: boolean = false)
```

#### Public Key Methods
- `getPublicKey()`: Default (00 prefix, 66 chars)
- `getPublicKeyTestnet()`: Testnet/localdev (00 prefix, 66 chars)
- `getPublicKeyMainnet()`: Mainnet (05 prefix, 66 chars)
- `getPublicKeyNoPrefix()`: Raw Ed25519 (64 chars)
- `getX25519PublicKeyNoPrefix()`: Raw X25519 (64 chars)

#### Session ID Methods (Coming Soon)
- `setSessionIdMode(isSessionId: boolean)`: Set Session ID mode
- `getSessionIdMode()`: Get current Session ID mode

#### API Parameter Methods
- `getStoreParams(data, ttl, namespace)`: Generate store parameters
- `getRetrieveParams(lastHash, namespace, maxCount, maxSize)`: Generate retrieve parameters
- `getDeleteParams(messages, required)`: Generate delete parameters
- `getDeleteAllParams(namespace)`: Generate delete_all parameters
- `getExpiriesParams(messages)`: Generate get_expiries parameters
- `getExpireAllParams(expiry, namespace)`: Generate expire_all parameters
- `getExpireMsgsParams(messages, expiry, shorten, extend)`: Generate expire_msgs parameters

#### Subaccount Methods
- `generateSubaccountDelegation(targetPubkey, permissions, networkPrefix)`: Create subaccount delegation
- `getStoreParamsWithSubaccount(...)`: Store with subaccount authentication
- `getRetrieveParamsWithSubaccount(...)`: Retrieve with subaccount authentication
- `getDeleteParamsWithSubaccount(...)`: Delete with subaccount authentication
- `getRevokeSubaccountParams(subaccountToken)`: Revoke subaccount
- `static createSubaccountUser(seed?)`: Create subaccount user instance

### CryptoUtils

#### Constructor
```typescript
constructor(seed?: Uint8Array)
```

#### Key Management
- `getPublicKeyHex()`: Get Ed25519 public key as hex
- `getX25519PublicKeyHex()`: Get X25519 public key as hex
- `getSecretKeyHex()`: Get Ed25519 secret key as hex
- `getX25519SecretKeyHex()`: Get X25519 secret key as hex

#### Signing Methods
- `signStore(namespace, sigTimestamp)`: Sign store operation
- `signRetrieve(namespace, timestamp)`: Sign retrieve operation
- `signDelete(messages)`: Sign delete operation
- `signDeleteAll(namespace, timestamp)`: Sign delete_all operation
- `signExpireAll(namespace, expiry)`: Sign expire_all operation
- `signExpireMsgs(messages, expiry, shorten, extend)`: Sign expire_msgs operation
- `signMessage(message)`: Sign arbitrary message
- `signMessageX25519(message)`: Sign message for X25519 context

#### Subaccount Methods
- `generateSubaccountToken(permissions, networkPrefix)`: Generate subaccount token
- `generateBlindedSubaccountToken(targetPubkey, permissions, networkPrefix)`: Generate blinded subaccount token
- `signSubaccountToken(subaccountToken)`: Sign subaccount token
- `signRevokeSubaccount(subaccountToken)`: Sign revoke_subaccount operation

#### Static Methods
- `generateKeyPair()`: Generate random key pair
- `fromEd25519KeyPair(publicKey, secretKey)`: Create from Ed25519 key pair
- `fromX25519KeyPair(publicKey, secretKey)`: Create from X25519 key pair
- `fromSeed(seed)`: Create from seed
- `hexToBytes(hexStr)`: Convert hex to bytes
- `bytesToHex(bytes)`: Convert bytes to hex
- `stringToBase64(str)`: Convert string to base64
- `base64ToString(base64Str)`: Convert base64 to string
- `generateRandomBytes(length)`: Generate random bytes

## Dependencies

- `@stablelib/ed25519`: Ed25519 cryptographic operations
- `@stablelib/x25519`: X25519 cryptographic operations
- `@stablelib/random`: Random number generation
- `@stablelib/hex`: Hex encoding/decoding
- `@stablelib/base64`: Base64 encoding/decoding
- `bs58`: Base58 encoding/decoding

## License

This project is part of the Oxen ecosystem. Please refer to the main Oxen repository for licensing information. 