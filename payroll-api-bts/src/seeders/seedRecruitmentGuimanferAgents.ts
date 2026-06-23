import crypto from "crypto";
import AiAgent from "../model/aiAgent";

const buildChecksum = (value: any) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const seedRecruitmentAgentsForGuimanferJobs = async () => {
  const agents = [
    {
      name: "Agente IA – Reclutamiento Oficial de Negocios",
      code: "RECRUITMENT_OFICIAL_NEGOCIOS_V1",
      type: "recruitment",
      description:
        "Analiza candidatos para Oficial de Negocios. Evalúa perfil comercial, negociación, manejo de expedientes, experiencia financiera, relación con dealers/B2B, conocimiento vehicular, trabajo de campo y orientación al cliente.",
      provider: "openai",
      model: "gpt-4.1-mini",
      temperature: 0,
      maxTokens: 1600,
      version: 2,
      isActive: true,
      isDeleted: false,
      config: {
        kind: "recruitment",
        jobProfile: {
          positionTitle: "Oficial de Negocios",
          description:
            "Puesto táctico-comercial responsable de captar nuevos negocios, negociar préstamos, validar datos del cliente, dar seguimiento a expedientes, visitar dealers/clientes B2B, coordinar tasaciones, seguros, garantías, GPS y mantener actualizado el CDC. Requiere fuerte orientación comercial, organización documental y trato profesional al cliente.",
          mustHaveSkills: [
            "Experiencia comercial o ventas",
            "Negociación con clientes",
            "Orientación al cliente",
            "Seguimiento de expedientes o casos",
            "Organización documental",
            "Comunicación clara y profesional",
            "Disponibilidad para trabajo de campo o visitas comerciales",
          ],
          niceToHaveSkills: [
            "Experiencia en préstamos o productos financieros",
            "Experiencia con dealers, comercios o clientes B2B",
            "Conocimiento de vehículos, matrículas, garantías o seguros",
            "Manejo de CRM, CDC, Office, Outlook o sistemas internos",
            "Licencia de conducir vigente",
            "Vehículo propio",
          ],
          minExperienceYears: 3,
          preferredIndustries: [
            "Financiera",
            "Banca",
            "Crédito",
            "Ventas",
            "Automotriz",
            "Dealer",
            "Seguros",
            "Servicio al cliente",
          ],
          minEducationLevel:
            "Universitario en Administración de Empresas, Marketing, Ventas o áreas afines",
          languagesRequired: [
            {
              language: "Español",
              level: "Intermedio",
            },
          ],
          locationType: "Presencial",
          additionalConstraints: [
            "Validar especialmente experiencia comercial, negociación, seguimiento de casos y trato con clientes.",
            "Valorar positivamente experiencia con productos financieros, préstamos, dealers, vehículos, garantías o seguros.",
            "Valorar disponibilidad para visitas comerciales o trabajo de campo.",
            "Valorar licencia de conducir y vehículo propio, pero no rechazar automáticamente si no está confirmado.",
            "No basar la recomendación en estado civil, nacionalidad, género, salud, religión u otros datos sensibles.",
            "La IA solo recomienda; RRHH toma la decisión final.",
          ],
        },

        evaluationRubric: [
          {
            key: "commercialDrive",
            label: "Impulso comercial y captación",
            weight: 0.2,
            description:
              "Evalúa experiencia en ventas, captación de clientes, generación de oportunidades, orientación a metas y actitud comercial.",
          },
          {
            key: "negotiation",
            label: "Negociación y cierre",
            weight: 0.18,
            description:
              "Evalúa capacidad para negociar, manejar objeciones, persuadir y cerrar acuerdos de forma profesional.",
          },
          {
            key: "documentationControl",
            label: "Control documental y seguimiento",
            weight: 0.18,
            description:
              "Evalúa orden, seguimiento, manejo de expedientes, precisión en información y capacidad para completar procesos.",
          },
          {
            key: "financialVehicleKnowledge",
            label: "Conocimiento financiero y vehicular",
            weight: 0.22,
            description:
              "Evalúa experiencia en préstamos, productos financieros, vehículos, matrículas, garantías, seguros, GPS o procesos relacionados.",
          },
          {
            key: "customerRelationship",
            label: "Relación con clientes, dealers y B2B",
            weight: 0.12,
            description:
              "Evalúa trato al cliente, manejo de relaciones comerciales, dealers, comercios, referidores o cartera B2B.",
          },
          {
            key: "communicationSoftSkills",
            label: "Comunicación y habilidades blandas",
            weight: 0.1,
            description:
              "Evalúa claridad, empatía, proactividad, trabajo en equipo, actitud de servicio y profesionalismo.",
          },
        ],

        thresholds: {
          autoRejectScore: 45,
          autoInterviewScore: 72,
          autoPoolMinScore: 55,
        },

        hardFilters: [
          {
            key: "minimumExperience",
            type: "minimumExperience",
            value: 3,
            onFail: "REVIEW",
          },
          {
            key: "requiredEducation",
            type: "requiredField",
            field: "educationLevel",
            onFail: "REVIEW",
          },
          {
            key: "requiredSpanish",
            type: "requiredLanguage",
            language: "Español",
            minLevel: "Intermedio",
            onFail: "REVIEW",
          },
          {
            key: "fieldWorkAvailability",
            type: "requiredField",
            field: "fieldWorkAvailability",
            onFail: "REVIEW",
          },
        ],

        decisionPolicy: {
          requireAllMustHaves: false,
          allowInterviewIfMissingInfo: true,
          maxCriticalRiskFlags: 1,
          minimumCriterionScores: {
            commercialDrive: 50,
            negotiation: 50,
            documentationControl: 45,
            financialVehicleKnowledge: 45,
          },
        },

        interviewConfig: {
          autoSchedule: false,
          defaultMode: "Presencial",
          defaultLocation: "Sucursal / Oficina comercial",
          defaultEvaluators: [],
        },

        promptConfig: {
          systemStyle: "professional",
          maxStrengths: 5,
          maxWeaknesses: 5,
          maxRiskFlags: 5,
        },
      },
    },

    {
      name: "Agente IA – Reclutamiento Gerente de Sucursal",
      code: "RECRUITMENT_GERENTE_SUCURSAL_V1",
      type: "recruitment",
      description:
        "Analiza candidatos para Gerente de Sucursal. Evalúa liderazgo, manejo de personal, supervisión comercial, control administrativo, operación de sucursal, indicadores, manejo de conflictos y servicio al cliente.",
      provider: "openai",
      model: "gpt-4.1-mini",
      temperature: 0,
      maxTokens: 1600,
      version: 2,
      isActive: true,
      isDeleted: false,
      config: {
        kind: "recruitment",
        jobProfile: {
          positionTitle: "Gerente de Sucursal",
          description:
            "Puesto táctico-gerencial responsable de asegurar la operación integral de una sucursal, supervisar personal, apoyar el cierre de negocios, controlar expedientes, caja, garantías, cartera, indicadores, servicio al cliente, conflictos, mantenimiento de la oficina y cumplimiento de políticas internas.",
          mustHaveSkills: [
            "Liderazgo de equipos",
            "Manejo de personal",
            "Supervisión comercial",
            "Control administrativo y operativo",
            "Manejo de conflictos",
            "Orientación al cliente",
            "Seguimiento de indicadores y metas",
            "Comunicación profesional",
          ],
          niceToHaveSkills: [
            "Experiencia en sucursales financieras o comerciales",
            "Experiencia con cartera de clientes",
            "Experiencia en caja, expedientes, garantías o documentación",
            "Conocimiento de productos financieros",
            "Manejo de CRM, CDC, Office, Outlook o sistemas internos",
            "Maestría en Alta Gerencia o formación gerencial",
            "Inglés avanzado",
          ],
          minExperienceYears: 5,
          preferredIndustries: [
            "Financiera",
            "Banca",
            "Crédito",
            "Operaciones de sucursal",
            "Retail financiero",
            "Servicio al cliente",
            "Ventas",
            "Administración",
          ],
          minEducationLevel:
            "Universitario en Administración o áreas afines; deseable Maestría en Alta Gerencia",
          languagesRequired: [
            {
              language: "Español",
              level: "Intermedio",
            },
          ],
          locationType: "Presencial",
          additionalConstraints: [
            "Validar especialmente experiencia manejando personal, indicadores, conflictos, operaciones y servicio al cliente.",
            "Valorar experiencia en sucursales, cartera de clientes, caja, expedientes, garantías, auditoría o control administrativo.",
            "No rechazar automáticamente si no tiene maestría, pero sí marcarlo como punto a verificar.",
            "No basar la recomendación en estado civil, nacionalidad, género, salud, religión u otros datos sensibles.",
            "La IA solo recomienda; RRHH toma la decisión final.",
          ],
        },

        evaluationRubric: [
          {
            key: "leadershipPeopleManagement",
            label: "Liderazgo y dirección de personas",
            weight: 0.24,
            description:
              "Evalúa experiencia liderando equipos, supervisando personal, dando seguimiento al desempeño, gestionando clima y desarrollando colaboradores.",
          },
          {
            key: "commercialOperationsManagement",
            label: "Gestión comercial y operativa",
            weight: 0.2,
            description:
              "Evalúa capacidad para supervisar resultados comerciales, dar seguimiento a casos, apoyar cierres, gestionar cartera y asegurar continuidad operativa.",
          },
          {
            key: "administrativeControl",
            label: "Control administrativo y documental",
            weight: 0.18,
            description:
              "Evalúa experiencia en caja, expedientes, garantías, reportes, auditoría, documentación, cumplimiento y control de procesos.",
          },
          {
            key: "customerConflictManagement",
            label: "Servicio al cliente y manejo de conflictos",
            weight: 0.14,
            description:
              "Evalúa manejo de clientes difíciles, quejas, objeciones, reclamaciones y situaciones críticas con calma y profesionalismo.",
          },
          {
            key: "strategicJudgement",
            label: "Criterio gerencial e indicadores",
            weight: 0.14,
            description:
              "Evalúa pensamiento analítico, uso de KPIs, reportes, toma de decisiones, mejora continua y criterio gerencial.",
          },
          {
            key: "communicationProfessionalism",
            label: "Comunicación y profesionalismo",
            weight: 0.1,
            description:
              "Evalúa comunicación, inteligencia emocional, madurez, presencia ejecutiva, orden y alineación con políticas internas.",
          },
        ],

        thresholds: {
          autoRejectScore: 50,
          autoInterviewScore: 76,
          autoPoolMinScore: 60,
        },

        hardFilters: [
          {
            key: "minimumExperience",
            type: "minimumExperience",
            value: 5,
            onFail: "REVIEW",
          },
          {
            key: "requiredEducation",
            type: "requiredField",
            field: "educationLevel",
            onFail: "REVIEW",
          },
          {
            key: "requiredSpanish",
            type: "requiredLanguage",
            language: "Español",
            minLevel: "Intermedio",
            onFail: "REVIEW",
          },
          {
            key: "peopleManagementExperience",
            type: "requiredField",
            field: "peopleManagementExperience",
            onFail: "REVIEW",
          },
          {
            key: "teamSizeManaged",
            type: "requiredField",
            field: "teamSizeManaged",
            onFail: "REVIEW",
          },
        ],

        decisionPolicy: {
          requireAllMustHaves: true,
          allowInterviewIfMissingInfo: true,
          maxCriticalRiskFlags: 1,
          minimumCriterionScores: {
            leadershipPeopleManagement: 60,
            commercialOperationsManagement: 55,
            administrativeControl: 50,
            customerConflictManagement: 50,
          },
        },

        interviewConfig: {
          autoSchedule: false,
          defaultMode: "Presencial",
          defaultLocation: "Sucursal principal / Oficina administrativa",
          defaultEvaluators: [],
        },

        promptConfig: {
          systemStyle: "professional",
          maxStrengths: 5,
          maxWeaknesses: 5,
          maxRiskFlags: 5,
        },
      },
    },
  ];

  for (const agentData of agents) {
    const configChecksum = buildChecksum(agentData.config);

    await AiAgent.findOneAndUpdate(
      { code: agentData.code, isDeleted: false },
      {
        $set: {
          name: agentData.name,
          type: agentData.type,
          description: agentData.description,
          provider: agentData.provider,
          model: agentData.model,
          temperature: agentData.temperature,
          maxTokens: agentData.maxTokens,
          version: agentData.version,
          config: agentData.config,
          configChecksum,
          isActive: agentData.isActive,
          isDeleted: false,
        },
        $setOnInsert: {
          code: agentData.code,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  console.log(
    "✅ Agentes de reclutamiento actualizados: Oficial de Negocios y Gerente de Sucursal",
  );
};
