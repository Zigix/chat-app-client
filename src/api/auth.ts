import { postJson } from "./client";
import { createRegisterCrypto } from "../crypto/webcrypto";

export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
  rePassword: string;
  pubEcdhJwk: string;
  vault: {
    version: number;
    kdfSaltB64: string;
    kdfIterations: number;
    wrappedMkB64: string;
    wrappedMkIvB64: string;
    wrappedEcdhPrivB64: string;
    wrappedEcdhPrivIvB64: string;
  };
};

export type LoginRequest = { username: string; password: string };
export type LoginUserResponse = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  pubEcdhJwk: string;
  vaultDto: {
    version: number;
    kdfSaltB64: string;
    kdfIterations: number;
    wrappedMkB64: string;
    wrappedMkIvB64: string;
    wrappedEcdhPrivB64: string;
    wrappedEcdhPrivIvB64: string;
  };
};
export type ApiValidationError = { field: string; error: string };
export type ApiErrorResponse = {
  message?: string;
  errors?: ApiValidationError[];
};

export type RegisterForm = {
  email: string;
  username: string;
  password: string;
  rePassword: string;
};

export async function registerUser(form: RegisterForm) {

  const { pubEcdhJwk, vault } = await createRegisterCrypto(form.password);

  const req: RegisterRequest = {
    email: form.email,
    username: form.username,
    password: form.password,
    rePassword: form.rePassword,
    pubEcdhJwk,
    vault,
  };

  return postJson<{ status: string }>("api/auth/sign-up", req);
}
export function loginUser(req: LoginRequest) {
  return postJson<LoginUserResponse>("api/auth/login", req);
}
