import Company from "../../model/company";

export const setOnlyOneDefaultCompany = async (companyId: any) => {
  await Company.updateMany(
    {
      _id: { $ne: companyId },
      isDeleted: false,
    },
    {
      $set: {
        isDefault: false,
      },
    },
  );
};

export const validateCompanyUniqueFields = async ({
  companyId,
  code,
  taxId,
}: {
  companyId?: string;
  code: string;
  taxId?: string;
}) => {
  const baseQuery: any = {
    isDeleted: false,
  };

  if (companyId) {
    baseQuery._id = { $ne: companyId };
  }

  const codeExists = await Company.findOne({
    ...baseQuery,
    code,
  });

  if (codeExists) {
    return {
      ok: false,
      mensaje: companyId
        ? "Ya existe otra compañía con ese código."
        : "Ya existe una compañía con ese código.",
    };
  }

  if (taxId) {
    const taxIdExists = await Company.findOne({
      ...baseQuery,
      taxId,
    });

    if (taxIdExists) {
      return {
        ok: false,
        mensaje: companyId
          ? "Ya existe otra compañía con ese RNC / Tax ID."
          : "Ya existe una compañía con ese RNC / Tax ID.",
      };
    }
  }

  return {
    ok: true,
    mensaje: "",
  };
};