export const sanitizeSession = (session: any) => {
  return {
    _id: session._id,
    user: session.user,
    deviceId: session.deviceId,
    platform: session.platform,
    hasExpoPushToken: Boolean(session.expoPushToken),
    hasWebPushSubscription: Boolean(session.webPushSubscription?.endpoint),
    ip: session.ip || "",
    userAgent: session.userAgent || "",
    lastUsedAt: session.lastUsedAt,
    revokedAt: session.revokedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    isActive: !session.revokedAt,
  };
};
