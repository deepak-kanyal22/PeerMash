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
