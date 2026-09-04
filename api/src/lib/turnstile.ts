import { env, isTurnstileConfigured } from "../env.js";
import { HttpError } from "../middleware/error.js";

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

/** Validates the single-use, five-minute Cloudflare Turnstile token server-side. */
export async function verifyTurnstile({
  token,
  remoteIp,
  action,
}: {
  token: string;
  remoteIp?: string;
  action: string;
}) {
  if (!isTurnstileConfigured) {
    throw new HttpError(503, "Bot verification is not configured yet");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const payload = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    if (remoteIp) payload.set("remoteip", remoteIp);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null) as TurnstileResponse | null;

    if (!response.ok || !result?.success) {
      throw new HttpError(400, "Bot verification failed. Please try again.");
    }
    if (result.action && result.action !== action) {
      throw new HttpError(400, "Bot verification could not be confirmed. Please try again.");
    }
    if (env.TURNSTILE_EXPECTED_HOSTNAME && result.hostname !== env.TURNSTILE_EXPECTED_HOSTNAME) {
      throw new HttpError(400, "Bot verification could not be confirmed. Please try again.");
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "Bot verification is temporarily unavailable. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}
