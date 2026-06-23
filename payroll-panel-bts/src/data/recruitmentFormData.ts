export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "email"
  | "select"
  | "yesno"
  | "file-select"
  | "number"
  | "checkbox";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  optionsKey?: string;
  placeholder?: string;
  showIf?: { field: string; equals: any };
};

export type StepDef = {
  name: number;
  title: string;
  icon: string;
  fields: FieldDef[];
};

export const optionsMap = {
  yesNo: ["Sí", "No"],
  nationalities: ["Dominicana", "Haitiana", "Venezolana", "Colombiana", "Otra"],
  maritalStatuses: [
    "Soltero/a",
    "Casado/a",
    "Unión libre",
    "Divorciado/a",
    "Viudo/a",
  ],
  departments: [
    "Administración",
    "Comercial",
    "Tecnología",
    "Operaciones",
    "Ventas",
    "RRHH",
    "Finanzas",
    "Otro",
  ],
  schedules: ["Tiempo completo", "Medio tiempo", "Nocturno", "Rotativo"],
  vacancySources: ["Instagram", "LinkedIn", "Referido", "Web", "Otro"],
  educationLevels: [
    "Bachiller",
    "Técnico",
    "Universitario",
    "Postgrado",
    "Maestría",
    "Otro",
  ],
  languagesLevel: ["Básico", "Intermedio", "Avanzado", "Nativo"],
  filesMock: [
    "Archivo adjunto (mock)",
    "No adjuntado",
    "Pendiente por entregar",
  ],
} as const;

export const recruitmentSteps: StepDef[] = [
  {
    name: 1,
    title: "Información Personal",
    icon: "person",
    fields: [
      {
        key: "fullName",
        label: "Nombre completo",
        type: "text",
        required: true,
      },
      {
        key: "birthDate",
        label: "Fecha de nacimiento",
        type: "date",
        required: true,
      },
      {
        key: "nationality",
        label: "Nacionalidad",
        type: "select",
        required: true,
        optionsKey: "nationalities",
      },
      {
        key: "idNumber",
        label: "Número de identificación (cédula / pasaporte)",
        type: "text",
        required: true,
      },
      {
        key: "mobilePhone",
        label: "Teléfono móvil",
        type: "text",
        required: true,
      },
      { key: "alternatePhone", label: "Teléfono alterno", type: "text" },
      {
        key: "email",
        label: "Correo electrónico",
        type: "email",
        required: true,
      },
      {
        key: "address",
        label: "Dirección completa",
        type: "textarea",
        required: true,
      },
      {
        key: "maritalStatus",
        label: "Estado civil",
        type: "select",
        required: true,
        optionsKey: "maritalStatuses",
      },
      {
        key: "hasDriverLicense",
        label: "¿Posee licencia de conducir?",
        type: "yesno",
        required: true,
        optionsKey: "yesNo",
      },
      {
        key: "driverLicenseType",
        label: "Tipo de licencia",
        type: "text",
        showIf: { field: "hasDriverLicense", equals: "Sí" },
      },
      {
        key: "hasVehicle",
        label: "¿Posee vehículo propio?",
        type: "yesno",
        optionsKey: "yesNo",
      },
    ],
  },

  {
    name: 2,
    title: "Puesto al que Aplica",
    icon: "work",
    fields: [
      {
        key: "department",
        label: "Área / Departamento",
        type: "select",
        required: true,
        optionsKey: "departments",
      },
      {
        key: "scheduleAvailable",
        label: "Jornada disponible",
        type: "select",
        required: true,
        optionsKey: "schedules",
      },
      {
        key: "startDateAvailable",
        label: "Fecha disponible para iniciar",
        type: "date",
        required: true,
      },
      {
        key: "salaryExpectation",
        label: "Pretensión salarial",
        type: "number",
        required: true,
        placeholder: "RD$",
      },
      {
        key: "vacancySource",
        label: "¿Cómo se enteró de la vacante?",
        type: "select",
        required: true,
        optionsKey: "vacancySources",
      },
      {
        key: "fieldWorkAvailability",
        label:
          "¿Tiene disponibilidad para visitas comerciales o trabajo de campo?",
        type: "yesno",
        optionsKey: "yesNo",
      },
      {
        key: "timeAvailability",
        label: "Disponibilidad de horario",
        type: "text",
      },
    ],
  },

  {
    name: 3,
    title: "Documentos Adjuntos",
    icon: "attach_file",
    fields: [
      {
        key: "cv",
        label: "Currículum vitae (CV)",
        type: "file-select",
        required: true,
        optionsKey: "filesMock",
      },
      {
        key: "photoID",
        label: "Foto tipo carnet",
        type: "file-select",
        required: true,
        optionsKey: "filesMock",
      },
      {
        key: "idCopy",
        label: "Copia de cédula/pasaporte",
        type: "file-select",
        required: true,
        optionsKey: "filesMock",
      },
      {
        key: "recommendationLetter",
        label: "Carta de recomendación",
        type: "file-select",
        optionsKey: "filesMock",
      },
      {
        key: "certificates",
        label: "Certificados o diplomas",
        type: "file-select",
        optionsKey: "filesMock",
      },
      {
        key: "portfolio",
        label: "Portafolio (si aplica)",
        type: "file-select",
        optionsKey: "filesMock",
      },
    ],
  },

  {
    name: 4,
    title: "Experiencia Laboral",
    icon: "history_edu",
    fields: [
      {
        key: "yearsExperience",
        label: "Años de experiencia relacionados al puesto",
        type: "number",
        required: true,
      },
      {
        key: "companyName",
        label: "Nombre de la empresa",
        type: "text",
        required: true,
      },
      {
        key: "positionHeld",
        label: "Cargo desempeñado",
        type: "text",
        required: true,
      },
      {
        key: "countryCity",
        label: "País y ciudad",
        type: "text",
        required: true,
      },
      {
        key: "expStartDate",
        label: "Fecha de inicio",
        type: "date",
        required: true,
      },
      {
        key: "expEndDate",
        label: "Fecha de fin",
        type: "date",
        required: true,
      },
      {
        key: "functionsDescription",
        label: "Descripción de funciones",
        type: "textarea",
        required: true,
      },
      {
        key: "mainAchievements",
        label: "Logros principales",
        type: "textarea",
      },
      {
        key: "monthlySalaryOptional",
        label: "Salario mensual (opcional)",
        type: "number",
        placeholder: "RD$",
      },
      { key: "exitReason", label: "Motivo de salida", type: "text" },
      {
        key: "supervisorContact",
        label: "Contacto del supervisor",
        type: "text",
      },

      {
        key: "salesExperience",
        label: "Experiencia en ventas o captación comercial",
        type: "textarea",
      },
      {
        key: "financialProductsExperience",
        label: "Experiencia con productos financieros o préstamos",
        type: "textarea",
      },
      {
        key: "dealerOrB2BExperience",
        label: "Experiencia trabajando con dealers, comercios o clientes B2B",
        type: "textarea",
      },
      {
        key: "vehicleKnowledge",
        label: "Conocimiento sobre vehículos, matrículas, garantías o seguros",
        type: "textarea",
      },

      {
        key: "peopleManagementExperience",
        label: "Experiencia supervisando personal",
        type: "textarea",
      },
      {
        key: "teamSizeManaged",
        label: "Cantidad aproximada de personas supervisadas",
        type: "number",
      },
      {
        key: "branchOperationsExperience",
        label: "Experiencia en operación de sucursal u oficina",
        type: "textarea",
      },
      {
        key: "kpiManagementExperience",
        label: "Experiencia manejando indicadores, reportes o metas",
        type: "textarea",
      },
      {
        key: "conflictManagementExperience",
        label: "Ejemplo de manejo de conflictos o clientes difíciles",
        type: "textarea",
      },
      {
        key: "cashOrAdministrativeControlExperience",
        label: "Experiencia en control administrativo, caja o expedientes",
        type: "textarea",
      },
    ],
  },

  {
    name: 5,
    title: "Educación / Formación",
    icon: "school",
    fields: [
      {
        key: "educationLevel",
        label: "Nivel educativo",
        type: "select",
        required: true,
        optionsKey: "educationLevels",
      },
      {
        key: "degreeTitle",
        label: "Título obtenido",
        type: "text",
        required: true,
      },
      {
        key: "institution",
        label: "Institución educativa",
        type: "text",
        required: true,
      },
      { key: "educationCountry", label: "País", type: "text", required: true },
      { key: "educationStart", label: "Fecha de inicio", type: "date" },
      { key: "educationEnd", label: "Fecha de finalización", type: "date" },
      {
        key: "extraCerts",
        label: "Certificaciones adicionales",
        type: "textarea",
      },
    ],
  },

  {
    name: 6,
    title: "Habilidades y Competencias",
    icon: "psychology",
    fields: [
      {
        key: "languages",
        label: "Idiomas y nivel",
        type: "textarea",
        required: true,
        placeholder: "Ej: Inglés B2, Español nativo",
      },
      {
        key: "softwareTools",
        label: "Software o herramientas",
        type: "textarea",
        required: true,
        placeholder: "Ej: Excel, CRM, CDC, Office, Outlook",
      },
      { key: "softSkills", label: "Competencias blandas", type: "textarea" },
      { key: "techSkills", label: "Competencias técnicas", type: "textarea" },
      {
        key: "relevantCourses",
        label: "Cursos o entrenamientos relevantes",
        type: "textarea",
      },
      {
        key: "leadershipStyle",
        label: "Describa su estilo de liderazgo",
        type: "textarea",
      },
    ],
  },

  {
    name: 7,
    title: "Información Adicional",
    icon: "info",
    fields: [
      {
        key: "willingToTravel",
        label: "¿Está dispuesto a viajar?",
        type: "yesno",
        optionsKey: "yesNo",
      },
      {
        key: "willingToRelocate",
        label: "¿Está dispuesto a reubicarse?",
        type: "yesno",
        optionsKey: "yesNo",
      },
      {
        key: "growthExpectations",
        label: "Expectativas de crecimiento profesional",
        type: "textarea",
      },
    ],
  },

  {
    name: 8,
    title: "Referencias Laborales",
    icon: "contacts",
    fields: [
      {
        key: "refName",
        label: "Nombre de la referencia",
        type: "text",
        required: true,
      },
      { key: "refRelation", label: "Relación", type: "text", required: true },
      { key: "refCompany", label: "Empresa", type: "text" },
      { key: "refPhone", label: "Teléfono", type: "text", required: true },
      { key: "refEmail", label: "Correo", type: "email" },
      { key: "refTime", label: "Tiempo de relación", type: "text" },
    ],
  },

  {
    name: 9,
    title: "Evaluación Inicial",
    icon: "quiz",
    fields: [
      {
        key: "whyWorkHere",
        label: "¿Por qué desea trabajar en la empresa?",
        type: "textarea",
        required: true,
      },
      {
        key: "valueToAdd",
        label: "¿Qué valor puede aportar al puesto?",
        type: "textarea",
        required: true,
      },
      {
        key: "biggestAchievement",
        label: "Mayor logro profesional",
        type: "textarea",
      },
      {
        key: "otherProcesses",
        label: "¿Tiene procesos en otras empresas?",
        type: "yesno",
        required: true,
        optionsKey: "yesNo",
      },
      {
        key: "recentDismissal",
        label: "¿Ha sido desvinculado recientemente?",
        type: "yesno",
        required: true,
        optionsKey: "yesNo",
      },
    ],
  },

  {
    name: 10,
    title: "Consentimientos",
    icon: "verified_user",
    fields: [
      {
        key: "refCheckAuth",
        label: "Autorizo verificación de referencias",
        type: "checkbox",
        required: true,
      },
      {
        key: "dataUseConsent",
        label: "Consiento uso de datos",
        type: "checkbox",
        required: true,
      },
      {
        key: "infoTruthConfirm",
        label: "Confirmo veracidad de la información",
        type: "checkbox",
        required: true,
      },
      {
        key: "digitalSignature",
        label: "Firma digital del candidato (escriba su nombre)",
        type: "text",
        required: true,
      },
      {
        key: "formDate",
        label: "Fecha del formulario",
        type: "date",
        required: true,
      },
    ],
  },
];

export const initialRecruitmentForm = recruitmentSteps.reduce(
  (acc: any, step) => {
    step.fields.forEach((f) => {
      if (f.type === "checkbox") acc[f.key] = false;
      else acc[f.key] = "";
    });
    return acc;
  },
  {},
);