import fs from "fs";
import path from "path";
import crypto from "crypto";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";

import { DEFAULT_CURRENCY } from "../../../constants/payroll";
import { PRODUCT_CONFIG_SOURCE } from "../../../constants/loan";
import { round2 } from "../../parse";
import { IUser } from "../../../model/account/user";
import { uploadRawFileToSpaces } from "../../upload/uploadRawFileToSpaces";

const CONTRACT_TEMPLATE_CODE = "PAY_DAY_LOAN_BTS_V1";
const CONTRACT_TEMPLATE_NAME =
  "Contrato de préstamo a corto plazo - Pay Day Loan";
const CONTRACT_TEMPLATE_VERSION = "1.0.0";

const CONTRACT_TEMPLATE_FILE_NAME = "payDayLoan.template.html";

/**
 * Guarda tu template HTML aquí:
 *
 * src/templates/contract/payDayLoan.template.html
 */
const DEFAULT_TEMPLATE_PATH = path.resolve(
  process.cwd(),
  "src",
  "templates",
  "contract",
  CONTRACT_TEMPLATE_FILE_NAME,
);

/**
 * Imagen transparente 1x1 para evitar que el PDF falle
 * si por alguna razón no llega la firma.
 */
const EMPTY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

const CONTRACT_PDF_FOLDER = "contracts/pdfs";
const CONTRACT_HTML_FOLDER = "contracts/html";
const CONTRACT_SIGNATURE_FOLDER = "contracts/signatures";

export interface UploadedSignatureFileLike {
  fieldname?: string;
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  path?: string;
  buffer?: Buffer;
  location?: string;
  url?: string;
  key?: string;
}

export interface GenerateEmployeeLoanContractSnapshotParams {
  employee: any;
  company?: any;
  loanQuote: any;
  loanProviderSnapshot: any;
  vacationSnapshot: any;
  salarySnapshot?: any;
  productConfig?: any;

  requestNumber?: string;

  signatureName: string;
  signatureDocument: string;
  signatureIpAddress: string;
  signatureUserAgent: string;

  /**
   * Firma subida por uploadCompanyImages/createUploadFieldsProcessor.
   * Field recomendado: signatureImage
   */
  signatureImageFile?: UploadedSignatureFileLike | null;

  /**
   * URL generada por req.uploadedFilesMap.signatureImage.
   */
  signatureImageUrl?: string;

  /**
   * Alternativa si decides enviar base64 desde frontend.
   */
  signatureImageBase64?: string;

  sourcePlatformCode?: string;
  sourcePlatformName?: string;
  sourceSystemId?: string;

  templatePath?: string;
}

const sanitizeFileName = (value: string) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
};

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const moneyText = (value: number, currency = DEFAULT_CURRENCY) => {
  const amount = round2(value || 0);

  return `${currency} ${amount.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getInterestRateTypeText = (value: any) => {
  const type = String(value || "")
    .trim()
    .toUpperCase();

  if (type === "ANNUAL") return "anual";
  if (type === "MONTHLY") return "mensual";
  if (type === "PER_INSTALLMENT") return "por cuota";
  if (type === "NONE") return "sin interés";

  return type.toLowerCase();
};

const getObjectName = (value: any) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  return (
    value.legalName ||
    value.commercialName ||
    value.name ||
    value.fullName ||
    ""
  );
};

const getEmployeeCompanyName = (employee: any, company?: any) => {
  return (
    getObjectName(company) ||
    getObjectName(employee?.company) ||
    employee?.companyName ||
    ""
  );
};

const getEmployeeDocument = (employee: IUser, signatureDocument?: string) => {
  return (
    signatureDocument ||
    employee?.idNumber ||
    employee?.payrollBank?.idNumber ||
    ""
  );
};

const getEmployeeAddress = (employee: any) => {
  return employee?.address || "";
};

const getEmployeeName = (employee: any, signatureName?: string) => {
  return (
    signatureName ||
    employee?.name ||
    employee?.fullName ||
    `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim() ||
    "EL DEUDOR"
  );
};

const getContractFileBaseName = ({
  requestNumber,
  employeeName,
}: {
  requestNumber?: string;
  employeeName: string;
}) => {
  const datePart = new Date().toISOString().slice(0, 10);
  const cleanRequest = sanitizeFileName(requestNumber || "solicitud");
  const cleanEmployee = sanitizeFileName(employeeName || "empleado");

  return `contrato-prestamo-${cleanRequest}-${cleanEmployee}-${datePart}`;
};

const bufferToChecksum = (buffer: Buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const dataUriToBuffer = (value: string) => {
  const text = String(value || "");

  if (!text) return Buffer.from(EMPTY_PNG_BASE64, "base64");

  const base64 = text.includes(",") ? text.split(",").pop() || "" : text;

  return Buffer.from(base64, "base64");
};

const bufferToPngDataUri = (buffer: Buffer) => {
  const cleanBuffer =
    buffer && buffer.length > 0
      ? buffer
      : Buffer.from(EMPTY_PNG_BASE64, "base64");

  return `data:image/png;base64,${cleanBuffer.toString("base64")}`;
};

const getSignatureBuffer = async ({
  signatureImageFile,
  signatureImageBase64,
}: {
  signatureImageFile?: UploadedSignatureFileLike | null;
  signatureImageBase64?: string;
}) => {
  if (signatureImageFile?.buffer) {
    return signatureImageFile.buffer;
  }

  if (signatureImageFile?.path) {
    return fs.promises.readFile(signatureImageFile.path);
  }

  if (signatureImageBase64) {
    return dataUriToBuffer(signatureImageBase64);
  }

  return Buffer.from(EMPTY_PNG_BASE64, "base64");
};

/**
 * Crea un objeto similar a Express.Multer.File para poder usar tu helper:
 * uploadRawFileToSpaces(file, folder)
 */
const buildVirtualMulterFileFromBuffer = ({
  buffer,
  fileName,
  mimetype,
  fieldname = "file",
}: {
  buffer: Buffer;
  fileName: string;
  mimetype: string;
  fieldname?: string;
}): Express.Multer.File => {
  return {
    fieldname,
    originalname: fileName,
    encoding: "7bit",
    mimetype,
    size: buffer.length,
    destination: "",
    filename: fileName,
    path: "",
    buffer,
  } as Express.Multer.File;
};

const uploadBufferAsRawFileToSpaces = async ({
  buffer,
  fileName,
  folder,
  mimetype,
  fieldname,
}: {
  buffer: Buffer;
  fileName: string;
  folder: string;
  mimetype: string;
  fieldname?: string;
}) => {
  const file = buildVirtualMulterFileFromBuffer({
    buffer,
    fileName,
    mimetype,
    fieldname,
  });

  const uploaded = await uploadRawFileToSpaces(file, folder);

  return {
    fileName,
    url: uploaded?.url || "",
    storageKey:
      uploaded?.key ||
      uploaded?.path ||
      uploaded?.location ||
      uploaded?.url ||
      "",
    sizeBytes: buffer.length,
    mimetype,
  };
};

const getUploadedSignatureStorageInfo = ({
  signatureImageFile,
  signatureImageUrl,
  fallbackFileName,
}: {
  signatureImageFile?: UploadedSignatureFileLike | null;
  signatureImageUrl?: string;
  fallbackFileName: string;
}) => {
  return {
    signatureImageUrl:
      signatureImageUrl ||
      signatureImageFile?.location ||
      signatureImageFile?.url ||
      "",
    signatureImageStorageKey:
      signatureImageFile?.key ||
      signatureImageFile?.path ||
      signatureImageUrl ||
      "",
    signatureImageFileName:
      signatureImageFile?.filename ||
      signatureImageFile?.originalname ||
      fallbackFileName,
    signatureImageMimeType: signatureImageFile?.mimetype || "image/png",
  };
};

export const buildEmployeeLoanContractDocumentData = ({
  employee,
  company,
  loanQuote,
  loanProviderSnapshot,
  vacationSnapshot,
  salarySnapshot,
  signatureName,
  signatureDocument,
  signatureIpAddress = "",
  signatureUserAgent = "",
  debtorSignatureImage = "",
  sourcePlatformCode,
  sourcePlatformName,
  sourceSystemId = "",
}: {
  employee: any;
  company?: any;
  loanQuote: any;
  loanProviderSnapshot: any;
  vacationSnapshot: any;
  salarySnapshot?: any;
  signatureName: string;
  signatureDocument: string;
  signatureIpAddress?: string;
  signatureUserAgent?: string;
  debtorSignatureImage?: string;
  sourcePlatformCode?: string;
  sourcePlatformName?: string;
  sourceSystemId?: string;
}) => {
  const currency =
    loanProviderSnapshot?.interestBankAccount?.currency || DEFAULT_CURRENCY;

  const employeeName = getEmployeeName(employee, signatureName);
  const employeeDocument = getEmployeeDocument(employee, signatureDocument);
  const employerName = getEmployeeCompanyName(employee, company);

  const principal = Number(loanQuote?.principal || 0);
  const totalInterest = Number(loanQuote?.totalInterest || 0);
  const totalToPay = Number(loanQuote?.totalToPay || 0);
  const installmentAmount = Number(loanQuote?.installmentAmount || 0);
  const installments = Number(loanQuote?.installments || 0);

  const signedAt = new Date();

  return {
    lenderName: "Blue Technology Solution",
    lenderRepresentativeName: "",
    lenderRepresentativeTitle: "",
    lenderSignatureName: "Blue Technology Solution",

    debtorName: employeeName,
    debtorDocument: employeeDocument,
    debtorNationality: employee?.nationality || "dominicano(a)",
    debtorAddress: getEmployeeAddress(employee),
    debtorCompanyName: employerName,

    employerName,

    loanAmount: moneyText(principal, currency),
    loanAmountNumber: round2(principal),
    loanCurrency: currency,

    loanDurationText: `${installments} cuota(s)`,
    loanInstallments: installments,
    loanInstallmentAmount: moneyText(installmentAmount, currency),
    loanTotalInterest: moneyText(totalInterest, currency),
    loanTotalToPay: moneyText(totalToPay, currency),

    interestRate: Number(loanProviderSnapshot?.interestRate || 0),
    interestRateText: `${Number(loanProviderSnapshot?.interestRate || 0)}%`,
    interestRateType: loanProviderSnapshot?.interestRateType || "",
    interestRateTypeText: getInterestRateTypeText(
      loanProviderSnapshot?.interestRateType,
    ),
    adminFee: moneyText(0, currency),
    adminFeeNumber: 0,

    guaranteedDays: Number(vacationSnapshot?.guaranteedDays || 0),
    guaranteedDaysText: `${Number(
      vacationSnapshot?.guaranteedDays || 0,
    )} día(s)`,
    estimatedGuaranteeAmount: moneyText(
      Number(vacationSnapshot?.estimatedGuaranteeAmount || 0),
      currency,
    ),

    monthlySalary: moneyText(
      Number(salarySnapshot?.monthlySalary || 0),
      currency,
    ),
    dailySalary: moneyText(Number(salarySnapshot?.dailySalary || 0), currency),
    paymentFrequency:
      salarySnapshot?.paymentFrequencyName ||
      salarySnapshot?.paymentFrequencyCode ||
      "",

    firstPaymentDate: formatDate(loanQuote?.firstPaymentDate),
    lastPaymentDate: formatDate(
      loanQuote?.amortizationSchedule?.[
        Math.max(Number(loanQuote?.amortizationSchedule?.length || 0) - 1, 0)
      ]?.dueDate,
    ),
    signedAt: formatDateTime(signedAt),
    signedDate: formatDate(signedAt),

    signatureName: employeeName,
    signatureDocument: employeeDocument,
    signatureIpAddress: String(signatureIpAddress || ""),
    signatureUserAgent: String(signatureUserAgent || ""),

    /**
     * En el HTML debe usarse así:
     * src="{{{debtorSignatureImage}}}"
     */
    debtorSignatureImage,

    sourcePlatformCode:
      sourcePlatformCode ||
      loanProviderSnapshot?.productConfigCode ||
      loanProviderSnapshot?.productCode ||
      PRODUCT_CONFIG_SOURCE,

    sourcePlatformName: sourcePlatformName || "Payroll System",
    sourceProductCode:
      loanProviderSnapshot?.productConfigCode ||
      loanProviderSnapshot?.productCode ||
      "",

    sourceSystemId: sourceSystemId || "",
  };
};

export const renderEmployeeLoanContractHtml = async ({
  templatePath,
  documentData,
}: {
  templatePath: string;
  documentData: Record<string, any>;
}) => {
  const templateContent = await fs.promises.readFile(templatePath, "utf-8");

  const template = Handlebars.compile(templateContent, {
    strict: false,
    noEscape: false,
  });

  return template(documentData);
};

export const renderEmployeeLoanContractPdfBuffer = async ({
  html,
}: {
  html: string;
}) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "18mm",
        right: "16mm",
        bottom: "18mm",
        left: "16mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

export const generateEmployeeLoanContractSnapshot = async ({
  employee,
  company,
  loanQuote,
  loanProviderSnapshot,
  vacationSnapshot,
  salarySnapshot,
  productConfig,
  requestNumber,
  signatureName,
  signatureDocument,
  signatureIpAddress,
  signatureUserAgent,
  signatureImageFile,
  signatureImageUrl,
  signatureImageBase64,
  sourcePlatformCode,
  sourcePlatformName,
  sourceSystemId,
  templatePath = DEFAULT_TEMPLATE_PATH,
}: GenerateEmployeeLoanContractSnapshotParams) => {
  const employeeName = getEmployeeName(employee, signatureName);

  const fileBaseName = getContractFileBaseName({
    requestNumber,
    employeeName,
  });

  const signedAt = new Date();

  const signatureBuffer = await getSignatureBuffer({
    signatureImageFile,
    signatureImageBase64,
  });

  const signatureStorageInfoFromUploader = getUploadedSignatureStorageInfo({
    signatureImageFile,
    signatureImageUrl,
    fallbackFileName: `${fileBaseName}-firma.png`,
  });

  let finalSignatureImageUrl =
    signatureStorageInfoFromUploader.signatureImageUrl;
  let signatureImageStorageKey =
    signatureStorageInfoFromUploader.signatureImageStorageKey;
  let signatureImageFileName =
    signatureStorageInfoFromUploader.signatureImageFileName;
  let signatureImageMimeType =
    signatureStorageInfoFromUploader.signatureImageMimeType;

  /**
   * Si createUploadFieldsProcessor ya subió la firma, signatureImageUrl vendrá
   * desde req.uploadedFilesMap.signatureImage.
   *
   * Si no llegó URL, subimos la firma aquí usando uploadRawFileToSpaces.
   */
  if (!finalSignatureImageUrl && !signatureImageStorageKey) {
    const uploadedSignature = await uploadBufferAsRawFileToSpaces({
      buffer: signatureBuffer,
      fileName: `${fileBaseName}-firma.png`,
      folder: CONTRACT_SIGNATURE_FOLDER,
      mimetype: "image/png",
      fieldname: "signatureImage",
    });

    finalSignatureImageUrl = uploadedSignature.url;
    signatureImageStorageKey = uploadedSignature.storageKey;
    signatureImageFileName = uploadedSignature.fileName;
    signatureImageMimeType = uploadedSignature.mimetype;
  }

  /**
   * Para generar el PDF, usamos data URI para que Puppeteer no dependa de si
   * la URL del storage es pública, privada o tiene latencia.
   */
  const debtorSignatureImage = bufferToPngDataUri(signatureBuffer);

  const documentData = buildEmployeeLoanContractDocumentData({
    employee,
    company,
    loanQuote,
    loanProviderSnapshot,
    vacationSnapshot,
    salarySnapshot,
    signatureName,
    signatureDocument,
    signatureIpAddress,
    signatureUserAgent,
    debtorSignatureImage,
    sourcePlatformCode,
    sourcePlatformName,
    sourceSystemId,
  });

  const html = await renderEmployeeLoanContractHtml({
    templatePath,
    documentData,
  });

  const pdfBuffer = await renderEmployeeLoanContractPdfBuffer({
    html,
  });

  const generatedPdf = await uploadBufferAsRawFileToSpaces({
    buffer: pdfBuffer,
    fileName: `${fileBaseName}.pdf`,
    folder: CONTRACT_PDF_FOLDER,
    mimetype: "application/pdf",
    fieldname: "contractPdf",
  });

  /**
   * Opcional, pero recomendado para auditoría/debug:
   * guardamos también el HTML renderizado en Spaces.
   */
  const htmlBuffer = Buffer.from(html, "utf-8");

  const generatedHtml = await uploadBufferAsRawFileToSpaces({
    buffer: htmlBuffer,
    fileName: `${fileBaseName}.html`,
    folder: CONTRACT_HTML_FOLDER,
    mimetype: "text/html",
    fieldname: "contractHtml",
  });

  const checksum = bufferToChecksum(pdfBuffer);

  return {
    contractVersion: "EMPLOYEE_LOAN_CONTRACT_TEMPLATE_V1",
    generationStatus: "GENERATED",

    templateCode: CONTRACT_TEMPLATE_CODE,
    templateName: CONTRACT_TEMPLATE_NAME,
    templateVersion: CONTRACT_TEMPLATE_VERSION,
    templateStorageKey: templatePath,
    templateFileName: CONTRACT_TEMPLATE_FILE_NAME,

    contractText: "",
    documentData,

    generatedDocxFileName: "",
    generatedDocxUrl: "",
    generatedDocxStorageKey: "",

    generatedPdfFileName: generatedPdf.fileName,
    generatedPdfUrl: generatedPdf.url,
    generatedPdfStorageKey: generatedPdf.storageKey,

    storageProvider: "SPACES",
    storageBucket:
      process.env.DO_SPACES_BUCKET || process.env.SPACES_BUCKET || "",

    mimeType: "application/pdf",
    docxSizeBytes: 0,
    pdfSizeBytes: generatedPdf.sizeBytes,
    checksum,

    acceptedAt: signedAt,
    signedAt,

    signatureName: String(signatureName || employeeName || "").trim(),
    signatureDocument: String(
      signatureDocument || getEmployeeDocument(employee) || "",
    ).trim(),

    signatureImageUrl: finalSignatureImageUrl,
    signatureImageStorageKey,
    signatureImageFileName,
    signatureImageMimeType,

    signatureIpAddress: String(signatureIpAddress || "").trim(),
    signatureUserAgent: String(signatureUserAgent || "").trim(),

    sourcePlatformCode: String(
      sourcePlatformCode ||
        productConfig?.externalProductCode ||
        productConfig?.code ||
        loanProviderSnapshot?.productCode ||
        PRODUCT_CONFIG_SOURCE,
    )
      .trim()
      .toUpperCase(),

    sourcePlatformName: String(sourcePlatformName || "Payroll System").trim(),

    sourceProductCode: String(
      productConfig?.externalProductCode ||
        productConfig?.code ||
        loanProviderSnapshot?.productCode ||
        "",
    )
      .trim()
      .toUpperCase(),

    sourceSystemId: sourceSystemId ? String(sourceSystemId) : "",

    generationError: "",

    metadata: {
      generatedAt: signedAt,
      requestNumber: requestNumber || "",
      productName: loanProviderSnapshot?.productName || "",
      providerType: loanProviderSnapshot?.providerType || "LOCAL",
      interestRate: loanProviderSnapshot?.interestRate || 0,
      interestRateType: loanProviderSnapshot?.interestRateType || "",
      defaultPaymentFrequency:
        loanProviderSnapshot?.defaultPaymentFrequency || "",
      templateType: "HTML_TO_PDF",

      generatedHtmlFileName: generatedHtml.fileName,
      generatedHtmlUrl: generatedHtml.url,
      generatedHtmlStorageKey: generatedHtml.storageKey,
      generatedHtmlSizeBytes: generatedHtml.sizeBytes,
    },
  };
};

export const buildEmployeeLoanContractPreviewSnapshot = ({
  employee,
  company,
  loanQuote,
  loanProviderSnapshot,
  vacationSnapshot,
  salarySnapshot,
  productConfig,
  sourcePlatformCode,
  sourcePlatformName,
}: {
  employee: any;
  company?: any;
  loanQuote: any;
  loanProviderSnapshot: any;
  vacationSnapshot: any;
  salarySnapshot?: any;
  productConfig?: any;
  sourcePlatformCode?: string;
  sourcePlatformName?: string;
}) => {
  const documentData = buildEmployeeLoanContractDocumentData({
    employee,
    company,
    loanQuote,
    loanProviderSnapshot,
    vacationSnapshot,
    salarySnapshot,
    signatureName: getEmployeeName(employee),
    signatureDocument: getEmployeeDocument(employee),
    signatureIpAddress: "",
    signatureUserAgent: "",
    debtorSignatureImage: "",
    sourcePlatformCode:
      sourcePlatformCode ||
      productConfig?.externalProductCode ||
      productConfig?.code ||
      loanProviderSnapshot?.productCode ||
      PRODUCT_CONFIG_SOURCE,
    sourcePlatformName,
  });

  return {
    contractVersion: "EMPLOYEE_LOAN_CONTRACT_TEMPLATE_V1",
    generationStatus: "NOT_GENERATED",

    templateCode: CONTRACT_TEMPLATE_CODE,
    templateName: CONTRACT_TEMPLATE_NAME,
    templateVersion: CONTRACT_TEMPLATE_VERSION,
    templateStorageKey: DEFAULT_TEMPLATE_PATH,
    templateFileName: CONTRACT_TEMPLATE_FILE_NAME,

    contractText: "",
    documentData,

    generatedDocxFileName: "",
    generatedDocxUrl: "",
    generatedDocxStorageKey: "",

    generatedPdfFileName: "",
    generatedPdfUrl: "",
    generatedPdfStorageKey: "",

    storageProvider: "SPACES",
    storageBucket:
      process.env.DO_SPACES_BUCKET || process.env.SPACES_BUCKET || "",

    mimeType: "application/pdf",

    docxSizeBytes: 0,
    pdfSizeBytes: 0,
    checksum: "",

    acceptedAt: null,
    signedAt: null,

    signatureName: "",
    signatureDocument: "",

    signatureImageUrl: "",
    signatureImageStorageKey: "",
    signatureImageFileName: "",
    signatureImageMimeType: "image/png",

    signatureIpAddress: "",
    signatureUserAgent: "",

    sourcePlatformCode: String(
      sourcePlatformCode ||
        productConfig?.externalProductCode ||
        productConfig?.code ||
        loanProviderSnapshot?.productCode ||
        PRODUCT_CONFIG_SOURCE,
    )
      .trim()
      .toUpperCase(),

    sourcePlatformName: String(sourcePlatformName || "Payroll System").trim(),

    sourceProductCode: String(
      productConfig?.externalProductCode ||
        productConfig?.code ||
        loanProviderSnapshot?.productCode ||
        "",
    )
      .trim()
      .toUpperCase(),

    sourceSystemId: "",

    generationError: "",

    metadata: {
      previewedAt: new Date(),
      productName: loanProviderSnapshot?.productName || "",
      providerType: loanProviderSnapshot?.providerType || "LOCAL",
      templateType: "HTML_TO_PDF",
    },
  };
};

export const getUploadedFileFromRequest = (req: any, fieldName: string) => {
  const files = req.files as any;

  if (!files) return null;

  if (Array.isArray(files)) {
    return files.find((file) => file.fieldname === fieldName) || null;
  }

  if (Array.isArray(files[fieldName])) {
    return files[fieldName][0] || null;
  }

  return files[fieldName] || null;
};

export const getUploadedFileUrlFromRequest = (req: any, fieldName: string) => {
  const uploadedFilesMap = req.uploadedFilesMap || {};
  const value = uploadedFilesMap[fieldName];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
};
