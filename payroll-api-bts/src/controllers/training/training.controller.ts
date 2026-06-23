import { Response } from "express";
import { Types } from "mongoose";
import Training from "../../model/training/training";
import TrainingContentBlock from "../../model/training/trainingContentBlock";
import TrainingQuestion from "../../model/training/trainingQuestion";
import TrainingUserAssignment from "../../model/training/trainingUserAssignment";
import TrainingAttempt from "../../model/training/trainingAttempt";
import TrainingAnswer from "../../model/training/trainingAnswer";
import { AuthRequest } from "../../middlewares/validate-jwt";


const isValidObjectId = (value: any) => Types.ObjectId.isValid(String(value));

const createTraining = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id || null

    const {
      title,
      code,
      description,
      type,
      instructions,
      thumbnail,
      estimatedMinutes,
      passScore,
      maxAttempts,
      isMandatory,
      startDate,
      endDate,
      status,
    } = req.body;

    const training = new Training({
      title,
      code,
      description,
      type,
      instructions,
      thumbnail,
      estimatedMinutes,
      passScore,
      maxAttempts,
      isMandatory,
      startDate: startDate || null,
      endDate: endDate || null,
      status,
      createdBy: userId,
    });

    await training.save();

    return res.status(201).json({
      ok: true,
      training,
      mensaje: "Entrenamiento creado con éxito",
    });
  } catch (error) {
    console.error("createTraining error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear el entrenamiento",
    });
  }
};

const getTrainings = async (req: AuthRequest, res: Response) => {
  try {
    const {
      text = "",
      type,
      status,
      isMandatory,
      limit = "10",
      initial = "0",
    } = req.query as any;

    const limitNum = parseInt(String(limit)) || 10;
    const initialNum = parseInt(String(initial)) || 0;

    const query: any = {
      isDeleted: false,
    };

    if (text) {
      query.$or = [
        { title: { $regex: text, $options: "i" } },
        { code: { $regex: text, $options: "i" } },
        { description: { $regex: text, $options: "i" } },
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (String(isMandatory) === "true") query.isMandatory = true;
    if (String(isMandatory) === "false") query.isMandatory = false;

    const [trainings, total] = await Promise.all([
      Training.find(query)
        .sort({ createdAt: -1 })
        .skip(initialNum)
        .limit(limitNum),
      Training.countDocuments(query),
    ]);

    return res.status(200).json({
      ok: true,
      trainings,
      total,
      mensaje: "Entrenamientos obtenidos con éxito",
    });
  } catch (error) {
    console.error("getTrainings error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener los entrenamientos",
    });
  }
};

const getTrainingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const training = await Training.findOne({
      _id: id,
      isDeleted: false,
    }).populate("createdBy", "name email");

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no encontrado",
      });
    }

    const [contentBlocks, questions, assignmentsCount] = await Promise.all([
      TrainingContentBlock.find({
        training: training._id,
        isDeleted: false,
      }).sort({ order: 1, createdAt: 1 }),
      TrainingQuestion.find({
        training: training._id,
        isDeleted: false,
      }).sort({ order: 1, createdAt: 1 }),
      TrainingUserAssignment.countDocuments({
        training: training._id,
        isDeleted: false,
      }),
    ]);

    return res.status(200).json({
      ok: true,
      training,
      contentBlocks,
      questions,
      assignmentsCount,
      mensaje: "Entrenamiento obtenido con éxito",
    });
  } catch (error) {
    console.error("getTrainingById error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el entrenamiento",
    });
  }
};

const updateTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const training = await Training.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no encontrado",
      });
    }

    const updates = [
      "title",
      "code",
      "description",
      "type",
      "instructions",
      "thumbnail",
      "estimatedMinutes",
      "passScore",
      "maxAttempts",
      "isMandatory",
      "startDate",
      "endDate",
      "status",
      "isActive",
    ];

    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (training as any)[field] = req.body[field];
      }
    });

    await training.save();

    return res.status(200).json({
      ok: true,
      training,
      mensaje: "Entrenamiento actualizado con éxito",
    });
  } catch (error) {
    console.error("updateTraining error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar el entrenamiento",
    });
  }
};

const deleteTraining = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const training = await Training.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        isActive: false,
      },
      {
        new: true,
      },
    );

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      training,
      mensaje: "Entrenamiento eliminado con éxito",
    });
  } catch (error) {
    console.error("deleteTraining error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar el entrenamiento",
    });
  }
};

const createTrainingContentBlock = async (req: any, res: Response) => {
  try {
    const { trainingId } = req.params;
    const { type, title, description, content, url, order, isRequired } =
      req.body;

    if (!isValidObjectId(trainingId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const training = await Training.findOne({
      _id: trainingId,
      isDeleted: false,
    });

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no encontrado",
      });
    }

    const uploadedFilesMap = req.uploadedFilesMap || {};
    const uploadedUrl = Array.isArray(uploadedFilesMap.file)
      ? uploadedFilesMap.file[0]
      : uploadedFilesMap.file || null;

    const finalType = String(type || "").trim();
    const finalTitle = title ? String(title).trim() : null;
    const finalDescription = description ? String(description).trim() : null;
    const finalOrder = Number(order || 0);
    const finalIsRequired =
      String(isRequired) === "true" || isRequired === true;

    let finalContent: string | null = null;
    let finalUrl: string | null = null;

    if (finalType === "TEXT") {
      finalContent = String(content || "").trim() || null;

      if (!finalContent) {
        return res.status(400).json({
          ok: false,
          mensaje: "El bloque de tipo TEXT requiere contenido",
        });
      }
    }

    if (finalType === "YOUTUBE") {
      finalUrl = String(url || "").trim() || null;

      if (!finalUrl) {
        return res.status(400).json({
          ok: false,
          mensaje: "El bloque de tipo YOUTUBE requiere URL",
        });
      }
    }

    if (["PDF", "IMAGE", "FILE"].includes(finalType)) {
      finalUrl = uploadedUrl || String(url || "").trim() || null;

      if (!finalUrl) {
        return res.status(400).json({
          ok: false,
          mensaje: `El bloque de tipo ${finalType} requiere archivo o URL`,
        });
      }
    }

    const block = new TrainingContentBlock({
      training: training._id,
      type: finalType,
      title: finalTitle,
      description: finalDescription,
      content: finalContent,
      url: finalUrl,
      order: finalOrder,
      isRequired: finalIsRequired,
    });

    await block.save();

    return res.status(201).json({
      ok: true,
      block,
      mensaje: "Bloque de contenido creado con éxito",
    });
  } catch (error) {
    console.error("createTrainingContentBlock error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear el bloque de contenido",
    });
  }
};

const updateTrainingContentBlock = async (req: any, res: Response) => {
  try {
    const { blockId } = req.params;

    if (!isValidObjectId(blockId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de bloque inválido",
      });
    }

    const block = await TrainingContentBlock.findOne({
      _id: blockId,
      isDeleted: false,
    });

    if (!block) {
      return res.status(404).json({
        ok: false,
        mensaje: "Bloque no encontrado",
      });
    }

    const uploadedFilesMap = req.uploadedFilesMap || {};
    const uploadedUrl = Array.isArray(uploadedFilesMap.file)
      ? uploadedFilesMap.file[0]
      : uploadedFilesMap.file || null;

    const nextType =
      req.body.type !== undefined ? String(req.body.type).trim() : block.type;

    if (req.body.title !== undefined) {
      block.title = req.body.title ? String(req.body.title).trim() : null;
    }

    if (req.body.description !== undefined) {
      block.description = req.body.description
        ? String(req.body.description).trim()
        : null;
    }

    if (req.body.order !== undefined) {
      block.order = Number(req.body.order || 0);
    }

    if (req.body.isRequired !== undefined) {
      block.isRequired =
        String(req.body.isRequired) === "true" || req.body.isRequired === true;
    }

    if (req.body.isActive !== undefined) {
      block.isActive =
        String(req.body.isActive) === "true" || req.body.isActive === true;
    }

    block.type = nextType as any;

    if (nextType === "TEXT") {
      const nextContent = String(req.body.content || "").trim() || null;

      if (!nextContent) {
        return res.status(400).json({
          ok: false,
          mensaje: "El bloque de tipo TEXT requiere contenido",
        });
      }

      block.content = nextContent;
      block.url = null;
    }

    if (nextType === "YOUTUBE") {
      const nextUrl = String(req.body.url || "").trim() || null;

      if (!nextUrl) {
        return res.status(400).json({
          ok: false,
          mensaje: "El bloque de tipo YOUTUBE requiere URL",
        });
      }

      block.content = null;
      block.url = nextUrl;
    }

    if (["PDF", "IMAGE", "FILE"].includes(nextType)) {
      const nextUrl =
        uploadedUrl || String(req.body.url || "").trim() || block.url || null;

      if (!nextUrl) {
        return res.status(400).json({
          ok: false,
          mensaje: `El bloque de tipo ${nextType} requiere archivo o URL`,
        });
      }

      block.content = null;
      block.url = nextUrl;
    }

    await block.save();

    return res.status(200).json({
      ok: true,
      block,
      mensaje: "Bloque actualizado con éxito",
    });
  } catch (error) {
    console.error("updateTrainingContentBlock error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar el bloque",
    });
  }
};

const deleteTrainingContentBlock = async (req: AuthRequest, res: Response) => {
  try {
    const { blockId } = req.params;

    if (!isValidObjectId(blockId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de bloque inválido",
      });
    }

    const block = await TrainingContentBlock.findOneAndUpdate(
      {
        _id: blockId,
        isDeleted: false,
      },
      {
        isDeleted: true,
        isActive: false,
      },
      { new: true },
    );

    if (!block) {
      return res.status(404).json({
        ok: false,
        mensaje: "Bloque no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      block,
      mensaje: "Bloque eliminado con éxito",
    });
  } catch (error) {
    console.error("deleteTrainingContentBlock error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar el bloque",
    });
  }
};

const createTrainingQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { trainingId } = req.params;

    if (!isValidObjectId(trainingId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const training = await Training.findOne({
      _id: trainingId,
      isDeleted: false,
    });

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no encontrado",
      });
    }

    const question = new TrainingQuestion({
      training: training._id,
      ...req.body,
    });

    await question.save();

    return res.status(201).json({
      ok: true,
      question,
      mensaje: "Pregunta creada con éxito",
    });
  } catch (error) {
    console.error("createTrainingQuestion error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear la pregunta",
    });
  }
};

const updateTrainingQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId } = req.params;

    if (!isValidObjectId(questionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de pregunta inválido",
      });
    }

    const question = await TrainingQuestion.findOne({
      _id: questionId,
      isDeleted: false,
    });

    if (!question) {
      return res.status(404).json({
        ok: false,
        mensaje: "Pregunta no encontrada",
      });
    }

    const attemptsCount = await TrainingAttempt.countDocuments({
      training: question.training,
      isDeleted: false,
    });

    if (attemptsCount > 0) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "No puedes modificar preguntas de un entrenamiento que ya tiene intentos registrados",
      });
    }

    const updates = [
      "title",
      "questionText",
      "type",
      "options",
      "correctAnswers",
      "acceptedAnswers",
      "textEvaluationMode",
      "minKeywordMatches",
      "isCaseSensitive",
      "ignoreAccents",
      "ignoreExtraSpaces",
      "order",
      "isRequired",
      "explanation",
      "isActive",
    ];

    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (question as any)[field] = req.body[field];
      }
    });

    await question.save();

    return res.status(200).json({
      ok: true,
      question,
      mensaje: "Pregunta actualizada con éxito",
    });
  } catch (error) {
    console.error("updateTrainingQuestion error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar la pregunta",
    });
  }
};

const deleteTrainingQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId } = req.params;

    if (!isValidObjectId(questionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de pregunta inválido",
      });
    }

    const question = await TrainingQuestion.findOne({
      _id: questionId,
      isDeleted: false,
    });

    if (!question) {
      return res.status(404).json({
        ok: false,
        mensaje: "Pregunta no encontrada",
      });
    }

    const attemptsCount = await TrainingAttempt.countDocuments({
      training: question.training,
      isDeleted: false,
    });

    if (attemptsCount > 0) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "No puedes eliminar preguntas de un entrenamiento que ya tiene intentos registrados",
      });
    }

    question.isDeleted = true;
    question.isActive = false;
    await question.save();

    return res.status(200).json({
      ok: true,
      question,
      mensaje: "Pregunta eliminada con éxito",
    });
  } catch (error) {
    console.error("deleteTrainingQuestion error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar la pregunta",
    });
  }
};

const assignTrainingToUsers = async (req: AuthRequest, res: Response) => {
  try {
    const assignedBy = req.user._id || null;
    const { trainingId } = req.params;
    const { userIds = [], availableFrom, dueDate, availableUntil } = req.body;

    if (!isValidObjectId(trainingId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes enviar al menos un usuario",
      });
    }

    const validUserIds = userIds.filter((id) => isValidObjectId(id));

    if (validUserIds.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "No hay usuarios válidos para asignar",
      });
    }

    const training = await Training.findOne({
      _id: trainingId,
      isDeleted: false,
    });

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no encontrado",
      });
    }

    const results = await Promise.all(
      validUserIds.map(async (userId) => {
        return TrainingUserAssignment.findOneAndUpdate(
          {
            training: training._id,
            user: userId,
            isDeleted: false,
          },
          {
            training: training._id,
            user: userId,
            assignedBy,
            assignedAt: new Date(),
            availableFrom: availableFrom || null,
            dueDate: dueDate || null,
            availableUntil: availableUntil || null,
            status: "ASSIGNED",
            isActive: true,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        );
      }),
    );

    return res.status(200).json({
      ok: true,
      assignments: results,
      mensaje: "Entrenamiento asignado con éxito",
    });
  } catch (error) {
    console.error("assignTrainingToUsers error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al asignar el entrenamiento",
    });
  }
};

const getTrainingAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { trainingId } = req.params;
    const { status, limit = "20", initial = "0" } = req.query as any;

    if (!isValidObjectId(trainingId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const query: any = {
      training: trainingId,
      isDeleted: false,
    };

    if (status) query.status = status;

    const limitNum = parseInt(String(limit)) || 20;
    const initialNum = parseInt(String(initial)) || 0;

    const [assignments, total] = await Promise.all([
      TrainingUserAssignment.find(query)
        .populate("user", "name email")
        .populate("assignedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(initialNum)
        .limit(limitNum),
      TrainingUserAssignment.countDocuments(query),
    ]);

    return res.status(200).json({
      ok: true,
      assignments,
      total,
      mensaje: "Asignaciones obtenidas con éxito",
    });
  } catch (error) {
    console.error("getTrainingAssignments error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las asignaciones",
    });
  }
};

const getTrainingResults = async (req: AuthRequest, res: Response) => {
  try {
    const { trainingId } = req.params;

    if (!isValidObjectId(trainingId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const training = await Training.findOne({
      _id: trainingId,
      isDeleted: false,
    });

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no encontrado",
      });
    }

    const [assignments, attempts] = await Promise.all([
      TrainingUserAssignment.find({
        training: training._id,
        isDeleted: false,
      })
        .populate("user", "name email")
        .sort({ createdAt: -1 }),
      TrainingAttempt.find({
        training: training._id,
        isDeleted: false,
      })
        .populate("user", "name email")
        .sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      ok: true,
      training,
      assignments,
      attempts,
      mensaje: "Resultados obtenidos con éxito",
    });
  } catch (error) {
    console.error("getTrainingResults error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener los resultados",
    });
  }
};

// 

const getTrainingDashboardMetrics = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const [
      totalTrainings,
      publishedTrainings,
      draftTrainings,
      archivedTrainings,
      totalAssignments,
      completedAssignments,
      failedAssignments,
      startedAssignments,
      totalAttempts,
      passedAttempts,
      failedAttempts,
    ] = await Promise.all([
      Training.countDocuments({
        isDeleted: false,
      }),
      Training.countDocuments({
        isDeleted: false,
        status: "PUBLISHED",
      }),
      Training.countDocuments({
        isDeleted: false,
        status: "DRAFT",
      }),
      Training.countDocuments({
        isDeleted: false,
        status: "ARCHIVED",
      }),
      TrainingUserAssignment.countDocuments({
        isDeleted: false,
      }),
      TrainingUserAssignment.countDocuments({
        isDeleted: false,
        status: "COMPLETED",
      }),
      TrainingUserAssignment.countDocuments({
        isDeleted: false,
        status: "FAILED",
      }),
      TrainingUserAssignment.countDocuments({
        isDeleted: false,
        status: "STARTED",
      }),
      TrainingAttempt.countDocuments({
        isDeleted: false,
      }),
      TrainingAttempt.countDocuments({
        isDeleted: false,
        status: "PASSED",
      }),
      TrainingAttempt.countDocuments({
        isDeleted: false,
        status: "FAILED",
      }),
    ]);

    const completionRate =
      totalAssignments > 0
        ? Number(((completedAssignments / totalAssignments) * 100).toFixed(2))
        : 0;

    const approvalRate =
      totalAttempts > 0
        ? Number(((passedAttempts / totalAttempts) * 100).toFixed(2))
        : 0;

    const latestAttempts = await TrainingAttempt.find({
      isDeleted: false,
    })
      .populate("training", "title")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(8);

    return res.status(200).json({
      ok: true,
      metrics: {
        totalTrainings,
        publishedTrainings,
        draftTrainings,
        archivedTrainings,
        totalAssignments,
        completedAssignments,
        failedAssignments,
        startedAssignments,
        totalAttempts,
        passedAttempts,
        failedAttempts,
        completionRate,
        approvalRate,
      },
      latestAttempts,
      mensaje: "Métricas obtenidas con éxito",
    });
  } catch (error) {
    console.error("getTrainingDashboardMetrics error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las métricas del dashboard",
    });
  }
};

const getTrainingAttemptDetail = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { attemptId } = req.params;

    const attempt = await TrainingAttempt.findOne({
      _id: attemptId,
      isDeleted: false,
    })
      .populate("training", "title description passScore type")
      .populate("user", "name email")
      .populate("assignment");

    if (!attempt) {
      return res.status(404).json({
        ok: false,
        mensaje: "Intento no encontrado",
      });
    }

    const [questions, answers] = await Promise.all([
      TrainingQuestion.find({
        training: attempt.training,
        isDeleted: false,
      }).sort({ order: 1, createdAt: 1 }),
      TrainingAnswer.find({
        attempt: attempt._id,
        isDeleted: false,
      }),
    ]);

    const answersMap = new Map(
      answers.map((item) => [String(item.question), item]),
    );

    const questionResults = questions.map((question) => {
      const answer = answersMap.get(String(question._id));

      return {
        question: {
          _id: question._id,
          title: question.title,
          questionText: question.questionText,
          type: question.type,
          options: question.options || [],
          correctAnswers: question.correctAnswers || [],
          acceptedAnswers: question.acceptedAnswers || [],
          explanation: question.explanation || null,
          order: question.order,
          isRequired: question.isRequired,
        },
        answer: answer
          ? {
              _id: answer._id,
              answerText: answer.answerText,
              selectedOptions: answer.selectedOptions || [],
              booleanAnswer: answer.booleanAnswer,
              normalizedAnswer: answer.normalizedAnswer,
              isCorrect: answer.isCorrect,
              pointsObtained: answer.pointsObtained,
            }
          : null,
      };
    });

    return res.status(200).json({
      ok: true,
      attempt,
      questionResults,
      mensaje: "Detalle del intento obtenido con éxito",
    });
  } catch (error) {
    console.error("getTrainingAttemptDetail error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el detalle del intento",
    });
  }
};

export {
  createTraining,
  getTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
  createTrainingContentBlock,
  updateTrainingContentBlock,
  deleteTrainingContentBlock,
  createTrainingQuestion,
  updateTrainingQuestion,
  deleteTrainingQuestion,
  assignTrainingToUsers,
  getTrainingAssignments,
  getTrainingResults,
  getTrainingDashboardMetrics,
  getTrainingAttemptDetail,
};
