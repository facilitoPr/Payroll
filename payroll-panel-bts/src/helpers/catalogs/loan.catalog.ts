export const getLoanRateTypeText = (rateType?: string) => {
  if (rateType === "MONTHLY") return "Mensual";
  if (rateType === "BIWEEKLY") return "Quincenal";
  if (rateType === "WEEKLY") return "Semanal";
  if (rateType === "DAILY") return "Diario";
  if (rateType === "ANNUAL") return "Anual";
  if (rateType === "HOURLY") return "Horario";
  return rateType || "N/D";
};


export const getLoanHistoryActionsText = (action?: string) => {
  if (action === "CREATED") return "Creada";
  if (action === "SUBMITTED") return "Enviada para aprobación";
  if (action === "CONTRACT_SIGNED") return "Contrato firmado";
  if (action === "SENT_TO_EXTERNAL") return "Enviada a sistema externo";
  if (action === "EXTERNAL_RECEIVED") return "Recibida por sistema externo";
  if (action === "STATUS_CHANGED") return "Estado cambiado";
  if (action === "APPROVED") return "Aprobada";
  if (action === "REJECTED") return "Rechazada";
  if (action === "CANCELLED") return "Cancelada";
  if (action === "ERROR") return "Error";
  if (action === "SYNC_FAILED") return "Fallo en sincronización";
  if (action === "SYNCED") return "Sincronizada";
  if (action === "COMMENTED") return "Comentada";
  if (action === "CLOSED") return "Cerrada";
  return action || "N/D";
};

export const getEmployeeLoanRequestStatusText = (status?: string) => {
  if (status === "DRAFT") return "Borrador";
  if (status === "SUBMITTED") return "En revisión";
  if (status === "SENT_TO_EXTERNAL") return "Enviada a sistema externo";
  if (status === "EXTERNAL_RECEIVED") return "Recibida por sistema externo";
  if (status === "UNDER_REVIEW") return "En revisión";
  if (status === "APPROVED") return "Aprobada";
  if (status === "REJECTED") return "Rechazada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "ERROR") return "Error";
  if (status === "CLOSED") return "Cerrada";
  return status || "N/D";
}