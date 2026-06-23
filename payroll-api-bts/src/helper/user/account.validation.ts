import { IUser } from "../../model/account/user";

export const isUserActive = (account: IUser | any): boolean => {
  if (!account) return false;

  const activeFlag =
    typeof account.isActive === "boolean"
      ? account.isActive
      : typeof account.isActived === "boolean"
        ? account.isActived
        : true;

  const deletedFlag =
    typeof account.isDeleted === "boolean" ? account.isDeleted : false;

  return activeFlag === true && deletedFlag === false;
};
