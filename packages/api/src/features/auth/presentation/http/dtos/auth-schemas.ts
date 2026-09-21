import { z } from "zod";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "~/features/auth/domain/rules/password-rules";
import {
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
} from "~/shared/kernel/rules/name-rules";

export const signUpSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
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
