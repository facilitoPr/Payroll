import { Request, Response } from "express";
import RecruitmentApplication from "../../model/recruitment/recruitmentApplication";
import { evaluateApplicationWithAi } from "../../services/recruitmentAi.service";

export const runRecruitmentAiForApplication = async (
  req: Request,
  res: Response,
) => {
  try {
    const { applicationId } = req.params;
    let { agentId, agentCode } = req.body as {
      agentId?: string;
      agentCode?: string;
    };

    if (!applicationId) {
      return res.status(400).json({
        ok: false,
        mensaje: "applicationId es requerido en la URL.",
      });
    }


    if (!agentId && !agentCode) {
      const application: any = await RecruitmentApplication.findOne({
        _id: applicationId,
        isDeleted: false,
      })
        .populate("form", "title aiAgent aiAgentCode")
        .lean();

      if (!application) {
        return res.status(404).json({
          ok: false,
          mensaje: "Aplicación de reclutamiento no encontrada.",
        });
      }

      agentId =
        application.aiAgent?.toString?.() ||
        application.form?.aiAgent?.toString?.() ||
        undefined;

      agentCode =
        !agentId && application.form?.aiAgentCode
          ? application.form.aiAgentCode
          : undefined;

      if (!agentId && !agentCode) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "Esta aplicación no tiene un agente IA asociado. Envía agentId o agentCode, o configura un agente en el formulario.",
        });
      }
    }

    const updatedApp: any = await evaluateApplicationWithAi(applicationId, {
      agentId,
      agentCode,
    });

    if (!updatedApp) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "No se pudo actualizar la aplicación. Verifica si existe o si ya fue contratada manualmente.",
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Evaluación IA generada correctamente.",
      application: updatedApp,
      aiDecision: updatedApp.aiDecision || null,
      recommendation: updatedApp.aiDecision?.recommendation || null,
      overallScore: updatedApp.aiDecision?.overallScore ?? null,
      confidenceLevel: updatedApp.aiDecision?.confidenceLevel || null,
    });
  } catch (error: any) {
    console.error("runRecruitmentAiForApplication error:", error);

    if (error?.status === 429 && error?.code === "insufficient_quota") {
      return res.status(429).json({
        ok: false,
        mensaje:
          "El agente de IA no pudo ejecutarse porque se ha excedido la cuota del plan de OpenAI. Verifica la facturación y el saldo de tu cuenta de OpenAI.",
        errorCode: "INSUFFICIENT_QUOTA",
      });
    }

    if (error?.status === 429) {
      return res.status(429).json({
        ok: false,
        mensaje:
          "El servicio de IA está recibiendo muchas solicitudes en este momento. Intenta de nuevo en unos segundos.",
        errorCode: "RATE_LIMIT",
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "Error al evaluar la aplicación con IA.",
      error: error.message,
    });
  }
};
