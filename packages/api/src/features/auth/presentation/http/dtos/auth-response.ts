export interface SessionUserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "admin" | "user";
}

export interface AuthSessionResponse {
  user: SessionUserResponse;
  token: string;
}

export interface SignOutResponse {
  success: boolean;
}

export interface GetSessionResponse {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    updatedAt: string;
  };
  user: SessionUserResponse;
}
