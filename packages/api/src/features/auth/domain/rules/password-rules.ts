export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_REQUIRE_UPPERCASE = true;

export const PASSWORD_REQUIRE_NUMBER = true;

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }

  if (PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/u.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }

  if (PASSWORD_REQUIRE_NUMBER && !/\d/u.test(password)) {
    errors.push("Password must contain a number");
  }

  return { valid: errors.length === 0, errors };
}
