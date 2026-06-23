import * as jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { IRole } from "../../model/role";
import { IUser } from "../../model/account/user";

const jwtTime = String(process.env.JTW_TIME || "15m");

export type tokenData = {
  uid: Types.ObjectId;

  roleId?: string | null;
  roleCode?: string | null;

  sid: string;
  iat?: number;
  exp?: number;
};

const isPopulatedRole = (
  role?: Types.ObjectId | IRole | null,
): role is IRole => {
  return !!role && !(role instanceof Types.ObjectId) && "code" in role;
};

export const generateJWT = (account: IUser, sessionId: string) => {
  return new Promise<string>((resolve, reject) => {
    const secretKey = process.env.SECRETORPRIVATEKEY;

    if (!secretKey) {
      return reject("Secret key is not defined");
    }

    let roleId: string | null =
      account.rol instanceof Types.ObjectId
        ? String(account.rol)
        : String(account.rol._id);

    let roleCode: string | null = isPopulatedRole(account.rol)
      ? account.rol.code
      : null;

    const payload: tokenData = {
      uid: account._id,
      roleId,
      roleCode,
      sid: sessionId,
    };

    jwt.sign(
      payload,
      secretKey,
      { expiresIn: jwtTime } as any,
      (err: any, token: string | undefined) => {
        if (err || !token) return reject("No se pudo generar el token");
        resolve(token);
      },
    );
  });
};
