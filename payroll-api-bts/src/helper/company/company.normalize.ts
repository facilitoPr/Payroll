import { cleanString } from "../string/string.clean";

const cleanText = (value: any) => {
  return String(value || "").trim();
};

export const normalizeEnum = <T extends string>(
  value: any,
  allowedValues: readonly T[],
  defaultValue: T,
): T => {
  if (typeof value !== "string") return defaultValue;

  return allowedValues.includes(value as T) ? (value as T) : defaultValue;
};

export const normalizeAddress = (address: any) => {
  /**
   * Compatibilidad con CompanyProfile anterior:
   * antes address era string.
   */
  if (typeof address === "string") {
    return {
      country: "",
      state: "",
      city: "",
      street: "",
      zipCode: "",
      fullAddress: cleanString(address),
    };
  }

  return {
    country: cleanString(address?.country),
    state: cleanString(address?.state),
    city: cleanString(address?.city),
    street: cleanString(address?.street),
    zipCode: cleanString(address?.zipCode),
    fullAddress: cleanString(address?.fullAddress),
  };
};

const normalizePublicProfile = (value: any = {}) => {
  const profile = value && typeof value === "object" ? value : {};
  const images =
    profile.images && typeof profile.images === "object" ? profile.images : {};

  return {
    headline: cleanText(profile.headline),
    subtitle: cleanText(profile.subtitle),

    aboutTitle: cleanText(profile.aboutTitle),
    aboutDescription: cleanText(profile.aboutDescription),
    aboutSecondDescription: cleanText(profile.aboutSecondDescription),

    trajectoryTitle: cleanText(profile.trajectoryTitle),
    trajectoryDescription: cleanText(profile.trajectoryDescription),
    trajectorySecondDescription: cleanText(profile.trajectorySecondDescription),

    mission: cleanText(profile.mission),
    vision: cleanText(profile.vision),
    valuesDescription: cleanText(profile.valuesDescription),

    values: Array.isArray(profile.values)
      ? profile.values
          .map((item: any) => ({
            title: cleanText(item.title),
            icon: cleanText(item.icon) || "check_circle",
            description: cleanText(item.description),
          }))
          .filter((item: any) => item.title || item.description)
      : [],

    stats: Array.isArray(profile.stats)
      ? profile.stats
          .map((item: any) => ({
            label: cleanText(item.label),
            value: cleanText(item.value),
          }))
          .filter((item: any) => item.label || item.value)
      : [],

    images: {
      main: cleanText(images.main),
      secondary: cleanText(images.secondary),
      third: cleanText(images.third),
      trajectory: cleanText(images.trajectory),
      hero: cleanText(images.hero),
    },
  };
};

export const normalizeCompanyPayload = (data: any = {}): any => {
  return {
    _id: data._id,
    code: cleanText(data.code),
    legalName: cleanText(data.legalName),
    tradeName: cleanText(data.tradeName),
    taxId: cleanText(data.taxId),
    businessGroupName: cleanText(data.businessGroupName),
    ownerName: cleanText(data.ownerName),

    contactName: cleanText(data.contactName),
    email: cleanText(data.email),
    phone: cleanText(data.phone),
    website: cleanText(data.website),

    logo: cleanText(data.logo || data.logoUrl),
    logoUrl: cleanText(data.logoUrl || data.logo),
    coverUrl: cleanText(data.coverUrl),

    primaryColor: cleanText(data.primaryColor) || "#024D48",
    secondaryColor: cleanText(data.secondaryColor) || "#1964A2",

    address: data.address || {},
    fiscalInfo: data.fiscalInfo || {},
    settings: data.settings || {},
    banking: data.banking || {},
    bankFileConfig: data.bankFileConfig || {},

    publicProfile: normalizePublicProfile(data.publicProfile),

    showInPublicLanding:
      data.showInPublicLanding === true ||
      data.showInPublicLanding === "true" ||
      data.showInPublicLanding === "1",

    notes: cleanText(data.notes),

    isDefault:
      data.isDefault === true ||
      data.isDefault === "true" ||
      data.isDefault === "1",

    isActive:
      data.isActive === undefined ||
      data.isActive === true ||
      data.isActive === "true" ||
      data.isActive === "1",
  };
};
