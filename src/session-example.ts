import { CryptoUtils } from './crypto';
import { PostmanParamsGenerator } from './postman-params';

function convertToJSON(data: any) {
    return JSON.stringify(data, null, 2);
}

console.log('=== Session ID Mode Testing ===\n');

// Create a seed for consistent testing
const seedHex = "1ffd5bc5435dc2af9bae5f29b376127c49004ae428f1716e9518bf3137b59ef9";
const seed = Buffer.from(seedHex, "hex");

// Create PostmanParamsGenerator instance for Session ID mode
const sessionGenerator = new PostmanParamsGenerator(seed, true);   // Session ID mode

console.log('🔑 Public Key Information:');
console.log('Session ID Mode (05 prefix):', sessionGenerator.getPublicKeyMainnet());
console.log('Raw Ed25519 (no prefix):', sessionGenerator.getPublicKeyNoPrefix());
console.log('');

// Test Store Parameters
console.log('📦 Store Parameters (Session ID Mode):');
const sessionStoreParams = sessionGenerator.getStoreParams("Hello from Session ID Mode!" + Date.now(), 86400000, 0);
console.log(convertToJSON(sessionStoreParams));

// Test Retrieve Parameters
console.log('\n📥 Retrieve Parameters (Session ID Mode):');
const sessionRetrieveParams = sessionGenerator.getRetrieveParams("q/6SecW6G9YsEku01T5lJ3gCz3XaMStsZxbXUWB2fHI", 0, 100, -5);
console.log(convertToJSON(sessionRetrieveParams));


console.log('\n✅ Session ID Mode Testing Complete!'); 