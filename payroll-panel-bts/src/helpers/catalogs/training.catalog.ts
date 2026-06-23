export const trainingTypeOptions = [
  { label: "Lección", value: "LESSON" },
  { label: "Cuestionario", value: "QUIZ" },
  { label: "Mixto", value: "MIXED" },
];

export const trainingStatusOptions = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Publicado", value: "PUBLISHED" },
  { label: "Archivado", value: "ARCHIVED" },
];

export const getTrainingStatusLabel = (status?: string | null) => {
  if (status === "DRAFT") return "Borrador";
  if (status === "PUBLISHED") return "Publicado";
  if (status === "ARCHIVED") return "Archivado";

  return status || "N/D";
};

export const getTrainingStatusColor = (status?: string | null) => {
  if (status === "PUBLISHED") return "positive";
  if (status === "DRAFT") return "warning";
  if (status === "ARCHIVED") return "grey-7";

  return "primary";
};

export const getTrainingTypeLabel = (type?: string | null) => {
  if (type === "LESSON") return "Lección";
  if (type === "QUIZ") return "Cuestionario";
  if (type === "MIXED") return "Mixto";

  return type || "N/D";
};


export const getQuestionTypeLabel = (type: string) => {
  if (type === "SHORT_TEXT") return "Texto corto";
  if (type === "LONG_TEXT") return "Texto largo";
  if (type === "SINGLE_CHOICE") return "Una respuesta";
  if (type === "MULTIPLE_CHOICE") return "Selección múltiple";
  if (type === "TRUE_FALSE") return "Verdadero/Falso";
  return type || "-";
};
