import { Types } from "mongoose";
import User from "../../model/account/user";
import Company from "../../model/company";
import { getMongoIdString } from "../objectIds";

type RequiredFieldConfig = {
  path: string;
  label: string;
};

const REQUIRED_COMPANY_FIELDS: RequiredFieldConfig[] = [
  {
    path: "legalName",
    label: "Nombre legal de la empresa",
  },
  {
    path: "taxId",
    label: "RNC / Identificación fiscal",
  },
  {
    path: "phone",
    label: "Teléfono de la empresa",
  },
  {
    path: "address.fullAddress",
    label: "Dirección completa",
  },
  {
    path: "banking.originBankCode",
    label: "Código del banco origen",
  },
  {
    path: "banking.originBankDigit",
    label: "Dígito del banco origen",
  },
  {
    path: "banking.originAccountType",
    label: "Tipo de cuenta origen",
  },
  {
    path: "banking.originAccountNumber",
    label: "Número de cuenta origen",
  },
  {
    path: "banking.currencyCode",
    label: "Código de moneda bancaria",
  },
];

const REQUIRED_EMPLOYEE_BANK_FIELDS: RequiredFieldConfig[] = [
  {
    path: "idType",
    label: "Tipo de identificación",
  },
  {
    path: "idNumber",
    label: "Número de identificación",
  },
  {
    path: "bankCode",
    label: "Código del banco",
  },
  {
    path: "bankDigit",
    label: "Dígito del banco",
  },
  {
    path: "accountType",
    label: "Tipo de cuenta",
  },
  {
    path: "accountNumber",
    label: "Número de cuenta",
  },
];

const getNestedValue = (obj: any, path: string) => {
  if (!obj || !path) return undefined;

  return path.split(".").reduce((acc: any, key: string) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, obj);
};

const isEmptyValue = (value: any) => {
  if (value === null || value === undefined) return true;

  if (typeof value === "string") {
    return value.trim() === "";
  }

  return false;
};

const hasUsableAddress = (company: any) => {
  const fullAddress = getNestedValue(company, "address.fullAddress");

  if (!isEmptyValue(fullAddress)) return true;

  const street = getNestedValue(company, "address.street");
  const city = getNestedValue(company, "address.city");
  const state = getNestedValue(company, "address.state");
  const country = getNestedValue(company, "address.country");

  /**
   * Si no tiene fullAddress, aceptamos dirección compuesta.
   * Puedes endurecer esto si tu banco exige fullAddress.
   */
  return (
    !isEmptyValue(street) &&
    !isEmptyValue(city) &&
    !isEmptyValue(state) &&
    !isEmptyValue(country)
  );
};

export const getCompanyAddressString = (company: any) => {
  if (!company?.address) return "";

  if (typeof company.address === "string") {
    return company.address;
  }

  return (
    company.address.fullAddress ||
    [
      company.address.street,
      company.address.city,
      company.address.state,
      company.address.country,
      company.address.zipCode,
    ]
      .filter(Boolean)
      .join(", ")
  );
};

export const getCompanyPhoneString = (company: any) => {
  return (
    company?.phone || company?.contactPhone || company?.contact?.phone || ""
  );
};

export const getCompanyMissingFields = (company: any) => {
  const missing: string[] = [];

  for (const field of REQUIRED_COMPANY_FIELDS) {
    if (field.path === "address.fullAddress") {
      if (!hasUsableAddress(company)) {
        missing.push(field.path);
      }

      continue;
    }

    const value = getNestedValue(company, field.path);

    if (isEmptyValue(value)) {
      missing.push(field.path);
    }
  }

  return missing;
};

export const getCompanyMissingFieldsDetailed = (company: any) => {
  const missing = getCompanyMissingFields(company);

  return missing.map((path) => {
    const config = REQUIRED_COMPANY_FIELDS.find((field) => field.path === path);

    return {
      field: path,
      label: config?.label || path,
    };
  });
};

export const getEmployeeBankMissingFields = (payrollBank: any) => {
  const missing: string[] = [];

  for (const field of REQUIRED_EMPLOYEE_BANK_FIELDS) {
    const value = getNestedValue(payrollBank, field.path);

    if (isEmptyValue(value)) {
      missing.push(field.path);
    }
  }

  return missing;
};

export const getEmployeeBankMissingFieldsDetailed = (payrollBank: any) => {
  const missing = getEmployeeBankMissingFields(payrollBank);

  return missing.map((path) => {
    const config = REQUIRED_EMPLOYEE_BANK_FIELDS.find(
      (field) => field.path === path,
    );

    return {
      field: path,
      label: config?.label || path,
    };
  });
};

export const validateClosePeriodPrerequisites = async ({
  userIds,
  companyId,
  companyDoc = null,
  session = null,
}: {
  userIds: string[];
  companyId: string;
  companyDoc?: any;
  session?: any;
}) => {
  const cleanCompanyId = getMongoIdString(companyId);

  if (!cleanCompanyId) {
    return {
      notFound: [],
      company: null,
      companyMissing: ["company"],
      companyMissingDetailed: [
        {
          field: "company",
          label: "Empresa",
        },
      ],
      employeesMissingBank: [],
      employeesWrongCompany: [],
    };
  }

  const ids = (userIds || [])
    .map((id) => getMongoIdString(id))
    .filter(Boolean) as string[];

  const users = await User.find({
    _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
    isDeleted: { $ne: true },
  })
    .select("_id name email username company payrollBank")
    .session(session)
    .lean();

  const foundIds = new Set(users.map((user: any) => String(user._id)));

  const notFound = ids.filter((id) => !foundIds.has(id));

  const employeesWrongCompany = users.filter((user: any) => {
    return getMongoIdString(user.company) !== cleanCompanyId;
  });

  let company = companyDoc;

  if (!company) {
    company = await Company.findOne({
      _id: new Types.ObjectId(cleanCompanyId),
      isDeleted: { $ne: true },
    })
      .session(session)
      .lean();
  }

  const companyMissing = company
    ? getCompanyMissingFields(company)
    : ["company"];

  const companyMissingDetailed = company
    ? getCompanyMissingFieldsDetailed(company)
    : [
        {
          field: "company",
          label: "Empresa",
        },
      ];

  const employeesMissingBank = users
    .map((user: any) => {
      const missingFields = getEmployeeBankMissingFields(user.payrollBank);
      const missingFieldsDetailed = getEmployeeBankMissingFieldsDetailed(
        user.payrollBank,
      );

      return {
        userId: String(user._id),
        name: user.name || user.email || user.username || "Empleado",
        missingFields,
        missingFieldsDetailed,
      };
    })
    .filter((item) => item.missingFields.length > 0);

  return {
    notFound,
    company,
    companyMissing,
    companyMissingDetailed,
    employeesMissingBank,
    employeesWrongCompany: employeesWrongCompany.map((user: any) => ({
      userId: String(user._id),
      name: user.name || user.email || user.username || "Empleado",
      company: user.company,
    })),
  };
};