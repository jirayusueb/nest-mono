import { AppError, type ErrorDetails } from "./app-error";

export class DomainError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super("DomainError", message, details);
    this.name = "DomainError";
  }
}
