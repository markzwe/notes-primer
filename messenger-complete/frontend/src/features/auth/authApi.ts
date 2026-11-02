import { request } from "../../lib/http";
export { ApiError } from "../../lib/http";
export type PublicUser = { id: string; username: string };
export type Session = {
  user: PublicUser;
  accessToken: string;
  expiresAt: string;
};
export const loginAccount = (username: string, password: string) =>
  request<Session>("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
export async function registerAccount(username: string, password: string) {
  return (
    await request<{ user: PublicUser }>("/api/auth/register", {
      method: "POST",
      body: { username, password },
    })
  ).user;
}
export const getCurrentUser = (token: string, signal?: AbortSignal) =>
  request<{ userId: string }>("/api/auth/me", { token, signal });
export const logoutAccount = (token: string) =>
  request<void>("/api/auth/logout", { token, method: "POST" });
