import { Response } from "express";
import { Types } from "mongoose";
import Training from "../../model/training/training";
import TrainingContentBlock from "../../model/training/trainingContentBlock";
import TrainingQuestion from "../../model/training/trainingQuestion";
import TrainingUserAssignment from "../../model/training/trainingUserAssignment";
import TrainingAttempt from "../../model/training/trainingAttempt";
import TrainingAnswer from "../../model/training/trainingAnswer";
import { AuthRequest } from "../../middlewares/validate-jwt";
import { populate } from 'dotenv';
import {
  evaluateTrainingAnswer,
  calculateTrainingAttemptScore,
} from "../../helper/training/training-evaluation.helper";

const isValidObjectId = (value: any) => Types.ObjectId.isValid(String(value));

const isAssignmentAvailableNow = (assignment: any) => {
  const now = new Date();

  if (assignment.availableFrom && new Date(assignment.availableFrom) > now) {
    return false;
  }

  if (assignment.availableUntil && new Date(assignment.availableUntil) < now) {
    return false;
  }

  return true;
};

const getMyTrainingAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || null;
    const { status } = req.query as any;

    const query: any = {
      user: userId,
      isDeleted: false,
      isActive: true,
    };

    if (status) {
      query.status = status;
    }

    const assignments = await TrainingUserAssignment.find(query)
      .populate({
        path: "training",
        match: {
          isDeleted: false,
          isActive: true,
          status: "PUBLISHED",
        },
      })
      .sort({ createdAt: -1 });

    const filteredAssignments = assignments.filter(
      (item: any) => item.training,
    );

    return res.status(200).json({
      ok: true,
      assignments: filteredAssignments,
      mensaje: "Mis entrenamientos obtenidos con éxito",
    });
  } catch (error) {
    console.error("getMyTrainingAssignments error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener mis entrenamientos",
    });
  }
};

const getMyTrainingDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || null;
    const { trainingId } = req.params;

    if (!isValidObjectId(trainingId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const assignment = await TrainingUserAssignment.findOne({
      training: trainingId,
      user: userId,
      isDeleted: false,
      isActive: true,
    }).populate({
      path: "training",
      match: {
        _id: trainingId,
        isDeleted: false,
        isActive: true,
        status: "PUBLISHED",
      },
    });

    if (!assignment || !assignment.training) {
      return res.status(404).json({
        ok: false,
        mensaje: "No tienes este entrenamiento disponible",
      });
    }

    const now = new Date();

    if (assignment.availableFrom && new Date(assignment.availableFrom) > now) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este entrenamiento aún no está disponible",
      });
    }

    if (
      assignment.availableUntil &&
      new Date(assignment.availableUntil) < now
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este entrenamiento ya no está disponible",
      });
    }

    const training: any = assignment.training;

    const [contentBlocks, questions, attempts] = await Promise.all([
      TrainingContentBlock.find({
        training: training._id,
        isDeleted: false,
        isActive: true,
      }).sort({ order: 1, createdAt: 1 }),

      TrainingQuestion.find({
        training: training._id,
        isDeleted: false,
        isActive: true,
      })
        .sort({ order: 1, createdAt: 1 })
        .select("-correctAnswers -acceptedAnswers"),

      TrainingAttempt.find({
        training: training._id,
        assignment: assignment._id,
        user: userId,
        isDeleted: false,
      }).sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      ok: true,
      training,
      assignment,
      contentBlocks,
      questions,
      attempts,
      mensaje: "Detalle del entrenamiento obtenido con éxito",
    });
  } catch (error) {
    console.error("getMyTrainingDetail error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el detalle del entrenamiento",
    });
  }
};

const startMyTrainingAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || null;
    const { trainingId } = req.params;

    if (!isValidObjectId(trainingId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de entrenamiento inválido",
      });
    }

    const assignment = await TrainingUserAssignment.findOne({
      training: trainingId,
      user: userId,
      isDeleted: false,
      isActive: true,
    });

    if (!assignment) {
      return res.status(404).json({
        ok: false,
        mensaje: "No tienes este entrenamiento asignado",
      });
    }

    const training = await Training.findOne({
      _id: trainingId,
      isDeleted: false,
      isActive: true,
      status: "PUBLISHED",
    });

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "Entrenamiento no disponible",
      });
    }

    const now = new Date();

    if (assignment.availableFrom && new Date(assignment.availableFrom) > now) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este entrenamiento aún no está disponible",
      });
    }

    if (
      assignment.availableUntil &&
      new Date(assignment.availableUntil) < now
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este entrenamiento ya no está disponible",
      });
    }

    const existingAttempt = await TrainingAttempt.findOne({
      training: training._id,
      assignment: assignment._id,
      user: userId,
      isDeleted: false,
      status: "IN_PROGRESS",
    });

    if (existingAttempt) {
      return res.status(200).json({
        ok: true,
        attempt: existingAttempt,
        mensaje: "Ya tienes un intento en progreso",
      });
    }

    if (
      training.maxAttempts > 0 &&
      assignment.totalAttemptsUsed >= training.maxAttempts
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Has alcanzado el máximo de intentos permitidos",
      });
    }

    const attemptNumber = (assignment.totalAttemptsUsed || 0) + 1;

    const attempt = new TrainingAttempt({
      training: training._id,
      user: userId,
      assignment: assignment._id,
      attemptNumber,
      startedAt: new Date(),
      status: "IN_PROGRESS",
    });

    await attempt.save();

    assignment.totalAttemptsUsed = attemptNumber;
    assignment.status = "STARTED";
    await assignment.save();

    return res.status(201).json({
      ok: true,
      attempt,
      mensaje: "Intento iniciado con éxito",
    });
  } catch (error) {
    console.error("startMyTrainingAttempt error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al iniciar el intento",
    });
  }
};

const saveMyTrainingAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id || null;
    const { attemptId } = req.params;
    const { questionId, answerText, selectedOptions, booleanAnswer } = req.body;

    if (!isValidObjectId(attemptId) || !isValidObjectId(questionId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de intento o pregunta inválido",
      });
    }

    const attempt = await TrainingAttempt.findOne({
      _id: attemptId,
      user: userId,
      isDeleted: false,
      status: "IN_PROGRESS",
    });

    if (!attempt) {
      return res.status(404).json({
        ok: false,
        mensaje: "Intento no encontrado o ya finalizado",
      });
    }

    const question = await TrainingQuestion.findOne({
      _id: questionId,
      training: attempt.training,

      isDeleted: false,
      isActive: true,
    });

    if (!question) {
      return res.status(404).json({
        ok: false,
        mensaje: "Pregunta no encontrada",
      });
    }

    const evaluation = evaluateTrainingAnswer(question, {
      answerText,
      selectedOptions,
      booleanAnswer,
    });

    const answer = await TrainingAnswer.findOneAndUpdate(
      {
        attempt: attempt._id,
        question: question._id,
      },
      {
        training: attempt.training,
        question: question._id,
        attempt: attempt._id,
        user: userId,
        answerText: answerText || null,
        selectedOptions: selectedOptions || [],
        booleanAnswer:
          booleanAnswer === undefined ? null : Boolean(booleanAnswer),
        normalizedAnswer: evaluation.normalizedAnswer,
        isCorrect: evaluation.isCorrect,
        pointsObtained: evaluation.pointsObtained,

        isActive: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      ok: true,
      answer,
      mensaje: "Respuesta guardada con éxito",
    });
  } catch (error) {
    console.error("saveMyTrainingAnswer error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al guardar la respuesta",
    });
  }
};

const submitMyTrainingAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || null;
    const { attemptId } = req.params;

    if (!isValidObjectId(attemptId)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de intento inválido",
      });
    }

    const attempt = await TrainingAttempt.findOne({
      _id: attemptId,
      user: userId,
      isDeleted: false,
      status: "IN_PROGRESS",
    });

    if (!attempt) {
      return res.status(404).json({
        ok: false,
        mensaje: "Intento no encontrado o ya enviado",
      });
    }

    const [training, assignment, questions, answers] = await Promise.all([
      Training.findOne({
        _id: attempt.training,
        isDeleted: false,
        isActive: true,
        status: "PUBLISHED",
      }),
      TrainingUserAssignment.findOne({
        _id: attempt.assignment,
        user: userId,
        isDeleted: false,
        isActive: true,
      }),
      TrainingQuestion.find({
        training: attempt.training,
        isDeleted: false,
        isActive: true,
      }).sort({ order: 1, createdAt: 1 }),
      TrainingAnswer.find({
        attempt: attempt._id,
        user: userId,
        isDeleted: false,
      }),
    ]);

    if (!training) {
      return res.status(404).json({
        ok: false,
        mensaje: "El entrenamiento no está disponible para envío",
      });
    }

    if (!assignment) {
      return res.status(404).json({
        ok: false,
        mensaje: "La asignación no fue encontrada",
      });
    }

    const now = new Date();

    if (assignment.availableFrom && new Date(assignment.availableFrom) > now) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este entrenamiento aún no está disponible",
      });
    }

    if (
      assignment.availableUntil &&
      new Date(assignment.availableUntil) < now
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este entrenamiento ya no está disponible",
      });
    }

    const requiredQuestions = questions.filter((item) => item.isRequired);
    const answeredQuestionIds = new Set(
      answers.map((item) => String(item.question)),
    );

    const missingRequired = requiredQuestions.filter(
      (item) => !answeredQuestionIds.has(String(item._id)),
    );

    if (missingRequired.length > 0) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Debes responder todas las preguntas obligatorias antes de enviar",
        missingQuestions: missingRequired.map((item) => ({
          _id: item._id,
          questionText: item.questionText,
        })),
      });
    }

    const result = calculateTrainingAttemptScore({
      questions,
      answers: answers.map((item) => ({
        question: String(item.question),
        pointsObtained: item.pointsObtained || 0,
      })),
      passScore: training.passScore,
    });

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (now.getTime() - new Date(attempt.startedAt).getTime()) / 1000,
      ),
    );

    attempt.submittedAt = now;
    attempt.totalPoints = result.totalPoints;
    attempt.pointsObtained = result.pointsObtained;
    attempt.score = result.score;
    attempt.passed = result.passed;
    attempt.durationSeconds = durationSeconds;
    attempt.status = result.passed ? "PASSED" : "FAILED";

    await attempt.save();

    assignment.score = result.score;
    assignment.passed = result.passed;
    assignment.completedAt = now;

    if (result.passed) {
      assignment.status = "COMPLETED";
    } else {
      const canRetry =
        training.maxAttempts === 0 ||
        assignment.totalAttemptsUsed < training.maxAttempts;

      assignment.status = canRetry ? "STARTED" : "FAILED";
    }

    await assignment.save();

    return res.status(200).json({
      ok: true,
      attempt,
      result,
      mensaje: result.passed
        ? "Entrenamiento completado y aprobado"
        : "Entrenamiento enviado, pero no alcanzó la puntuación mínima",
    });
  } catch (error) {
    console.error("submitMyTrainingAttempt error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al enviar el intento",
    });
  }
};

const getMyTrainingAttemptDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id || null;
    const { attemptId } = req.params;

    const attempt = await TrainingAttempt.findOne({
      _id: attemptId,
      user: userId,
      isDeleted: false,
    }).populate("training", "title description passScore type").populate("user", "email name")

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
        user: userId,
        isDeleted: false,
      })
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
      mensaje: "Detalle de mi intento obtenido con éxito",
    });
  } catch (error) {
    console.error("getMyTrainingAttemptDetail error:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el detalle del intento",
    });
  }
};

export {
  getMyTrainingAssignments,
  getMyTrainingDetail,
  startMyTrainingAttempt,
  saveMyTrainingAnswer,
  submitMyTrainingAttempt,
  getMyTrainingAttemptDetail,
};
