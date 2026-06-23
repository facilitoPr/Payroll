export const statusOptions = ["Pendiente", "Aprobada", "Rechazada"];
export const decisionOptions = [
  { label: "Contratado", value: "HIRED" },
  { label: "Apto para entrevista", value: "INTERVIEW" },
  { label: "Apto para contratación", value: "HIRING" },
  { label: "Activo en BD", value: "POOL" },
  { label: "Rechazar", value: "REJECTED" },
];

export const interviewModeOptions = ["Presencial", "Virtual", "Telefónica"];
export const expedientCodeOptions = ["EXP-NEW", "EXP-TRANSFER", "EXP-REHIRE"];
export const expedientOwnerOptions = ["RRHH", "Gerencia", "Supervisor directo"];


export const docStatuses = ["Original", "Copia", "Digital", "Pendiente", "No aplica"];
export const classificationSections = [
  {
    key: "personalDocs",
    title: "1. Documentos Personales",
    items: [
      { key: "idCopy", label: "Copia de cédula o pasaporte" },
      { key: "birthCertificate", label: "Acta de nacimiento" },
      { key: "photoID", label: "Foto tipo carnet" },
      { key: "addressProof", label: "Comprobante de dirección" },
    ],
  },
  {
    key: "legalContracts",
    title: "2. Documentos Legales y Contractuales",
    items: [
      { key: "workContract", label: "Contrato de trabajo" },
      { key: "nda", label: "Acuerdos de confidencialidad" },
      { key: "addendums", label: "Addendums o modificaciones al contrato" },
      { key: "workPermits", label: "Permisos de trabajo (si aplica)" },
    ],
  },
  {
    key: "recruiting",
    title: "3. Reclutamiento y Selección",
    items: [
      { key: "applicationForm", label: "Formulario de solicitud" },
      { key: "cv", label: "Currículum vitae" },
      { key: "interviewResults", label: "Resultados de entrevistas" },
      { key: "psychTests", label: "Pruebas psicométricas y técnicas" },
    ],
  },
  {
    key: "educationCerts",
    title: "4. Certificaciones y Educación",
    items: [
      { key: "degrees", label: "Títulos y diplomas" },
      { key: "professionalCerts", label: "Certificaciones profesionales" },
      { key: "trainings", label: "Cursos y entrenamientos completados" },
    ],
  },
  {
    key: "attendance",
    title: "5. Control de Asistencia",
    items: [
      { key: "punchRecords", label: "Registros de ponches" },
      { key: "attendanceReports", label: "Reportes de asistencia" },
      { key: "overtime", label: "Horas extras" },
      { key: "shifts", label: "Turnos y horarios asignados" },
    ],
  },
  {
    key: "performance",
    title: "6. Evaluación y Desempeño",
    items: [
      { key: "performanceReviews", label: "Evaluaciones de desempeño" },
      { key: "kpis", label: "Objetivos y KPIs" },
      { key: "improvementPlans", label: "Planes de mejora" },
    ],
  },
  {
    key: "discipline",
    title: "7. Disciplina y Conducta",
    items: [
      { key: "warnings", label: "Amonestaciones" },
      { key: "incidents", label: "Incidentes" },
      {
        key: "disciplinaryMeasures",
        label: "Registros de medidas disciplinarias",
      },
    ],
  },
  {
    key: "payrollBenefits",
    title: "8. Nómina y Beneficios",
    items: [
      { key: "payslips", label: "Talones de pago" },
      { key: "withholdings", label: "Retenciones e impuestos" },
      { key: "vacations", label: "Registros de vacaciones y licencias" },
      { key: "benefitsInsurance", label: "Beneficios y seguros" },
    ],
  },
  {
    key: "healthSafety",
    title: "9. Salud, Seguridad y Bienestar",
    items: [
      { key: "medicalCerts", label: "Certificados médicos" },
      { key: "accidentReports", label: "Reportes de accidentes laborales" },
      { key: "occupationalHealth", label: "Evaluaciones de salud ocupacional" },
    ],
  },
  {
    key: "separation",
    title: "10. Separación de la Empresa",
    items: [
      { key: "resignationLetter", label: "Carta de renuncia o despido" },
      { key: "settlement", label: "Liquidación" },
      { key: "exitInterview", label: "Entrevista de salida" },
      { key: "equipmentChecklist", label: "Checklist de entrega de equipos" },
    ],
  },
];