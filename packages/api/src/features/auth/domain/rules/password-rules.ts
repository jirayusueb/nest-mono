export class PasswordRules {
  static readonly MIN_LENGTH = 8;
  static readonly MAX_LENGTH = 128;
  static readonly REQUIRE_UPPERCASE = true;
  static readonly REQUIRE_NUMBER = true;

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must be at most ${this.MAX_LENGTH} characters`);
    }

    if (this.REQUIRE_UPPERCASE && !/[A-Z]/u.test(password)) {
      errors.push("Password must contain an uppercase letter");
    }

    if (this.REQUIRE_NUMBER && !/\d/u.test(password)) {
      errors.push("Password must contain a number");
    }

    return { valid: errors.length === 0, errors };
  }
}
