import { Request, Response } from "express";
import { Types } from "mongoose";
import RecruitmentForm from "../../model/recruitment/recruitment-form";
import RecruitmentApplication from "../../model/recruitment/recruitmentApplication";
import { sendEmail } from "../../utils/sendEmail";
import { evaluateApplicationWithAi } from "../../services/recruitmentAi.service";
import Expedient from "../../model/expedient/expedient";
import { ensureExpedientForApplication } from "../../helper/expedient/ensureExpedientForApplication";
import mongoose from "mongoose";
import AiAgent from "../../model/aiAgent";
import { populate } from "dotenv";
import { analyzeInterviewFromApplicationWithAi } from "../../services/interviewAnalyst.service";

const getAnswer = (
  answers: Record<string, any>,
  key: string,
): string | undefined => {
  const value = answers?.[key];
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  return String(value);
};

const submitRecruitmentApplication = async (req: Request, res: Response) => {
  try {
    const { formId, publicToken } = req.body;

    if (!formId || !publicToken) {
      return res.status(400).json({
        ok: false,
        mensaje: "formId y publicToken son requeridos.",
      });
    }

    if (!Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "formId no es un ObjectId válido.",
      });
    }

    let answers: Record<string, any> = {};
    try {
      answers =
        typeof req.body.answers === "string"
          ? JSON.parse(req.body.answers)
          : req.body.answers || {};
    } catch (err) {
      return res.status(400).json({
        ok: false,
        mensaje: "El campo answers debe ser un JSON válido.",
      });
    }

    const form: any = await RecruitmentForm.findOne({
      _id: formId,
      publicToken,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!form) {
      return res.status(404).json({
        ok: false,
        mensaje: "Formulario no encontrado o inactivo.",
      });
    }

    const shouldRunAutoAi =
      typeof form.autoAiEvaluation === "boolean"
        ? form.autoAiEvaluation
        : false;

    const applicantName =
      getAnswer(answers, "fullName") || getAnswer(answers, "name") || undefined;

    const applicantEmail =
      getAnswer(answers, "email") ||
      getAnswer(answers, "emailAddress") ||
      undefined;

    const applicantPhone =
      getAnswer(answers, "mobilePhone") ||
      getAnswer(answers, "alternatePhone") ||
      undefined;

    const desiredPosition =
      getAnswer(answers, "desiredPosition") ||
      getAnswer(answers, "position") ||
      undefined;

    const source =
      getAnswer(answers, "source") ||
      getAnswer(answers, "applicationSource") ||
      undefined;

    const customReq = req as any;
    const uploadedDocs = customReq.uploaded?.docs || [];

    for (const doc of uploadedDocs) {
      answers[doc.fieldname] = doc.url;
    }

    let application: any = await RecruitmentApplication.create({
      form: formId,
      publicToken,
      answers,
      applicantName,
      applicantEmail,
      applicantPhone,
      desiredPosition,
      source,
    });

    let aiExecuted = false;
    let aiExecutionError: string | null = null;

    if (shouldRunAutoAi) {
      try {
        const evaluated = await evaluateApplicationWithAi(
          application._id.toString(),
          {
            agentId: form.aiAgent?.toString?.(),
            agentCode:
              !form.aiAgent && form.aiAgentCode
                ? form.aiAgentCode
                : !form.aiAgent
                  ? "RECRUITMENT_CALLCENTER_DEFAULT"
                  : undefined,
          },
        );

        if (evaluated) {
          application = evaluated;
          aiExecuted = true;
        }
      } catch (aiError: any) {
        aiExecuted = false;
        aiExecutionError =
          aiError?.message ||
          "No se pudo ejecutar la evaluación automática de IA.";
        console.error(
          "Error en evaluación automática de IA (submitRecruitmentApplication):",
          aiError,
        );
      }
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Solicitud enviada correctamente.",
      application,
      aiExecuted,
      aiDecision: application?.aiDecision || null,
      recommendation: application?.aiDecision?.recommendation || null,
      overallScore: application?.aiDecision?.overallScore ?? null,
      confidenceLevel: application?.aiDecision?.confidenceLevel || null,
      aiExecutionError,
    });
  } catch (error: any) {
    console.error("Error submitRecruitmentApplication:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Hable con el administrador.",
      error: error.message,
    });
  }
};

const getRecruitmentApplications = async (req: any, res: Response) => {
  try {
    const user = req.user;

    const {
      formId,
      statusId,
      search,
      page = "1",
      limit = "20",
      answersFilters,
    } = req.query as {
      formId?: string;
      statusId?: string;
      search?: string;
      page?: string;
      limit?: string;
      answersFilters?: string;
    };

    const pageNum = Math.max(parseInt(page || "1", 10), 1);
    const limitNum = Math.max(parseInt(limit || "20", 10), 1);

    const query: any = {
      isDeleted: false,
    };

    // 🔹 Si es ADMIN: solo aplicaciones donde figure como evaluador
    if (user?.rol?.code === "EMPLOYEE" && user._id) {
      query["interview.evaluators"] = { $in: [user._id] };
    }

    if (formId && Types.ObjectId.isValid(formId)) {
      query.form = formId;
    }

    if (statusId && Types.ObjectId.isValid(statusId)) {
      query.status = statusId;
    }

    // 🔹 Búsqueda global básica
    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { applicantName: regex },
        { applicantEmail: regex },
        { desiredPosition: regex },
      ];
    }

    // 🔹 Filtros dinámicos por campos del formulario (answers)
    if (answersFilters) {
      try {
        const parsed = JSON.parse(String(answersFilters)) as Record<
          string,
          any
        >;

        const andConditions: any[] = [];

        Object.entries(parsed).forEach(([key, value]) => {
          if (
            value === null ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            return;
          }

          const path = `answers.${key}`;

          // Si viene string → regex case-insensitive (contains)
          if (typeof value === "string") {
            andConditions.push({
              [path]: { $regex: new RegExp(value.trim(), "i") },
            });
          } else {
            // boolean, number, etc → match directo
            andConditions.push({
              [path]: value,
            });
          }
        });

        if (andConditions.length) {
          if (query.$and) {
            query.$and = query.$and.concat(andConditions);
          } else {
            query.$and = andConditions;
          }
        }
      } catch (e) {
        console.error("answersFilters JSON inválido:", e);
        // no cortamos la ejecución; simplemente ignoramos filtros mal formados
      }
    }

    const [applications, total] = await Promise.all([
      RecruitmentApplication.find(query)
        // .populate("form", "title slug jobPosition")
        .populate({
          path: "form",
          select: "title slug jobPosition",
          populate: { path: "jobPosition", select: "name" },
        })
        .populate("status", "name color")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      RecruitmentApplication.countDocuments(query),
    ]);

    return res.json({
      ok: true,
      mensaje: "Listado de aplicaciones de reclutamiento.",
      applications,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error: any) {
    console.error("Error getRecruitmentApplications:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Hable con el administrador.",
      error: error.message,
    });
  }
};

const getRecruitmentApplicationById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const application = await RecruitmentApplication.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("form", "title slug")
      .populate("status", "name color")
      .lean();

    if (!application) {
      return res.status(404).json({
        ok: false,
        mensaje: "Aplicación no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Detalle de la aplicación.",
      application,
    });
  } catch (error: any) {
    console.error("Error getRecruitmentApplicationById:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Hable con el administrador.",
      error: error.message,
    });
  }
};

const getRecruitmentAllApplications = async (req: any, res: Response) => {
  try {
    const { decision } = req.query;

    const query: any = {
      isDeleted: false,
    };

    if (decision) {
      query.decision = decision;
    }

    const applications = await RecruitmentApplication.find(query)
      // .populate("form", "title slug")
      .populate({
        path: "form",
        select: "title slug",
        populate: {
          path: "jobPosition",
          select: "_id name department",
          populate: { path: "department", select: "_id name" },
        },
      })
      .populate("status", "name color")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).send({
      ok: true,
      mensaje: "Listado de aplicaciones de reclutamiento.",
      applications,
    });
  } catch (error: any) {
    console.error("Error getRecruitmentApplications:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Hable con el administrador.",
      error: error.message,
    });
  }
};

const updateRecruitmentApplicationStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(statusId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID o statusId inválidos.",
      });
    }

    const application = await RecruitmentApplication.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status: statusId },
      { new: true },
    )
      .populate("form", "title slug")
      .populate("status", "name color");

    if (!application) {
      return res.status(404).json({
        ok: false,
        mensaje: "Aplicación no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Estado de la aplicación actualizado.",
      application,
    });
  } catch (error: any) {
    console.error("Error updateRecruitmentApplicationStatus:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Hable con el administrador.",
      error: error.message,
    });
  }
};

const deleteRecruitmentApplication = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const application = await RecruitmentApplication.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true },
    );

    if (!application) {
      return res.status(404).json({
        ok: false,
        mensaje: "Aplicación no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Aplicación eliminada correctamente.",
      application,
    });
  } catch (error: any) {
    console.error("Error deleteRecruitmentApplication:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Hable con el administrador.",
      error: error.message,
    });
  }
};

const saveApplicationClassification = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { sections, expedientCode, owner, notes } = req.body;

    if (!sections) {
      return res.status(400).json({
        ok: false,
        mensaje: "El campo sections es requerido.",
      });
    }

    const userId = req.user?._id;
    const filter: any = { _id: id, isDeleted: false };

    const app = await RecruitmentApplication.findOneAndUpdate(
      filter,
      {
        $set: {
          classification: {
            sections,
            expedientCode: expedientCode || "EXP-NEW",
            owner: owner || "RRHH",
            notes: notes || "",
            updatedBy: userId || null,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean();

    if (!app) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud de reclutamiento no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Clasificación de expediente guardada correctamente.",
      application: app,
    });
  } catch (error: any) {
    console.error("saveApplicationClassification error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al guardar la clasificación de expediente.",
      error: error.message,
    });
  }
};

const changeApplicationStatus = async (req: any, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { status, decision } = req.body as any;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "id inválido" });
    }

    session.startTransaction();

    const app = await RecruitmentApplication.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).session(session);

    if (!app) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ ok: false, mensaje: "Solicitud no encontrada" });
    }

    if (status) {
      if (status === "Rechazada") app.decision = "REJECTED";
      app.status = status;
    }

    if (decision) {
      if (decision === "REJECTED") app.status = "Rechazada";
      app.decision = decision;
    }

    let expedient = null;

    if (decision === "HIRING") {
      expedient = await ensureExpedientForApplication({
        applicationId: String(app._id),
        actorUserId: String(req.user?._id || ""),
        session,
      });

      // ✅ Recomendado: guardar referencia (si ya agregaste el campo)
      app.expedient = expedient._id;
    }

    await app.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      ok: true,
      mensaje: "Estado actualizado",
      application: app,
      expedientId: expedient?._id || null,
    });
  } catch (error: any) {
    try {
      await session.abortTransaction();
    } catch {}
    console.error(error);
    return res.status(500).json({
      ok: false,
      mensaje: "¡Ups! Algo salió mal",
      error: String(error?.message || error),
    });
  } finally {
    session.endSession();
  }
};

const scheduleInterview = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledAt, mode, location, evaluators, notes } = req.body;

    if (
      !scheduledAt ||
      !mode ||
      !location ||
      !Array.isArray(evaluators) ||
      !evaluators.length
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "scheduledAt, mode, location y al menos un evaluador son requeridos.",
      });
    }

    const filter: any = { _id: id, isDeleted: false };

    const app: any = await RecruitmentApplication.findOneAndUpdate(
      filter,
      {
        $set: {
          interview: {
            ...(req.body.interview || {}),
            scheduledAt,
            mode,
            location,
            evaluators,
            notes: notes || "",
          },
        },
      },
      { new: true },
    )
      // si quieres, puedes hacer populate de quien creó o está asignado:
      .populate("interview.evaluators", "name email")
      .lean();

    if (!app) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud de reclutamiento no encontrada.",
      });
    }

    // ----------
    // Helpers
    // ----------
    const interviewDate = new Date(app.interview?.scheduledAt || scheduledAt);
    const formattedDate = interviewDate.toLocaleString("es-DO", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const companyName = "Blue Technology Solution";
    const candidateName =
      app.candidateName || app.answers?.fullName || "candidato/a";
    const position =
      app.answers?.desiredPosition || "el puesto al que has aplicado";

    // =====================================================
    // 1) EMAIL AL CANDIDATO
    // =====================================================
    if (app.applicantEmail) {
      const subjectCandidate = `Confirmación de entrevista – ${position}`;

      const htmlCandidate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Confirmación de entrevista</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#005aa5,#00a6e7); padding:16px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px;">${companyName}</h2>
              <p style="margin:4px 0 0; font-size:13px;">Confirmación de entrevista</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px; color:#333;">Hola <strong>${candidateName}</strong>,</p>

              <p style="font-size:14px; color:#333; line-height:1.5;">
                Gracias por tu interés en formar parte de <strong>${companyName}</strong>.
                Te confirmamos que hemos agendado una entrevista para el puesto de
                <strong>${position}</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0; font-size:13px; color:#333;">
                <tr>
                  <td style="padding:6px 0; width:140px; font-weight:bold;">Fecha y hora:</td>
                  <td style="padding:6px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Modalidad:</td>
                  <td style="padding:6px 0;">${mode}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Lugar / enlace:</td>
                  <td style="padding:6px 0;">${location}</td>
                </tr>
                ${
                  notes
                    ? `<tr>
                        <td style="padding:6px 0; font-weight:bold;">Notas:</td>
                        <td style="padding:6px 0;">${notes}</td>
                      </tr>`
                    : ""
                }
              </table>

              <p style="font-size:13px; color:#333; line-height:1.5;">
                Te recomendamos conectarte/ llegar al menos 10 minutos antes de la hora programada
                y tener a mano tus documentos relevantes (currículum actualizado, identificación,
                certificaciones, etc.).
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Si necesitas reprogramar la entrevista o tienes alguna duda,
                puedes responder a este correo.
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Saludos cordiales,<br/>
                <strong>Equipo de Reclutamiento</strong><br/>
                ${companyName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f0f0f0; padding:12px 24px; text-align:center; font-size:11px; color:#777;">
              Este mensaje se generó automáticamente. Por favor, no compartas este correo con personas no autorizadas.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await sendEmail({
        to: app.applicantEmail,
        subject: subjectCandidate,
        html: htmlCandidate,
      });
    }

    // =====================================================
    // 2) EMAIL A LOS EVALUADORES
    // =====================================================
    if (app.interview?.evaluators && Array.isArray(app.interview.evaluators)) {
      for (const evaluator of app.interview.evaluators as any[]) {
        if (!evaluator?.email) continue;

        const evaluatorName = evaluator.name || "Evaluador";
        const subjectEvaluator = `Nueva entrevista asignada – ${candidateName}`;

        const htmlEvaluator = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Entrevista asignada</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#005aa5,#00a6e7); padding:16px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px;">${companyName}</h2>
              <p style="margin:4px 0 0; font-size:13px;">Nueva entrevista asignada</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px; color:#333;">Hola <strong>${evaluatorName}</strong>,</p>

              <p style="font-size:14px; color:#333; line-height:1.5;">
                Se te ha asignado como evaluador en una entrevista para el/la candidato(a)
                <strong>${candidateName}</strong>, quien está aplicando al puesto de
                <strong>${position}</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0; font-size:13px; color:#333;">
                <tr>
                  <td style="padding:6px 0; width:140px; font-weight:bold;">Fecha y hora:</td>
                  <td style="padding:6px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Modalidad:</td>
                  <td style="padding:6px 0;">${mode}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Lugar / enlace:</td>
                  <td style="padding:6px 0;">${location}</td>
                </tr>
                ${
                  notes
                    ? `<tr>
                        <td style="padding:6px 0; font-weight:bold;">Notas:</td>
                        <td style="padding:6px 0;">${notes}</td>
                      </tr>`
                    : ""
                }
              </table>

              <p style="font-size:13px; color:#333; line-height:1.5;">
                Por favor, revisa la información del candidato en el sistema de reclutamiento
                antes de la entrevista y utiliza el formato de evaluación disponible
                para registrar tu valoración.
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Saludos,<br/>
                <strong>Equipo de Reclutamiento</strong><br/>
                ${companyName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f0f0f0; padding:12px 24px; text-align:center; font-size:11px; color:#777;">
              Este mensaje se generó automáticamente desde el módulo de reclutamiento.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        await sendEmail({
          to: evaluator.email,
          subject: subjectEvaluator,
          html: htmlEvaluator,
        });
      }
    }

    return res.json({
      ok: true,
      mensaje: "Entrevista agendada correctamente.",
      application: app,
    });
  } catch (error: any) {
    console.error("scheduleInterview error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al agendar la entrevista.",
      error: error.message,
    });
  }
};

const saveInterviewEvaluation = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const evaluation = req.body; // aquí viene todo el evaluationForm

    if (!evaluation || !evaluation.date) {
      return res.status(400).json({
        ok: false,
        mensaje: "La evaluación y la fecha son requeridas.",
      });
    }

    const filter: any = { _id: id, isDeleted: false };

    const app = await RecruitmentApplication.findOneAndUpdate(
      filter,
      {
        $set: {
          "interview.evaluation": {
            ...evaluation,
            interviewer: evaluation.interviewer._id,
          },
          "interview.evaluationUpdatedAt": new Date(),
        },
      },
      { new: true },
    )
      // .populate("assignedTo", "name email")
      .populate("interview.evaluators", "name email")
      .populate("interview.interviewer", "name email")
      .lean();

    if (!app) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud de reclutamiento no encontrada.",
      });
    }

    // Si en la evaluación recomiendas contratar, puedes ajustar la decisión:
    if (evaluation.recommendation === "CONTRATAR") {
      await RecruitmentApplication.updateOne(
        { _id: app._id },
        { $set: { decision: "HIRING", status: "Aprobada" } },
      );
      app.decision = "HIRING";
      app.status = "Aprobada";
    }

    return res.json({
      ok: true,
      mensaje: "Evaluación de entrevista guardada correctamente.",
      application: app,
    });
  } catch (error: any) {
    console.error("saveInterviewEvaluation error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al guardar la evaluación de la entrevista.",
      error: error.message,
    });
  }
};

const updateInterview = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledAt, mode, location, evaluators, notes } = req.body;

    if (
      !scheduledAt ||
      !mode ||
      !location ||
      !Array.isArray(evaluators) ||
      !evaluators.length
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "scheduledAt, mode, location y al menos un evaluador son requeridos.",
      });
    }

    const filter: any = { _id: id, isDeleted: false };

    // Usamos dot-notation para no perder otras cosas dentro de interview (evaluation, etc.)
    const app: any = await RecruitmentApplication.findOneAndUpdate(
      filter,
      {
        $set: {
          "interview.scheduledAt": scheduledAt,
          "interview.mode": mode,
          "interview.location": location,
          "interview.evaluators": evaluators,
          "interview.notes": notes || "",
        },
      },
      { new: true },
    )
      .populate("interview.evaluators", "name email")
      .lean();

    if (!app) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud de reclutamiento no encontrada.",
      });
    }

    // ----------
    // Helpers
    // ----------
    const interviewDate = new Date(app.interview?.scheduledAt || scheduledAt);
    const formattedDate = interviewDate.toLocaleString("es-DO", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const companyName = "Blue Technology Solution";
    const candidateName =
      app.candidateName || app.answers?.fullName || "candidato/a";
    const position =
      app.answers?.desiredPosition || "el puesto al que has aplicado";

    // =====================================================
    // 1) EMAIL AL CANDIDATO (reprogramación)
    // =====================================================
    if (app.applicantEmail) {
      const subjectCandidate = `Actualización de entrevista – ${position}`;

      const htmlCandidate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Actualización de entrevista</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#005aa5,#00a6e7); padding:16px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px;">${companyName}</h2>
              <p style="margin:4px 0 0; font-size:13px;">Actualización de entrevista</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px; color:#333;">Hola <strong>${candidateName}</strong>,</p>

              <p style="font-size:14px; color:#333; line-height:1.5;">
                Te informamos que hemos <strong>actualizado/reprogramado</strong> tu entrevista
                para el puesto de <strong>${position}</strong> en <strong>${companyName}</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0; font-size:13px; color:#333;">
                <tr>
                  <td style="padding:6px 0; width:140px; font-weight:bold;">Nueva fecha y hora:</td>
                  <td style="padding:6px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Modalidad:</td>
                  <td style="padding:6px 0;">${mode}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Lugar / enlace:</td>
                  <td style="padding:6px 0;">${location}</td>
                </tr>
                ${
                  notes
                    ? `<tr>
                        <td style="padding:6px 0; font-weight:bold;">Notas:</td>
                        <td style="padding:6px 0;">${notes}</td>
                      </tr>`
                    : ""
                }
              </table>

              <p style="font-size:13px; color:#333; line-height:1.5;">
                Te recomendamos conectarte/llegar al menos 10 minutos antes de la hora programada
                y tener a mano tus documentos relevantes (currículum actualizado, identificación,
                certificaciones, etc.).
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Si necesitas reprogramar nuevamente o tienes alguna duda,
                puedes responder a este correo.
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Saludos cordiales,<br/>
                <strong>Equipo de Reclutamiento</strong><br/>
                ${companyName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f0f0f0; padding:12px 24px; text-align:center; font-size:11px; color:#777;">
              Este mensaje se generó automáticamente. Por favor, no compartas este correo con personas no autorizadas.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await sendEmail({
        to: app.applicantEmail,
        subject: subjectCandidate,
        html: htmlCandidate,
      });
    }

    // =====================================================
    // 2) EMAIL A LOS EVALUADORES (reprogramación)
    // =====================================================
    if (app.interview?.evaluators && Array.isArray(app.interview.evaluators)) {
      for (const evaluator of app.interview.evaluators as any[]) {
        if (!evaluator?.email) continue;

        const evaluatorName = evaluator.name || "Evaluador";
        const subjectEvaluator = `Entrevista reprogramada – ${candidateName}`;

        const htmlEvaluator = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Entrevista reprogramada</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#005aa5,#00a6e7); padding:16px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px;">${companyName}</h2>
              <p style="margin:4px 0 0; font-size:13px;">Entrevista reprogramada</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px; color:#333;">Hola <strong>${evaluatorName}</strong>,</p>

              <p style="font-size:14px; color:#333; line-height:1.5;">
                Se ha <strong>reprogramado</strong> la entrevista del/de la candidato(a)
                <strong>${candidateName}</strong>, quien aplica al puesto de
                <strong>${position}</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0; font-size:13px; color:#333;">
                <tr>
                  <td style="padding:6px 0; width:140px; font-weight:bold;">Nueva fecha y hora:</td>
                  <td style="padding:6px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Modalidad:</td>
                  <td style="padding:6px 0;">${mode}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Lugar / enlace:</td>
                  <td style="padding:6px 0;">${location}</td>
                </tr>
                ${
                  notes
                    ? `<tr>
                        <td style="padding:6px 0; font-weight:bold;">Notas:</td>
                        <td style="padding:6px 0;">${notes}</td>
                      </tr>`
                    : ""
                }
              </table>

              <p style="font-size:13px; color:#333; line-height:1.5;">
                Por favor, revisa la información del candidato en el sistema de reclutamiento
                antes de la entrevista y utiliza el formato de evaluación disponible
                para registrar tu valoración.
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Saludos,<br/>
                <strong>Equipo de Reclutamiento</strong><br/>
                ${companyName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f0f0f0; padding:12px 24px; text-align:center; font-size:11px; color:#777;">
              Este mensaje se generó automáticamente desde el módulo de reclutamiento.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        await sendEmail({
          to: evaluator.email,
          subject: subjectEvaluator,
          html: htmlEvaluator,
        });
      }
    }

    return res.json({
      ok: true,
      mensaje: "Entrevista actualizada correctamente.",
      application: app,
    });
  } catch (error: any) {
    console.error("updateInterview error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar la entrevista.",
      error: error.message,
    });
  }
};

const cancelInterview = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const filter: any = { _id: id, isDeleted: false };

    // Primero buscamos la app para poder leer datos y enviar correos
    const app: any = await RecruitmentApplication.findOne(filter)
      .populate("interview.evaluators", "name email")
      .lean();

    if (!app) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud de reclutamiento no encontrada.",
      });
    }

    const companyName = "Blue Technology Solution";
    const candidateName =
      app.candidateName || app.answers?.fullName || "candidato/a";
    const position =
      app.answers?.desiredPosition || "el puesto al que has aplicado";

    const interviewDate = app.interview?.scheduledAt
      ? new Date(app.interview.scheduledAt)
      : null;

    const formattedDate = interviewDate
      ? interviewDate.toLocaleString("es-DO", {
          dateStyle: "full",
          timeStyle: "short",
        })
      : "";

    const mode = app.interview?.mode || "";
    const location = app.interview?.location || "";
    const notes = app.interview?.notes || "";

    // =====================================================
    // 1) EMAIL AL CANDIDATO (cancelación)
    // =====================================================
    if (app.applicantEmail && interviewDate) {
      const subjectCandidate = `Cancelación de entrevista – ${position}`;

      const htmlCandidate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Cancelación de entrevista</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#005aa5,#00a6e7); padding:16px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px;">${companyName}</h2>
              <p style="margin:4px 0 0; font-size:13px;">Cancelación de entrevista</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px; color:#333;">Hola <strong>${candidateName}</strong>,</p>

              <p style="font-size:14px; color:#333; line-height:1.5;">
                Te informamos que la entrevista que estaba programada para el puesto de
                <strong>${position}</strong>, con fecha <strong>${formattedDate}</strong>,
                ha sido <strong>cancelada</strong>.
              </p>

              ${
                notes
                  ? `<p style="font-size:13px; color:#333; line-height:1.5;">
                      Motivo / notas de la cancelación: ${notes}
                    </p>`
                  : ""
              }

              <p style="font-size:13px; color:#333; line-height:1.5;">
                Si corresponde, nuestro equipo de reclutamiento se pondrá en contacto contigo
                para coordinar una nueva fecha o informarte sobre los próximos pasos.
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Saludos cordiales,<br/>
                <strong>Equipo de Reclutamiento</strong><br/>
                ${companyName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f0f0f0; padding:12px 24px; text-align:center; font-size:11px; color:#777;">
              Este mensaje se generó automáticamente. Por favor, no compartas este correo con personas no autorizadas.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await sendEmail({
        to: app.applicantEmail,
        subject: subjectCandidate,
        html: htmlCandidate,
      });
    }

    // =====================================================
    // 2) EMAIL A LOS EVALUADORES (cancelación)
    // =====================================================
    if (app.interview?.evaluators && Array.isArray(app.interview.evaluators)) {
      for (const evaluator of app.interview.evaluators as any[]) {
        if (!evaluator?.email) continue;

        const evaluatorName = evaluator.name || "Evaluador";
        const subjectEvaluator = `Entrevista cancelada – ${candidateName}`;

        const htmlEvaluator = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Entrevista cancelada</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#005aa5,#00a6e7); padding:16px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px;">${companyName}</h2>
              <p style="margin:4px 0 0; font-size:13px;">Entrevista cancelada</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px; color:#333;">Hola <strong>${evaluatorName}</strong>,</p>

              <p style="font-size:14px; color:#333; line-height:1.5;">
                La entrevista del/de la candidato(a)
                <strong>${candidateName}</strong>, quien aplicaba al puesto de
                <strong>${position}</strong>, programada para
                <strong>${formattedDate}</strong>, ha sido <strong>cancelada</strong>.
              </p>

              ${
                notes
                  ? `<p style="font-size:13px; color:#333; line-height:1.5;">
                      Motivo / notas de la cancelación: ${notes}
                    </p>`
                  : ""
              }

              <p style="font-size:13px; color:#333; line-height:1.5;">
                Cualquier nueva fecha o cambio será notificado a través del sistema de reclutamiento.
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Saludos,<br/>
                <strong>Equipo de Reclutamiento</strong><br/>
                ${companyName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f0f0f0; padding:12px 24px; text-align:center; font-size:11px; color:#777;">
              Este mensaje se generó automáticamente desde el módulo de reclutamiento.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        await sendEmail({
          to: evaluator.email,
          subject: subjectEvaluator,
          html: htmlEvaluator,
        });
      }
    }

    // =====================================================
    // 3) Limpiar la entrevista en BD
    // =====================================================
    await RecruitmentApplication.updateOne(filter, {
      $set: { interview: null },
    });

    return res.json({
      ok: true,
      mensaje: "Entrevista cancelada correctamente.",
    });
  } catch (error: any) {
    console.error("cancelInterview error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al cancelar la entrevista.",
      error: error.message,
    });
  }
};

const runInterviewAiForApplication = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const {
      agentCode,
      evaluationDraft, // 👈 lo que viene del front (evaluationForm)
      applyDraft = true, // 👈 guardar el draft antes de analizar
    } = req.body || {};

    const out = await analyzeInterviewFromApplicationWithAi({
      applicationId: id,
      agentCode,
      evaluationDraft,
      applyDraft,
    });

    return res.status(200).json({ ok: true, ...out });
  } catch (err: any) {
    return res.status(400).json({ ok: false, mensaje: err.message });
  }
};

export {
  submitRecruitmentApplication,
  getRecruitmentApplications,
  getRecruitmentApplicationById,
  updateRecruitmentApplicationStatus,
  deleteRecruitmentApplication,
  saveApplicationClassification,
  getRecruitmentAllApplications,
  changeApplicationStatus,
  scheduleInterview,
  saveInterviewEvaluation,
  updateInterview,
  cancelInterview,
  runInterviewAiForApplication,
};
