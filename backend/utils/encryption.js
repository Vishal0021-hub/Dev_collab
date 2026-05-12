const crypto = require("crypto");

const ALGO = "aes-256-cbc";

function getKey() {
  const k = process.env.GITHUB_ENCRYPTION_KEY || "";
  if (k.length !== 32) {
    throw new Error("[Encryption] GITHUB_ENCRYPTION_KEY must be exactly 32 characters");
  }
  return Buffer.from(k, "utf8");
}

/**
 * Encrypts a plain-text string using AES-256-CBC.
 * @param {string} text
 * @returns {{ encrypted: string, iv: string }}
 */
function encrypt(text) {
  const iv  = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return {
    encrypted: encrypted.toString("hex"),
    iv:        iv.toString("hex"),
  };
}

/**
 * Decrypts an AES-256-CBC cipher text.
 * @param {string} encrypted - hex-encoded cipher text
 * @param {string} iv        - hex-encoded IV
 * @returns {string}
 */
function decrypt(encrypted, iv) {
  const key        = getKey();
  const decipher   = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, "hex"));
  const decrypted  = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };
