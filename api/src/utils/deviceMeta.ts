export type DeviceMeta = {
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export function deviceNameFromUserAgent(ua?: string | null): string {
  if (!ua || !ua.trim()) return "Appareil inconnu";
  if (/android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iOS/i.test(ua)) return "iOS";
  if (/Expo|okhttp|Darwin/i.test(ua)) return "Application mobile";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS/i.test(ua)) return "Mac";
  return ua.trim().slice(0, 80);
}

export function extractDeviceMeta(req: {
  headers: Record<string, unknown>;
  ip?: string;
}): DeviceMeta {
  const uaHeader = req.headers["user-agent"];
  const userAgent = typeof uaHeader === "string" ? uaHeader : null;
  const deviceHeader = req.headers["x-device-name"];
  const deviceName =
    typeof deviceHeader === "string" && deviceHeader.trim()
      ? deviceHeader.trim().slice(0, 80)
      : deviceNameFromUserAgent(userAgent);

  const forwarded = req.headers["x-forwarded-for"];
  let ipAddress = req.ip ?? null;
  if (typeof forwarded === "string" && forwarded.length > 0) {
    ipAddress = forwarded.split(",")[0]!.trim();
  }

  return { deviceName, userAgent, ipAddress };
}
