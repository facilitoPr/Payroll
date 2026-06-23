import AiAgent, { IAiAgent } from "../model/aiAgent"; // ajusta la ruta si es diferente
import { Types } from "mongoose";
import { IRecruitmentAgentConfig } from "../types/aiAgent";

export const seedDefaultRecruitmentAgent = async () => {
  try {
    // Evitar duplicados por code
    const existing = await AiAgent.findOne({
      code: "RECRUITMENT_GENERAL_DEFAULT",
      isDeleted: false,
    });

    if (existing) {
      console.log(
        "[seedDefaultRecruitmentAgent] Agente IA de reclutamiento general ya existe."
      );
      return existing;
    }

    const config: IRecruitmentAgentConfig = {
      kind: "recruitment",
      jobProfile: {
        positionTitle: "Reclutamiento general (múltiples puestos)",
        description:
          "Agente IA diseñado para apoyar procesos de reclutamiento en general. " +
          "No está limitado a un solo puesto: debe analizar el formulario, " +
          "entender el puesto deseado y el contexto del candidato, y emitir " +
          "una recomendación basada en las respuestas.",
        mustHaveSkills: [
          "Capacidad para interpretar formularios de reclutamiento estructurados",
          "Análisis general de experiencia laboral",
          "Evaluación de habilidades técnicas y blandas declaradas",
        ],
        niceToHaveSkills: [
          "Experiencia previa en el sector del puesto deseado",
          "Idiomas adicionales relevantes al rol",
        ],
        // Este valor es solo una referencia para la IA, no una restricción dura:
        minExperienceYears: 0,
        preferredIndustries: [
          "General",
          "Call center",
          "Administrativo",
          "Tecnología",
          "Ventas",
          "Servicio al cliente",
        ],
        // Como es general, definimos el mínimo como algo razonable y amplio
        minEducationLevel: "Bachiller o equivalente",
        languagesRequired: [
          {
            language: "Español",
            level: "Intermedio",
          },
        ],
        // General: puede aplicar para roles remotos, presenciales, híbridos
        locationType: "Presencial",
        salaryRange: {
          min: 0,
          max: 999999,
          currency: "DOP",
        },
        additionalConstraints: [
          "La IA NO debe tomar decisiones legales ni discriminatorias.",
          "La IA solo recomienda; el humano siempre valida.",
          "La IA debe detectar desalineaciones fuertes entre el candidato y el rol descrito.",
        ],
      },

      evaluationRubric: [
        {
          key: "technicalFit",
          label: "Ajuste técnico / habilidades duras",
          weight: 0.3,
        },
        {
          key: "experience",
          label: "Experiencia y trayectoria",
          weight: 0.25,
        },
        {
          key: "softSkills",
          label: "Habilidades blandas",
          weight: 0.2,
        },
        {
          key: "culturalFit",
          label: "Ajuste cultural y motivación",
          weight: 0.15,
        },
        {
          key: "salaryAlignment",
          label: "Alineación de pretensión salarial",
          weight: 0.1,
        },
      ],

      thresholds: {
        // < 40: alto riesgo / muy poco ajuste
        autoRejectScore: 40,
        // >= 70: claramente interesante para entrevista
        autoInterviewScore: 70,
        // entre 40 y 70: se puede recomendar POOL o segunda revisión
        autoPoolMinScore: 50,
      },

      interviewConfig: {
        // Por ahora que SOLO recomiende, el humano decide agendar o no.
        autoSchedule: false,
        defaultMode: "Virtual",
        defaultLocation:
          "Enlace de videoconferencia (por definir en el sistema)",
        // Lo dejamos vacío; en el futuro puedes setear evaluadores por defecto.
        defaultEvaluators: [] as Types.ObjectId[],
      },
    };

    const agentData: Partial<IAiAgent> = {
      name: "Agente IA – Reclutamiento General",
      code: "RECRUITMENT_GENERAL_DEFAULT",
      type: "recruitment",
      description:
        "Agente IA encargado de analizar formularios de reclutamiento " +
        "para cualquier puesto y generar una recomendación (rechazar, pool, " +
        "entrevista, posible contratación), con desglose de puntajes.",
      provider: "openai",
      model: "gpt-4.1-mini", // o "gpt-4.1" si prefieres más capacidad
      temperature: 0.1, // bajito para que sea consistente
      maxTokens: 1024,
      config,
      isActive: true,
      isDeleted: false,
    };

    const agent = await AiAgent.create(agentData);

    console.log(
      "[seedDefaultRecruitmentAgent] Agente IA de reclutamiento general creado.",
      agent._id.toString()
    );

    return agent;
  } catch (error) {
    console.error(
      "[seedDefaultRecruitmentAgent] Error creando agente IA de reclutamiento general:",
      error
    );
    throw error;
  }
};

// export const seedCallCenterRecruitmentAgent = async () => {
//   try {
//     // Evitar duplicados por code
//     const existing = await AiAgent.findOne({
//       code: "RECRUITMENT_CALLCENTER_DEFAULT",
//       isDeleted: false,
//     });

//     if (existing) {
//       console.log(
//         "[seedCallCenterRecruitmentAgent] Agente IA de reclutamiento call center ya existe."
//       );
//       return existing;
//     }

//     const config: IRecruitmentAgentConfig = {
//       jobProfile: {
//         positionTitle: "Agente de Call Center (Entry Level)",
//         description:
//           "Agente IA diseñado para evaluar candidatos para puestos de call center " +
//           "de nivel inicial. No requiere experiencia previa. Debe enfocarse en " +
//           "idiomas, comunicación, disponibilidad y actitud de servicio. " +
//           "Debe validar que el candidato sea mayor de edad.",
//         mustHaveSkills: [
//           "Comunicación clara y respetuosa",
//           "Orientación a servicio al cliente",
//           "Capacidad para seguir instrucciones y guiones",
//         ],
//         niceToHaveSkills: [
//           "Experiencia previa en atención al cliente (no obligatoria)",
//           "Manejo básico de computadora",
//           "Disponibilidad para turnos rotativos",
//         ],
//         // No se requiere experiencia
//         minExperienceYears: 0,
//         preferredIndustries: ["Call center", "Servicio al cliente", "Ventas"],

//         // No exigimos un nivel de educación estricto
//         minEducationLevel: "No requerido (preferible bachiller)",

//         // Importante: Español obligatorio; Inglés opcional (si lo tiene, suma)
//         languagesRequired: [{ language: "Español", level: "Intermedio" }],
//         locationType: "Presencial",

//         // No se evalúa expectativa salarial, pero el esquema lo requiere:
//         // Lo dejamos amplio y sin impacto real (ver rubric abajo)
//         salaryRange: {
//           min: 0,
//           max: 999999,
//           currency: "DOP",
//         },

//         additionalConstraints: [
//           "El candidato DEBE ser mayor de edad (18+). Si no lo confirma, marcar como 'requiere verificación'.",
//           "La IA NO debe solicitar ni usar datos sensibles innecesarios.",
//           "La IA NO debe tomar decisiones discriminatorias ni legales.",
//           "No se debe basar la recomendación en expectativa salarial.",
//           "La IA solo recomienda; un humano valida la decisión final.",
//         ],
//       },

//       evaluationRubric: [
//         {
//           key: "communication",
//           label: "Comunicación y claridad",
//           weight: 0.35,
//         },
//         {
//           key: "customerService",
//           label: "Actitud de servicio / empatía",
//           weight: 0.25,
//         },
//         {
//           key: "languageFit",
//           label: "Idiomas (Español obligatorio, Inglés opcional)",
//           weight: 0.25,
//         },
//         {
//           key: "availability",
//           label: "Disponibilidad y flexibilidad de horarios",
//           weight: 0.15,
//         },
//         // Nota: NO incluimos salaryAlignment para que no pese en nada
//       ],

//       thresholds: {
//         autoRejectScore: 35, // más flexible: entry level
//         autoInterviewScore: 70, // entrevista si está bien
//         autoPoolMinScore: 50, // pool si es decente pero faltan detalles
//       },

//       interviewConfig: {
//         autoSchedule: false,
//         defaultMode: "Virtual",
//         defaultLocation:
//           "Enlace de videoconferencia (por definir en el sistema)",
//         defaultEvaluators: [] as Types.ObjectId[],
//       },
//     };

//     const agentData: Partial<IAiAgent> = {
//       name: "Agente IA – Reclutamiento Call Center",
//       code: "RECRUITMENT_CALLCENTER_DEFAULT",
//       type: "recruitment",
//       description:
//         "Agente IA encargado de analizar formularios de reclutamiento para " +
//         "puestos de call center (nivel inicial). Se enfoca en comunicación, " +
//         "idiomas (Español obligatorio, Inglés opcional), disponibilidad y " +
//         "validación de mayoría de edad (18+). No evalúa expectativa salarial.",
//       provider: "openai",
//       model: "gpt-4.1-mini",
//       temperature: 0.1,
//       maxTokens: 1024,
//       config,
//       isActive: true,
//       isDeleted: false,
//     };

//     const agent = await AiAgent.create(agentData);

//     console.log(
//       "[seedCallCenterRecruitmentAgent] Agente IA call center creado.",
//       agent._id.toString()
//     );

//     return agent;
//   } catch (error) {
//     console.error(
//       "[seedCallCenterRecruitmentAgent] Error creando agente IA call center:",
//       error
//     );
//     throw error;
//   }
// };
