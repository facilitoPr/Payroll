import { Types } from "mongoose";
import User from "../../model/account/user";
import Company from "../../model/company";
import { getMongoIdString } from "../objectIds";

export const resolvePayrollCompanyFromUsers = async ({
  userIds,
  requestedCompanyId,
  session = null,
}: {
  userIds: string[];
  requestedCompanyId?: any;
  session?: any;
}) => {
  const users = await User.find({
    _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
    isDeleted: { $ne: true },
  })
    .select("_id name company")
    .session(session)
    .lean();

  if (!users.length) {
    return {
      ok: false,
      status: 400,
      mensaje: "No se encontraron empleados válidos para resolver la empresa.",
      companyId: "",
      company: null,
    };
  }

  const usersWithoutCompany = users.filter((user: any) => {
    return !getMongoIdString(user.company);
  });

  if (usersWithoutCompany.length) {
    return {
      ok: false,
      status: 409,
      mensaje: "Hay empleados sin empresa asignada.",
      companyId: "",
      company: null,
      employees: usersWithoutCompany.map((user: any) => ({
        userId: String(user._id),
        name: user.name || "Empleado",
        missingFields: ["company"],
      })),
    };
  }

  const companyIds = Array.from(
    new Set(
      users
        .map((user: any) => getMongoIdString(user.company))
        .filter(Boolean) as string[],
    ),
  );

  if (companyIds.length !== 1) {
    return {
      ok: false,
      status: 409,
      mensaje:
        "No se puede cerrar una misma nómina con empleados de empresas diferentes.",
      companyId: "",
      company: null,
      companyIds,
    };
  }

  const realCompanyId = companyIds[0];
  const requested = getMongoIdString(requestedCompanyId);

  if (requested && requested !== realCompanyId) {
    return {
      ok: false,
      status: 409,
      mensaje:
        "La empresa enviada no coincide con la empresa real de los empleados.",
      companyId: realCompanyId,
      company: null,
      requestedCompanyId: requested,
    };
  }

  const company = await Company.findOne({
    _id: new Types.ObjectId(realCompanyId),
    isDeleted: { $ne: true },
  })
    .session(session)
    .lean();

  if (!company) {
    return {
      ok: false,
      status: 409,
      mensaje: "La empresa de los empleados no existe o está eliminada.",
      companyId: realCompanyId,
      company: null,
    };
  }

  return {
    ok: true,
    status: 200,
    mensaje: "",
    companyId: realCompanyId,
    company,
  };
};