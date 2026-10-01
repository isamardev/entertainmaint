const crypto = require("crypto");

const PBKDF2_ITERATIONS = 120_000;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_JWT_SECRET is required in production. Add it to the backend .env file and restart the Node.js app.",
    );
  }
  return secret || "dev-admin-jwt-secret-change-me";
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function hashPassword(password, saltBuffer) {
  return crypto.pbkdf2Sync(password, saltBuffer, PBKDF2_ITERATIONS, 32, "sha256").toString("base64");
}

function createPasswordRecord(password) {
  const saltBuffer = crypto.randomBytes(16);
  return {
    salt: saltBuffer.toString("base64"),
    password_hash: hashPassword(password, saltBuffer),
  };
}

function verifyPassword(password, saltBase64, passwordHash) {
  const saltBuffer = Buffer.from(saltBase64, "base64");
  const hash = hashPassword(password, saltBuffer);
  const a = Buffer.from(hash);
  const b = Buffer.from(passwordHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function signAdminToken(payload) {
  const secret = getJwtSecret();
  const body = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, sig] = parts;
  const secret = getJwtSecret();
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!payload?.email || !payload?.version || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  normalizeEmail,
  createPasswordRecord,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
};
