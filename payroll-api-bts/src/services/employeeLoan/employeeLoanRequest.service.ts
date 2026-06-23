import mongoose, { Types } from "mongoose";
import EmployeeLoanProductConfig from "../../model/employeeLoan/employeeLoanProductConfig";
import VacationDayReservation from "../../model/vacation/VacationDayReservation";
import { recalculateVacationBalance } from "../../helper/employeeLoan/loanRequest/employeeLoanRequest.calculate";
import User from "../../model/account/user";
import EmployeeLoanPolicy from "../../model/employeeLoan/employeeLoanPolicy";
import {
  EMPLOYEE_LOAN_POLICY_CODE,
  PRINCIPAL_PRODUCT_CONFIG_API_KEY,
  PRINCIPAL_PRODUCT_CONFIG_URL,
  PRODUCT_CONFIG_SOURCE,
} from "../../constants/loan";
import { normalizeProductConfig } from "../../helper/normalize";
import { buildDefaultEmployeeLoanPolicyPayload } from "../../helper/employeeLoan/employeeLoanPolicy.build";
import VacationBalanceMovement from "../../model/vacation/VacationBalanceMovement";
import EmployeeVacationBalance from "../../model/vacation/EmployeeVacationBalance";
import { getAvailableDaysForLoan } from "../../helper/employeeLoan/loanRequest/employeeLoanRequest.get";
import { getEmployeeLoanPrincipalBootstrap, hasEmployeeLoanIntegrationConfiguration } from "../../helper/employeeLoan/loanIntegration/employeeLoanIntegration.principalApi";
import Company from "../../model/company";

export const getActiveLocalLoanProductConfig = async (
  session?: mongoose.ClientSession,
) => {
  const config = await EmployeeLoanProductConfig.findOne({
    isDefault: true,
    isActive: true,
    isDeleted: false,
  }).session(session || null);

  if (config) return config;

  return EmployeeLoanProductConfig.findOne({
    isActive: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .session(session || null);
};

export const loadEmployeeForLoan = async ({
  authUserId,
  session,
}: {
  authUserId: any;
  session?: mongoose.ClientSession;
}) => {
  return User.findOne({
    _id: authUserId,
    isDeleted: false,
  })
    .select(
      "name email document phone company department jobPosition project salary monthlySalary baseSalary fixedSalary grossSalary paymentAmount salaryAmount employeeSalary paymentSchedule paymentFrequency salaryType hiringDate idNumber address payrollBank.idNumber payrollBank.idNumber",
    )
    .populate("company", "legalName commercialName name code")
    .populate("department", "name code")
    .populate("jobPosition", "name code")
    .populate("project", "name code")
    .populate("salaryType", "name code")
    .populate({
      path: "paymentSchedule",
      populate: {
        path: "paymentFrequency",
        select: "name code",
      },
    })
    .session(session || null);
};

export const reserveVacationDaysForLoan = async ({
  loanRequest,
  employee,
  companyId,
  vacationBalance,
  year,
  guaranteedDays,
  authUserId,
  session,
}: {
  loanRequest: any;
  employee: any;
  companyId: Types.ObjectId | null;
  vacationBalance: any;
  year: number;
  guaranteedDays: number;
  authUserId: any;
  session: mongoose.ClientSession;
}) => {
  if (guaranteedDays <= 0) return null;

  const cleanGuaranteedDays = Math.max(
    0,
    Math.floor(Number(guaranteedDays || 0)),
  );

  const currentAvailableForLoanDays = getAvailableDaysForLoan(vacationBalance);

  if (cleanGuaranteedDays > currentAvailableForLoanDays) {
    throw {
      statusCode: 400,
      mensaje: `No tienes suficientes días disponibles para garantizar este préstamo. Disponible: ${currentAvailableForLoanDays}, solicitado: ${cleanGuaranteedDays}.`,
      message: "Not enough vacation days available for loan guarantee.",
      data: {
        availableForLoanDays: currentAvailableForLoanDays,
        guaranteedDays: cleanGuaranteedDays,
      },
    };
  }

  vacationBalance.reservedDays =
    Number(vacationBalance.reservedDays || 0) + cleanGuaranteedDays;

  recalculateVacationBalance(vacationBalance);

  await vacationBalance.save({ session });

  const reservations = await VacationDayReservation.create(
    [
      {
        balance: vacationBalance._id,
        user: employee._id,
        company: companyId,
        year,
        loanRequest: loanRequest._id,
        source: "EMPLOYEE_LOAN_REQUEST",
        sourceId: loanRequest._id,
        reservedDays: cleanGuaranteedDays,
        status: "ACTIVE",
        reason: `Garantía de préstamo ${loanRequest.requestNumber}`,
        createdBy: authUserId,
        isActive: true,
        isDeleted: false,
      },
    ],
    { session },
  );

  const vacationReservation = reservations[0];

  loanRequest.vacationReservation = vacationReservation._id;

  await loanRequest.save({ session });

  return vacationReservation;
};

export const findApplicableEmployeeLoanPolicy = async (
  companyId: Types.ObjectId | null,
  session?: mongoose.ClientSession,
) => {
  if (!companyId) return null;

  return EmployeeLoanPolicy.findOne({
    company: companyId,
    code: EMPLOYEE_LOAN_POLICY_CODE,
    isActive: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .session(session || null);
};

export const getEmployeeLoanPolicyOrThrow = async ({
  companyId,
  session,
}: {
  companyId: Types.ObjectId | null;
  session?: mongoose.ClientSession;
}) => {
  const policy = await findApplicableEmployeeLoanPolicy(companyId, session);

  if (!policy) {
    throw {
      statusCode: 404,
      mensaje: "No hay una política de préstamos para esta compañía.",
      message: "No employee loan policy found for this company.",
    };
  }

  if (policy.allowEmployeeLoanRequests !== true) {
    throw {
      statusCode: 400,
      mensaje:
        "Las solicitudes de préstamos están desactivadas para esta compañía.",
      message: "Employee loan requests are disabled for this company.",
    };
  }

  return policy;
};

export const getProductConfigFromPrincipalApi = async () => {
  if (!PRINCIPAL_PRODUCT_CONFIG_URL) {
    throw {
      statusCode: 500,
      mensaje:
        "No se configuró la URL del principal para obtener la configuración del préstamo.",
      message: "Missing PRINCIPAL_EMPLOYEE_LOAN_PRODUCT_CONFIG_URL.",
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (PRINCIPAL_PRODUCT_CONFIG_API_KEY) {
    headers["x-api-key"] = PRINCIPAL_PRODUCT_CONFIG_API_KEY;
  }

  const response = await fetch(PRINCIPAL_PRODUCT_CONFIG_URL, {
    method: "GET",
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw {
      statusCode: response.status || 502,
      mensaje:
        data?.mensaje ||
        "No se pudo obtener la configuración principal del préstamo.",
      message:
        data?.message || "Could not fetch principal loan product config.",
    };
  }

  const productConfig =
    data?.productConfig ||
    data?.employeeLoanProductConfig ||
    data?.config ||
    data?.data?.productConfig ||
    data?.data?.employeeLoanProductConfig ||
    data?.data ||
    data;

  if (!productConfig) {
    throw {
      statusCode: 502,
      mensaje: "El principal no devolvió una configuración válida de préstamo.",
      message: "Principal API did not return a valid product config.",
    };
  }

  return normalizeProductConfig(productConfig, "PRINCIPAL_API");
};

export const getActiveEmployeeLoanProductConfig = async (
  session?: mongoose.ClientSession,
) => {
  const mustUsePrincipalApi = ["PRINCIPAL_API", "REMOTE", "EXTERNAL"].includes(
    PRODUCT_CONFIG_SOURCE,
  );

  if (mustUsePrincipalApi) {
    return getProductConfigFromPrincipalApi();
  }

  const localConfig = await getActiveLocalLoanProductConfig(session);

  if (!localConfig) return null;

  return normalizeProductConfig(localConfig, "LOCAL");
};

export const getActiveEmployeeLoanProductConfigOrThrow = async (
  session?: mongoose.ClientSession,
) => {
  const productConfig = await getActiveEmployeeLoanProductConfig(session);

  if (!productConfig) {
    throw {
      statusCode: 404,
      mensaje: "No hay una configuración principal activa para préstamos.",
      message: "No active employee loan product config found.",
    };
  }

  return productConfig;
};

export const softDeleteEmployeeLoanPolicyByCompany = async ({
  companyId,
  session,
}: {
  companyId: Types.ObjectId | string;
  session?: mongoose.ClientSession;
}) => {
  const cleanCompanyId =
    typeof companyId === "string" ? new Types.ObjectId(companyId) : companyId;

  const result = await EmployeeLoanPolicy.updateMany(
    {
      company: cleanCompanyId,
      code: EMPLOYEE_LOAN_POLICY_CODE,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        isActive: false,
        allowEmployeeLoanRequests: false,
      },
    },
    {
      session,
    },
  );

  return result;
};

export const ensureEmployeeLoanPolicyForCompany = async ({
  companyId,
  session,
}: {
  companyId: Types.ObjectId | string;
  session?: mongoose.ClientSession;
}) => {
  if (!companyId || !Types.ObjectId.isValid(String(companyId))) {
    throw {
      statusCode: 400,
      mensaje: "La compañía no es válida para crear la política de préstamos.",
      message: "Invalid company for employee loan policy creation.",
    };
  }

  const cleanCompanyId =
    companyId instanceof Types.ObjectId
      ? companyId
      : new Types.ObjectId(String(companyId));

  const defaultPayload = buildDefaultEmployeeLoanPolicyPayload(cleanCompanyId);

  /**
   * Importante:
   * $setOnInsert solamente se aplica cuando la política no existe.
   *
   * Si la empresa después desactiva allowEmployeeLoanRequests,
   * reiniciar el sistema o volver a validar la integración NO la vuelve
   * a activar automáticamente.
   */
  try {
    const result = await EmployeeLoanPolicy.updateOne(
      {
        company: cleanCompanyId,
        code: EMPLOYEE_LOAN_POLICY_CODE,
        isDeleted: false,
      },
      {
        $setOnInsert: {
          ...defaultPayload,

          /**
           * La integración crea la política disponible,
           * pero la empresa debe decidir si habilita las solicitudes.
           */
          allowEmployeeLoanRequests: false,

          isActive: true,
          isDeleted: false,
        },
      },
      {
        upsert: true,
        session,
        setDefaultsOnInsert: true,
      },
    );

    const policy = await EmployeeLoanPolicy.findOne({
      company: cleanCompanyId,
      code: EMPLOYEE_LOAN_POLICY_CODE,
      isDeleted: false,
    }).session(session || null);

    return {
      created: result.upsertedCount > 0,
      policy,
    };
  } catch (error: any) {
    /**
     * Protección adicional para dos arranques simultáneos.
     * El índice único protege la base de datos; aquí simplemente
     * recuperamos el registro que otro proceso acabó de insertar.
     */
    if (error?.code === 11000) {
      const policy = await EmployeeLoanPolicy.findOne({
        company: cleanCompanyId,
        code: EMPLOYEE_LOAN_POLICY_CODE,
        isDeleted: false,
      }).session(session || null);

      if (policy) {
        return {
          created: false,
          policy,
        };
      }
    }

    throw error;
  }
};

export const bootstrapEmployeeLoanPolicyForIntegration = async ({
  integrationCode,
  companyId,
  session,
}: {
  integrationCode?: string | null;
  companyId?: Types.ObjectId | string | null;
  session?: mongoose.ClientSession;
}) => {
  const cleanIntegrationCode = String(integrationCode || "")
    .trim()
    .toUpperCase();

  /**
   * Si este payroll no tiene integración de préstamos configurada,
   * no se crea nada.
   */
  if (!cleanIntegrationCode) {
    return {
      enabled: false,
      created: false,
      policy: null,
      reason: "MISSING_INTEGRATION_CODE",
    };
  }

  /**
   * El companyId debe venir de la integración validada.
   * Debe ser la compañía local del payroll hijo.
   */
  if (!companyId || !Types.ObjectId.isValid(String(companyId))) {
    return {
      enabled: false,
      created: false,
      policy: null,
      reason: "MISSING_OR_INVALID_COMPANY",
    };
  }

  const result = await ensureEmployeeLoanPolicyForCompany({
    companyId,
    session,
  });

  return {
    enabled: true,
    integrationCode: cleanIntegrationCode,
    created: result.created,
    policy: result.policy,
  };
};

const resolveEmployeeLoanIntegrationCompany = async () => {
  const companyId = String(process.env.EMPLOYEE_LOAN_COMPANY_ID || "").trim();

  const companyCode = String(process.env.EMPLOYEE_LOAN_COMPANY_CODE || "")
    .trim()
    .toUpperCase();

  if (companyId && Types.ObjectId.isValid(companyId)) {
    const company = await Company.findOne({
      _id: new Types.ObjectId(companyId),
      isDeleted: false,
    });

    if (company) {
      return company;
    }

    throw {
      statusCode: 404,
      mensaje:
        "No se encontró la compañía configurada en EMPLOYEE_LOAN_COMPANY_ID.",
      message: "Company configured in EMPLOYEE_LOAN_COMPANY_ID was not found.",
    };
  }

  if (companyCode) {
    const company = await Company.findOne({
      code: companyCode,
      isDeleted: false,
    });

    if (company) {
      return company;
    }

    throw {
      statusCode: 404,
      mensaje:
        "No se encontró la compañía configurada en EMPLOYEE_LOAN_COMPANY_CODE.",
      message:
        "Company configured in EMPLOYEE_LOAN_COMPANY_CODE was not found.",
    };
  }

  /**
   * Fallback para payroll hijo de una sola empresa:
   * se usa siempre la primera compañía creada.
   *
   * Si el payroll hijo maneja múltiples compañías,
   * configura EMPLOYEE_LOAN_COMPANY_ID o EMPLOYEE_LOAN_COMPANY_CODE.
   */
  const firstCompany = await Company.findOne({
    isDeleted: false,
  }).sort({
    createdAt: 1,
    _id: 1,
  });

  if (!firstCompany) {
    throw {
      statusCode: 404,
      mensaje:
        "No existe una compañía disponible para crear la política de préstamos.",
      message: "No company is available to create the employee loan policy.",
    };
  }

  return firstCompany;
};

export const bootstrapEmployeeLoanIntegrationForCurrentPayroll = async () => {
  if (!hasEmployeeLoanIntegrationConfiguration()) {
    return {
      ok: true,
      enabled: false,
      created: false,
      policy: null,
      integration: null,
      reason: "INTEGRATION_NOT_CONFIGURED",
    };
  }

  /**
   * Primero valida la integración contra el principal.
   * Si x-system-code, x-api-key, permisos o expiración son inválidos,
   * aquí falla y NO se crea la política local.
   */
  const principalBootstrap = await getEmployeeLoanPrincipalBootstrap();

  const company = await resolveEmployeeLoanIntegrationCompany();

  /**
   * Usa tu upsert actual:
   * - crea solo una política por compañía;
   * - no reactiva allowEmployeeLoanRequests si la empresa lo apagó;
   * - crea la política en false, pendiente de activación manual.
   */
  const result = await ensureEmployeeLoanPolicyForCompany({
    companyId: company._id,
  });

  return {
    ok: true,
    enabled: true,
    created: result.created,
    integration: {
      systemCode: principalBootstrap.integration.systemCode,
      name: principalBootstrap.integration.name,
    },
    company: {
      id: company._id,
      name:
        company.tradeName ||
        company.legalName ||
        company.code ||
        String(company._id),
      code: company.code || "",
    },
    policy: result.policy,
  };
};

export const releaseVacationLoanReservation = async ({
  loanRequest,
  authUserId,
  session,
  reason,
}: {
  loanRequest: any;
  authUserId: Types.ObjectId | string;
  session: mongoose.ClientSession;
  reason?: string;
}) => {
  const loanRequestId = loanRequest?._id || loanRequest;

  if (!loanRequestId || !Types.ObjectId.isValid(String(loanRequestId))) {
    throw {
      statusCode: 400,
      mensaje:
        "La solicitud de préstamo no es válida para liberar la garantía.",
      message:
        "Invalid employee loan request for releasing vacation guarantee.",
    };
  }

  if (!authUserId || !Types.ObjectId.isValid(String(authUserId))) {
    throw {
      statusCode: 400,
      mensaje: "El usuario que libera la garantía no es válido.",
      message: "Invalid user releasing vacation guarantee.",
    };
  }

  const performedBy =
    authUserId instanceof Types.ObjectId
      ? authUserId
      : new Types.ObjectId(String(authUserId));

  const reservationFilters: any[] = [
    {
      loanRequest: new Types.ObjectId(String(loanRequestId)),
    },
  ];

  if (
    loanRequest?.vacationReservation &&
    Types.ObjectId.isValid(String(loanRequest.vacationReservation))
  ) {
    reservationFilters.push({
      _id: new Types.ObjectId(String(loanRequest.vacationReservation)),
    });
  }

  /**
   * Solo buscamos reservas activas.
   *
   * Esto hace que la función sea idempotente:
   * si ya fue liberada, no vuelve a restar días.
   */
  const vacationReservation = await VacationDayReservation.findOne({
    $or: reservationFilters,
    status: "ACTIVE",
    isActive: true,
    isDeleted: false,
  })
    .sort({
      createdAt: -1,
    })
    .session(session);

  if (!vacationReservation) {
    const previousReservation = await VacationDayReservation.findOne({
      $or: reservationFilters,
      isDeleted: false,
    })
      .sort({
        createdAt: -1,
      })
      .session(session);

    return {
      released: false,
      alreadyReleased: Boolean(previousReservation),
      reservation: previousReservation || null,
      releasedDays: 0,
      balance: null,
    };
  }

  const vacationBalance = await EmployeeVacationBalance.findOne({
    _id: vacationReservation.balance,
    user: vacationReservation.user,
    isDeleted: false,
  }).session(session);

  if (!vacationBalance) {
    throw {
      statusCode: 404,
      mensaje:
        "No se encontró el balance de vacaciones relacionado con la garantía.",
      message: "Vacation balance related to the guarantee was not found.",
    };
  }

  const reservationDays = Math.max(
    0,
    Number(vacationReservation.reservedDays || 0),
  );

  const previousReservedDays = Math.max(
    0,
    Number(vacationBalance.reservedDays || 0),
  );

  /**
   * Evita que reservedDays quede negativo si existe
   * alguna inconsistencia en datos antiguos.
   */
  const releasedDays = Math.min(reservationDays, previousReservedDays);

  const previousAvailableDays = Math.max(
    0,
    Number(vacationBalance.availableDays || 0),
  );

  const previousAvailableForLoanDays = Math.max(
    0,
    Number(vacationBalance.availableForLoanDays || 0),
  );

  const previousPayableVacationDays = Math.max(
    0,
    Number(vacationBalance.payableVacationDays || 0),
  );

  const previousNetPayableVacationDays = Math.max(
    0,
    Number(vacationBalance.netPayableVacationDays || 0),
  );

  vacationBalance.reservedDays = Math.max(
    0,
    previousReservedDays - releasedDays,
  );

  /**
   * IMPORTANTE:
   *
   * La nueva fórmula de recalculateVacationBalance debe:
   *
   * - NO restar reservedDays de availableDays.
   * - SÍ restar reservedDays de availableForLoanDays.
   * - SÍ restar reservedDays de netPayableVacationDays.
   */
  recalculateVacationBalance(vacationBalance);

  vacationBalance.updatedBy = performedBy;

  await vacationBalance.save({
    session,
  });

  const releasedAt = new Date();

  const releaseReason =
    String(reason || "").trim() ||
    `Liberación de garantía del préstamo ${
      loanRequest?.requestNumber || loanRequestId
    }`;

  vacationReservation.status = "RELEASED";

  vacationReservation.releasedAt = releasedAt;

  vacationReservation.releasedBy = performedBy;

  vacationReservation.isActive = false;

  vacationReservation.metadata = {
    ...(vacationReservation.metadata || {}),

    releasedReason: releaseReason,

    releasedLoanRequest: String(loanRequestId),

    releasedReservationDays: reservationDays,

    releasedBalanceDays: releasedDays,

    doesNotAffectEnjoyableVacationDays: true,

    affectsAvailableForLoanDays: true,

    affectsNetPayableVacationDays: true,
  };

  await vacationReservation.save({
    session,
  });

  const newAvailableDays = Math.max(
    0,
    Number(vacationBalance.availableDays || 0),
  );

  const newAvailableForLoanDays = Math.max(
    0,
    Number(vacationBalance.availableForLoanDays || 0),
  );

  const newPayableVacationDays = Math.max(
    0,
    Number(vacationBalance.payableVacationDays || 0),
  );

  const newNetPayableVacationDays = Math.max(
    0,
    Number(vacationBalance.netPayableVacationDays || 0),
  );

  await VacationBalanceMovement.create(
    [
      {
        balance: vacationBalance._id,

        user: vacationReservation.user,

        company: vacationReservation.company || null,

        year: vacationReservation.year,

        type: "LOAN_RELEASE",

        /**
         * Se guarda positivo porque representa
         * la cantidad de días liberados.
         *
         * El tipo LOAN_RELEASE indica la dirección
         * del movimiento.
         */
        days: releasedDays,

        /**
         * Estos valores representan los días
         * disfrutables.
         *
         * Con la nueva regla deben permanecer iguales,
         * porque la reserva del préstamo no bloquea
         * el disfrute de vacaciones.
         */
        previousAvailableDays,

        newAvailableDays,

        loanRequest: new Types.ObjectId(String(loanRequestId)),

        reason: releaseReason,

        performedBy,

        metadata: {
          reservation: vacationReservation._id,

          reservationStatus: "RELEASED",

          previousReservedDays,

          newReservedDays: Number(vacationBalance.reservedDays || 0),

          reservationDays,

          releasedDays,

          previousAvailableDays,

          newAvailableDays,

          previousAvailableForLoanDays,

          newAvailableForLoanDays,

          previousPayableVacationDays,

          newPayableVacationDays,

          previousNetPayableVacationDays,

          newNetPayableVacationDays,

          doesNotAffectEnjoyableVacationDays: true,
        },
      },
    ],
    {
      session,
    },
  );

  return {
    released: true,
    alreadyReleased: false,
    reservation: vacationReservation,
    releasedDays,
    balance: vacationBalance,
  };
};
