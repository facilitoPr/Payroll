import { Schema, model, Document, Types } from "mongoose";
import {
  EMPLOYEE_LOAN_INTEREST_RATE_TYPE,
  EMPLOYEE_LOAN_PAYMENT_FREQUENCY,
  LoanInterestRateType,
  LoanPaymentFrequency,
  EmployeeLoanGuaranteeSource,
  EmployeeLoanGuaranteeCoverageBasis,
} from "./employeeLoanProductConfig";

/**
 * Estados internos de la solicitud.
 */
export const EMPLOYEE_LOAN_REQUEST_STATUS = [
  "DRAFT",
  "SUBMITTED",
  "SENT_TO_EXTERNAL",
  "EXTERNAL_RECEIVED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "ERROR",
  "TERMINATED",
  "CLOSED",
] as const;

export type EmployeeLoanRequestStatus =
  (typeof EMPLOYEE_LOAN_REQUEST_STATUS)[number];

/**
 * Estado de sincronización externa.
 * NOT_REQUIRED se usa cuando el préstamo es del sistema principal
 * y no necesita enviarse a otra API.
 */
export const EMPLOYEE_LOAN_EXTERNAL_SYNC_STATUS = [
  "NOT_REQUIRED",
  "NOT_SENT",
  "PENDING",
  "SENT",
  "SYNCED",
  "FAILED",
] as const;

export type EmployeeLoanExternalSyncStatus =
  (typeof EMPLOYEE_LOAN_EXTERNAL_SYNC_STATUS)[number];

/**
 * Fuente que creó la solicitud.
 */
export const EMPLOYEE_LOAN_REQUEST_SOURCE = [
  "EMPLOYEE_PORTAL",
  "ADMIN_PORTAL",
  "EXTERNAL_API",
] as const;

export type EmployeeLoanRequestSource =
  (typeof EMPLOYEE_LOAN_REQUEST_SOURCE)[number];

/**
 * Tipo de proveedor de préstamo.
 * LOCAL = configuración del sistema principal.
 * REMOTE_MAIN_API = otro payroll consultó al principal.
 */
export const EMPLOYEE_LOAN_PROVIDER_TYPE = [
  "LOCAL",
  "REMOTE_MAIN_API",
] as const;

export type EmployeeLoanProviderType =
  (typeof EMPLOYEE_LOAN_PROVIDER_TYPE)[number];

/**
 * Estado de cada cuota en la tabla de amortización.
 */
export const EMPLOYEE_LOAN_AMORTIZATION_STATUS = [
  "PENDING",
  "PAID",
  "CANCELLED",
  "SKIPPED",
] as const;

export type EmployeeLoanAmortizationStatus =
  (typeof EMPLOYEE_LOAN_AMORTIZATION_STATUS)[number];

/**
 * Versión del contrato.
 * Se mantiene EMPLOYEE_LOAN_CONTRACT_V1 por compatibilidad.
 * EMPLOYEE_LOAN_CONTRACT_TEMPLATE_V1 será la versión nueva basada en plantilla DOCX.
 */
export const EMPLOYEE_LOAN_CONTRACT_VERSION = [
  "EMPLOYEE_LOAN_CONTRACT_V1",
  "EMPLOYEE_LOAN_CONTRACT_TEMPLATE_V1",
] as const;

export type EmployeeLoanContractVersion =
  (typeof EMPLOYEE_LOAN_CONTRACT_VERSION)[number];

/**
 * Estado de generación del documento del contrato.
 */
export const EMPLOYEE_LOAN_CONTRACT_GENERATION_STATUS = [
  "NOT_GENERATED",
  "GENERATING",
  "GENERATED",
  "FAILED",
] as const;

export type EmployeeLoanContractGenerationStatus =
  (typeof EMPLOYEE_LOAN_CONTRACT_GENERATION_STATUS)[number];

export interface IEmployeeLoanRequest extends Document {
  /** Código interno visible de la solicitud. */
  requestNumber: string;

  /** Empleado que realiza la solicitud. */
  employee: Types.ObjectId;

  /** Compañía del empleado al momento de solicitar. */
  company?: Types.ObjectId | null;

  /** Departamento del empleado al momento de solicitar. */
  department?: Types.ObjectId | null;

  /** Puesto del empleado al momento de solicitar. */
  jobPosition?: Types.ObjectId | null;

  /** Proyecto del empleado al momento de solicitar. */
  project?: Types.ObjectId | null;

  /** Política de préstamo usada para validar esta solicitud. */
  policy?: Types.ObjectId | null;

  /** Estado actual de la solicitud dentro de esta plataforma. */
  status: EmployeeLoanRequestStatus;

  /** Fuente que creó la solicitud. */
  source: EmployeeLoanRequestSource;

  /** Monto solicitado por el empleado. */
  requestedAmount: number;

  /** Monto máximo calculado por vacaciones y configuración principal. */
  maxAllowedAmount: number;

  /** Monto aprobado. */
  approvedAmount?: number;

  /** Cantidad de cuotas solicitadas. */
  requestedInstallments?: number;

  /** Cantidad de cuotas aprobadas. */
  approvedInstallments?: number;

  /** Motivo o propósito del préstamo. */
  purpose?: string;

  /** Comentario escrito por el empleado. */
  employeeComment?: string;

  /** Comentario visible recibido desde una API externa o proceso externo. */
  externalComment?: string;

  /** Snapshot del sueldo usado para calcular la solicitud. */
  salarySnapshot: {
    /** Tipo de salario del empleado. */
    salaryType?: Types.ObjectId | null;

    /** Salario correspondiente al período de pago. */
    periodSalary: number;

    /** Nombre o código del tipo de salario. */
    salaryTypeName?: string;

    /** Sueldo crudo usado como base. */
    rawSalary?: number;

    /** Sueldo mensual usado para el cálculo. */
    monthlySalary: number;

    /** Sueldo diario usado para calcular garantía. */
    dailySalary: number;

    /** Frecuencia de pago asociada al empleado. */
    paymentFrequency?: Types.ObjectId | null;

    /** Nombre o código de la frecuencia de pago. */
    paymentFrequencyName?: string;

    /** Moneda del salario. */
    currency: string;
  };

  /** Snapshot del balance de vacaciones al momento de solicitar. */
  vacationSnapshot: {
    /** Año o ciclo usado para el balance. */
    year: number;

    /** Balance de vacaciones relacionado. */
    balance?: Types.ObjectId | null;

    /** Días asignados en el balance. */
    assignedDays: number;

    /** Días usados antes de la solicitud. */
    usedDays: number;

    /** Días ya reservados antes de esta solicitud. */
    reservedDays: number;

    /** Ajustes manuales del balance. */
    adjustmentDays: number;

    /** Días disponibles antes de esta solicitud. */
    availableDaysBeforeRequest: number;

    /** Días usados como garantía en esta solicitud. */
    guaranteedDays: number;

    /** Días disponibles luego de aplicar la garantía. */
    availableDaysAfterGuarantee: number;

    /** Valor monetario estimado de la garantía. */
    estimatedGuaranteeAmount: number;
  };

  /** Reserva de dias de vacaciones asociada a esta solicitud. */
  vacationReservation?: Types.ObjectId | null;

  /** Fuente de garantia congelada al aprobar o firmar el prestamo. */
  guaranteeSourceSnapshot?: EmployeeLoanGuaranteeSource;

  /** Snapshot del balance de doble sueldo usado para validar prestamos nuevos. */
  christmasSalaryGuaranteeSnapshot?: {
    year?: number;
    accruedChristmasSalaryAmount?: number;
    reservedGuaranteeAmount?: number;
    availableUnreservedChristmasSalaryAmount?: number;
    maxAllowedLoanAmount?: number;
    maxChristmasSalaryGuaranteePercent?: number;
    guaranteeCoverageBasis?: EmployeeLoanGuaranteeCoverageBasis;
  };

  /** Reserva monetaria futura para garantias basadas en doble sueldo. */
  guaranteeReservation?: Types.ObjectId | null;

  /** Snapshot del proveedor/configuración usada para calcular el préstamo. */
  loanProviderSnapshot?: {
    /** Tipo de proveedor que procesó el producto. */
    providerType: EmployeeLoanProviderType;

    /** Configuración de producto usada. */
    productConfig?: Types.ObjectId | null;

    /** Código del producto de préstamo. */
    productCode: string;

    /** Nombre del producto de préstamo. */
    productName: string;

    /** Tasa de interés usada. */
    interestRate: number;

    /** Tipo de tasa de interés. */
    interestRateType: LoanInterestRateType;

    /** Frecuencia de pago por defecto. */
    defaultPaymentFrequency: LoanPaymentFrequency;

    /** Cuenta bancaria donde se reciben intereses. */
    interestBankAccount: {
      /** Nombre del banco. */
      bankName: string;

      /** Código del banco. */
      bankCode: string;

      /** Número de cuenta. */
      accountNumber: string;

      /** Tipo de cuenta. */
      accountType: string;

      /** Moneda de la cuenta. */
      currency: string;

      /** Nombre del beneficiario. */
      beneficiaryName: string;

      /** Documento o RNC del beneficiario. */
      beneficiaryDocument: string;

      /** Instrucciones de pago. */
      paymentInstructions: string;
    };

    /** Fecha en que se calculó el snapshot del proveedor. */
    calculatedAt?: Date | null;
  };

  /** Snapshot de la cotización calculada. */
  loanQuoteSnapshot?: {
    /** Capital principal del préstamo. */
    principal: number;

    /** Cantidad de cuotas. */
    installments: number;

    /** Tasa periódica usada en la amortización. */
    periodicRate: number;

    /** Monto de cada cuota. */
    installmentAmount: number;

    /** Total de intereses calculados. */
    totalInterest: number;

    /** Total final a pagar. */
    totalToPay: number;

    /** Cantidad de pagos por año. */
    paymentsPerYear: number;

    /** Fecha del primer pago. */
    firstPaymentDate?: Date | null;
  };

  /** Tabla de amortización calculada al momento de firmar/crear el préstamo. */
  amortizationSchedule?: {
    /** Número de cuota. */
    installmentNumber: number;

    /** Fecha de vencimiento de la cuota. */
    dueDate: Date;

    /** Balance inicial antes del pago. */
    openingBalance: number;

    /** Monto total de la cuota. */
    paymentAmount: number;

    /** Parte de la cuota aplicada a capital. */
    principalAmount: number;

    /** Parte de la cuota aplicada a intereses. */
    interestAmount: number;

    /** Balance restante luego del pago. */
    closingBalance: number;

    /** Estado de la cuota. */
    status: EmployeeLoanAmortizationStatus;

    /** Nómina donde fue descontada la cuota. */
    payrollRun?: Types.ObjectId | null;

    /** Fecha en que fue pagada la cuota. */
    paidAt?: Date | null;
  }[];

  /** Contrato aceptado, generado desde plantilla y firmado digitalmente por el empleado. */
  contractSnapshot?: {
    /** Versión lógica del contrato. */
    contractVersion: EmployeeLoanContractVersion;

    /** Estado de generación del documento. */
    generationStatus: EmployeeLoanContractGenerationStatus;

    /** Código interno de la plantilla usada. */
    templateCode: string;

    /** Nombre visible de la plantilla usada. */
    templateName: string;

    /** Versión de la plantilla usada. */
    templateVersion: string;

    /** Ruta o key interna de la plantilla original. */
    templateStorageKey: string;

    /** Nombre del archivo de plantilla original. */
    templateFileName: string;

    /** Texto plano opcional del contrato, solo para compatibilidad o búsqueda. */
    contractText: string;

    /** Data usada para llenar los placeholders del documento. */
    documentData?: Record<string, any>;

    /** Nombre del documento DOCX generado. */
    generatedDocxFileName: string;

    /** URL pública o privada firmada del DOCX generado. */
    generatedDocxUrl: string;

    /** Key/ruta interna del DOCX generado en storage. */
    generatedDocxStorageKey: string;

    /** Nombre del PDF generado. */
    generatedPdfFileName: string;

    /** URL pública o privada firmada del PDF generado. */
    generatedPdfUrl: string;

    /** Key/ruta interna del PDF generado en storage. */
    generatedPdfStorageKey: string;

    /** Proveedor donde se guardó el documento. */
    storageProvider: string;

    /** Bucket o contenedor donde se guardó el documento. */
    storageBucket: string;

    /** Mime type del documento principal. */
    mimeType: string;

    /** Tamaño del DOCX generado en bytes. */
    docxSizeBytes: number;

    /** Tamaño del PDF generado en bytes. */
    pdfSizeBytes: number;

    /** Hash/checksum opcional del DOCX o PDF para auditoría. */
    checksum: string;

    /** Fecha en que el empleado aceptó el contrato. */
    acceptedAt?: Date | null;

    /** Fecha en que el empleado firmó el contrato. */
    signedAt?: Date | null;

    /** Nombre usado para la firma. */
    signatureName: string;

    /** Documento/cédula usado para la firma. */
    signatureDocument: string;

    /** URL de la imagen de la firma guardada. */
    signatureImageUrl: string;

    /** Key/ruta interna de la imagen de firma. */
    signatureImageStorageKey: string;

    /** Nombre del archivo de firma. */
    signatureImageFileName: string;

    /** Mime type de la imagen de firma. */
    signatureImageMimeType: string;

    /** IP desde donde se firmó. */
    signatureIpAddress: string;

    /** User-Agent desde donde se firmó. */
    signatureUserAgent: string;

    /** Código de la plataforma que originó la solicitud. */
    sourcePlatformCode: string;

    /** Nombre de la plataforma que originó la solicitud. */
    sourcePlatformName: string;

    /** Código del producto enviado a plataforma principal. */
    sourceProductCode: string;

    /** ID o código del sistema origen si aplica. */
    sourceSystemId?: string;

    /** Error de generación del contrato, si falla. */
    generationError?: string;

    /** Metadata adicional para auditoría, logs o integración externa. */
    metadata?: Record<string, any>;
  };

  /** Datos de cierre del préstamo por desvinculación laboral. */
  terminationSettlement?: {
    /** Indica si el préstamo fue alcanzado por una desvinculación. */
    isTerminated: boolean;

    /** Desvinculación que originó el cierre o cambio de estado. */
    termination?: Types.ObjectId | null;

    /** Pago de desvinculación donde se retuvo el dinero. */
    terminationPayment?: Types.ObjectId | null;

    /** Fecha de salida del empleado. */
    terminationDate?: Date | null;

    /** Fecha en que se aplicó el cierre al préstamo. */
    settledAt?: Date | null;

    /** Estado que tenía el préstamo antes de la desvinculación. */
    statusBeforeTermination?: string;

    /** Balance total pendiente al calcular la desvinculación. */
    totalOutstandingAtTermination: number;

    /** Monto retenido de la liquidación para pagar al prestamista. */
    amountDeducted: number;

    /** Balance que queda pendiente luego de la retención. */
    remainingOutstanding: number;

    /** Cantidad de cuotas pendientes al momento de desvincular. */
    pendingInstallmentsAtTermination: number;

    /** Números de cuotas pendientes al momento de desvincular. */
    pendingInstallmentNumbers: number[];

    /** Método con el que se registró el pago de la desvinculación. */
    paymentMethod: string;

    /** Notas de auditoría. */
    notes: string;
  };

  /** Payload preparado o enviado a una API externa. */
  externalPayload?: Record<string, any>;

  /** ID de la solicitud en una API externa futura. */
  externalRequestId?: string;

  /** Código o nombre del sistema externo. */
  externalSystemCode?: string;

  /** Estado de sincronización con API externa. */
  externalSyncStatus: EmployeeLoanExternalSyncStatus;

  /** Fecha en que se intentó enviar por última vez a una API externa. */
  externalLastSyncAt?: Date | null;

  /** Mensaje de error de sincronización externa. */
  externalSyncError?: string;

  /** Fecha en que fue enviado formalmente. */
  submittedAt?: Date | null;

  /** Fecha de aprobación. */
  approvedAt?: Date | null;

  /** Fecha de decisión final. */
  decidedAt?: Date | null;

  /** Usuario que creó la solicitud. */
  createdBy?: Types.ObjectId | null;

  /** Usuario o proceso que actualizó la solicitud. */
  updatedBy?: Types.ObjectId | null;

  /** Indica si el registro está activo. */
  isActive: boolean;

  /** Soft delete. */
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const employeeLoanRequestSchema = new Schema<IEmployeeLoanRequest>(
  {
    requestNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    jobPosition: {
      type: Schema.Types.ObjectId,
      ref: "JobPosition",
      default: null,
      index: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    policy: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeLoanPolicy",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: EMPLOYEE_LOAN_REQUEST_STATUS,
      default: "SUBMITTED",
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: EMPLOYEE_LOAN_REQUEST_SOURCE,
      default: "EMPLOYEE_PORTAL",
      required: true,
    },

    requestedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    maxAllowedAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    approvedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    requestedInstallments: {
      type: Number,
      default: 1,
      min: 1,
    },

    approvedInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    purpose: {
      type: String,
      trim: true,
      default: "",
    },

    employeeComment: {
      type: String,
      trim: true,
      default: "",
    },

    externalComment: {
      type: String,
      trim: true,
      default: "",
    },

    salarySnapshot: {
      salaryType: {
        type: Schema.Types.ObjectId,
        ref: "SalaryType",
        default: null,
      },

      periodSalary: {
        type: Number,
        default: 0,
        min: 0,
      },

      salaryTypeName: {
        type: String,
        default: "",
      },

      rawSalary: {
        type: Number,
        default: 0,
        min: 0,
      },

      monthlySalary: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      dailySalary: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      paymentFrequency: {
        type: Schema.Types.ObjectId,
        ref: "PaymentFrequency",
        default: null,
      },

      paymentFrequencyName: {
        type: String,
        default: "",
      },

      currency: {
        type: String,
        default: "DOP",
        uppercase: true,
        trim: true,
      },
    },

    vacationSnapshot: {
      year: {
        type: Number,
        required: true,
      },

      balance: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeVacationBalance",
        default: null,
      },

      assignedDays: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      usedDays: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      reservedDays: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      adjustmentDays: {
        type: Number,
        required: true,
        default: 0,
      },

      availableDaysBeforeRequest: {
        type: Number,
        required: true,
        default: 0,
      },

      guaranteedDays: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      availableDaysAfterGuarantee: {
        type: Number,
        required: true,
        default: 0,
      },

      estimatedGuaranteeAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },

    vacationReservation: {
      type: Schema.Types.ObjectId,
      ref: "VacationDayReservation",
      default: null,
      index: true,
    },

    guaranteeSourceSnapshot: {
      type: String,
      enum: ["VACATION_DAYS", "CHRISTMAS_SALARY"],
      default: undefined,
      index: true,
    },

    christmasSalaryGuaranteeSnapshot: {
      year: {
        type: Number,
        default: null,
      },

      accruedChristmasSalaryAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      reservedGuaranteeAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      availableUnreservedChristmasSalaryAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      maxAllowedLoanAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      maxChristmasSalaryGuaranteePercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      guaranteeCoverageBasis: {
        type: String,
        enum: ["OUTSTANDING_BALANCE", "OUTSTANDING_PRINCIPAL"],
        default: undefined,
      },
    },

    guaranteeReservation: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeLoanGuaranteeReservation",
      default: null,
      index: true,
    },

    loanProviderSnapshot: {
      providerType: {
        type: String,
        enum: EMPLOYEE_LOAN_PROVIDER_TYPE,
        default: "LOCAL",
      },

      productConfig: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeLoanProductConfig",
        default: null,
      },

      productCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      productName: {
        type: String,
        default: "",
        trim: true,
      },

      interestRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      interestRateType: {
        type: String,
        enum: EMPLOYEE_LOAN_INTEREST_RATE_TYPE,
        default: "ANNUAL",
      },

      defaultPaymentFrequency: {
        type: String,
        enum: EMPLOYEE_LOAN_PAYMENT_FREQUENCY,
        default: "BIWEEKLY",
      },

      interestBankAccount: {
        bankName: {
          type: String,
          default: "",
          trim: true,
        },

        bankCode: {
          type: String,
          default: "",
          trim: true,
        },

        accountNumber: {
          type: String,
          default: "",
          trim: true,
        },

        accountType: {
          type: String,
          default: "",
          trim: true,
        },

        currency: {
          type: String,
          default: "DOP",
          trim: true,
          uppercase: true,
        },

        beneficiaryName: {
          type: String,
          default: "",
          trim: true,
        },

        beneficiaryDocument: {
          type: String,
          default: "",
          trim: true,
        },

        paymentInstructions: {
          type: String,
          default: "",
          trim: true,
        },
      },

      calculatedAt: {
        type: Date,
        default: null,
      },
    },

    loanQuoteSnapshot: {
      principal: {
        type: Number,
        default: 0,
        min: 0,
      },

      installments: {
        type: Number,
        default: 0,
        min: 0,
      },

      periodicRate: {
        type: Number,
        default: 0,
      },

      installmentAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalInterest: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalToPay: {
        type: Number,
        default: 0,
        min: 0,
      },

      paymentsPerYear: {
        type: Number,
        default: 24,
        min: 1,
      },

      firstPaymentDate: {
        type: Date,
        default: null,
      },
    },

    amortizationSchedule: [
      {
        installmentNumber: {
          type: Number,
          required: true,
          min: 1,
        },

        dueDate: {
          type: Date,
          required: true,
        },

        openingBalance: {
          type: Number,
          default: 0,
          min: 0,
        },

        paymentAmount: {
          type: Number,
          default: 0,
          min: 0,
        },

        principalAmount: {
          type: Number,
          default: 0,
          min: 0,
        },

        interestAmount: {
          type: Number,
          default: 0,
          min: 0,
        },

        closingBalance: {
          type: Number,
          default: 0,
          min: 0,
        },

        status: {
          type: String,
          enum: EMPLOYEE_LOAN_AMORTIZATION_STATUS,
          default: "PENDING",
          index: true,
        },

        payrollRun: {
          type: Schema.Types.ObjectId,
          ref: "PayrollRun",
          default: null,
        },

        paidAt: {
          type: Date,
          default: null,
        },
      },
    ],

    contractSnapshot: {
      contractVersion: {
        type: String,
        enum: EMPLOYEE_LOAN_CONTRACT_VERSION,
        default: "EMPLOYEE_LOAN_CONTRACT_TEMPLATE_V1",
      },

      generationStatus: {
        type: String,
        enum: EMPLOYEE_LOAN_CONTRACT_GENERATION_STATUS,
        default: "NOT_GENERATED",
        index: true,
      },

      templateCode: {
        type: String,
        default: "PAY_DAY_LOAN_BTS_V1",
        trim: true,
        uppercase: true,
        index: true,
      },

      templateName: {
        type: String,
        default: "Contrato de préstamo a corto plazo - Pay Day Loan",
        trim: true,
      },

      templateVersion: {
        type: String,
        default: "1.0.0",
        trim: true,
      },

      templateStorageKey: {
        type: String,
        default: "",
        trim: true,
      },

      templateFileName: {
        type: String,
        default: "employee_loan_contract_template.docx",
        trim: true,
      },

      contractText: {
        type: String,
        default: "",
      },

      documentData: {
        type: Schema.Types.Mixed,
        default: {},
      },

      generatedDocxFileName: {
        type: String,
        default: "",
        trim: true,
      },

      generatedDocxUrl: {
        type: String,
        default: "",
        trim: true,
      },

      generatedDocxStorageKey: {
        type: String,
        default: "",
        trim: true,
      },

      generatedPdfFileName: {
        type: String,
        default: "",
        trim: true,
      },

      generatedPdfUrl: {
        type: String,
        default: "",
        trim: true,
      },

      generatedPdfStorageKey: {
        type: String,
        default: "",
        trim: true,
      },

      storageProvider: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      storageBucket: {
        type: String,
        default: "",
        trim: true,
      },

      mimeType: {
        type: String,
        default:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        trim: true,
      },

      docxSizeBytes: {
        type: Number,
        default: 0,
        min: 0,
      },

      pdfSizeBytes: {
        type: Number,
        default: 0,
        min: 0,
      },

      checksum: {
        type: String,
        default: "",
        trim: true,
      },

      acceptedAt: {
        type: Date,
        default: null,
      },

      signedAt: {
        type: Date,
        default: null,
        index: true,
      },

      signatureName: {
        type: String,
        default: "",
        trim: true,
      },

      signatureDocument: {
        type: String,
        default: "",
        trim: true,
      },

      signatureImageUrl: {
        type: String,
        default: "",
        trim: true,
      },

      signatureImageStorageKey: {
        type: String,
        default: "",
        trim: true,
      },

      signatureImageFileName: {
        type: String,
        default: "",
        trim: true,
      },

      signatureImageMimeType: {
        type: String,
        default: "image/png",
        trim: true,
      },

      signatureIpAddress: {
        type: String,
        default: "",
        trim: true,
      },

      signatureUserAgent: {
        type: String,
        default: "",
        trim: true,
      },

      sourcePlatformCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
        index: true,
      },

      sourcePlatformName: {
        type: String,
        default: "",
        trim: true,
      },

      sourceProductCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      sourceSystemId: {
        type: String,
        default: "",
        trim: true,
      },

      generationError: {
        type: String,
        default: "",
        trim: true,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    terminationSettlement: {
      isTerminated: {
        type: Boolean,
        default: false,
        index: true,
      },

      termination: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeTermination",
        default: null,
        index: true,
      },

      terminationPayment: {
        type: Schema.Types.ObjectId,
        ref: "TerminationPayment",
        default: null,
      },

      terminationDate: {
        type: Date,
        default: null,
      },

      settledAt: {
        type: Date,
        default: null,
      },

      statusBeforeTermination: {
        type: String,
        default: "",
        trim: true,
      },

      totalOutstandingAtTermination: {
        type: Number,
        default: 0,
        min: 0,
      },

      amountDeducted: {
        type: Number,
        default: 0,
        min: 0,
      },

      remainingOutstanding: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingInstallmentsAtTermination: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingInstallmentNumbers: {
        type: [Number],
        default: [],
      },

      paymentMethod: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },

    externalPayload: {
      type: Schema.Types.Mixed,
      default: {},
    },

    externalRequestId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    externalSystemCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      index: true,
    },

    externalSyncStatus: {
      type: String,
      enum: EMPLOYEE_LOAN_EXTERNAL_SYNC_STATUS,
      default: "NOT_SENT",
      required: true,
      index: true,
    },

    externalLastSyncAt: {
      type: Date,
      default: null,
    },

    externalSyncError: {
      type: String,
      trim: true,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    decidedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

employeeLoanRequestSchema.index({
  employee: 1,
  status: 1,
  isDeleted: 1,
});

employeeLoanRequestSchema.index({
  company: 1,
  status: 1,
  createdAt: -1,
});

employeeLoanRequestSchema.index({
  externalSystemCode: 1,
  externalRequestId: 1,
});

employeeLoanRequestSchema.index({
  "loanProviderSnapshot.productCode": 1,
  status: 1,
});

employeeLoanRequestSchema.index({
  "amortizationSchedule.status": 1,
});

employeeLoanRequestSchema.index({
  "contractSnapshot.signedAt": 1,
});

employeeLoanRequestSchema.index({
  "contractSnapshot.templateCode": 1,
  "contractSnapshot.generationStatus": 1,
});

employeeLoanRequestSchema.index({
  "contractSnapshot.sourcePlatformCode": 1,
  createdAt: -1,
});

employeeLoanRequestSchema.index({
  "contractSnapshot.generatedDocxStorageKey": 1,
});

employeeLoanRequestSchema.index({
  "contractSnapshot.generatedPdfStorageKey": 1,
});

employeeLoanRequestSchema.index({
  "terminationSettlement.termination": 1,
  status: 1,
});

employeeLoanRequestSchema.index({
  guaranteeSourceSnapshot: 1,
  status: 1,
  isDeleted: 1,
});

employeeLoanRequestSchema.index({
  guaranteeReservation: 1,
});

export default model<IEmployeeLoanRequest>(
  "EmployeeLoanRequest",
  employeeLoanRequestSchema,
);
