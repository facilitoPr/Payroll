export const cleanString = (value: any): string => {
  return typeof value === "string" ? value.trim() : "";
};

export const cleanUpperString = (value: any): string => {
  return cleanString(value).toUpperCase();
};

export const cleanLowerString = (value: any): string => {
  return cleanString(value).toLowerCase();
};
