import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function compare(password: string, stored: string) {
  const extractSalt = (stored: string) => stored.split('$')[2]
  const salt = extractSalt(stored)
  // Note: This function would need a hash implementation, which is not provided
  // For production, use the bcrypt.compare function above instead
  return salt + hash(salt + password) === stored
}

// Placeholder for the hash function mentioned in the compare function
function hash(input: string): string {
  // This should be implemented according to your specific requirements
  // For actual use, rely on bcrypt.compare instead
  throw new Error('Hash function not implemented')
}