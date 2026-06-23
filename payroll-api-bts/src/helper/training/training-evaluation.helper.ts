import { ITrainingQuestion } from "../../model/training/trainingQuestion";

type EvaluatePayload = {
  answerText?: string;
  selectedOptions?: string[];
  booleanAnswer?: boolean | null;
};

type EvaluateResult = {
  isCorrect: boolean;
  pointsObtained: number;
  normalizedAnswer: string | null;
};

type NormalizeOptions = {
  isCaseSensitive?: boolean;
  ignoreAccents?: boolean;
  ignoreExtraSpaces?: boolean;
};

export const normalizeTrainingText = (
  value: string,
  options?: NormalizeOptions,
): string => {
  let finalValue = String(value || "");

  if (options?.ignoreAccents) {
    finalValue = finalValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  if (!options?.isCaseSensitive) {
    finalValue = finalValue.toLowerCase();
  }

  if (options?.ignoreExtraSpaces) {
    finalValue = finalValue.replace(/\s+/g, " ").trim();
  }

  return finalValue;
};

const sortStringArray = (arr: string[] = []) => {
  return [...new Set(arr.map((item) => String(item).trim()))].sort();
};

const sameStringArray = (a: string[] = [], b: string[] = []) => {
  const arrA = sortStringArray(a);
  const arrB = sortStringArray(b);

  if (arrA.length !== arrB.length) return false;
  return arrA.every((item, index) => item === arrB[index]);
};

const evaluateTextAnswer = (
  question: ITrainingQuestion,
  answerText?: string,
): EvaluateResult => {
  const rawAnswer = String(answerText || "");
  const normalizedAnswer = normalizeTrainingText(rawAnswer, {
    isCaseSensitive: question.isCaseSensitive,
    ignoreAccents: question.ignoreAccents,
    ignoreExtraSpaces: question.ignoreExtraSpaces,
  });

  const acceptedAnswers = (question.acceptedAnswers || [])
    .map((item: string) =>
      normalizeTrainingText(String(item || ""), {
        isCaseSensitive: question.isCaseSensitive,
        ignoreAccents: question.ignoreAccents,
        ignoreExtraSpaces: question.ignoreExtraSpaces,
      }),
    )
    .filter(Boolean);

  let isCorrect = false;

  if (!normalizedAnswer) {
    return {
      isCorrect: false,
      pointsObtained: 0,
      normalizedAnswer,
    };
  }

  if (question.type === "SHORT_TEXT") {
    isCorrect = acceptedAnswers.some(
      (item: string) => item === normalizedAnswer,
    );
  }

  if (question.type === "LONG_TEXT") {
    const uniqueKeywords = [...new Set(acceptedAnswers)];
    const matches = uniqueKeywords.filter((keyword: string) =>
      normalizedAnswer.includes(keyword),
    );

    const requiredMatches = Math.min(
      Number(question.minKeywordMatches || 1),
      uniqueKeywords.length || 1,
    );

    isCorrect = matches.length >= requiredMatches;
  }

  return {
    isCorrect,
    pointsObtained: isCorrect ? 1 : 0,
    normalizedAnswer,
  };
};

export const evaluateTrainingAnswer = (
  question: ITrainingQuestion,
  payload: EvaluatePayload,
): EvaluateResult => {
  if (["SHORT_TEXT", "LONG_TEXT"].includes(question.type)) {
    return evaluateTextAnswer(question, payload.answerText);
  }

  if (question.type === "SINGLE_CHOICE") {
    const selected = sortStringArray(payload.selectedOptions || []);
    const correct = sortStringArray(question.correctAnswers || []);
    const isCorrect = sameStringArray(selected, correct);

    return {
      isCorrect,
      pointsObtained: isCorrect ? 1 : 0,
      normalizedAnswer: null,
    };
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = sortStringArray(payload.selectedOptions || []);
    const correct = sortStringArray(question.correctAnswers || []);
    const isCorrect = sameStringArray(selected, correct);

    return {
      isCorrect,
      pointsObtained: isCorrect ? 1 : 0,
      normalizedAnswer: null,
    };
  }

  if (question.type === "TRUE_FALSE") {
    if (payload.booleanAnswer === null || payload.booleanAnswer === undefined) {
      return {
        isCorrect: false,
        pointsObtained: 0,
        normalizedAnswer: null,
      };
    }

    const answerValue = String(payload.booleanAnswer).toLowerCase();
    const correctValue = String(
      question.correctAnswers?.[0] || "",
    ).toLowerCase();
    const isCorrect = answerValue === correctValue;

    return {
      isCorrect,
      pointsObtained: isCorrect ? 1 : 0,
      normalizedAnswer: null,
    };
  }

  return {
    isCorrect: false,
    pointsObtained: 0,
    normalizedAnswer: null,
  };
};

export const calculateTrainingAttemptScore = ({
  questions,
  answers,
  passScore,
}: {
  questions: ITrainingQuestion[];
  answers: { question: string; pointsObtained: number }[];
  passScore: number;
}) => {
  const totalPoints = questions.length;

  const pointsObtained = answers.reduce(
    (acc, answer) => acc + (answer.pointsObtained || 0),
    0,
  );

  const score =
    totalPoints > 0
      ? Number(((pointsObtained / totalPoints) * 100).toFixed(2))
      : 0;

  const passed = score >= passScore;

  return {
    totalPoints,
    pointsObtained,
    score,
    passed,
  };
};
