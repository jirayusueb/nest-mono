declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]?: B };

// SAFETY: branding is compile-time only; the runtime value passes through
// untouched.
export const make = <T>(value: string): T => value as T;
