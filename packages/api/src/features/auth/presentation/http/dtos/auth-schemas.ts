import { z } from "zod";
import {
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
} from "../../../domain/rules/name-rules";
import { PasswordRules } from "../../../domain/rules/password-rules";

export const signUpSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(PasswordRules.MIN_LENGTH)
    .max(PasswordRules.MAX_LENGTH)
    .regex(/[A-Z]/u, "Password must contain an uppercase letter")
    .regex(/\d/u, "Password must contain a number"),
  name: z.string().min(MIN_NAME_LENGTH).max(MAX_NAME_LENGTH),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type SignUpRequest = z.infer<typeof signUpSchema>;

export type SignInRequest = z.infer<typeof signInSchema>;
