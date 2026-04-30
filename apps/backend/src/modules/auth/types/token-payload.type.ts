export type TokenPayloadType = "access" | "refresh";

export type TokenPayload = {
  sub: string;
  email: string;
  roles: string[];
  sessionId: string;
  type: TokenPayloadType;
};
