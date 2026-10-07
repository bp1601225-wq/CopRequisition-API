import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, { type: argon2.argon2id });
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  if (hashedPassword.startsWith('$argon2')) {
    return argon2.verify(hashedPassword, password);
  }

  return bcrypt.compare(password, hashedPassword);
};
