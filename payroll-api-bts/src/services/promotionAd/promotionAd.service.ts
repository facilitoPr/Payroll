import { normalizeCode } from "../../helper/normalize";
import PromotionAd from "../../model/promotionAd";

export const createUniquePromotionCode = async (
  title: string,
  promotionId?: string,
) => {
  const rawTitle = title || "PROMOCION";
  const baseCode = normalizeCode(rawTitle);
  let code = baseCode || `PROMOCION_${Date.now()}`;
  let counter = 1;

  while (
    await PromotionAd.exists({
      code,
      isDeleted: false,
      ...(promotionId ? { _id: { $ne: promotionId } } : {}),
    })
  ) {
    code = `${baseCode}_${counter}`;
    counter += 1;
  }

  return code;
};
