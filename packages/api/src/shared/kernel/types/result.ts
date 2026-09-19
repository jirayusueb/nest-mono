/**
 * The kernel Result is better-result's. This module stays as the single import
 * path so features never reach for the package directly, and keeps the
 * `ok(...)` / `err(...)` shorthands the use cases already use.
 */
import { Result } from "better-result";

export { Err, Ok, Result } from "better-result";

export const { ok } = Result;

export const { err } = Result;
