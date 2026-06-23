import { Request, Response } from "express";
import { Types } from "mongoose";
import PromotionAd from "../model/promotionAd";
import { AuthRequest } from "../middlewares/validate-jwt";
import { buildPromotionPayloadFromRequest } from "../helper/promotionAd/promotionAd.build";
import Company from "../model/company";

const createPromotionAd = async (req: AuthRequest, res: Response) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();

    if (!title || !description) {
      return res.status(400).json({
        ok: false,
        mensaje: "El título y la descripción son requeridos.",
      });
    }

    if (req.body.company && !Types.ObjectId.isValid(req.body.company)) {
      return res.status(400).json({
        ok: false,
        mensaje: "La empresa enviada no es válida.",
      });
    }

    const payload = await buildPromotionPayloadFromRequest(req);

    const promotion = await PromotionAd.create({
      ...payload,
      createdBy: req.uid,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Promoción creada correctamente.",
      promotion,
    });
  } catch (error) {
    console.log("createPromotionAd error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear la promoción.",
      error,
    });
  }
};

const getPromotionAds = async (req: Request, res: Response) => {
  try {
    const {
      search = "",
      status,
      audience,
      company,
      isActive,
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const query: any = {
      isDeleted: false,
    };

    if (status) query.status = String(status);
    if (audience) query.audience = String(audience);

    if (typeof isActive === "string" && isActive !== "") {
      query.isActive = isActive === "true";
    }

    if (company) {
      if (!Types.ObjectId.isValid(String(company))) {
        return res.status(400).json({
          ok: false,
          mensaje: "ID de empresa inválido.",
        });
      }

      query.company = company;
    }

    if (search) {
      const regex = new RegExp(String(search), "i");

      query.$or = [
        { code: regex },
        { title: regex },
        { highlight: regex },
        { subtitle: regex },
        { description: regex },
        { badge: regex },
      ];
    }

    const [promotions, total] = await Promise.all([
      PromotionAd.find(query)
        .populate("company", "code legalName tradeName logo")
        .sort({ order: 1, createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage),
      PromotionAd.countDocuments(query),
    ]);

    return res.json({
      ok: true,
      mensaje: "Promociones obtenidas correctamente.",
      promotions,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.log("getPromotionAds error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las promociones.",
      error,
    });
  }
};

const getPromotionAdById = async (req: Request, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de promoción inválido.",
      });
    }

    const promotion = await PromotionAd.findOne({
      _id: promotionId,
      isDeleted: false,
    }).populate("company", "code legalName tradeName logo");

    if (!promotion) {
      return res.status(404).json({
        ok: false,
        mensaje: "Promoción no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Promoción obtenida correctamente.",
      promotion,
    });
  } catch (error) {
    console.log("getPromotionAdById error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener la promoción.",
      error,
    });
  }
};

const updatePromotionAd = async (req: AuthRequest, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de promoción inválido.",
      });
    }

    const promotion = await PromotionAd.findOne({
      _id: promotionId,
      isDeleted: false,
    });

    if (!promotion) {
      return res.status(404).json({
        ok: false,
        mensaje: "Promoción no encontrada.",
      });
    }

    const title = String(req.body.title || promotion.title || "").trim();
    const description = String(
      req.body.description || promotion.description || "",
    ).trim();

    if (!title || !description) {
      return res.status(400).json({
        ok: false,
        mensaje: "El título y la descripción son requeridos.",
      });
    }

    if (req.body.company && !Types.ObjectId.isValid(req.body.company)) {
      return res.status(400).json({
        ok: false,
        mensaje: "La empresa enviada no es válida.",
      });
    }

    const payload = await buildPromotionPayloadFromRequest(
      req,
      promotionId,
      promotion,
    );

    /**
     * No actualizamos code desde el frontend.
     * El code queda como identificador interno.
     */
    delete payload.code;

    payload.updatedBy = req.uid;

    const updatedPromotion = await PromotionAd.findByIdAndUpdate(
      promotionId,
      payload,
      {
        new: true,
        runValidators: true,
      },
    ).populate("company", "code legalName tradeName logo");

    return res.json({
      ok: true,
      mensaje: "Promoción actualizada correctamente.",
      promotion: updatedPromotion,
    });
  } catch (error) {
    console.log("updatePromotionAd error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar la promoción.",
      error,
    });
  }
};

const publishPromotionAd = async (req: AuthRequest, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de promoción inválido.",
      });
    }

    const promotion = await PromotionAd.findOneAndUpdate(
      {
        _id: promotionId,
        isDeleted: false,
      },
      {
        $set: {
          status: "PUBLISHED",
          isActive: true,
          updatedBy: req.uid,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!promotion) {
      return res.status(404).json({
        ok: false,
        mensaje: "Promoción no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Promoción publicada correctamente.",
      promotion,
    });
  } catch (error) {
    console.log("publishPromotionAd error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al publicar la promoción.",
      error,
    });
  }
};

const archivePromotionAd = async (req: AuthRequest, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de promoción inválido.",
      });
    }

    const promotion = await PromotionAd.findOneAndUpdate(
      {
        _id: promotionId,
        isDeleted: false,
      },
      {
        $set: {
          status: "ARCHIVED",
          isActive: false,
          updatedBy: req.uid,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!promotion) {
      return res.status(404).json({
        ok: false,
        mensaje: "Promoción no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Promoción archivada correctamente.",
      promotion,
    });
  } catch (error) {
    console.log("archivePromotionAd error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al archivar la promoción.",
      error,
    });
  }
};

const deletePromotionAd = async (req: AuthRequest, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de promoción inválido.",
      });
    }

    const promotion = await PromotionAd.findOneAndUpdate(
      {
        _id: promotionId,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          isActive: false,
          updatedBy: req.uid,
        },
      },
      {
        new: true,
      },
    );

    if (!promotion) {
      return res.status(404).json({
        ok: false,
        mensaje: "Promoción no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Promoción eliminada correctamente.",
      promotion,
    });
  } catch (error) {
    console.log("deletePromotionAd error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar la promoción.",
      error,
    });
  }
};

const getPublicLandingHeroPromotions = async (req: Request, res: Response) => {
  try {
    const { company = "" } = req.query as {
      company?: string;
    };

    const cleanCompany = String(company || "").trim();

    const query: any = {
      isDeleted: false,
      isActive: true,
    };

    if (cleanCompany) {
      const companyQuery: any = {
        isDeleted: false,
        isActive: true,
        $or: [{ code: cleanCompany }],
      };

      if (Types.ObjectId.isValid(cleanCompany)) {
        companyQuery.$or.push({ _id: new Types.ObjectId(cleanCompany) });
      }

      const companyDoc = await Company.findOne(companyQuery)
        .select("_id code")
        .lean();

      if (!companyDoc) {
        return res.status(200).json({
          ok: true,
          mensaje: "Promociones obtenidas correctamente.",
          promotions: [],
        });
      }

      query.$or = [
        { company: companyDoc._id },
        { companyCode: companyDoc.code },
        { isGlobal: true },
      ];
    } else {
      query.$or = [
        { company: null },
        { company: { $exists: false } },
        { companyCode: "" },
        { isGlobal: true },
      ];
    }

    const promotions = await PromotionAd.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      ok: true,
      mensaje: "Promociones obtenidas correctamente.",
      promotions,
    });
  } catch (error) {
    console.error("getPublicLandingHeroPromotions error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las promociones.",
      error,
    });
  }
};

const registerPromotionView = async (req: Request, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de promoción inválido.",
      });
    }

    await PromotionAd.updateOne(
      {
        _id: promotionId,
        isDeleted: false,
      },
      {
        $inc: {
          "metrics.views": 1,
        },
      },
    );

    return res.json({
      ok: true,
      mensaje: "Vista registrada correctamente.",
    });
  } catch (error) {
    console.log("registerPromotionView error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al registrar la vista.",
    });
  }
};

const registerPromotionClick = async (req: Request, res: Response) => {
  try {
    const { promotionId } = req.params;

    if (!Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de promoción inválido.",
      });
    }

    await PromotionAd.updateOne(
      {
        _id: promotionId,
        isDeleted: false,
      },
      {
        $inc: {
          "metrics.clicks": 1,
        },
      },
    );

    return res.json({
      ok: true,
      mensaje: "Click registrado correctamente.",
    });
  } catch (error) {
    console.log("registerPromotionClick error:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al registrar el click.",
    });
  }
};

export {
  createPromotionAd,
  getPromotionAds,
  getPromotionAdById,
  updatePromotionAd,
  publishPromotionAd,
  archivePromotionAd,
  deletePromotionAd,
  getPublicLandingHeroPromotions,
  registerPromotionView,
  registerPromotionClick,
};
