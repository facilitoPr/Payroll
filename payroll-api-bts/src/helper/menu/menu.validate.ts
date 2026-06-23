import { MenuType } from "../../model/menu";
import { toStr } from "../parse";

export const validateItemRoute = (
  type: MenuType,
  path?: string | null,
  externalPath?: string | null,
) => {
  if (type !== "ITEM") return null;

  const hasInternalPath = !!toStr(path);
  const hasExternalPath = !!toStr(externalPath);

  if (!hasInternalPath && !hasExternalPath) {
    return "Un menú de tipo ITEM debe tener path o externalPath";
  }

  return null;
};