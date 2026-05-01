import { UserStatus } from '@prisma/client';

export type SafeUserResponse = {
  id: string;
  email: string;
  status: UserStatus;
  profile: {
    displayName: string | null;
  } | null;
  roles: string[];
  createdAt: Date;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type AuthResponse = {
  user: SafeUserResponse;
  tokens: AuthTokensResponse;
};
