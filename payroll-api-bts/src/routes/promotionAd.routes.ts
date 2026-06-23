import { Router } from "express";
import * as promotionAd from "../controllers/promotionAd.controller";
import { createUploadFieldsProcessor } from "../middlewares/upload/createUploadFieldsProcessor";
import { validateJWT } from "../middlewares/validate-jwt";

const promotionAdRouter: any = Router();

/**
 * Rutas públicas
 */
promotionAdRouter.get(
  "/public/landing-hero",
  promotionAd.getPublicLandingHeroPromotions,
);

promotionAdRouter.post(
  "/public/:promotionId/view",
  promotionAd.registerPromotionView,
);

promotionAdRouter.post(
  "/public/:promotionId/click",
  promotionAd.registerPromotionClick,
);

/**
 * Rutas privadas
 */
promotionAdRouter.use(validateJWT);

promotionAdRouter.post(
  "/",
  createUploadFieldsProcessor([
    {
      name: "desktopImage",
      maxCount: 1,
      folder: "promotion-ads/desktop",
      kind: "image",
    },
    {
      name: "mobileImage",
      maxCount: 1,
      folder: "promotion-ads/mobile",
      kind: "image",
    },
  ]),
  promotionAd.createPromotionAd,
);

promotionAdRouter.get("/", promotionAd.getPromotionAds);

promotionAdRouter.get("/:promotionId", promotionAd.getPromotionAdById);

promotionAdRouter.put(
  "/:promotionId",
  createUploadFieldsProcessor([
    {
      name: "desktopImage",
      maxCount: 1,
      folder: "promotion-ads/desktop",
      kind: "image",
    },
    {
      name: "mobileImage",
      maxCount: 1,
      folder: "promotion-ads/mobile",
      kind: "image",
    },
  ]),
  promotionAd.updatePromotionAd,
);

promotionAdRouter.patch(
  "/:promotionId/publish",
  promotionAd.publishPromotionAd,
);

promotionAdRouter.patch(
  "/:promotionId/archive",
  promotionAd.archivePromotionAd,
);

promotionAdRouter.delete("/:promotionId", promotionAd.deletePromotionAd);

export default promotionAdRouter;