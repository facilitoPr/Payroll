import { ref } from "vue";

import methodsHttp from "src/api/methodsHttp";
import type {
  TrainingAssignment,
  TrainingAttempt,
  TrainingAttemptQuestionResult,
  TrainingContentBlock,
  TrainingQuestion,
  TrainingRow,
} from "../types/training";

const { getApi, postApi } = methodsHttp;

export const useTrainingEmployee = () => {
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

  const getMyAssignments = async () => {
    return safeRequest<{
      ok: boolean;
      assignments: TrainingAssignment[];
      mensaje: string;
    }>(() => getApi("/training/me/assignments"));
  };

  const getMyTrainingDetail = async (trainingId: string) => {
    return safeRequest<{
      ok: boolean;
      training: TrainingRow;
      assignment: TrainingAssignment;
      contentBlocks: TrainingContentBlock[];
      questions: TrainingQuestion[];
      attempts: TrainingAttempt[];
      mensaje: string;
    }>(() => getApi(`/training/me/${trainingId}`));
  };

  const startAttempt = async (trainingId: string) => {
    return safeRequest<{
      ok: boolean;
      attempt: TrainingAttempt;
      mensaje: string;
    }>(() => postApi(`/training/me/${trainingId}/start`, {}));
  };

  const saveAnswer = async (attemptId: string, payload: any) => {
    return safeRequest(() =>
      postApi(`/training/me/attempts/${attemptId}/answers`, payload),
    );
  };

  const submitAttempt = async (attemptId: string) => {
    return safeRequest(() =>
      postApi(`/training/me/attempts/${attemptId}/submit`, {}),
    );
  };

  const getMyAttemptDetail = async (attemptId: string) => {
    return safeRequest<{
      ok: boolean;
      attempt: TrainingAttempt;
      questionResults: TrainingAttemptQuestionResult[];
      mensaje: string;
    }>(() => getApi(`/training/me/attempts/${attemptId}`));
  };

  return {
    loading,
    getMyAssignments,
    getMyTrainingDetail,
    startAttempt,
    saveAnswer,
    submitAttempt,
    getMyAttemptDetail,
  };
};
