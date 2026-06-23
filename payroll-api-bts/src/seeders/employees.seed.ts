import mongoose, { Types } from "mongoose";

import User from "../model/account/user";
import Role from "../model/role";
import SalaryType from "../model/employee-payment-management/salaryType";
import PaymentSchedule from "../model/employee-payment-management/paymentSchedule";

type SalaryTypeCode =
  | "FIJO"
  | "HORAS"
  | "COMISION"
  | "FIJO_COMISION"
  | "JORNAL_DIARIO"
  | "VARIABLE"
  | "POR_TAREA";

type PaymentScheduleCode =
  | "MENSUAL_DIA_30"
  | "MENSUAL_DIA_15"
  | "QUINCENAL_15_30"
  | "QUINCENAL_15_ULTIMO"
  | "SEMANAL_VIERNES"
  | "SEMANAL_SABADO"
  | "BISEMANAL_VIERNES"
  | "DIARIO";

type ScheduleDayName =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

interface EmployeeScheduleDay {
  isActive: boolean;
  hasLunchTime: boolean;
  entryTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  exitTime: string;
}

interface EmployeeSeedConfig {
  name: string;
  email: string;
  phone: string;
  code: string;
  punchCode: string;
  idNumber: string;
  address: string;

  salaryTypeCode: SalaryTypeCode;
  paymentScheduleCode: PaymentScheduleCode;

  baseSalary?: number;
  hourlyRate?: number;

  hiringDate: string;
  schedule: Record<ScheduleDayName, EmployeeScheduleDay>;

  departmentIndex?: number;
  jobPositionIndex?: number;
  projectIndex?: number;

  operatorNameNumber?: string;
  extension?: string;
}

const EMPLOYEE_PASSWORD = process.env.SEED_EMPLOYEE_PASSWORD || "Empleado123*";

const isTrue = (value: unknown) => {
  return (
    String(value || "")
      .trim()
      .toLowerCase() === "true"
  );
};

const inactiveDay = (): EmployeeScheduleDay => ({
  isActive: false,
  hasLunchTime: false,
  entryTime: "",
  exitTime: "",
});

const activeDay = ({
  entryTime,
  exitTime,
  lunchStartTime,
  lunchEndTime,
}: {
  entryTime: string;
  exitTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
}): EmployeeScheduleDay => {
  const hasLunchTime = Boolean(lunchStartTime && lunchEndTime);

  return {
    isActive: true,
    hasLunchTime,
    entryTime,
    exitTime,
    ...(hasLunchTime
      ? {
          lunchStartTime,
          lunchEndTime,
        }
      : {}),
  };
};

const createStandardSchedule = () => ({
  lunes: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "17:00",
  }),
  martes: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "17:00",
  }),
  miercoles: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "17:00",
  }),
  jueves: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "17:00",
  }),
  viernes: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "17:00",
  }),
  sabado: inactiveDay(),
  domingo: inactiveDay(),
});

const createEarlySchedule = () => ({
  lunes: activeDay({
    entryTime: "07:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  martes: activeDay({
    entryTime: "07:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  miercoles: activeDay({
    entryTime: "07:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  jueves: activeDay({
    entryTime: "07:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  viernes: activeDay({
    entryTime: "07:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  sabado: inactiveDay(),
  domingo: inactiveDay(),
});

const createHourlySchedule = () => ({
  lunes: activeDay({
    entryTime: "09:00",
    exitTime: "14:00",
  }),
  martes: activeDay({
    entryTime: "09:00",
    exitTime: "14:00",
  }),
  miercoles: activeDay({
    entryTime: "09:00",
    exitTime: "14:00",
  }),
  jueves: activeDay({
    entryTime: "09:00",
    exitTime: "14:00",
  }),
  viernes: activeDay({
    entryTime: "09:00",
    exitTime: "14:00",
  }),
  sabado: activeDay({
    entryTime: "09:00",
    exitTime: "14:00",
  }),
  domingo: inactiveDay(),
});

const createSixDaySchedule = () => ({
  lunes: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  martes: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  miercoles: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  jueves: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  viernes: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  sabado: activeDay({
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "16:00",
  }),
  domingo: inactiveDay(),
});

const createLateSchedule = () => ({
  lunes: activeDay({
    entryTime: "10:00",
    lunchStartTime: "14:00",
    lunchEndTime: "15:00",
    exitTime: "19:00",
  }),
  martes: activeDay({
    entryTime: "10:00",
    lunchStartTime: "14:00",
    lunchEndTime: "15:00",
    exitTime: "19:00",
  }),
  miercoles: activeDay({
    entryTime: "10:00",
    lunchStartTime: "14:00",
    lunchEndTime: "15:00",
    exitTime: "19:00",
  }),
  jueves: activeDay({
    entryTime: "10:00",
    lunchStartTime: "14:00",
    lunchEndTime: "15:00",
    exitTime: "19:00",
  }),
  viernes: activeDay({
    entryTime: "10:00",
    lunchStartTime: "14:00",
    lunchEndTime: "15:00",
    exitTime: "19:00",
  }),
  sabado: inactiveDay(),
  domingo: inactiveDay(),
});

const employeeSeeds: EmployeeSeedConfig[] = [
  {
    name: "Prueba Desvinculación - Fijo Estable",
    email: "termination.fixed.stable@bts.test",
    phone: "8095551001",
    code: "EMP-TERM-001",
    punchCode: "TERM001",
    idNumber: "00100000001",
    address: "Santo Domingo, República Dominicana",
    salaryTypeCode: "FIJO",
    paymentScheduleCode: "QUINCENAL_15_30",
    baseSalary: 30000,
    hiringDate: "2021-02-01",
    schedule: createStandardSchedule(),
    departmentIndex: 0,
    jobPositionIndex: 0,
    projectIndex: 0,
    operatorNameNumber: "OP-TERM-001",
    extension: "201",
  },
  {
    name: "Prueba Desvinculación - Fijo Actual",
    email: "termination.fixed.current@bts.test",
    phone: "8095551002",
    code: "EMP-TERM-002",
    punchCode: "TERM002",
    idNumber: "00100000002",
    address: "Santo Domingo Este, República Dominicana",
    salaryTypeCode: "FIJO",
    paymentScheduleCode: "MENSUAL_DIA_30",
    baseSalary: 36000,
    hiringDate: "2022-06-15",
    schedule: createEarlySchedule(),
    departmentIndex: 1,
    jobPositionIndex: 1,
    projectIndex: 0,
    operatorNameNumber: "OP-TERM-002",
    extension: "202",
  },
  {
    name: "Prueba Desvinculación - Horas Variables",
    email: "termination.hourly.variable@bts.test",
    phone: "8095551003",
    code: "EMP-TERM-003",
    punchCode: "TERM003",
    idNumber: "00100000003",
    address: "Distrito Nacional, República Dominicana",
    salaryTypeCode: "HORAS",
    paymentScheduleCode: "SEMANAL_VIERNES",
    hourlyRate: 250,
    hiringDate: "2023-01-10",
    schedule: createHourlySchedule(),
    departmentIndex: 2,
    jobPositionIndex: 2,
    projectIndex: 1,
    operatorNameNumber: "OP-TERM-003",
    extension: "203",
  },
  {
    name: "Prueba Desvinculación - Solo Comisión",
    email: "termination.commission.only@bts.test",
    phone: "8095551004",
    code: "EMP-TERM-004",
    punchCode: "TERM004",
    idNumber: "00100000004",
    address: "Santiago, República Dominicana",
    salaryTypeCode: "COMISION",
    paymentScheduleCode: "QUINCENAL_15_30",
    hiringDate: "2020-09-05",
    schedule: createLateSchedule(),
    departmentIndex: 3,
    jobPositionIndex: 3,
    projectIndex: 1,
    operatorNameNumber: "OP-TERM-004",
    extension: "204",
  },
  {
    name: "Prueba Desvinculación - Fijo Más Comisión",
    email: "termination.fixed.commission@bts.test",
    phone: "8095551005",
    code: "EMP-TERM-005",
    punchCode: "TERM005",
    idNumber: "00100000005",
    address: "La Vega, República Dominicana",
    salaryTypeCode: "FIJO_COMISION",
    paymentScheduleCode: "QUINCENAL_15_30",
    baseSalary: 20000,
    hiringDate: "2024-03-01",
    schedule: createStandardSchedule(),
    departmentIndex: 3,
    jobPositionIndex: 4,
    projectIndex: 2,
    operatorNameNumber: "OP-TERM-005",
    extension: "205",
  },
  {
    name: "Prueba Desvinculación - Ingreso Variable",
    email: "termination.variable@bts.test",
    phone: "8095551006",
    code: "EMP-TERM-006",
    punchCode: "TERM006",
    idNumber: "00100000006",
    address: "San Cristóbal, República Dominicana",
    salaryTypeCode: "VARIABLE",
    paymentScheduleCode: "MENSUAL_DIA_30",
    hiringDate: "2025-01-15",
    schedule: createStandardSchedule(),
    departmentIndex: 4,
    jobPositionIndex: 5,
    projectIndex: 2,
    operatorNameNumber: "OP-TERM-006",
    extension: "206",
  },
  {
    name: "Prueba Desvinculación - Jornal Diario",
    email: "termination.daily.worker@bts.test",
    phone: "8095551007",
    code: "EMP-TERM-007",
    punchCode: "TERM007",
    idNumber: "00100000007",
    address: "Boca Chica, República Dominicana",
    salaryTypeCode: "JORNAL_DIARIO",
    paymentScheduleCode: "DIARIO",
    hiringDate: "2025-06-01",
    schedule: createSixDaySchedule(),
    departmentIndex: 2,
    jobPositionIndex: 6,
    projectIndex: 3,
    operatorNameNumber: "OP-TERM-007",
    extension: "207",
  },
  {
    name: "Prueba Desvinculación - Pago Por Tarea",
    email: "termination.task.worker@bts.test",
    phone: "8095551008",
    code: "EMP-TERM-008",
    punchCode: "TERM008",
    idNumber: "00100000008",
    address: "Haina, República Dominicana",
    salaryTypeCode: "POR_TAREA",
    paymentScheduleCode: "BISEMANAL_VIERNES",
    hiringDate: "2026-01-05",
    schedule: createSixDaySchedule(),
    departmentIndex: 2,
    jobPositionIndex: 7,
    projectIndex: 3,
    operatorNameNumber: "OP-TERM-008",
    extension: "208",
  },
];

const parseTimeToMinutes = (value?: string) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return 0;

  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
};

const calculateScheduleTotals = (
  schedule: Record<ScheduleDayName, EmployeeScheduleDay>,
) => {
  const totalWeeklyMinutes = Object.values(schedule).reduce((total, day) => {
    if (!day?.isActive) return total;

    const entryMinutes = parseTimeToMinutes(day.entryTime);
    const exitMinutes = parseTimeToMinutes(day.exitTime);

    let workedMinutes = Math.max(0, exitMinutes - entryMinutes);

    if (day.hasLunchTime && day.lunchStartTime && day.lunchEndTime) {
      const lunchStartMinutes = parseTimeToMinutes(day.lunchStartTime);
      const lunchEndMinutes = parseTimeToMinutes(day.lunchEndTime);

      workedMinutes -= Math.max(0, lunchEndMinutes - lunchStartMinutes);
    }

    return total + Math.max(0, workedMinutes);
  }, 0);

  return {
    totalWeeklyMinutes,
    totalWeeklyHours:
      Math.round((totalWeeklyMinutes / 60 + Number.EPSILON) * 100) / 100,
  };
};

const getCompany = async () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("No existe una conexión activa con MongoDB.");
  }

  const configuredCompanyId = String(
    process.env.SEED_EMPLOYEE_COMPANY_ID || "",
  ).trim();

  if (configuredCompanyId) {
    if (!Types.ObjectId.isValid(configuredCompanyId)) {
      throw new Error(
        "SEED_EMPLOYEE_COMPANY_ID no contiene un ObjectId válido.",
      );
    }

    const company = await db.collection("companies").findOne({
      _id: new Types.ObjectId(configuredCompanyId),
      isDeleted: { $ne: true },
    });

    if (!company) {
      throw new Error(`No se encontró la compañía ${configuredCompanyId}.`);
    }

    return company;
  }

  const company = await db.collection("companies").findOne(
    {
      isDeleted: { $ne: true },
      $or: [
        { isActive: true },
        { isActived: true },
        {
          isActive: { $exists: false },
          isActived: { $exists: false },
        },
      ],
    },
    {
      sort: {
        createdAt: 1,
        _id: 1,
      },
    },
  );

  if (!company) {
    throw new Error(
      "No existe ninguna compañía activa. Ejecuta primero el seed de compañías o configura SEED_EMPLOYEE_COMPANY_ID.",
    );
  }

  return company;
};

const getRelatedDocuments = async ({
  collectionName,
  companyId,
  limit = 20,
}: {
  collectionName: string;
  companyId: Types.ObjectId;
  limit?: number;
}) => {
  const db = mongoose.connection.db;

  if (!db) return [];

  const byCompany = await db
    .collection(collectionName)
    .find({
      company: companyId,
      isDeleted: { $ne: true },
    })
    .sort({
      createdAt: 1,
      _id: 1,
    })
    .limit(limit)
    .toArray();

  if (byCompany.length) return byCompany;

  return db
    .collection(collectionName)
    .find({
      isDeleted: { $ne: true },
    })
    .sort({
      createdAt: 1,
      _id: 1,
    })
    .limit(limit)
    .toArray();
};

const getPunchTypes = async () => {
  const db = mongoose.connection.db;

  if (!db) return [];

  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();

  const collectionNames = collections.map((item) => item.name);

  const punchTypeCollectionName = [
    "punchtypes",
    "punch_types",
    "punchTypes",
  ].find((name) => collectionNames.includes(name));

  if (!punchTypeCollectionName) return [];

  return db
    .collection(punchTypeCollectionName)
    .find({
      isDeleted: { $ne: true },
    })
    .sort({
      createdAt: 1,
      _id: 1,
    })
    .limit(10)
    .toArray();
};

const resolveSalaryTypes = async () => {
  const requiredCodes = [
    ...new Set(employeeSeeds.map((item) => item.salaryTypeCode)),
  ];

  const salaryTypes = await SalaryType.find({
    code: {
      $in: requiredCodes,
    },
  }).lean();

  const salaryTypeMap = new Map(
    salaryTypes.map((item: any) => [String(item.code), item]),
  );

  const missingCodes = requiredCodes.filter((code) => !salaryTypeMap.has(code));

  if (missingCodes.length) {
    throw new Error(
      `Faltan los siguientes SalaryType: ${missingCodes.join(
        ", ",
      )}. Ejecuta primero seedSalaryTypes().`,
    );
  }

  return salaryTypeMap;
};

const paymentScheduleNames: Record<PaymentScheduleCode, string[]> = {
  MENSUAL_DIA_30: ["Pago mensual día 30", "Pago mensual dia 30"],
  MENSUAL_DIA_15: ["Pago mensual día 15", "Pago mensual dia 15"],
  QUINCENAL_15_30: ["Pagos los días 15 y 30", "Pagos los dias 15 y 30"],
  QUINCENAL_15_ULTIMO: [
    "Pagos los días 15 y último día del mes",
    "Pagos los dias 15 y ultimo dia del mes",
  ],
  SEMANAL_VIERNES: ["Pago semanal los viernes"],
  SEMANAL_SABADO: ["Pago semanal los sábados", "Pago semanal los sabados"],
  BISEMANAL_VIERNES: ["Pago bisemanal los viernes"],
  DIARIO: ["Pago diario"],
};

const resolvePaymentSchedules = async () => {
  const requiredCodes = [
    ...new Set(employeeSeeds.map((item) => item.paymentScheduleCode)),
  ];

  const paymentScheduleMap = new Map<string, any>();

  for (const code of requiredCodes) {
    const schedule = await PaymentSchedule.findOne({
      $or: [
        { code },
        {
          name: {
            $in: paymentScheduleNames[code] || [],
          },
        },
      ],
      isActive: { $ne: false },
    }).lean();

    if (schedule) {
      paymentScheduleMap.set(code, schedule);
    }
  }

  const missingCodes = requiredCodes.filter(
    (code) => !paymentScheduleMap.has(code),
  );

  if (missingCodes.length) {
    throw new Error(
      `Faltan los siguientes PaymentSchedule: ${missingCodes.join(
        ", ",
      )}. Ejecuta primero seedPaymentSchedules().`,
    );
  }

  return paymentScheduleMap;
};

const getDocumentByIndex = (documents: any[], index = 0) => {
  if (!documents.length) return null;

  return documents[index % documents.length] || documents[0];
};

const buildPayrollBank = ({
  employee,
  index,
}: {
  employee: EmployeeSeedConfig;
  index: number;
}) => {
  return {
    enabled: true,
    accountNumber: `960000000000000${String(index + 1).padStart(3, "0")}`,
    accountType: "2",
    currency: "214",
    bankCode: "10101070",
    bankDigit: "",
    operationCode: "32",
    idType: "CE",
    idNumber: employee.idNumber,
    referenceNumber: `TERM${String(index + 1).padStart(4, "0")}`,
    statementDescription: "NOMINA BTS TEST",
    contactMethod: "1",
    emailBenef: employee.email,
    faxOrPhoneBenef: employee.phone,
    acquirerId: "00",
  };
};

export const seedTestEmployees = async () => {
  /**
   * Este seed elimina usuarios empleados.
   * Requiere una bandera específica además de RUN_SEEDERS=true.
   */
  if (!isTrue(process.env.RESET_EMPLOYEE_USERS)) {
    console.log(
      "Seed de empleados omitido. Configura RESET_EMPLOYEE_USERS=true para borrar y recrear los empleados.",
    );
    return;
  }

  const employeeRole = await Role.findOne({
    code: "EMPLOYEE",
  });

  if (!employeeRole) {
    throw new Error(
      "No se encontró el rol EMPLOYEE. Ejecuta primero seedRoles().",
    );
  }

  const company = await getCompany();
  const companyId = company._id as Types.ObjectId;

  const salaryTypeMap = await resolveSalaryTypes();
  const paymentScheduleMap = await resolvePaymentSchedules();

  const departments = await getRelatedDocuments({
    collectionName: "departments",
    companyId,
  });

  const jobPositions = await getRelatedDocuments({
    collectionName: "jobpositions",
    companyId,
  });

  const projects = await getRelatedDocuments({
    collectionName: "projects",
    companyId,
  });

  const punchTypes = await getPunchTypes();

  /**
   * Solo elimina usuarios que tengan el rol EMPLOYEE.
   * No elimina administradores ni superadministradores.
   */
  const employeeUsersToDelete = await User.find({
    rol: employeeRole._id,
  })
    .select("_id email name")
    .lean();

  const deleteResult = await User.deleteMany({
    rol: employeeRole._id,
  });

  console.log(
    `Empleados eliminados antes del seed: ${deleteResult.deletedCount || 0}.`,
  );

  if (employeeUsersToDelete.length) {
    console.log(
      `Se eliminaron ${employeeUsersToDelete.length} usuarios con rol EMPLOYEE.`,
    );
  }

  const createdEmployees: any[] = [];

  for (let index = 0; index < employeeSeeds.length; index++) {
    const employeeConfig = employeeSeeds[index];

    const salaryType = salaryTypeMap.get(employeeConfig.salaryTypeCode);

    const paymentSchedule = paymentScheduleMap.get(
      employeeConfig.paymentScheduleCode,
    );

    if (!salaryType) {
      throw new Error(
        `No se encontró SalaryType ${employeeConfig.salaryTypeCode}.`,
      );
    }

    if (!paymentSchedule) {
      throw new Error(
        `No se encontró PaymentSchedule ${employeeConfig.paymentScheduleCode}.`,
      );
    }

    const department = getDocumentByIndex(
      departments,
      employeeConfig.departmentIndex,
    );

    const jobPosition = getDocumentByIndex(
      jobPositions,
      employeeConfig.jobPositionIndex,
    );

    const project = getDocumentByIndex(projects, employeeConfig.projectIndex);

    const punchType = getDocumentByIndex(punchTypes, index);

    const scheduleTotals = calculateScheduleTotals(employeeConfig.schedule);

    const employeePayload: any = {
      name: employeeConfig.name,
      email: employeeConfig.email,
      phone: employeeConfig.phone,
      password: EMPLOYEE_PASSWORD,

      img: "",
      document: "",
      contract: "",

      code: employeeConfig.code,
      code_punch: employeeConfig.punchCode,

      idNumber: employeeConfig.idNumber,
      address: employeeConfig.address,

      rol: employeeRole._id,
      company: companyId,

      salaryType: salaryType._id,
      paymentSchedule: paymentSchedule._id,

      schedule: employeeConfig.schedule,

      weeklyWorkHours: scheduleTotals.totalWeeklyHours,
      totalWeeklyMinutes: scheduleTotals.totalWeeklyMinutes,
      totalWeeklyHours: scheduleTotals.totalWeeklyHours,

      hiringDate: employeeConfig.hiringDate,
      terminationDate: "",

      payrollBank: buildPayrollBank({
        employee: employeeConfig,
        index,
      }),

      operatorNameNumber: employeeConfig.operatorNameNumber || "",
      ext: employeeConfig.extension || null,

      employmentStatus: "ACTIVE",
      terminationInfo: {
        lastTermination: null,
        terminationDate: "",
        terminationType: "",
        terminationReason: "",
        terminatedBy: null,
        terminatedAt: null,
      },

      probation: {
        enabled: false,
        startDate: employeeConfig.hiringDate,
        endDate: "",
        completedAt: new Date(),
      },

      isActived: true,
      isDeleted: false,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (employeeConfig.baseSalary !== undefined) {
      employeePayload.baseSalary = employeeConfig.baseSalary;
    }

    if (employeeConfig.hourlyRate !== undefined) {
      employeePayload.hourlyRate = employeeConfig.hourlyRate;
    }

    if (department?._id) {
      employeePayload.department = department._id;
    }

    if (jobPosition?._id) {
      employeePayload.jobPosition = jobPosition._id;
    }

    if (project?._id) {
      employeePayload.project = project._id;
    }

    if (punchType?._id) {
      employeePayload.punchTypeId = punchType._id;
    }

    /**
     * Se usa User.create individualmente para que se ejecute
     * el middleware pre("save") que encripta la contraseña.
     */
    const employee = await User.create(employeePayload);

    createdEmployees.push({
      id: String(employee._id),
      name: employee.name,
      email: employee.email,
      salaryType: employeeConfig.salaryTypeCode,
      paymentSchedule: employeeConfig.paymentScheduleCode,
      baseSalary: employeeConfig.baseSalary || 0,
      hourlyRate: employeeConfig.hourlyRate || 0,
      weeklyHours: scheduleTotals.totalWeeklyHours,
    });
  }

  console.log(
    `Seed de empleados ejecutado correctamente. Empleados creados: ${createdEmployees.length}.`,
  );

  console.table(createdEmployees);
};
