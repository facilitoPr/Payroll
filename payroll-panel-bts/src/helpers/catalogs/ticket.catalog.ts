export const getSupportTicketStatusLabel = (status?: string) => {
  if (status === "OPEN") return "Abierto";
  if (status === "IN_PROGRESS") return "En proceso";
  if (status === "RESOLVED") return "Resuelto";
  if (status === "CLOSED") return "Cerrado";
  return status || "N/D";
};

export const getSupportTicketStatusColor = (status?: string) => {
  if (status === "OPEN") return "primary";
  if (status === "IN_PROGRESS") return "warning";
  if (status === "RESOLVED") return "positive";
  if (status === "CLOSED") return "grey-7";
  return "grey-6";
};

export const getSupportTicketPriorityLabel = (priority?: string) => {
  if (priority === "LOW") return "Baja";
  if (priority === "MEDIUM") return "Media";
  if (priority === "HIGH") return "Alta";
  return priority || "N/D";
};

export const getSupportTicketPriorityColor = (priority?: string) => {
  if (priority === "LOW") return "teal";
  if (priority === "MEDIUM") return "orange";
  if (priority === "HIGH") return "negative";
  return "grey-6";
};