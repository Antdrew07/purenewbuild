import type { Member } from "./member";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const membersApiConfigured = Boolean(API_URL);
export const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export type MemberSession = { token: string; member: Member };

export class MemberAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request(path: "/register" | "/login", body: Record<string, unknown>): Promise<MemberSession> {
  if (!API_URL) throw new MemberAuthError(503, "Member access is not configured yet.");
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/members${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new MemberAuthError(0, "Could not reach member access. Please try again.");
  }

  const json = (await response.json().catch(() => null)) as { data?: MemberSession; error?: string } | null;
  if (!response.ok || !json?.data) throw new MemberAuthError(response.status, json?.error ?? "Could not complete member access.");
  return json.data;
}

export function registerMember(input: { email: string; password: string; turnstileToken: string }) {
  return request("/register", { ...input, ageConfirmed: true });
}

export function signInMember(input: { email: string; password: string; turnstileToken: string }) {
  return request("/login", input);
}
