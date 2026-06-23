export interface TrainingMetrics {
  totalTrainings: number;
  publishedTrainings: number;
  draftTrainings: number;
  archivedTrainings: number;
  totalAssignments: number;
  completedAssignments: number;
  failedAssignments: number;
  startedAssignments: number;
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  completionRate: number;
  approvalRate: number;
}

export interface TrainingRow {
  _id: string;
  title: string;
  code?: string;
  description?: string;
  type: "LESSON" | "QUIZ" | "MIXED";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  estimatedMinutes: number;
  passScore: number;
  maxAttempts: number;
  isMandatory: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface TrainingContentBlock {
  _id: string;
  training: string;
  type: "TEXT" | "YOUTUBE" | "PDF" | "IMAGE" | "FILE";
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  order: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface TrainingQuestionOption {
  key: string;
  text: string;
}

export interface TrainingQuestion {
  _id: string;
  training: string;
  title?: string;
  questionText: string;
  type:
    | "SHORT_TEXT"
    | "LONG_TEXT"
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE";
  options: TrainingQuestionOption[];
  correctAnswers?: string[];
  acceptedAnswers?: string[];
  textEvaluationMode?: "EXACT" | "CONTAINS" | "KEYWORDS" | "REGEX" | null;
  minKeywordMatches?: number;
  isCaseSensitive?: boolean;
  ignoreAccents?: boolean;
  ignoreExtraSpaces?: boolean;
  points: number;
  order: number;
  isRequired: boolean;
  explanation?: string;
  isActive: boolean;
}

export interface TrainingAssignment {
  _id: string;
  training: string | TrainingRow;
  user: any;
  assignedBy: any;
  status: "ASSIGNED" | "STARTED" | "COMPLETED" | "FAILED" | "EXPIRED";
  score: number;
  passed: boolean;
  totalAttemptsUsed: number;
  dueDate?: string | null;
  completedAt?: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
}

export interface TrainingAttempt {
  _id: string;
  training: any;
  user: any;
  assignment: any;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string | null;
  score: number;
  pointsObtained: number;
  totalPoints: number;
  passed: boolean;
  status: "IN_PROGRESS" | "SUBMITTED" | "PASSED" | "FAILED" | "EXPIRED";
  durationSeconds: number;
  createdAt?: string;
}

export interface TrainingAttemptQuestionResult {
  question: {
    _id: string;
    title?: string;
    questionText: string;
    type: string;
    options: TrainingQuestionOption[];
    correctAnswers?: string[];
    acceptedAnswers?: string[];
    explanation?: string | null;
    points: number;
    order: number;
    isRequired: boolean;
  };
  answer: {
    _id: string;
    answerText?: string;
    selectedOptions?: string[];
    booleanAnswer?: boolean | null;
    normalizedAnswer?: string | null;
    isCorrect: boolean;
    pointsObtained: number;
  } | null;
}