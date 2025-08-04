import { decode } from '@session.js/mnemonic';
import * as ed25519 from '@stablelib/ed25519';
import { mnemonicToSeedSync, generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { convertPublicKeyToX25519 } from '@stablelib/ed25519';

function seedPhraseToBytes(seedPhrase: string): Uint8Array {
    // Use Session.js mnemonic decode function
    const seedHex = decode(seedPhrase);
    
    // Convert hex string to Uint8Array and pad to 32 bytes
    const seed = new Uint8Array(32);
    for (let i = 0; i < seedHex.length && i < 64; i += 2) {
        seed[i / 2] = parseInt(seedHex.substr(i, 2), 16);
    }
    
    // Fill remaining bytes with zeros if needed
    for (let i = seedHex.length / 2; i < 32; i++) {
        seed[i] = 0;
    }
    
    return seed;
}

/**
 * Convert a seed to a Session ID (05-prefixed X25519 public key)
 * @param seed 32-byte seed
 * @returns Session ID as hex string
 */
function seedToSessionId(seed: Uint8Array): string {
    // Create CryptoUtils instance from seed
    const ed25519KeyPair = ed25519.generateKeyPairFromSeed(seed);
    
    // Get X25519 public key (which is what Session IDs use)
    const x25519Pubkey = convertPublicKeyToX25519(ed25519KeyPair.publicKey);

    
    // Convert to hex and add 05 prefix
    const pubkeyHex = Array.from(x25519Pubkey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    return `05${pubkeyHex}`;
}
/**
 * Test function for Session.js 13-word seed phrase conversion
 */
function test_session_seed() {
    try {
        // Define the seed phrase as a variable (13 words)
        const seedPhrase = 'tadpoles duration initiate zippers fonts dullness saxophone solved cool pirate examine buffet pirate';
        console.log('Seed phrase:', seedPhrase);
        console.log('Word count:', seedPhrase.split(' ').length);
        
        // Convert to bytes using Session.js mnemonic decode
        const seed = seedPhraseToBytes(seedPhrase);
        console.log('Seed (hex):', Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join(''));
        
        // Convert to Session ID
        const sessionId = seedToSessionId(seed);
        console.log('Session ID:', sessionId);
        
        // Verify it starts with 05
        if (!sessionId.startsWith('05')) {
            throw new Error('Session ID should start with 05');
        }
        
        console.log('✅ Successfully converted 13-word seed phrase to Session ID');
     
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
        return;
    }
}

/**
 * Test function for any 12-word seed phrase with Ed25519 and X25519 public keys using BIP39
 */
function test_any_seed() {
    try {
        // Generate a new 12-word seed phrase using BIP39
        const seedPhrase = generateMnemonic(wordlist, 128); // 128 bits = 12 words
        console.log('Generated 12-word seed phrase:', seedPhrase);
        console.log('Word count:', seedPhrase.split(' ').length);
        
        // Convert BIP39 mnemonic to seed using BIP39 library
        const seed = mnemonicToSeedSync(seedPhrase);
        console.log('Seed (hex):', Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join(''));
        
        // Create Ed25519 keypair from seed
        const ed25519KeyPair = ed25519.generateKeyPairFromSeed(seed.slice(0, 32));
        
        // Get Ed25519 public key
        const ed25519PubkeyHex = Array.from(ed25519KeyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('Ed25519 public key:', ed25519PubkeyHex);
        
        // Get X25519 public key
        const x25519Pubkey = convertPublicKeyToX25519(ed25519KeyPair.publicKey);
        const x25519PubkeyHex = Array.from(x25519Pubkey).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('X25519 public key:', x25519PubkeyHex);
        
        // Create Session ID (05 + X25519 public key)
        const sessionId = `05${x25519PubkeyHex}`;
        console.log('Session ID:', sessionId);
        
        console.log('✅ Successfully generated Ed25519 and X25519 public keys from BIP39 12-word seed');
        
        // Test with a known BIP39 seed phrase
        // console.log('\n--- Testing with known BIP39 seed phrase ---');
        // const knownSeedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        // console.log('Known seed phrase:', knownSeedPhrase);
        
        // const knownSeed = mnemonicToSeedSync(knownSeedPhrase);
        // const knownEd25519KeyPair = ed25519.generateKeyPairFromSeed(knownSeed.slice(0, 32));
        
        // const knownEd25519PubkeyHex = Array.from(knownEd25519KeyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
        // const knownX25519Pubkey = convertPublicKeyToX25519(knownEd25519KeyPair.publicKey);
        // const knownX25519PubkeyHex = Array.from(knownX25519Pubkey).map(b => b.toString(16).padStart(2, '0')).join('');
        // const knownSessionId = `05${knownX25519PubkeyHex}`;
        
        // console.log('Known Ed25519 public key:', knownEd25519PubkeyHex);
        // console.log('Known X25519 public key:', knownX25519PubkeyHex);
        // console.log('Known Session ID:', knownSessionId);
     
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
        return;
    }
}

// Run the test functions
console.log('=== Testing Session.js 13-word seed ===');
test_session_seed();

console.log('\n=== Testing any 12-word seed ===');
test_any_seed(); 