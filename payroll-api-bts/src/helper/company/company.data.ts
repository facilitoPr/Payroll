import { NormalizedCompanyPayload } from "../../model/company";

export const mapCompanyToProfileResponse = (company: any) => {
  if (!company) return null;

  const plain =
    typeof company.toObject === "function" ? company.toObject() : company;

  return {
    _id: plain._id,

    code: plain.code,
    isDefault: plain.isDefault,

    legalName: plain.legalName,
    tradeName: plain.tradeName,
    taxId: plain.taxId,

    address: plain.address?.fullAddress || "",
    addressDetail: plain.address || {},

    phone: plain.phone,
    email: plain.email,
    contactName: plain.contactName,

    originBankName: plain.banking?.originBankName || "",
    originBankCode: plain.banking?.originBankCode || "",
    originBankDigit: plain.banking?.originBankDigit || "",
    originAccountType: plain.banking?.originAccountType || "1",
    originAccountNumber: plain.banking?.originAccountNumber || "",
    currency: plain.banking?.currencyCode || "214",

    agreementCode: plain.bankFileConfig?.agreementCode || "",
    serviceCode: plain.bankFileConfig?.serviceCode || "",
    defaultStatementDescription:
      plain.bankFileConfig?.defaultStatementDescription || "NOMINA",

    bankFileLayoutVersion: plain.bankFileConfig?.bankFileLayoutVersion || 1,
    fileEncoding: plain.bankFileConfig?.fileEncoding || "utf8",
    lineEnding: plain.bankFileConfig?.lineEnding || "LF",
    defaultPaddingChar: plain.bankFileConfig?.defaultPaddingChar || " ",

    lastSequenceDate: plain.bankFileConfig?.lastSequenceDate || "",
    lastSequenceNumber: plain.bankFileConfig?.lastSequenceNumber || 0,

    notes: plain.notes || "",

    logoUrl: plain.logoUrl || plain.logo || "",
    logo: plain.logo || plain.logoUrl || "",
    coverUrl: plain.coverUrl || "",
    primaryColor: plain.primaryColor || "#024D48",
    secondaryColor: plain.secondaryColor || "#1964A2",
    website: plain.website || "",

    isActive: plain.isActive,
    isDeleted: plain.isDeleted,

    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,

    company: plain,
  };
};

export const applyPayloadToCompany = ({
  company,
  payload,
  includeCode = true,
  userId = null,
}: {
  company: any;
  payload: NormalizedCompanyPayload;
  includeCode?: boolean;
  userId?: string | null;
}) => {
  if (includeCode && payload.code) {
    company.code = payload.code;
  }
  company.legalName = payload.legalName || company.legalName;
  company.tradeName = payload.tradeName;
  company.taxId = payload.taxId;
  company.businessGroupName = payload.businessGroupName;
  company.ownerName = payload.ownerName;

  company.contactName = payload.contactName;
  company.email = payload.email;
  company.phone = payload.phone;
  company.website = payload.website;

  company.logo = payload.logo;
  company.logoUrl = payload.logoUrl;
  company.coverUrl = payload.coverUrl;
  company.primaryColor = payload.primaryColor;
  company.secondaryColor = payload.secondaryColor;

  company.address = {
    ...(company.address || {}),
    ...payload.address,
  };

  company.fiscalInfo = {
    ...(company.fiscalInfo || {}),
    ...payload.fiscalInfo,
  };

  company.settings = {
    ...(company.settings || {}),
    ...payload.settings,
  };

  company.banking = {
    ...(company.banking || {}),
    ...payload.banking,
  };

  company.bankFileConfig = {
    ...(company.bankFileConfig || {}),
    ...payload.bankFileConfig,
  };

  company.notes = payload.notes;
  company.isDefault = payload.isDefault;
  company.isActive = payload.isActive;

  company.publicProfile = payload.publicProfile;
  company.showInPublicLanding = payload.showInPublicLanding;
  company.markModified("publicProfile");

  if (userId) {
    company.updatedBy = userId as any;
  }
};