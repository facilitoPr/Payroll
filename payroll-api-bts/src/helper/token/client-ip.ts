import type { Request } from "express";

export function getClientIp(req: Request) {
  // 1) Prioriza x-forwarded-for si estás detrás de proxy
  const xff = req.headers["x-forwarded-for"];
  const raw =
    (typeof xff === "string" && xff.split(",")[0].trim()) ||
    (Array.isArray(xff) && xff[0]) ||
    req.socket?.remoteAddress ||
    req.ip ||
    "";

  // 2) Normaliza IPv4-mapped IPv6 ( ::ffff:127.0.0.1 )
  if (raw.startsWith("::ffff:")) return raw.replace("::ffff:", "");

  // 3) Normaliza loopback IPv6
  if (raw === "::1") return "127.0.0.1";

  return raw;
}
