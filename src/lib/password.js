import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

export function isHashedPassword(password) {
  return (
    typeof password === "string" &&
    (password.startsWith("$2a$") ||
      password.startsWith("$2b$") ||
      password.startsWith("$2y$"))
  );
}
