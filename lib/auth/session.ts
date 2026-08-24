const SESSION_COOKIE_NAME = "voiceloop_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function requireAuthEnvironment() {
  const accessCode = process.env.DEMO_ACCESS_CODE;
  const sessionSecret = process.env.AUTH_SESSION_SECRET;

  if (!accessCode || !sessionSecret) {
    throw new Error(
      "DEMO_ACCESS_CODE and AUTH_SESSION_SECRET must be configured on the server.",
    );
  }

  return { accessCode, sessionSecret };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function createSessionToken() {
  const { accessCode, sessionSecret } = requireAuthEnvironment();
  return sha256(`voiceloop:${accessCode}:${sessionSecret}`);
}

export async function isValidAccessCode(value: string) {
  const { accessCode } = requireAuthEnvironment();
  return (await sha256(value)) === (await sha256(accessCode));
}

export async function isValidSession(value?: string) {
  if (!value) return false;

  try {
    return value === (await createSessionToken());
  } catch {
    return false;
  }
}

export {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
};
