# Oxen Storage API TypeScript Library

A TypeScript library for interacting with the Oxen Storage API, providing easy-to-use methods for generating API request parameters and handling cryptographic operations.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run examples
npm run owner
npm run session
npm run subaccount
```

## 📚 Example Files Usage

This library provides three comprehensive example files that demonstrate different use cases:

### 1. 🔑 Owner Example (`owner-example.ts`)

**Purpose**: Demonstrates basic storage operations for regular Ed25519 accounts.

**What it shows**:
- Generating different public key formats
- Basic store/retrieve operations
- Message deletion and expiry management
- Swarm information retrieval

**Key Features**:
```typescript
// Generate different public key formats
console.log('Default (00 prefix):', generator.getPublicKey());
console.log('Raw Ed25519:', generator.getPublicKeyNoPrefix());
console.log('Raw X25519:', generator.getX25519PublicKeyNoPrefix());

// Basic storage operations
const storeParams = generator.getStoreParams("Hello World!", 86400000, 0);
const retrieveParams = generator.getRetrieveParams(hash, 0, 100, -5);
const deleteParams = generator.getDeleteParams(["message_hash"]);
```

**Run it**:
```bash
npm run owner
```

### 2. 🆔 Session Example (`session-example.ts`)

**Purpose**: Demonstrates Session ID mode operations with X25519 keys and Ed25519 signatures.

**What it shows**:
- Session ID mode activation (05 prefix)
- X25519 public key usage with Ed25519 signatures
- Push notification subscription
- Session-specific cryptographic operations

**Key Features**:
```typescript
// Create Session ID mode generator
const sessionGenerator = new PostmanParamsGenerator(seed, true);

// Session ID operations
const sessionStoreParams = sessionGenerator.getStoreParams("Hello from Session ID!", 86400000, 0);
const sessionRetrieveParams = sessionGenerator.getRetrieveParams(hash, 0, 100, -5);

// Push notification subscription
const pushSubscribeParams = sessionGenerator.getPushSubscribeParams(
  [-400, 0, 1, 2, 17], // namespaces
  true,                  // data
  "apns",               // service
  { token: "..." }      // service_info
);
```

**Run it**:
```bash
npm run session
```

### 3. 👥 Subaccount Example (`subaccount-example.ts`)

**Purpose**: Demonstrates complete subaccount delegation and usage workflow.

**What it shows**:
- Complete subaccount creation process
- Permission-based access control
- Subaccount token generation and verification
- API operations using subaccount authentication

**Key Features**:
```typescript
// Step 1: Account Owner Setup
const accountOwner = new PostmanParamsGenerator(accountOwnerSeed);

// Step 2: Subaccount User Setup
const subaccountUser = PostmanParamsGenerator.createSubaccountUser(subaccountUserSeed);

// Step 3: Create Subaccount Delegation
const delegation = accountOwner.generateSubaccountDelegation(
    targetUserPubkeyHex,  // Target user's Ed25519 pubkey
    4,                    // Read permission only
    0                     // Testnet prefix
);

// Step 4: Use Subaccount for API Requests
const retrieveRequest = accountOwner.getRetrieveParamsWithSubaccount(
    undefined,                    // last_hash
    0,                           // namespace
    100,                         // max_count
    -5,                          // max_size
    delegation.subaccountToken,  // Subaccount token
    delegation.subaccountSignature, // Owner's signature of token
    subaccountUser               // Subaccount user's Ed25519 keys
);
```

**Run it**:
```bash
npm run subaccount
```

## 🛠️ Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd script-ts

# Install dependencies
npm install

# Build the project
npm run build
```

## 📖 Understanding the Examples

### Public Key Formats

The library supports multiple public key formats for different use cases:

| Format | Prefix | Length | Use Case |
|--------|--------|--------|----------|
| Default | `00` | 66 chars | Testnet/localdev operations |
| Raw Ed25519 | None | 64 chars | `pubkey_ed25519` field |
| Raw X25519 | None | 64 chars | Raw X25519 operations |
| Session ID | `05` | 66 chars | Session ID operations |

### Namespace Usage

Namespaces organize conversations and have different authentication requirements:

- **Namespace 0**: Public messages (DMs) - unauthenticated submission allowed
- **Namespaces 2-5**: Session config data (profile, contacts, conversations, groups)
- **Namespace 10**: Legacy closed groups
- **Other namespaces**: Require authentication for all operations

### Subaccount Permissions

Subaccounts support granular permission control:

| Value | Permissions | Description |
|-------|-------------|-------------|
| `01` | Read only | Retrieve messages and view expiries |
| `02` | Write only | Store messages and extend expiries |
| `03` | Read + Write | Read and write, but not delete |
| `04` | Delete only | Delete messages and shorten expiries |
| `07` | Read + Write + Delete | Full access |
| `0F` | Read + Write + Delete + AnyPrefix | Full access across all prefixes |

## 🔧 Customization

### Using Your Own Seeds

```typescript
// Use a specific seed for consistent testing
const seedHex = "your_32_byte_hex_seed_here";
const seed = Buffer.from(seedHex, "hex");
const generator = new PostmanParamsGenerator(seed);

// Or generate a random seed
const randomSeed = CryptoUtils.generateRandomBytes(32);
const randomGenerator = new PostmanParamsGenerator(randomSeed);
```

### Modifying Example Parameters

Each example file can be customized:

```typescript
// In owner-example.ts, modify these values:
const seedHex = "your_seed_here";
const messageData = "Your custom message";
const ttl = 86400000; // 24 hours in milliseconds
const namespace = 0;   // Your preferred namespace
```

## 🧪 Testing with Postman

All examples generate Postman-ready request parameters. Copy the JSON output and use it in Postman:

1. **Run an example** (e.g., `npm run owner`)
2. **Copy the JSON output** for the operation you want to test
3. **Paste into Postman** request body
4. **Set the endpoint** to your OXEN storage server
5. **Send the request**

## 📚 API Reference

For detailed API documentation, see [OXEN_STORAGE_API_DOCS.md](./OXEN_STORAGE_API_DOCS.md).

## 🔗 Dependencies

- `@stablelib/ed25519`: Ed25519 cryptographic operations
- `@stablelib/x25519`: X25519 cryptographic operations  
- `@stablelib/random`: Random number generation
- `@stablelib/hex`: Hex encoding/decoding
- `@stablelib/base64`: Base64 encoding/decoding
- `bs58`: Base58 encoding/decoding
- `@session.js/mnemonic`: Session-specific utilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the Oxen ecosystem. Please refer to the main Oxen repository for licensing information. 