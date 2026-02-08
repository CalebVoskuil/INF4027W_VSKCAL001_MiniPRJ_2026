import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Generates a random salt for password hashing.
 * The salt is a cryptographically random string used to ensure
 * that identical passwords produce different hashes.
 */
export function generateSalt(): string {
  return bcrypt.genSaltSync(SALT_ROUNDS);
}

/**
 * Hashes a password with the provided salt using bcrypt.
 * bcrypt internally applies the Blowfish cipher with multiple rounds,
 * making brute-force attacks computationally expensive.
 *
 * @param password - The plaintext password to hash
 * @param salt - The salt to use for hashing
 * @returns The hashed password string
 */
export function hashPassword(password: string, salt: string): string {
  return bcrypt.hashSync(password, salt);
}

/**
 * Verifies a plaintext password against a stored hash.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param password - The plaintext password to verify
 * @param storedHash - The previously stored bcrypt hash
 * @returns true if the password matches the hash, false otherwise
 */
export function verifyPassword(
  password: string,
  storedHash: string
): boolean {
  return bcrypt.compareSync(password, storedHash);
}
