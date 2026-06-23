import { isValidObjectId } from "mongoose";
import Menu from "../model/menu";

export const getValidParentMenu = async (
  parentId?: string | null,
  currentMenuId?: string | null,
) => {
  if (!parentId) return null;

  if (!isValidObjectId(parentId)) {
    throw new Error("El menú padre es inválido");
  }

  if (currentMenuId && String(parentId) === String(currentMenuId)) {
    throw new Error("Un menú no puede ser padre de sí mismo");
  }

  const parentMenu: any = await Menu.findOne({
    _id: parentId,
    isDeleted: { $ne: true },
  });

  if (!parentMenu) {
    throw new Error("El menú padre no existe");
  }

  if (parentMenu.type === "DIVIDER") {
    throw new Error("Un menú divisor no puede ser usado como padre");
  }

  if (currentMenuId) {
    let cursor: any = parentMenu;

    while (cursor?.parent) {
      if (String(cursor.parent) === String(currentMenuId)) {
        throw new Error("No se puede asignar un descendiente como menú padre");
      }

      cursor = await Menu.findById(cursor.parent).select("parent");
    }
  }

  return parentMenu;
};
