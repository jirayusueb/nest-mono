import { z } from "zod";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "../../../domain/values/plain-password";

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  name: z.string().min(1).max(100),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type SignUpBody = z.infer<typeof signUpSchema>;

export type SignInBody = z.infer<typeof signInSchema>;
