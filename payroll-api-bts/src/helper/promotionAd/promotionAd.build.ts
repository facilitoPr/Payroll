import { AuthRequest } from "../../middlewares/validate-jwt";
import { createUniquePromotionCode } from "../../services/promotionAd/promotionAd.service";
import { getUploadedFileFromMap } from "../upload/upload.get";

const parseJsonField = <T>(value: any, fallback: T): T => {
  try {
    if (!value) return fallback;

    if (typeof value === "string") {
      return JSON.parse(value) as T;
    }

    return value as T;
  } catch {
    return fallback;
  }
};

const parseBooleanField = (value: any, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;

  return value === "true";
};

const parseNumberField = (value: any, fallback = 0) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const buildPromotionMediaFromRequest = (
  req: AuthRequest,
  currentMedia: any = {},
) => {
  const bodyMedia = parseJsonField<any>(req.body.media, {});

  let desktopImage = String(
    bodyMedia.desktopImage || currentMedia.desktopImage || "",
  ).trim();

  let mobileImage = String(
    bodyMedia.mobileImage || currentMedia.mobileImage || "",
  ).trim();

  const uploadedDesktopImage = getUploadedFileFromMap(req, "desktopImage");
  const uploadedMobileImage = getUploadedFileFromMap(req, "mobileImage");

  /**
   * Si llegó imagen procesada por createUploadFieldsProcessor,
   * tiene prioridad sobre la URL enviada manualmente.
   */
  if (uploadedDesktopImage) {
    desktopImage = uploadedDesktopImage;
  }

  if (uploadedMobileImage) {
    mobileImage = uploadedMobileImage;
  }

  return {
    desktopImage,
    mobileImage,
    alt: String(bodyMedia.alt || currentMedia.alt || "").trim(),
  };
};

export const buildPromotionPayloadFromRequest = async (
  req: AuthRequest,
  promotionId?: string,
  currentPromotion?: any,
) => {
  const title = String(req.body.title || currentPromotion?.title || "").trim();

  const style = parseJsonField<any>(req.body.style, {});
  const cta = parseJsonField<any>(req.body.cta, {});
  const media = buildPromotionMediaFromRequest(
    req,
    currentPromotion?.media || {},
  );

  const company = String(req.body.company || "").trim();

  const payload: any = {
    title,
    highlight: String(req.body.highlight || "").trim(),
    subtitle: String(req.body.subtitle || "").trim(),
    description: String(req.body.description || "").trim(),
    badge: String(req.body.badge || "").trim(),

    status: req.body.status || "DRAFT",
    audience: req.body.audience || "PUBLIC",
    company: company || null,
    media,
    style,
    cta,
    order: parseNumberField(req.body.order, 0),
    startsAt: req.body.startsAt || null,
    endsAt: req.body.endsAt || null,
    isActive: parseBooleanField(req.body.isActive, true),
  };

  /**
   * El usuario común no llena código.
   * Se genera automáticamente al crear.
   */
  if (!currentPromotion?.code) {
    payload.code = await createUniquePromotionCode(title, promotionId);
  }

  return payload;
};
