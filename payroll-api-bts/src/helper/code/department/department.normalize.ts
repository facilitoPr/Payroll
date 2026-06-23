import { normalizeObjectIdArray } from "../../normalize";
import { toBool } from '../../parse';
import { cleanString } from "../../string/string.clean";
import { generateCodeFromName } from "../code.generate";

export const normalizeDepartmentPayload = (body: any) => {
  const name = cleanString(body.name);
  const code = generateCodeFromName(name);

  return {
    company: cleanString(body.company),
    name,
    code,
    description: cleanString(body.description),
    managers: normalizeObjectIdArray(body.managers),
    isActive:
      body.isActive === undefined ? true : toBool(body.isActive),
  };
};