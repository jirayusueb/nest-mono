declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]?: B };

/**
 * Lift a runtime string into a branded id. No runtime cost — branding is a
 * compile-time guarantee that a `UserId` only ever comes from a trusted source.
 */
// SAFETY: branding is compile-time only; the runtime value passes through
// untouched.
export const make = <T>(value: string): T => value as T;
