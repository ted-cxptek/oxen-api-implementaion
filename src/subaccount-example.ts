import { CryptoUtils } from './crypto';
import { PostmanParamsGenerator } from './postman-params';
import * as hex from '@stablelib/hex';

function convertToJSON(data: any) {
    return JSON.stringify(data, null, 2);
}

console.log('=== Complete Subaccount Signing Example ===\n');

// Step 1: Account Owner Setup
console.log('1. ACCOUNT OWNER SETUP');
const accountOwnerSeed = Buffer.from("610987A8DFB79BCFE635A14CFA1F22D9D4BF2A28A9A707D19CF2FFC03AA59F16", "hex");
const accountOwner = new PostmanParamsGenerator(accountOwnerSeed);
console.log('Account Owner Public Key:', accountOwner.getPublicKey());
console.log('Account Owner Ed25519 Public Key (raw):', accountOwner.getPublicKeyNoPrefix());
console.log();

// Step 2: Subaccount User Setup
console.log('2. SUBACCOUNT USER SETUP');
const subaccountUserSeed = Buffer.from("2466D62FFF7246D201B111FEE08F4B9DCE7CD9303436CA3555E84BF99A0CEE19", "hex");
const subaccountUser = PostmanParamsGenerator.createSubaccountUser(subaccountUserSeed);
console.log('Subaccount User Ed25519 Public Key (raw):', subaccountUser.getPublicKeyHex());
console.log();

// Step 3: Account Owner Creates Subaccount Delegation
console.log('3. ACCOUNT OWNER CREATES SUBACCOUNT DELEGATION');
const targetUserPubkeyHex = subaccountUser.getPublicKeyHex(); // The subaccount user's Ed25519 pubkey
const delegation = accountOwner.generateSubaccountDelegation(
    targetUserPubkeyHex,  // Target user's Ed25519 pubkey
    4,                    // Read permission only
    0                     // Testnet prefix
);

console.log('Subaccount Token (36 bytes):', delegation.subaccountToken);
console.log('Subaccount Token Breakdown:');
console.log('  - Network Prefix (1 byte):', delegation.subaccountToken.substring(0, 2));
console.log('  - Permissions (1 byte):', delegation.subaccountToken.substring(2, 4));
console.log('  - Reserved (2 bytes):', delegation.subaccountToken.substring(4, 8));
console.log('  - Ed25519 Pubkey (32 bytes):', delegation.subaccountToken.substring(8, 72));
console.log('Subaccount Signature (owner signs token):', delegation.subaccountSignature);
console.log();

// Step 4: Verify the subaccount token contains the correct pubkey
console.log('4. VERIFY SUBACCOUNT TOKEN');
const tokenBytes = hex.decode(delegation.subaccountToken);
const tokenPubkey = tokenBytes.slice(4, 36); // Skip prefix, permissions, reserved bytes
const tokenPubkeyHex = hex.encode(tokenPubkey);
console.log('Token contains pubkey:', tokenPubkeyHex);
console.log('Expected pubkey:', targetUserPubkeyHex);
console.log('Match:', tokenPubkeyHex === targetUserPubkeyHex);
console.log();

// Step 5: Subaccount User Signs API Requests
console.log('5. SUBACCOUNT USER SIGNS API REQUESTS');

// Example 1: Retrieve with subaccount
console.log('Example 1: Retrieve with subaccount');
const retrieveRequest = accountOwner.getRetrieveParamsWithSubaccount(
    undefined,                    // last_hash
    0,                           // namespace
    100,                         // max_count
    -5,                          // max_size
    delegation.subaccountToken,  // Subaccount token
    delegation.subaccountSignature, // Owner's signature of token
    subaccountUser               // Subaccount user's Ed25519 keys
);
console.log('Retrieve Request:');
console.log(convertToJSON(retrieveRequest));
console.log();

// Example 2: Store with subaccount
console.log('Example 2: Store with subaccount');
const storeRequest = accountOwner.getStoreParamsWithSubaccount(
    "Hello from subaccount user!",  // data
    86400000,                       // ttl
    0,                              // namespace
    delegation.subaccountToken,     // Subaccount token
    delegation.subaccountSignature, // Owner's signature of token
    subaccountUser                  // Subaccount user's Ed25519 keys
);
console.log('Store Request:');
console.log(convertToJSON(storeRequest));
console.log();

// Example 3: Delete with subaccount
console.log('Example 3: Delete with subaccount');
const deleteRequest = accountOwner.getDeleteParamsWithSubaccount(
    ["3RxmuoYMEPadsBzw+2ZAybHfTs5bL8JbhiJeS52ZSSQ"], // messages
    true,                           // required
    delegation.subaccountToken,     // Subaccount token
    delegation.subaccountSignature, // Owner's signature of token
    subaccountUser                  // Subaccount user's Ed25519 keys
);
console.log('Delete Request:');
console.log(convertToJSON(deleteRequest));
console.log();

// Step 6: Account Owner Can Revoke Subaccount
console.log('6. ACCOUNT OWNER REVOKES SUBACCOUNT');
const revokeRequest = accountOwner.getRevokeSubaccountParams(delegation.subaccountToken);
console.log('Revoke Request:');
console.log(convertToJSON(revokeRequest));
console.log();

// Step 7: Show Different Permission Levels
console.log('7. PERMISSION LEVELS');
const permissions = [
    { value: 1, name: "Read only" },
    { value: 2, name: "Write only" },
    { value: 3, name: "Read + Write" },
    { value: 4, name: "Delete only" },
    { value: 7, name: "Read + Write + Delete" },
    { value: 15, name: "Read + Write + Delete + AnyPrefix" }
];

permissions.forEach(perm => {
    const delegationWithPerm = accountOwner.generateSubaccountDelegation(
        targetUserPubkeyHex,
        perm.value,
        0
    );
    console.log(`${perm.name} (${perm.value}): ${delegationWithPerm.subaccountToken.substring(2, 4)}`);
});
console.log();

console.log('=== Subaccount Signing Process Complete ===');