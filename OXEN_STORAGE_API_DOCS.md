# OXEN Storage API Documentation

This document provides a comprehensive guide to the OXEN Storage API, which enables secure message storage and retrieval using public key cryptography.

## Table of Contents
- [Overview](#overview)
- [Data Structure](#data-structure)
- [Namespaces](#namespaces)
- [Key Generation](#key-generation)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Get Swarm Information](#get-swarm-information)
  - [Store](#store)
  - [Retrieve](#retrieve)
  - [Delete Specific Messages](#delete-specific-messages)
  - [Delete All Messages](#delete-all-messages)
  - [Delete Before Timestamp](#delete-before-timestamp)
  - [Expire Specific Messages](#expire-specific-messages)
  - [Expire All Messages](#expire-all-messages)
  - [Get Message Expiries](#get-message-expiries)
- [Common Parameters](#common-parameters)
  - [Session ID Public Key](#session-id-public-key-pubkey_ed25519)
  - [SubAccount](#subaccount)
- [Examples](#examples)
- [Additional Resources](#additional-resources)

## Overview

The OXEN Storage API provides a decentralized messaging system where users can:
- **Store messages** for specific recipients using their public keys
- **Retrieve messages** sent to them
- **Manage message lifecycle** through deletion and expiration controls
- **Organize conversations** using namespaces
- **Get swarm information** for optimal storage node selection

## Data Structure

The storage system maps messages using the structure: `(pubkey, namespace) → [message1, message2, ..., messageN]`

| Pubkey | Namespace | Messages |
|--------|-----------|----------|
| 05abc123... (User A) | chat A | [msg1, msg2, msg3] |
| 05abc123... (User A) | chat B | [msg4] |

## Namespaces

Namespaces are conversation channels that organize messages (e.g., DMs, Group Messages, etc.).

### Namespace Rules:
- **Namespaces divisible by 10** (e.g., 0, 60, -30): Allow unauthenticated message submission. Anyone can deposit messages without authentication, but authentication is required for retrieval and all other operations.
- **Namespaces -30 through 30**: Reserved for current and future Session message storage:
  - `0`: Public messages (DMs)
  - `10`: Legacy closed groups
  - `2` through `5`: Encrypted libsession-util client config data (profile settings, contacts, conversations, and groups, respectively)
- **Non-divisible-by-10 namespaces**: Require authentication for all operations, including storage.

**Note**: Omitting the namespace is equivalent to specifying namespace `0`.

## Key Generation

### Generate an Ed25519 Key Pair

- **Public Key**: Used as your user identifier (`pubkey`)
- **Secret Key**: Used to sign messages for authentication

You can use libraries like [`@noble/ed25519`](https://github.com/paulmillr/noble-ed25519) in Node.js:

```json
{
  "privateKey": "1ffd5bc5435dc2af9bae5f29b376127c49004ae428f1716e9518bf3137b59ef9",
  "publicKey": "e7900a8a132e57f8a409baf5b8d9e2ed659564b241d4dd3e9c5cfd4755fea545"
}
```

## Authentication

All API requests require Ed25519 signatures for authentication. The signature format varies by operation and typically includes:
- The operation name (e.g., "store", "retrieve")
- Namespace (if applicable)
- Timestamp
- Additional operation-specific data

## API Endpoints

### Get Swarm Information

**Purpose**: Retrieve the list of OXEN Storage Server nodes responsible for storing data for a given public key.

**Endpoint**: `POST https://localhost:22021/storage_rpc/v1`

**Request**:
```json
{
  "method": "get_swarm",
  "params": {
    "pubkey": "<your public key (hex)>"
  }
}
```

**Response**: Returns a list of OXEN Storage Server nodes responsible for storing data for the public key.

```json
{
  "hf": [7, 0],
  "snodes": [
    {
      "address": "na5pedzkrahotnati97q5dqh9b1og7abuibakich453ym31f7e3o.snode",
      "ip": "164.68.101.46",
      "port": "22021",
      "port_https": 22021,
      "port_omq": 22020,
      "port_quic": 22020,
      "pubkey_ed25519": "1636d40eea2639088b11affaed8ddcf8650377019d4385559cd6f205e645ea33",
      "pubkey_legacy": "1636d40eea2639088b11affaed8ddcf8650377019d4385559cd6f205e645ea33",
      "pubkey_x25519": "8d3c61bcc0d7f23c21ccf35efe9551612e30b0d54bca3aa26207b55c84b82a08"
    }
  ],
  "swarm": "b9ffffffffffffff",
  "t": 1753866690768
}
```

### Store

**Purpose**: Send a message to a specific recipient identified by their public key.

**Use Case**: Alice sends "Hello Bob" to Bob, who can later retrieve it using the retrieve endpoint.

**Parameters**:
- `pubkey` (required): The recipient's public key in hex format
- `timestamp`: Message timestamp in Unix epoch milliseconds
- `ttl`: Message lifetime in milliseconds
- `namespace`: Conversation channel identifier (default: 0)
- `data` (required): Message content encoded in base64 (can be raw or encrypted)
- `signature`: Ed25519 signature of `("store" || namespace || sig_timestamp)`
- `sig_timestamp`: Request initiation timestamp in milliseconds
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "store",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "timestamp": 1753933969153,
    "ttl": 86400000,
    "data": "SGVsbG8gV29ybGQhISEgMTc1MzkzMzk2OTE1Mw==",
    "namespace": 0,
    "signature": "bwDdcRFtikGnMIzb9n7E851LyOwA7rbD3pbdQwU0KLu2HDNe4km+dgOiTt4CH5HQjDVIw/Q5kwdFy8MZ2nOYBw=="
  }
}
```

### Retrieve

**Purpose**: Retrieve stored messages sent to a specific public key.

**Use Case**: Bob retrieves messages that Alice sent to him.

**Parameters**:
- `pubkey` (required): The hex-encoded public key of the message recipient
- `namespace` (optional): The message namespace to retrieve from
- `max_count`/`max_size` (optional): Controls the number of messages to retrieve
- `signature`: Ed25519 signature of:
  - `("retrieve" || namespace || timestamp)` (if using non-0 namespace)
  - `("retrieve" || timestamp)` (if using namespace 0)
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "retrieve",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "namespace": 0,
    "last_hash": "m4z+WvLvlieg97cMoq4r9ABrBAKA14YWdEXdnp/ubtU",
    "max_count": 100,
    "max_size": -5,
    "timestamp": 1753933969155,
    "signature": "bwDdcRFtikGnMIzb9n7E851LyOwA7rbD3pbdQwU0KLu2HDNe4km+dgOiTt4CH5HQjDVIw/Q5kwdFy8MZ2nOYBw=="
  }
}
```

### Delete Specific Messages

**Purpose**: Delete specific messages by their hash identifiers.

**Parameters**:
- `pubkey` (required): The hex-encoded public key of the message owner
- `messages` (required): Array of message hash strings to delete
- `required` (required): Set to `true` to require at least one message deletion for a 200 response; otherwise returns 404
- `signature`: Ed25519 signature of `("delete" || messages.join())`
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "delete",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "messages": [
      "mHPehqESO/xLUN4zp7ZyBV0vT4vObYJfj0OoUbMhra8"
    ],
    "required": true,
    "signature": "xiRQE0hIe/sQjTdQ6WUsnTHZNGOmnZDSN2jvtHUg5bUrkgQyxfBjHbH17Hom4dc71VSjsYO119FfTGXcK1PGDA=="
  }
}
```

### Delete All Messages

**Purpose**: Delete all messages for a specific public key and namespace.

**Parameters**:
- `pubkey` (required): The hex-encoded public key of the message owner
- `namespace` (optional): The message namespace to delete from
- `timestamp` (required): Request initiation timestamp in milliseconds
- `signature`: Ed25519 signature of:
  - `("delete_all" || namespace || timestamp)` (if using non-0 namespace)
  - `("delete_all" || timestamp)` (if using namespace 0)
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "delete_all",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "namespace": 0,
    "timestamp": 1753933562925,
    "signature": "XCFLDRlUl44x2YhJAg8xsHos89ZCX/u0s1qWJIR1Fg1LgV7RozmxV2RySdLpBZb0cUSm6966JX6wUInnG8/DBQ=="
  }
}
```

### Delete Before Timestamp

**Purpose**: Delete all messages with timestamps less than or equal to a specified time.

**Parameters**:
- `pubkey` (required): The hex-encoded public key of the message owner
- `namespace` (optional): The message namespace to delete from
- `before` (required): Timestamp in milliseconds since Unix epoch; all messages with timestamps ≤ this value will be deleted
- `signature`: Ed25519 signature of:
  - `("delete_before" || namespace || before)` (if namespace is specified)
  - `("delete_before" || "all" || timestamp)` (if no namespace)
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "delete_before",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "namespace": 0,
    "before": 1753933562925,
    "signature": "XCFLDRlUl44x2YhJAg8xsHos89ZCX/u0s1qWJIR1Fg1LgV7RozmxV2RySdLpBZb0cUSm6966JX6wUInnG8/DBQ=="
  }
}
```

### Expire Specific Messages

**Purpose**: Adjust the expiry time of specific messages (shorten or extend).

**Parameters**:
- `pubkey` (required): The hex-encoded public key of the message owner
- `messages` (required): Array of message hash strings to update
- `expiry` (required): New expiry timestamp in milliseconds since Unix epoch
- `shorten` (optional): If `true`, only shorten expiry (never extend)
- `extend` (optional): If `true`, only extend expiry (never shorten)
- `signature`: Ed25519 signature of `("expire" || ShortenOrExtend || expiry || messages[0] || ... || messages[N])`
  - `ShortenOrExtend`: Either "shorten" or "extend"
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "expire_msgs",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "messages": [
      "mHPehqESO/xLUN4zp7ZyBV0vT4vObYJfj0OoUbMhra8"
    ],
    "expiry": 1753944012045,
    "signature": "/lESrQ2B3HTHrxodCStesxQRz/QblzH6Q85NP7qJQZQUsGirCb+f8isE7l6/Do2hdilsvdG+hnqpt1zSFC8hDw==",
    "shorten": false,
    "extend": true
  }
}
```

### Expire All Messages

**Purpose**: Shorten the expiry time of all messages in one or all namespaces.

**Parameters**:
- `pubkey` (required): The hex-encoded public key of the message owner
- `namespace` (optional): The message namespace to modify
- `expiry` (required): New expiry timestamp in milliseconds since Unix epoch
- `signature`: Ed25519 signature of:
  - `("expire_all" || namespace || expiry)` (if namespace is specified)
  - `("expire_all" || "all" || expiry)` (if no namespace)
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "expire_all",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "expiry": 1753940412043,
    "signature": "nt7YDos/dXLZPy7KNsnusWtAgfDScEluuuiptW91V15KPldsMoIGrSQBacQ/I0zIfRSAVuWlN7Ug76yoYS6LDQ==",
    "namespace": 0
  }
}
```

### Get Message Expiries

**Purpose**: Retrieve current expiry timestamps for one or more messages.

**Parameters**:
- `pubkey` (required): The hex-encoded public key of the message owner
- `messages` (required): Array of message hash strings to query
- `timestamp` (required): Request initiation timestamp in milliseconds
- `signature`: Ed25519 signature of `("get_expiries" || timestamp || messages[0] || ... || messages[N])`
- `pubkey_ed25519` (optional): See SessionID explanation below
- `subaccount` (optional): See SubAccount explanation below
- `subaccount_sig` (optional): See SubAccount explanation below

**Example Request**:
```json
{
  "method": "get_expiries",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "messages": [
      "mHPehqESO/xLUN4zp7ZyBV0vT4vObYJfj0OoUbMhra8"
    ],
    "timestamp": 1753936812042,
    "signature": "dYB9+4BBZbejD8ZeuZHsKKPGKjEihZGAjOLBIBRNcPUjGsSJQumK8Ju6QsI83xuJGZN7N0MOI6ToyJVxca9CAA=="
  }
}
```

## Common Parameters

### Session ID Public Key (`pubkey_ed25519`)

Session accounts use the **prefix `05`** and have specific behavior:

- **If `pubkey_ed25519` is provided** on each request:
  - `pubkey_ed25519` is used to **verify the signature**
  - `pubkey` is the **X25519 key derived from `pubkey_ed25519`**, used to **identify the message owner** (with `05` prefix)
- **If `pubkey_ed25519` is not provided**, the request is from a **regular (Ed25519) account**

| Case | `pubkey` | `pubkey_ed25519` | Purpose |
|------|----------|-------------------|---------|
| Regular account (Ed25519) | Ed25519 public key | Not needed | Used as the ID and for signing and verifying the request |
| Session account (type prefix 05, X25519) | X25519 public key | Ed25519 public key | `pubkey` is used as ID, `pubkey_ed25519` for signing and verifying |

### SubAccount

Subaccounts allow an account owner to delegate access permissions to another public key, enabling shared access to storage accounts without sharing private keys.

#### SubAccount Token Structure (36 bytes)

**Derived from:**
- **Network Prefix (1 byte)**: `00` for testnet/localdev, `05` for Session ID
- **Permissions (1 byte)**: Bit flags for access control
  - `01`: Read only
  - `02`: Write only
  - `03`: Read + Write
  - `04`: Delete only
  - `07`: Read + Write + Delete
  - `0F`: Read + Write + Delete + AnyPrefix
- **Reserved (2 bytes)**: `0000` for future use
- **Ed25519 Public Key (32 bytes)**: The subaccount user's Ed25519 public key

**Example**:
```
000100002FE86F0D8587DE9604853185DF2E18350BAECF95360B2CB0493CFCE5C6A8AB55
00:  testnet/localdev, 05 for Session ID
01: Read
0000: 2 bytes reserved
2FE...B55: Subaccount's pubkey
```

#### SubAccount Usage

When a subaccount requests any API on behalf of the owner, additional fields are required:

```json
{
  "method": "retrieve",
  "params": {
    "pubkey": "0074C72203AAD9E2B67CA7331162FE293D492AFADB5CEECF83FB56B015ED575B75",
    "namespace": 0,
    "max_count": 100,
    "max_size": -5,
    "timestamp": 1753948241367,
    "signature": "h2Q6v8vc/jm6mNi02D/mHPWCecg9EU+XtuzCFG1wZppN0G/loHMChFeP8WsSy0rb01RiDdZDBj0IZQu+/qJ1DA==",
    "subaccount": "000100002FE86F0D8587DE9604853185DF2E18350BAECF95360B2CB0493CFCE5C6A8AB55",
    "subaccount_sig": "c9dnjMpsDgq+MnDF0elmThF6oJvjvhKvOsMnaESdsNLMtbcf2HnetEmzocVec6oAMMRqlvSnyGrg02w+vvJcDQ=="
  }
}
```

**Important Notes**:
- `subaccount_sig`: Owner signs the constructed subaccount token with Ed25519
- `signature` in request params: Signed by the **subaccount** instead of the **owner**

## Examples

### Complete Message Flow

1. **Alice stores a message for Bob**:
   ```json
   {
     "method": "store",
     "params": {
       "pubkey": "BOB_PUBLIC_KEY",
       "data": "SGVsbG8gQm9iIQ==", // "Hello Bob!" in base64
       "namespace": 0,
       "timestamp": 1753933969153,
       "ttl": 86400000,
       "signature": "ALICE_SIGNATURE"
     }
   }
   ```

2. **Bob retrieves messages**:
   ```json
   {
     "method": "retrieve",
     "params": {
       "pubkey": "BOB_PUBLIC_KEY",
       "namespace": 0,
       "timestamp": 1753933969155,
       "signature": "BOB_SIGNATURE"
     }
   }
   ```

3. **Bob deletes old messages**:
   ```json
   {
     "method": "delete_before",
     "params": {
       "pubkey": "BOB_PUBLIC_KEY",
       "before": 1753933562925,
       "signature": "BOB_SIGNATURE"
     }
   }
   ```

## Additional Resources

For more detailed information, visit the [official OXEN Storage API documentation](https://api.oxen.io/storage-rpc/#/storage).

For implementation examples and code samples, check out the [oxen-api-implementation repository](https://github.com/ted-cxptek/oxen-api-implementaion).

---

**Note**: This documentation is based on the OXEN Storage API specification. Always refer to the official documentation for the most up-to-date information and implementation details.
