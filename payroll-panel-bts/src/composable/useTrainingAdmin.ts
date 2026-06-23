import { ref } from "vue";
import type {
  TrainingAssignment,
  TrainingAttempt,
  TrainingAttemptQuestionResult,
  TrainingContentBlock,
  TrainingMetrics,
  TrainingQuestion,
  TrainingRow,
} from "src/types/training";
import methodsHttp from "src/api/methodsHttp";

const { getApi, postApi, putApi, deleteApi } = methodsHttp;

export const useTrainingAdmin = () => {
  const loading = ref(false);

  const safeRequest = async <T = any>(fn: () => Promise<any>): Promise<T> => {
    loading.value = true;
    try {
      const resp = await fn();

      if (!resp?.ok) {
        throw new Error(resp?.mensaje || "Ocurrió un error");
      }

      return resp as T;
    } finally {
      loading.value = false;
    }
  };

  const getDashboardMetrics = async () => {
    return safeRequest<{
      ok: boolean;
      metrics: TrainingMetrics;
      latestAttempts: TrainingAttempt[];
      mensaje: string;
    }>(() => getApi("/training/dashboard/metrics"));
  };

  const getTrainings = async (params?: {
    text?: string;
    type?: string;
    status?: string;
    isMandatory?: string;
    limit?: number;
    initial?: number;
  }) => {
    const query = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    });

    return safeRequest<{
      ok: boolean;
      trainings: TrainingRow[];
      total: number;
      mensaje: string;
    }>(() => getApi(`/training?${query.toString()}`));
  };

  const getTrainingById = async (id: string) => {
    return safeRequest<{
      ok: boolean;
      training: TrainingRow;
      contentBlocks: TrainingContentBlock[];
      questions: TrainingQuestion[];
      assignmentsCount: number;
      mensaje: string;
    }>(() => getApi(`/training/${id}`));
  };

  const createTraining = async (payload: any) => {
    return safeRequest(() => postApi("/training", payload));
  };

  const updateTraining = async (id: string, payload: any) => {
    return safeRequest(() => putApi(`/training/${id}`, payload));
  };

  const deleteTraining = async (id: string) => {
    return safeRequest(() => deleteApi(`/training/${id}`));
  };

  const createBlock = async (trainingId: string, payload: any) => {
    return safeRequest(() =>
      postApi(`/training/${trainingId}/blocks`, payload),
    );
  };

  const updateBlock = async (blockId: string, payload: any) => {
    return safeRequest(() => putApi(`/training/blocks/${blockId}`, payload));
  };

  const deleteBlock = async (blockId: string) => {
    return safeRequest(() => deleteApi(`/training/blocks/${blockId}`));
  };

  const createQuestion = async (trainingId: string, payload: any) => {
    return safeRequest(() =>
      postApi(`/training/${trainingId}/questions`, payload),
    );
  };

  const updateQuestion = async (questionId: string, payload: any) => {
    return safeRequest(() =>
      putApi(`/training/questions/${questionId}`, payload),
    );
  };

  const deleteQuestion = async (questionId: string) => {
    return safeRequest(() => deleteApi(`/training/questions/${questionId}`));
  };

  const assignUsers = async (trainingId: string, payload: any) => {
    return safeRequest(() =>
      postApi(`/training/${trainingId}/assign-users`, payload),
    );
  };

  const getAssignments = async (trainingId: string) => {
    return safeRequest<{
      ok: boolean;
      assignments: TrainingAssignment[];
      total: number;
      mensaje: string;
    }>(() => getApi(`/training/${trainingId}/assignments`));
  };

  const getResults = async (trainingId: string) => {
    return safeRequest<{
      ok: boolean;
      training: TrainingRow;
      assignments: TrainingAssignment[];
      attempts: TrainingAttempt[];
      mensaje: string;
    }>(() => getApi(`/training/${trainingId}/results`));
  };

  const getAttemptDetail = async (attemptId: string) => {
    return safeRequest<{
      ok: boolean;
      attempt: TrainingAttempt;
      questionResults: TrainingAttemptQuestionResult[];
      mensaje: string;
    }>(() => getApi(`/training/attempts/${attemptId}`));
  };

  const getEmployees = async () => {
    return safeRequest<{
      ok: boolean;
      employees: any[];
      mensaje?: string;
    }>(() => getApi("/user/getEmployees?isActived=true"));
  };

  return {
    loading,
    getDashboardMetrics,
    getTrainings,
    getTrainingById,
    createTraining,
    updateTraining,
    deleteTraining,
    createBlock,
    updateBlock,
    deleteBlock,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    assignUsers,
    getAssignments,
    getResults,
    getAttemptDetail,
    getEmployees,
  };
};