/**
 * Web Crypto API wrapper for ECDH Key Exchange and AES-GCM Encryption.
 * Uses native browser crypto, zero external dependencies.
 */

const CURVE_NAME = 'P-256'
const ALGO_NAME = 'AES-GCM'
const KEY_LENGTH = 256

export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: CURVE_NAME },
    true, // extractable
    ['deriveKey', 'deriveBits']
  )
}

export async function exportPublicKey(key) {
  return await window.crypto.subtle.exportKey('raw', key)
}

export async function importPublicKey(rawBytes) {
  return await window.crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'ECDH', namedCurve: CURVE_NAME },
    true,
    []
  )
}

export async function deriveSharedKey(privateKey, publicKey) {
  return await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: ALGO_NAME, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

// ─── AES-GCM Encryption ──────────────────────────────────────────────────────

export async function encryptData(key, data) {
  // data can be an ArrayBuffer or a string
  const iv = window.crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV
  
  let bufferToEncrypt
  if (typeof data === 'string') {
    bufferToEncrypt = new TextEncoder().encode(data)
  } else {
    bufferToEncrypt = data
  }

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: ALGO_NAME, iv },
    key,
    bufferToEncrypt
  )

  return { ciphertext, iv: Array.from(iv) } // convert Uint8Array to normal array for JSON serialization if needed
}

export async function decryptData(key, ciphertext, ivArray) {
  const iv = new Uint8Array(ivArray)
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: ALGO_NAME, iv },
    key,
    ciphertext
  )
  return decryptedBuffer
}

export async function decryptText(key, ciphertext, ivArray) {
  const decryptedBuffer = await decryptData(key, ciphertext, ivArray)
  return new TextDecoder().decode(decryptedBuffer)
}

// ─── Password Protection (PBKDF2 + XOR key mixing) ───────────────────────────

/**
 * Derive 256-bit key material from a user passphrase using PBKDF2-SHA256.
 * @param {string}   passphrase - the user-provided passphrase
 * @param {number[]} salt       - 16-byte random salt stored as a plain array
 * @returns {Promise<Uint8Array>} 32 raw bytes of derived key material
 */
export async function derivePassphraseKey(passphrase, salt) {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  return new Uint8Array(bits)
}

/**
 * XOR-combine an AES-GCM CryptoKey with raw PBKDF2 bits and re-import.
 * Both inputs are 256-bit. If the passphrase is wrong the XOR produces a
 * different key, causing AES-GCM authentication to fail on the first chunk.
 */
export async function mixPassphraseIntoKey(ecdhKey, passphraseBits) {
  const rawEcdh = new Uint8Array(
    await window.crypto.subtle.exportKey('raw', ecdhKey)
  )
  const mixed = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    mixed[i] = rawEcdh[i] ^ passphraseBits[i]
  }
  return window.crypto.subtle.importKey(
    'raw',
    mixed,
    { name: 'AES-GCM', length: 256 },
    false, // final key is non-extractable for security
    ['encrypt', 'decrypt']
  )
}
