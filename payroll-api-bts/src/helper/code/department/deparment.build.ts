import { Request } from "express";
import { isValidObjectId } from "mongoose";
import { cleanString } from "../../string/string.clean";

export const buildDepartmentQuery = (req: Request, onlyActive = false) => {
  const {
    search = "",
    company = "",
    isActive = "",
  } = req.query as {
    search?: string;
    company?: string;
    isActive?: string;
  };

  const query: any = {
    isDeleted: false,
  };

  if (onlyActive) {
    query.isActive = true;
  } else {
    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;
  }

  if (company && isValidObjectId(company)) {
    query.company = company;
  }

  const term = cleanString(search);

  if (term) {
    query.$or = [
      { name: { $regex: term, $options: "i" } },
      { code: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
    ];
  }

  return query;
};
