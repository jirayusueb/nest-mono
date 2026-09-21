export const MIN_NAME_LENGTH = 1;

export const MAX_NAME_LENGTH = 100;

export function validateName(name: string) {
  const errors: string[] = [];

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    errors.push(
      `Name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`,
    );
  }

  return { valid: errors.length === 0, errors };
}
