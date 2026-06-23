import { Request, Response } from "express";

export const cookieName = "userRefreshToken";
export const cookiePath = "/api/auth/refresh";
export const isProduction = process.env.NODE_ENV === "production";

export const getRefreshTokenFromReq = (req: Request) => {
  return req.cookies?.[cookieName] || null;
};

export const clearRefreshCookies = (res: Response) => {
  res.cookie(cookieName, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: cookiePath,
    expires: new Date(0),
  });
};