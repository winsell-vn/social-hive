/**
 * JWT Secret Generator
 * 
 * This script generates cryptographically secure random strings suitable for
 * use as JWT_SECRET and JWT_REFRESH_SECRET environment variables.
 * 
 * Usage:
 *   node scripts/generate-jwt-secrets.js
 * 
 * Why this matters:
 *   JWT secrets should be random cryptographic strings, NOT actual JWT tokens.
 *   Using JWT tokens as secrets is insecure because:
 *   1. JWT tokens have a predictable structure (header.payload.signature)
 *   2. Parts of the token (header and payload) are just base64-encoded, not encrypted
 *   3. This reduces the effective entropy of your secret
 * 
 * Security recommendations:
 *   - Use at least 256 bits (32 bytes) of entropy for JWT secrets
 *   - Generate separate secrets for access tokens and refresh tokens
 *   - Never commit secrets to version control
 *   - Rotate secrets periodically in production
 */

const crypto = require('crypto');

/**
 * Generates a cryptographically secure random string
 * @param {number} bytes - Number of random bytes to generate (default: 32 = 256 bits)
 * @returns {string} Base64-encoded random string
 */
function generateSecureSecret(bytes = 32) {
  // Generate random bytes using Node.js crypto module
  const randomBytes = crypto.randomBytes(bytes);
  
  // Encode as base64 for easy storage in .env files
  // Base64 encoding produces ~4/3 the length of input bytes
  // 32 bytes -> ~44 characters in base64
  return randomBytes.toString('base64');
}

/**
 * Generates a URL-safe base64 encoded secret
 * @param {number} bytes - Number of random bytes to generate
 * @returns {string} URL-safe base64-encoded random string
 */
function generateUrlSafeSecret(bytes = 32) {
  const randomBytes = crypto.randomBytes(bytes);
  // URL-safe base64: replace + with -, / with _, and remove =
  return randomBytes.toString('base64url');
}

// Generate secrets with 256 bits (32 bytes) of entropy
// This exceeds the minimum recommendation and provides strong security
const jwtSecret = generateSecureSecret(32);
const jwtRefreshSecret = generateSecureSecret(32);

// Also generate URL-safe versions (useful if secrets might appear in URLs)
const jwtSecretUrlSafe = generateUrlSafeSecret(32);
const jwtRefreshSecretUrlSafe = generateUrlSafeSecret(32);

// Display the generated secrets
console.log('\n' + '='.repeat(70));
console.log('  JWT SECRET GENERATOR - Cryptographically Secure Random Strings');
console.log('='.repeat(70) + '\n');

console.log('Generated secrets with 256 bits of entropy (32 bytes):\n');

console.log('─'.repeat(70));
console.log('STANDARD BASE64 FORMAT (recommended for .env files):');
console.log('─'.repeat(70));
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);

console.log('\n' + '─'.repeat(70));
console.log('URL-SAFE BASE64 FORMAT (alternative, no special characters):');
console.log('─'.repeat(70));
console.log(`JWT_SECRET=${jwtSecretUrlSafe}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecretUrlSafe}`);

console.log('\n' + '─'.repeat(70));
console.log('HOW TO USE:');
console.log('─'.repeat(70));
console.log('1. Copy the JWT_SECRET and JWT_REFRESH_SECRET lines above');
console.log('2. Open your Backend/.env file');
console.log('3. Replace the existing JWT_SECRET and JWT_REFRESH_SECRET values');
console.log('4. Save the file and restart your application');

console.log('\n' + '─'.repeat(70));
console.log('SECURITY NOTES:');
console.log('─'.repeat(70));
console.log('• Each secret has 256 bits of entropy (cryptographically secure)');
console.log('• Access token and refresh token use DIFFERENT secrets');
console.log('• Never commit these secrets to version control');
console.log('• Generate new secrets for each environment (dev, staging, prod)');
console.log('• Rotate secrets periodically in production environments');
console.log('• If a secret is compromised, generate and deploy new ones immediately');

console.log('\n' + '='.repeat(70) + '\n');

