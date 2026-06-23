import { Types } from "mongoose";
import Role, { IRole } from "../../model/role";

export const getRoleByCode = async (value: string) => {
  try {
    const code: IRole | null = await Role.findOne({
      code: value,
    });

    if (code?._id) {
      return new Types.ObjectId(code._id);
    }

    return "";
  } catch (error) {
    console.log(error);
  }
};