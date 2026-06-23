import moment from "moment-timezone";
import bcrypt from "bcrypt";
import User from "../model/account/user";
import Role from "../model/role";
import Company from "../model/company";
import Department from "../model/rrhh/department";
import { JobPosition } from "../model/rrhh/jobPosition";
import SalaryType from "../model/employee-payment-management/salaryType";
import PaymentSchedule from "../model/employee-payment-management/paymentSchedule";
import PunchType from "../model/punch/punchTypes";
import WorkSummary from "../model/punch/workSummary";
import PunchHistory, { PunchStep } from "../model/punch/puncHistory";

const TZ = "America/Santo_Domingo";

const DAY_KEYS: Record<number, string> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};

const STEP_TIME_FIELD: Record<PunchStep, string> = {
  entrada: "entryTime",
  salida_almuerzo: "lunchStartTime",
  entrada_almuerzo: "lunchEndTime",
  salida: "exitTime",
};

const STEP_ORDER: PunchStep[] = [
  "entrada",
  "salida_almuerzo",
  "entrada_almuerzo",
  "salida",
];

const toNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getDateFromTime = (dateString: string, time: string, minutesOffset = 0) => {
  const safeTime = String(time || "08:00").slice(0, 5);

  return moment
    .tz(`${dateString} ${safeTime}`, "YYYY-MM-DD HH:mm", TZ)
    .add(minutesOffset, "minutes")
    .toDate();
};

const getExpectedSteps = (punchType: any, daySchedule: any): PunchStep[] => {
  const configured = Array.isArray(punchType?.expectedPunches)
    ? punchType.expectedPunches
    : [];

  return STEP_ORDER.filter((step) => {
    if (!configured.includes(step)) return false;

    const field = STEP_TIME_FIELD[step];
    return Boolean(daySchedule?.[field]);
  });
};

const getWorkedMinutes = (daySchedule: any) => {
  const entry = moment(`2000-01-01 ${daySchedule.entryTime}`, "YYYY-MM-DD HH:mm");
  const exit = moment(`2000-01-01 ${daySchedule.exitTime}`, "YYYY-MM-DD HH:mm");

  let minutes = Math.max(0, exit.diff(entry, "minutes"));

  if (daySchedule.hasLunchTime && daySchedule.lunchStartTime && daySchedule.lunchEndTime) {
    const lunchStart = moment(
      `2000-01-01 ${daySchedule.lunchStartTime}`,
      "YYYY-MM-DD HH:mm",
    );
    const lunchEnd = moment(
      `2000-01-01 ${daySchedule.lunchEndTime}`,
      "YYYY-MM-DD HH:mm",
    );

    minutes = Math.max(0, minutes - Math.max(0, lunchEnd.diff(lunchStart, "minutes")));
  }

  return minutes;
};

const getBusinessDates = (days: number) => {
  const dates: string[] = [];
  const cursor = moment.tz(TZ).startOf("day");

  while (dates.length < days) {
    const day = cursor.day();

    if (day !== 0 && day !== 6) {
      dates.unshift(cursor.format("YYYY-MM-DD"));
    }

    cursor.subtract(1, "day");
  }

  return dates;
};

const getDateRange = (from: string, to: string) => {
  const dates: string[] = [];
  const cursor = moment.tz(from, "YYYY-MM-DD", TZ).startOf("day");
  const end = moment.tz(to, "YYYY-MM-DD", TZ).startOf("day");

  while (cursor.isSameOrBefore(end, "day")) {
    const day = cursor.day();

    if (day !== 0 && day !== 6) {
      dates.push(cursor.format("YYYY-MM-DD"));
    }

    cursor.add(1, "day");
  }

  return dates;
};

const createStandardSchedule = () => {
  const workDay = {
    isActive: true,
    hasLunchTime: true,
    entryTime: "08:00",
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    exitTime: "17:00",
  };

  const offDay = {
    isActive: false,
    hasLunchTime: false,
    entryTime: "",
    lunchStartTime: "",
    lunchEndTime: "",
    exitTime: "",
  };

  return {
    lunes: { ...workDay },
    martes: { ...workDay },
    miercoles: { ...workDay },
    jueves: { ...workDay },
    viernes: { ...workDay },
    sabado: { ...offDay },
    domingo: { ...offDay },
  };
};

const calculateScheduleTotals = (schedule: any) => {
  const totalWeeklyMinutes = Number(Object.values(schedule).reduce(
    (total: number, day: any) => {
      if (!day?.isActive || !day.entryTime || !day.exitTime) return total;
      return total + getWorkedMinutes(day);
    },
    0,
  ));

  return {
    totalWeeklyMinutes,
    totalWeeklyHours: round2(totalWeeklyMinutes / 60),
  };
};

const round2 = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const buildPayrollBank = (index: number, name: string) => {
  const accountNumber = `96000000${String(index + 1).padStart(4, "0")}`;

  return {
    enabled: true,
    accountNumber,
    accountType: "2",
    currency: "214",
    bankCode: "10101070",
    bankDigit: "8",
    operationCode: "32",
    idType: "RN",
    idNumber: `001${String(9000000 + index).padStart(8, "0")}1`,
    beneficiaryName: name,
    referenceNumber: `DEMOQ${String(index + 1).padStart(4, "0")}`.slice(0, 12),
    statementDescription: "NOMINA",
    contactMethod: "1",
    emailBenef: `demo.quincenal.${index + 1}@bts.test`,
    faxOrPhoneBenef: "",
    acquirerId: "00",
    dueDate4: "",
  };
};

const ensureDemoBiweeklyEmployees = async (count: number) => {
  const [role, salaryType, paymentSchedule, punchType, company, department, jobPosition] =
    await Promise.all([
      Role.findOne({ code: "EMPLOYEE" }).lean(),
      SalaryType.findOne({ code: "FIJO" }).lean(),
      PaymentSchedule.findOne({ code: "QUINCENAL_15_30" }).lean(),
      PunchType.findOne({ code: "4-punch" }).lean(),
      Company.findOne({ isDeleted: false }).sort({ isDefault: -1, createdAt: 1 }).lean(),
      Department.findOne({ isDeleted: false }).sort({ createdAt: 1 }).lean(),
      JobPosition.findOne({ isDeleted: false }).sort({ createdAt: 1 }).lean(),
    ]);

  if (!role?._id) throw new Error("No existe rol EMPLOYEE.");
  if (!salaryType?._id) throw new Error("No existe SalaryType FIJO.");
  if (!paymentSchedule?._id) {
    throw new Error("No existe PaymentSchedule QUINCENAL_15_30.");
  }
  if (!punchType?._id) throw new Error("No existe PunchType 4-punch.");

  const schedule = createStandardSchedule();
  const totals = calculateScheduleTotals(schedule);
  const password = await bcrypt.hash("Demo1234!", 10);
  const employees: any[] = [];

  for (let index = 0; index < count; index++) {
    const number = index + 1;
    const name = `Empleado Demo Quincenal ${String(number).padStart(2, "0")}`;
    const email = `demo.quincenal.${number}@bts.test`;
    const baseSalary = 28000 + index * 1250;
    const payrollBank = buildPayrollBank(index, name);

    const payload: any = {
      name,
      email,
      phone: `809555${String(1200 + index).padStart(4, "0")}`,
      password,
      img: "",
      isActived: true,
      isDeleted: false,
      rol: role._id,
      code: `DEMOQ${String(number).padStart(3, "0")}`,
      code_punch: `DEMOQ${String(number).padStart(3, "0")}`,
      document: payrollBank.idNumber,
      idNumber: payrollBank.idNumber,
      contract: "INDEFINIDO",
      hiringDate: "2026-01-15T00:00:00.000Z",
      salaryType: salaryType._id,
      paymentSchedule: paymentSchedule._id,
      baseSalary,
      schedule,
      punchTypeId: punchType._id,
      payrollBank,
      employmentStatus: "ACTIVE",
      weeklyWorkHours: totals.totalWeeklyHours,
      totalWeeklyMinutes: totals.totalWeeklyMinutes,
      totalWeeklyHours: totals.totalWeeklyHours,
      updated_at: new Date().toISOString(),
    };

    if (company?._id) payload.company = company._id;
    if (department?._id) payload.department = department._id;
    if (jobPosition?._id) payload.jobPosition = jobPosition._id;

    const employee = await User.findOneAndUpdate(
      { email },
      {
        $set: payload,
        $setOnInsert: {
          created_at: new Date().toISOString(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    employees.push(employee.toObject());
  }

  return employees;
};

export const seedDemoPunches = async () => {
  const enabled = String(process.env.RUN_DEMO_PUNCH_SEED || "")
    .trim()
    .toLowerCase();

  if (enabled !== "true") {
    console.log(
      "Seeder de ponches demo omitido. Usa RUN_DEMO_PUNCH_SEED=true para ejecutarlo.",
    );
    return;
  }

  const employeeLimit = Math.max(
    1,
    Math.min(25, toNumber(process.env.DEMO_PUNCH_EMPLOYEE_LIMIT, 8)),
  );
  const daysToGenerate = Math.max(
    1,
    Math.min(30, toNumber(process.env.DEMO_PUNCH_DAYS, 7)),
  );
  const createEmployees = String(process.env.DEMO_PUNCH_CREATE_EMPLOYEES || "")
    .trim()
    .toLowerCase() === "true";
  const employeeCreateCount = Math.max(
    1,
    Math.min(50, toNumber(process.env.DEMO_PUNCH_CREATE_EMPLOYEE_COUNT, 12)),
  );

  if (createEmployees) {
    await ensureDemoBiweeklyEmployees(employeeCreateCount);
  }

  const employeeQuery: any = {
    isDeleted: false,
    isActived: true,
    employmentStatus: { $ne: "TERMINATED" },
    punchTypeId: { $exists: true, $ne: null },
  };

  if (createEmployees) {
    employeeQuery.email = /^demo\.quincenal\.\d+@bts\.test$/;
  }

  const employees: any[] = await User.find(employeeQuery)
    .select("_id name schedule punchTypeId")
    .sort({ name: 1 })
    .limit(createEmployees ? employeeCreateCount : employeeLimit)
    .lean();

  const punchTypeIds = employees
    .map((employee) => employee.punchTypeId)
    .filter(Boolean);

  const punchTypes = await PunchType.find({
    _id: { $in: punchTypeIds },
    isDeleted: { $ne: true },
  }).lean();

  const punchTypeById = new Map(
    punchTypes.map((punchType: any) => [String(punchType._id), punchType]),
  );

  const fromDate = String(process.env.DEMO_PUNCH_FROM || "").trim();
  const toDate = String(process.env.DEMO_PUNCH_TO || "").trim();
  const dates =
    fromDate && toDate ? getDateRange(fromDate, toDate) : getBusinessDates(daysToGenerate);
  let workSummaries = 0;
  let punches = 0;

  for (const employee of employees) {
    const punchType = punchTypeById.get(String(employee.punchTypeId));

    if (!punchType) continue;

    for (const dateString of dates) {
      const date = moment.tz(dateString, "YYYY-MM-DD", TZ).startOf("day").toDate();
      const dayKey = DAY_KEYS[moment.tz(dateString, "YYYY-MM-DD", TZ).day()];
      const daySchedule = employee.schedule?.[dayKey];

      if (!daySchedule?.isActive || !daySchedule.entryTime || !daySchedule.exitTime) {
        continue;
      }

      const expectedSteps = getExpectedSteps(punchType, daySchedule);

      if (!expectedSteps.length) continue;

      const expectedMinutes = getWorkedMinutes(daySchedule);

      const workSummary: any = await WorkSummary.findOneAndUpdate(
        {
          user: employee._id,
          dateString,
          date,
          isDeleted: false,
        },
        {
          $set: {
            user: employee._id,
            date,
            dateString,
            totalMinutes: expectedMinutes,
            expectedMinutes,
            approvedMinutes: expectedMinutes,
            notWorkedMinutes: 0,
            payImpact: "NONE",
            discountOverride: "AUTO",
            isIncomplete: false,
            punchSteps: expectedSteps,
            missingSteps: [],
            scheduledExitTime: daySchedule.exitTime,
            realEntryTime: daySchedule.entryTime,
            realExitTime: daySchedule.exitTime,
            classification: "Trabajo regular",
            confirmedToPay: true,
            lateTime: 0,
            isActive: true,
            isDeleted: false,
            isPaid: false,
            autoClosedReason:
              "Registro demo generado para simular asistencia normal.",
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      workSummaries++;

      for (const step of expectedSteps) {
        const expectedTime = daySchedule[STEP_TIME_FIELD[step]];
        const timestamp = getDateFromTime(dateString, expectedTime, 0);

        await PunchHistory.findOneAndUpdate(
          {
            user: employee._id,
            date: dateString,
            punchStep: step,
            isDeleted: false,
          },
          {
            $set: {
              user: employee._id,
              punchType: employee.punchTypeId,
              punchStep: step,
              timestamp,
              date: dateString,
              expectedTime,
              isLate: false,
              lateTime: 0,
              workSummary: workSummary._id,
              img: "",
              isDeleted: false,
            },
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
          },
        );

        punches++;
      }
    }
  }

  console.log(
    `Ponches demo listos: ${workSummaries} WorkSummary y ${punches} PunchHistory.`,
  );
};
