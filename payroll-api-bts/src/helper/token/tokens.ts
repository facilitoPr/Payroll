import crypto from "crypto";

export const createRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex"); // token largo
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateEmailVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 horas

  return {
    rawToken,
    hashedToken,
    expiresAt,
  };
};

export const generatePasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  return {
    rawToken,
    hashedToken,
    expiresAt,
  };
};
