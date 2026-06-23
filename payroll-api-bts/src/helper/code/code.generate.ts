import { cleanString } from "../string/string.clean";

export const generateCodeFromName = (name: string): string => {
  return cleanString(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};