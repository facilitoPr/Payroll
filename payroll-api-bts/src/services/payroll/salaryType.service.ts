import { isValidObjectId } from "mongoose";
import SalaryType from "../../model/employee-payment-management/salaryType";

export const getSalaryTypeCodeMap = async (userDocs: any[]) =>  {
  const ids = Array.from(
    new Set(
      userDocs
        .map((u) => u.salaryType)
        .filter(Boolean)
        .map((x) => String(x)),
    ),
  );

  if (!ids.length) return new Map<string, string>();

  const salaryTypes = await SalaryType.find({ _id: { $in: ids } })
    .select("_id code")
    .lean();

  const map = new Map<string, string>();
  for (const st of salaryTypes as any[]) {
    map.set(String(st._id), String(st.code || ""));
  }
  return map;
}

export const resolveSalaryCode = async (userDoc: any) => {
  const populated = userDoc?.salaryType?.code;
  if (populated) return String(populated).toUpperCase();

  const id = userDoc?.salaryType;
  if (id && isValidObjectId(String(id))) {
    const st: any = await SalaryType.findById(id).select("code").lean();
    return String(st?.code || "").toUpperCase();
  }
  return "";
};