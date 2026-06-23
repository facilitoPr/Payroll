import { Types } from "mongoose";
import RecruitmentForm from "../model/recruitment/recruitment-form";

const OFFICIAL_JOB_POSITION_ID = "69ea7a597ca456291b753fb4";
const MANAGER_JOB_POSITION_ID = "69ea7a7d7ca456291b753fc1";

const OFFICIAL_AGENT_ID = "69ea7955506ec81f8d0995a8";
const MANAGER_AGENT_ID = "69ea7955506ec81f8d0995a9";

const field = (
  key: string,
  groupKey: string,
  order: number,
  requiredOverride?: boolean,
) => ({
  key,
  groupKey,
  order,
  ...(typeof requiredOverride === "boolean" ? { requiredOverride } : {}),
});

const OFICIAL_NEGOCIOS_FIELDS = [
  field("fullName", "step_1", 1, true),
  field("birthDate", "step_1", 2, true),
  field("nationality", "step_1", 3, true),
  field("idNumber", "step_1", 4, true),
  field("mobilePhone", "step_1", 5, true),
  field("alternatePhone", "step_1", 6),
  field("email", "step_1", 7, true),
  field("address", "step_1", 8, true),
  field("maritalStatus", "step_1", 9),
  field("hasDriverLicense", "step_1", 10, true),
  field("driverLicenseType", "step_1", 11),
  field("hasVehicle", "step_1", 12),

  field("department", "step_2", 13, true),
  field("scheduleAvailable", "step_2", 14, true),
  field("startDateAvailable", "step_2", 15, true),
  field("salaryExpectation", "step_2", 16),
  field("vacancySource", "step_2", 17),
  field("fieldWorkAvailability", "step_2", 18, true),
  field("timeAvailability", "step_2", 19),

  field("cv", "step_3", 20, true),
  field("idCopy", "step_3", 21, true),
  field("photoID", "step_3", 22),
  field("certificates", "step_3", 23),
  field("recommendationLetter", "step_3", 24),

  field("yearsExperience", "step_4", 25, true),
  field("companyName", "step_4", 26, true),
  field("positionHeld", "step_4", 27, true),
  field("countryCity", "step_4", 28, true),
  field("expStartDate", "step_4", 29, true),
  field("expEndDate", "step_4", 30),
  field("functionsDescription", "step_4", 31, true),
  field("mainAchievements", "step_4", 32),
  field("exitReason", "step_4", 33),
  field("supervisorContact", "step_4", 34),

  field("salesExperience", "step_4", 35, true),
  field("financialProductsExperience", "step_4", 36, true),
  field("dealerOrB2BExperience", "step_4", 37, true),
  field("vehicleKnowledge", "step_4", 38, true),

  field("educationLevel", "step_5", 39, true),
  field("degreeTitle", "step_5", 40, true),
  field("institution", "step_5", 41, true),
  field("educationCountry", "step_5", 42),
  field("extraCerts", "step_5", 43),

  field("languages", "step_6", 44, true),
  field("softwareTools", "step_6", 45, true),
  field("softSkills", "step_6", 46),
  field("techSkills", "step_6", 47),
  field("relevantCourses", "step_6", 48),

  field("willingToTravel", "step_7", 49),
  field("willingToRelocate", "step_7", 50),
  field("growthExpectations", "step_7", 51),

  field("refName", "step_8", 52),
  field("refRelation", "step_8", 53),
  field("refCompany", "step_8", 54),
  field("refPhone", "step_8", 55),
  field("refEmail", "step_8", 56),
  field("refTime", "step_8", 57),

  field("whyWorkHere", "step_9", 58, true),
  field("valueToAdd", "step_9", 59, true),
  field("biggestAchievement", "step_9", 60),
  field("otherProcesses", "step_9", 61),
  field("recentDismissal", "step_9", 62),

  field("refCheckAuth", "step_10", 63, true),
  field("dataUseConsent", "step_10", 64, true),
  field("infoTruthConfirm", "step_10", 65, true),
  field("digitalSignature", "step_10", 66, true),
  field("formDate", "step_10", 67, true),
];

const GERENTE_SUCURSAL_FIELDS = [
  field("fullName", "step_1", 1, true),
  field("birthDate", "step_1", 2, true),
  field("nationality", "step_1", 3, true),
  field("idNumber", "step_1", 4, true),
  field("mobilePhone", "step_1", 5, true),
  field("alternatePhone", "step_1", 6),
  field("email", "step_1", 7, true),
  field("address", "step_1", 8, true),
  field("maritalStatus", "step_1", 9),

  field("department", "step_2", 10, true),
  field("scheduleAvailable", "step_2", 11, true),
  field("startDateAvailable", "step_2", 12, true),
  field("salaryExpectation", "step_2", 13),
  field("vacancySource", "step_2", 14),
  field("timeAvailability", "step_2", 15),

  field("cv", "step_3", 16, true),
  field("idCopy", "step_3", 17, true),
  field("photoID", "step_3", 18),
  field("certificates", "step_3", 19),
  field("recommendationLetter", "step_3", 20),

  field("yearsExperience", "step_4", 21, true),
  field("companyName", "step_4", 22, true),
  field("positionHeld", "step_4", 23, true),
  field("countryCity", "step_4", 24, true),
  field("expStartDate", "step_4", 25, true),
  field("expEndDate", "step_4", 26),
  field("functionsDescription", "step_4", 27, true),
  field("mainAchievements", "step_4", 28),
  field("monthlySalaryOptional", "step_4", 29),
  field("exitReason", "step_4", 30),
  field("supervisorContact", "step_4", 31),

  field("peopleManagementExperience", "step_4", 32, true),
  field("teamSizeManaged", "step_4", 33, true),
  field("branchOperationsExperience", "step_4", 34, true),
  field("kpiManagementExperience", "step_4", 35, true),
  field("conflictManagementExperience", "step_4", 36, true),
  field("cashOrAdministrativeControlExperience", "step_4", 37, true),

  field("educationLevel", "step_5", 38, true),
  field("degreeTitle", "step_5", 39, true),
  field("institution", "step_5", 40, true),
  field("educationCountry", "step_5", 41),
  field("extraCerts", "step_5", 42),

  field("languages", "step_6", 43, true),
  field("softwareTools", "step_6", 44, true),
  field("softSkills", "step_6", 45),
  field("techSkills", "step_6", 46),
  field("relevantCourses", "step_6", 47),
  field("leadershipStyle", "step_6", 48, true),

  field("willingToTravel", "step_7", 49),
  field("willingToRelocate", "step_7", 50),
  field("growthExpectations", "step_7", 51),

  field("refName", "step_8", 52),
  field("refRelation", "step_8", 53),
  field("refCompany", "step_8", 54),
  field("refPhone", "step_8", 55),
  field("refEmail", "step_8", 56),
  field("refTime", "step_8", 57),

  field("whyWorkHere", "step_9", 58, true),
  field("valueToAdd", "step_9", 59, true),
  field("biggestAchievement", "step_9", 60),
  field("otherProcesses", "step_9", 61),
  field("recentDismissal", "step_9", 62),

  field("refCheckAuth", "step_10", 63, true),
  field("dataUseConsent", "step_10", 64, true),
  field("infoTruthConfirm", "step_10", 65, true),
  field("digitalSignature", "step_10", 66, true),
  field("formDate", "step_10", 67, true),
];

export const seedRecruitmentFormsForGuimanfer = async (
  createdByUserId: string,
) => {
  if (!Types.ObjectId.isValid(createdByUserId)) {
    throw new Error("createdByUserId no es un ObjectId válido.");
  }

  const createdBy = new Types.ObjectId(createdByUserId);

  const forms = [
    {
      title: "Formulario de Reclutamiento – Oficial de Negocios",
      publicToken: "recruitment_oficial_negocios_public_v1",
      description:
        "Formulario para evaluar candidatos al puesto de Oficial de Negocios. Este perfil requiere orientación comercial, negociación, seguimiento de expedientes, relación con dealers/clientes B2B, conocimiento de productos financieros, documentación vehicular, disponibilidad para trabajo de campo y cumplimiento de metas comerciales.",
      createdBy,
      jobPosition: new Types.ObjectId(OFFICIAL_JOB_POSITION_ID),
      aiAgent: new Types.ObjectId(OFFICIAL_AGENT_ID),
      autoAiEvaluation: true,
      isActive: true,
      isDeleted: false,
      documents: [],
      images: [],
      fields: OFICIAL_NEGOCIOS_FIELDS,
    },
    {
      title: "Formulario de Reclutamiento – Gerente de Sucursal",
      publicToken: "recruitment_gerente_sucursal_public_v1",
      description:
        "Formulario para evaluar candidatos al puesto de Gerente de Sucursal. Este perfil requiere liderazgo, manejo de personal, supervisión comercial, control administrativo y documental, gestión de cartera, manejo de conflictos, seguimiento de indicadores, servicio al cliente y capacidad para asegurar la operación integral de una sucursal.",
      createdBy,
      jobPosition: new Types.ObjectId(MANAGER_JOB_POSITION_ID),
      aiAgent: new Types.ObjectId(MANAGER_AGENT_ID),
      autoAiEvaluation: true,
      isActive: true,
      isDeleted: false,
      documents: [],
      images: [],
      fields: GERENTE_SUCURSAL_FIELDS,
    },
  ];

  for (const form of forms) {
    await RecruitmentForm.findOneAndUpdate(
      { publicToken: form.publicToken },
      {
        $set: {
          title: form.title,
          description: form.description,
          fields: form.fields,
          createdBy: form.createdBy,
          documents: form.documents,
          images: form.images,
          jobPosition: form.jobPosition,
          aiAgent: form.aiAgent,
          autoAiEvaluation: form.autoAiEvaluation,
          isActive: form.isActive,
          isDeleted: form.isDeleted,
        },
        $setOnInsert: {
          publicToken: form.publicToken,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  console.log(
    "✅ Formularios de reclutamiento creados/actualizados correctamente.",
  );
};
