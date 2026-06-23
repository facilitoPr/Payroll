import EmployeeLoanProductConfig from "../../../model/employeeLoan/employeeLoanProductConfig";

export const validateClientPayload = async (payload: any) => {
  if (!payload.systemCode) {
    return "El código del sistema es requerido.";
  }

  if (!payload.name) {
    return "El nombre es requerido.";
  }

  if (payload.expiresAt && Number.isNaN(payload.expiresAt.getTime())) {
    return "La fecha de expiración no es válida.";
  }

  if (payload.allowedProductCodes.length > 0) {
    const productCount = await EmployeeLoanProductConfig.countDocuments({
      code: {
        $in: payload.allowedProductCodes,
      },
      isActive: true,
      isDeleted: false,
    });

    if (productCount !== payload.allowedProductCodes.length) {
      return "Uno o más productos permitidos no existen o no están activos.";
    }
  }

  return "";
};