import SalaryType from "../model/employee-payment-management/salaryType";
import PaymentSchedule from "../model/employee-payment-management/paymentSchedule";
import PunchTypes from "../model/punch/punchTypes"; // o como lo tengas
import Roles from "../model/role";
import { JobPosition } from "../model/rrhh/jobPosition";

export type AuditEntityType =
  | "User"
  | "Expedient"
  | "RecruitmentApplication"
  | "PaymentPeriod"
  | "Other";

export type TitleRule = {
  when: (paths: string[]) => boolean;
  title: string;
  tags: string[];
};

export type AuditEntityConfig = {
  ignorePaths: Set<string>;
  sensitivePrefixes: string[];
  labelByPath: Record<string, string>;
  titleRules: TitleRule[];
  refPaths: any;
};

// ✅ defaults globales (para todas las entidades)
const DEFAULT_IGNORE = new Set<string>([
  "__v",
  "password",
  "createdAt",
  "updatedAt",
  "created_at",
  "updated_at",
]);

const dayLabels: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const scheduleFieldLabels: Record<string, string> = {
  isActive: "Trabaja",
  hasLunchTime: "Tiene almuerzo",
  entryTime: "Hora entrada",
  lunchStartTime: "Inicio almuerzo",
  lunchEndTime: "Fin almuerzo",
  exitTime: "Hora salida",
  workHours: "Horas del día",
};

// Genera: schedule.lunes.entryTime => "Lunes · Hora entrada"
const scheduleLabels = Object.fromEntries(
  Object.keys(dayLabels).flatMap((day) =>
    Object.keys(scheduleFieldLabels).map((field) => [
      `schedule.${day}.${field}`,
      `${dayLabels[day]} · ${scheduleFieldLabels[field]}`,
    ]),
  ),
);

export const AUDIT_CONFIG: Record<AuditEntityType, AuditEntityConfig> = {
  User: {
    ignorePaths: new Set(DEFAULT_IGNORE),
    sensitivePrefixes: [
      // "payrollBank.accountNumber",
      // "payrollBank.idNumber",
      // "nationalId",
    ],
    labelByPath: {
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      address: "Dirección",
      department: "Departamento",
      jobPosition: "Puesto",
      project: "Proyecto",
      hiringDate: "Fecha contratación",
      terminationDate: "Fecha salida",
      ext: "Extensión",
      isActived: "Estado",
      salaryType: "Tipo salario",
      baseSalary: "Sueldo base",
      hourlyRate: "Tarifa por hora",
      paymentSchedule: "Frecuencia de pago",
      img: "Foto",
      weeklyWorkHours: "Horas semanales de trabajo",

      "payrollBank.enabled": "Banco habilitado",
      "payrollBank.accountNumber": "Cuenta bancaria",
      "payrollBank.operationCode": "Código operación",
      "payrollBank.bankCode": "Código banco",
      "payrollBank.bankDigit": "Dígito banco",
      "payrollBank.currency": "Moneda",
      "payrollBank.idType": "Tipo ID",
      "payrollBank.idNumber": "Número ID",
      ...scheduleLabels,
    },
    titleRules: [
      {
        when: (paths) => paths.some((p) => p.startsWith("payrollBank.")),
        title: "Actualizó datos bancarios",
        tags: ["payrollBank", "sensitive"],
      },
      {
        when: (paths) => paths.some((p) => p.startsWith("schedule.")),
        title: "Actualizó horario",
        tags: ["schedule"],
      },
      {
        when: (paths) =>
          paths.some((p) =>
            [
              "salaryType",
              "baseSalary",
              "hourlyRate",
              "paymentSchedule",
            ].includes(p),
          ),
        title: "Actualizó datos salariales",
        tags: ["payroll", "salary"],
      },
      {
        when: (paths) =>
          paths.some((p) =>
            ["department", "jobPosition", "project", "ext"].includes(p),
          ),
        title: "Actualizó datos laborales",
        tags: ["hr"],
      },
    ],
    refPaths: {
      jobPosition: {
        model: JobPosition,
        select: "name",
        buildLabel: (d: any) => d?.name || "",
        snapshotFields: ["name"],
      },
      salaryType: {
        model: SalaryType,
        select: "name code",
        buildLabel: (d: any) => d?.name || d?.code || "",
        snapshotFields: ["name", "code"],
      },
      paymentSchedule: {
        model: PaymentSchedule,
        select: "name code",
        buildLabel: (d: any) => d?.name || d?.code || "",
        snapshotFields: ["name", "code"],
      },
      punchTypeId: {
        model: PunchTypes,
        select: "name code",
        buildLabel: (d: any) => d?.name || d?.code || "",
        snapshotFields: ["name", "code"],
      },
      rol: {
        model: Roles,
        select: "name code",
        buildLabel: (d: any) => d?.name || d?.code || "",
        snapshotFields: ["name", "code"],
      },
    },
  },

  Expedient: {
    ignorePaths: new Set(DEFAULT_IGNORE),
    sensitivePrefixes: [
      // si en expedient guardas cosas sensibles, las pones aquí
      // ejemplo: "classification.sections.identificacion.cedula.number"
    ],
    labelByPath: {
      status: "Estado del expediente",
      notes: "Notas",
      requiredTotal: "Docs requeridos",
      requiredCompleted: "Docs completos",
      "classification.expedientCode": "Código expediente",
      "classification.owner": "Owner",
      "classification.notes": "Notas expediente",
      updatedBy: "Actualizado por",
      // Puedes dejar paths dinámicos sin label y caerán en el path
    },
    titleRules: [
      {
        when: (paths) => paths.some((p) => p.startsWith("classification.")),
        title: "Actualizó expediente",
        tags: ["expedient", "classification"],
      },
      {
        when: (paths) => paths.some((p) => p === "status"),
        title: "Cambió estado del expediente",
        tags: ["expedient", "status"],
      },
      {
        when: (paths) =>
          paths.some((p) => p.startsWith("classification.sections.")),
        title: "Actualizó documentos del expediente",
        tags: ["expedient", "documents"],
      },
    ],
    refPaths: {},
  },

  RecruitmentApplication: {
    ignorePaths: new Set(DEFAULT_IGNORE),
    sensitivePrefixes: [],
    labelByPath: {},
    titleRules: [],
    refPaths: {},
  },

  PaymentPeriod: {
    ignorePaths: new Set(DEFAULT_IGNORE),
    sensitivePrefixes: [],
    labelByPath: {},
    titleRules: [],
    refPaths: {},
  },

  Other: {
    ignorePaths: new Set(DEFAULT_IGNORE),
    sensitivePrefixes: [],
    labelByPath: {},
    titleRules: [],
    refPaths: {},
  },
};

export function getAuditConfig(entityType: AuditEntityType): AuditEntityConfig {
  return AUDIT_CONFIG[entityType] || AUDIT_CONFIG.Other;
}