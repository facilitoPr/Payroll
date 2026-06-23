
import { MENU_POSITIONS, MENU_TYPES, MenuPosition, MenuType } from "../../model/menu";

export const normalizeMenuType = (value: any): MenuType => {
  const normalized = String(value || "ITEM")
    .trim()
    .toUpperCase() as MenuType;
  return MENU_TYPES.includes(normalized) ? normalized : "ITEM";
};

export const normalizeMenuPosition = (value: any): MenuPosition => {
  const normalized = String(value || "SIDEBAR")
    .trim()
    .toUpperCase() as MenuPosition;

  return MENU_POSITIONS.includes(normalized) ? normalized : "SIDEBAR";
};
