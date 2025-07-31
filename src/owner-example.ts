import { CryptoUtils } from './crypto';
import { PostmanParamsGenerator } from './postman-params';

function convertToJSON(data: any) {
    return JSON.stringify(data, null, 2);
}

const seedHex = "610987A8DFB79BCFE635A14CFA1F22D9D4BF2A28A9A707D19CF2FFC03AA59F16";
const seedHex123 = CryptoUtils.bytesToHex(CryptoUtils.generateRandomBytes(32));
console.log("🚀 ~ seedHex123:", seedHex123)
console.log("🚀 ~ seedHex:", seedHex)

const seed = Buffer.from(seedHex, "hex");

// Create a Postman parameters generator
const generator = new PostmanParamsGenerator(seed);

console.log('=== Oxen Storage API Postman Parameters ===\n');

// Show public key options
console.log('Public Key Options:');
console.log('Default (00 prefix, 66 chars):', generator.getPublicKey());
console.log('Testnet/Localdev (00 prefix, 66 chars):', generator.getPublicKeyTestnet());
console.log('Mainnet (05 prefix, 66 chars):', generator.getPublicKeyMainnet());
console.log('Raw Ed25519 (no prefix, 64 chars):', generator.getPublicKeyNoPrefix());
console.log('Raw X25519 (no prefix, 64 chars):', generator.getX25519PublicKeyNoPrefix());
console.log('\n' + '='.repeat(50) + '\n');

const getSwarmParams = generator.getSwarmParams();
console.log(convertToJSON(getSwarmParams));

console.log('\n=== Regular Examples (isSessionId=false) ===');
console.log('Session ID Mode:', generator.getSessionIdMode());
const getStoreParams = generator.getStoreParams("Hello World!!! " + Date.now(), 86400000, 0);
console.log(convertToJSON(getStoreParams));

const hash = "m4z+WvLvlieg97cMoq4r9ABrBAKA14YWdEXdnp/ubtU";
const retrieveParams = generator.getRetrieveParams(hash, 0, 100, -5);
console.log(convertToJSON(retrieveParams));

const deleteParams = generator.getDeleteParams(
    ["mHPehqESO/xLUN4zp7ZyBV0vT4vObYJfj0OoUbMhra8"]
)
console.log(convertToJSON(deleteParams));

const deleteAllParams = generator.getDeleteAllParams(0)
console.log(convertToJSON(deleteAllParams));


const getExpiriesParams = generator.getExpiriesParams(
    ["iVgqe491ehNpFWxYGp00XLHKGe0vnOhplsEPDCImzUA"]
);
console.log(convertToJSON(getExpiriesParams));

const expireAllParams = generator.getExpireAllParams(Date.now() + 60, 0); // 1 hour from now, namespace 0
console.log(convertToJSON(expireAllParams));

const expireMsgsParams = generator.getExpireMsgsParams(
    ["iVgqe491ehNpFWxYGp00XLHKGe0vnOhplsEPDCImzUA"],
    Date.now() + 200000, // 2 hours from now
    false, // not shorten
    true   // extend only
);
console.log(convertToJSON(expireMsgsParams));