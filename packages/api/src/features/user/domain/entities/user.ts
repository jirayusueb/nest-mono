import type { UserId } from "../../../../shared/kernel/types/ids";
import { Email } from "../../../../shared/kernel/values/email";

export interface UserProps {
  id: UserId;
  name: string;
  email: Email;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Read-only feature: restore() only — nothing in `user` ever mints a User. */
export class User {
  private constructor(private readonly props: UserProps) {}

  get id(): UserId {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): Email {
    return this.props.email;
  }
  get emailVerified(): boolean {
    return this.props.emailVerified;
  }
  get image(): string | null {
    return this.props.image;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static restore(props: UserProps): User {
    return new User(props);
  }
}
