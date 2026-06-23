import UserSession from "../../model/account/userSession";

type reasonType =
  | "REFRESH_TOKEN_MISSING"
  | "SESSION_NOT_FOUND"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_INACTIVE";

export const logRefresh401 = ({
  reason,
  deviceId,
  platform,
  ip,
  userAgent,
  extra = {},
}: {
  reason: reasonType;
  deviceId: string | null;
  platform: string | null;
  ip: string | null;
  userAgent: string | null;
  extra?: Record<string, any>;
}) => {
  console.warn("[AUTH][REFRESH][401]", {
    reason,
    deviceId: deviceId || null,
    platform: platform || null,
    ip: ip || null,
    userAgent: userAgent || null,
    ...extra,
  });
};

export const revokeSessionsByDevice = async (
  deviceId?: string,
  platform?: "ios" | "android" | "web",
) => {
  if (!deviceId || !platform) return;

  await UserSession.updateMany(
    {
      deviceId,
      platform,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};
