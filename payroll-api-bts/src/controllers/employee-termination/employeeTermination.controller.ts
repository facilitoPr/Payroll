import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import EmployeeTermination from "../../model/employee-termination/employeeTermination";
import {
  createEmployeeTermination,
  findActiveLaborTerminationPolicyRD,
  generateEmployeeTerminationBankFile,
  getEmployeeTerminationLoanSummary,
  markEmployeeTerminationAsPaid,
  previewEmployeeTermination,
  recalculateEmployeeTermination,
} from "../../services/employee-termination/employeeTermination.service";
import TerminationPayment from "../../model/employee-termination/terminationPayment";
import { escapeRegex } from "../../helper/parse";

const STATUS_PRESENTATION: Record<string, any> = {
  DRAFT: {
    label: "Borrador",
    summaryLabel: "Borradores",
    color: "grey-9",
    background: "grey-3",
    icon: "edit_note",
    actions: ["RECALCULATE", "SUBMIT", "CANCEL"],
    primaryAction: "SUBMIT",
    showInSummary: false,
  },

  CALCULATED: {
    label: "Calculada",
    summaryLabel: "Calculadas",
    color: "primary",
    background: "blue-1",
    icon: "calculate",
    actions: ["RECALCULATE", "SUBMIT", "CANCEL"],
    primaryAction: "SUBMIT",
    showInSummary: true,
  },

  PENDING_APPROVAL: {
    label: "Pendiente de aprobación",
    summaryLabel: "Pendientes",
    color: "orange-10",
    background: "orange-1",
    icon: "pending_actions",
    actions: ["RECALCULATE", "APPROVE", "CANCEL"],
    primaryAction: "APPROVE",
    showInSummary: true,
  },

  APPROVED: {
    label: "Aprobada",
    summaryLabel: "Aprobadas",
    color: "positive",
    background: "green-1",
    icon: "verified",
    actions: ["PAY", "CANCEL"],
    primaryAction: "PAY",
    showInSummary: true,
  },

  PAID: {
    label: "Pagada",
    summaryLabel: "Pagadas",
    color: "teal-9",
    background: "teal-1",
    icon: "payments",
    actions: [],
    primaryAction: null,
    showInSummary: true,
  },

  CANCELLED: {
    label: "Cancelada",
    summaryLabel: "Canceladas",
    color: "negative",
    background: "red-1",
    icon: "cancel",
    actions: [],
    primaryAction: null,
    showInSummary: false,
  },
};

const ACTION_PRESENTATION = [
  {
    code: "RECALCULATE",
    label: "Recalcular",
    title: "Recalcular desvinculación",
    subtitle: "Se actualizarán salarios, vacaciones, deducciones y préstamos.",
    icon: "refresh",
    color: "primary",
    confirmLabel: "Recalcular",
  },
  {
    code: "SUBMIT",
    label: "Enviar a aprobación",
    title: "Enviar a aprobación",
    subtitle: "La desvinculación quedará pendiente de revisión.",
    icon: "send",
    color: "primary",
    confirmLabel: "Enviar a aprobación",
  },
  {
    code: "APPROVE",
    label: "Aprobar",
    title: "Aprobar desvinculación",
    subtitle: "Confirma que revisaste el cálculo y sus deducciones.",
    icon: "verified",
    color: "positive",
    confirmLabel: "Aprobar",
  },
  {
    code: "PAY",
    label: "Registrar pago",
    title: "Registrar pago",
    subtitle: "Completa la información financiera de la liquidación.",
    icon: "payments",
    color: "teal",
    confirmLabel: "Registrar pago",
  },
  {
    code: "CANCEL",
    label: "Cancelar",
    title: "Cancelar desvinculación",
    subtitle: "La desvinculación quedará cancelada.",
    icon: "cancel",
    color: "negative",
    confirmLabel: "Cancelar desvinculación",
  },
];

const PAYMENT_METHOD_PRESENTATION: Record<string, string> = {
  // PAYROLL: "Nómina",
  BANK_TRANSFER: "Transferencia bancaria",
  // CHECK: "Cheque",
  // CASH: "Efectivo",
  OTHER: "Otro",
};

const humanizeCode = (value: unknown) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
};

const getSchemaEnumValues = (model: any, path: string): string[] => {
  const schemaPath: any = model.schema.path(path);

  return Array.isArray(schemaPath?.enumValues)
    ? schemaPath.enumValues.map(String)
    : [];
};

const toDateRangeEnd = (value: unknown) => {
  if (!value) return null;

  const raw = String(value);
  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
};


const getAuthUserId = (req: any) => {
  return (
    req.user?._id ||
    req.user?.id ||
    req.uid ||
    req.userId ||
    req.body?.createdBy ||
    null
  );
};

const handleError = (res: Response, error: any) => {
  console.error("[EmployeeTerminationController]", error);

  return res.status(error.status || 500).json({
    ok: false,
    mensaje: error.message || "Error interno del servidor.",
    message: error.message || "Internal server error.",
  });
};

const previewTermination = async (req: Request, res: Response) => {
  try {
    const result = await previewEmployeeTermination({
      ...req.body,
      calculatedBy: getAuthUserId(req),
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Vista previa generada correctamente.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const createTermination = async (req: Request, res: Response) => {
  try {
    const result = await createEmployeeTermination({
      ...req.body,
      calculatedBy: getAuthUserId(req),
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Desvinculación creada correctamente.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const listTerminations = async (req: Request, res: Response) => {
  try {
    const {
      company,
      employee,
      status,
      terminationType,
      from,
      to,
      search,
      hasLoans,
      minimumNet,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      descending = "true",
    } = req.query;

    const filter: any = {
      isDeleted: false,
    };

    if (company && isValidObjectId(String(company))) {
      filter.company = company;
    }

    if (employee && isValidObjectId(String(employee))) {
      filter.employee = employee;
    }

    if (status) {
      filter.status = String(status);
    }

    if (terminationType) {
      filter.terminationType = String(terminationType);
    }

    if (from || to) {
      filter.terminationDate = {};

      if (from) {
        const fromDate = new Date(String(from));

        if (!Number.isNaN(fromDate.getTime())) {
          filter.terminationDate.$gte = fromDate;
        }
      }

      if (to) {
        const toDate = toDateRangeEnd(to);

        if (toDate) {
          filter.terminationDate.$lte = toDate;
        }
      }
    }

    if (
      hasLoans !== undefined &&
      hasLoans !== null &&
      String(hasLoans) !== ""
    ) {
      if (String(hasLoans) === "true") {
        filter["loanSnapshot.hasActiveLoans"] = true;
      }

      if (String(hasLoans) === "false") {
        filter["loanSnapshot.hasActiveLoans"] = {
          $ne: true,
        };
      }
    }

    if (Number(minimumNet || 0) > 0) {
      filter["calculation.netTotal"] = {
        $gte: Number(minimumNet),
      };
    }

    if (search) {
      const normalizedSearch = escapeRegex(String(search).trim());

      filter.$or = [
        {
          "employeeSnapshot.fullName": {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          "employeeSnapshot.email": {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          "employeeSnapshot.idNumber": {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          "employeeSnapshot.code": {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          reason: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
      ];
    }

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const allowedSortFields = new Set([
      "createdAt",
      "updatedAt",
      "terminationDate",
      "terminationType",
      "status",
      "calculation.totalIncome",
      "calculation.netTotal",
    ]);

    const normalizedSortBy = allowedSortFields.has(String(sortBy))
      ? String(sortBy)
      : "createdAt";

    const sortDirection = String(descending) === "false" ? 1 : -1;

    const sort: Record<string, 1 | -1> = {
      [normalizedSortBy]: sortDirection,
      _id: -1,
    };

    /*
     * El resumen conserva los demás filtros,
     * pero no limita por estado para poder mostrar
     * todas las tarjetas.
     */
    const summaryFilter = {
      ...filter,
    };

    delete summaryFilter.status;

    const [items, total, summaryGroups] = await Promise.all([
      EmployeeTermination.find(filter)
        .populate("employee", "name email idNumber code phone img hiringDate")
        .populate("company", "name legalName commercialName")
        .populate("approvedBy", "name email")
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      EmployeeTermination.countDocuments(filter),

      EmployeeTermination.aggregate([
        {
          $match: summaryFilter,
        },
        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },

            totalNet: {
              $sum: {
                $ifNull: ["$calculation.netTotal", 0],
              },
            },
          },
        },
      ]),
    ]);

    const byStatus: Record<string, number> = {};

    let summaryTotal = 0;
    let summaryTotalNet = 0;

    for (const group of summaryGroups) {
      const code = String(group._id || "");

      byStatus[code] = Number(group.count || 0);

      summaryTotal += Number(group.count || 0);
      summaryTotalNet += Number(group.totalNet || 0);
    }

    return res.status(200).json({
      ok: true,

      data: {
        items,

        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(total / limitNumber),
        },

        summary: {
          total: summaryTotal,
          totalNet: summaryTotalNet,
          byStatus,
        },
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getTerminationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const [termination, payment] = await Promise.all([
      EmployeeTermination.findOne({
        _id: id,
        isDeleted: false,
      })
        .populate(
          "employee",
          "name email idNumber code phone img hiringDate employmentStatus jobPosition",
        )
        .populate("company", "name legalName commercialName")
        .populate("policy")
        .populate("approvedBy", "name email")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .populate("cancelledBy", "name email")
        .populate("calculation.calculatedBy", "name email")
        .lean(),

      TerminationPayment.findOne({
        termination: id,
        isDeleted: false,
      })
        .sort({
          createdAt: -1,
        })
        .populate("createdBy", "name email")
        .lean(),
    ]);

    if (!termination) {
      return res.status(404).json({
        ok: false,
        mensaje: "Desvinculación no encontrada.",
      });
    }

    return res.status(200).json({
      ok: true,

      data: {
        ...termination,
        payment: payment || null,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const recalculateTermination = async (req: Request, res: Response) => {
  try {
    const result = await recalculateEmployeeTermination(
      req.params.id,
      req.body,
      getAuthUserId(req),
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Desvinculación recalculada correctamente.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const replaceManualLines = async (req: Request, res: Response) => {
  try {
    const result = await recalculateEmployeeTermination(
      req.params.id,
      {
        manualLines: req.body.manualLines || [],
      },
      getAuthUserId(req),
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Ajustes manuales actualizados correctamente.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const submitForApproval = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const termination: any = await EmployeeTermination.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!termination) {
      return res.status(404).json({
        ok: false,
        mensaje: "Desvinculación no encontrada.",
      });
    }

    if (!["DRAFT", "CALCULATED"].includes(termination.status)) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Solo se pueden enviar a aprobación desvinculaciones en borrador o calculadas.",
      });
    }

    termination.status = "PENDING_APPROVAL";
    termination.updatedBy = getAuthUserId(req);

    await termination.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Desvinculación enviada a aprobación.",
      data: termination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const approveTermination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const termination: any = await EmployeeTermination.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!termination) {
      return res.status(404).json({
        ok: false,
        mensaje: "Desvinculación no encontrada.",
      });
    }

    if (!["CALCULATED", "PENDING_APPROVAL"].includes(termination.status)) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "Solo se puede aprobar una desvinculación calculada o pendiente de aprobación.",
      });
    }

    termination.status = "APPROVED";
    termination.approvedBy = getAuthUserId(req);
    termination.approvedAt = new Date();
    termination.updatedBy = getAuthUserId(req);

    await termination.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Desvinculación aprobada correctamente.",
      data: termination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const payTermination = async (req: Request, res: Response) => {
  try {
    const result = await markEmployeeTerminationAsPaid(
      req.params.id,
      req.body,
      getAuthUserId(req),
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Desvinculación marcada como pagada correctamente.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const generateTerminationBankFile = async (req: Request, res: Response) => {
  try {
    const result = await generateEmployeeTerminationBankFile(
      req.params.id,
      req.body,
      getAuthUserId(req),
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Archivo TXT bancario generado correctamente.",
      data: result,
      bankFile: result.bankFile,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const cancelTermination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const termination: any = await EmployeeTermination.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!termination) {
      return res.status(404).json({
        ok: false,
        mensaje: "Desvinculación no encontrada.",
      });
    }

    if (termination.status === "PAID") {
      return res.status(400).json({
        ok: false,
        mensaje: "No se puede cancelar una desvinculación ya pagada.",
      });
    }

    termination.status = "CANCELLED";
    termination.cancelledBy = getAuthUserId(req);
    termination.cancelledAt = new Date();
    termination.cancellationReason =
      req.body.cancellationReason || req.body.reason || "";
    termination.updatedBy = getAuthUserId(req);

    await termination.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Desvinculación cancelada correctamente.",
      data: termination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteTermination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID inválido.",
      });
    }

    const termination: any = await EmployeeTermination.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!termination) {
      return res.status(404).json({
        ok: false,
        mensaje: "Desvinculación no encontrada.",
      });
    }

    if (termination.status === "PAID") {
      return res.status(400).json({
        ok: false,
        mensaje: "No se puede eliminar una desvinculación pagada.",
      });
    }

    termination.isDeleted = true;
    termination.updatedBy = getAuthUserId(req);

    await termination.save();

    return res.status(200).json({
      ok: true,
      mensaje: "Desvinculación eliminada correctamente.",
      data: termination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getTerminationLoanSummary = async (req: Request, res: Response) => {
  try {
    const result = await getEmployeeTerminationLoanSummary({
      companyId: String(req.query.companyId || ""),
      employeeId: String(req.params.employeeId || ""),
    });

    return res.status(200).json({
      ok: true,
      mensaje: result.hasActiveLoans
        ? "Préstamos activos encontrados."
        : "El empleado no tiene préstamos activos.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getTerminationCatalogs = async (req: Request, res: Response) => {
  try {
    const company = req.query.company ? String(req.query.company) : null;

    const policy = await findActiveLaborTerminationPolicyRD({
      company: company && isValidObjectId(company) ? company : null,
      date: new Date(),
    });

    const statusCodes = getSchemaEnumValues(EmployeeTermination, "status");

    const paymentMethodCodes = getSchemaEnumValues(
      TerminationPayment,
      "paymentMethod",
    );

    let terminationTypes: any[] = [];

    if (policy?.terminationTypeRules?.length) {
      terminationTypes = policy.terminationTypeRules
        .filter((item: any) => item?.isActive !== false)
        .filter((item: any) => item?.code)
        .map((item: any) => ({
          label: item.label || item.name || humanizeCode(item.code),

          value: String(item.code),

          description: item.description || "",

          requiresReason: item.requiresReason === true,

          requiresApproval: item.requiresApproval !== false,

          rule: item,
        }));
    } else {
      const distinctFilter: any = {
        isDeleted: false,
      };

      if (company && isValidObjectId(company)) {
        distinctFilter.company = company;
      }

      const distinctTypes = await EmployeeTermination.distinct(
        "terminationType",
        distinctFilter,
      );

      terminationTypes = distinctTypes.filter(Boolean).map((code) => ({
        label: humanizeCode(code),
        value: String(code),
        description: "",
      }));
    }

    const statuses = statusCodes.map((code) => ({
      value: code,

      label: STATUS_PRESENTATION[code]?.label || humanizeCode(code),

      summaryLabel:
        STATUS_PRESENTATION[code]?.summaryLabel || humanizeCode(code),

      color: STATUS_PRESENTATION[code]?.color || "grey-9",

      background: STATUS_PRESENTATION[code]?.background || "grey-3",

      icon: STATUS_PRESENTATION[code]?.icon || "label",

      actions: STATUS_PRESENTATION[code]?.actions || [],

      primaryAction: STATUS_PRESENTATION[code]?.primaryAction || null,

      showInSummary: STATUS_PRESENTATION[code]?.showInSummary === true,
    }));

    const paymentMethods = paymentMethodCodes.map((code) => ({
      label: PAYMENT_METHOD_PRESENTATION[code] || humanizeCode(code),

      value: code,
    }));

    return res.status(200).json({
      ok: true,

      data: {
        policy: policy
          ? {
              _id: policy._id,
              name:
                (policy as any).name ||
                (policy as any).code ||
                "Política de desvinculación",
              code: (policy as any).code || "",
              version: policy.version,
              year: policy.year,
              effectiveFrom: policy.effectiveFrom,
              effectiveTo: policy.effectiveTo,
            }
          : null,

        statuses,
        terminationTypes,
        paymentMethods,

        loanFilters: [
          {
            label: "Con préstamos",
            value: true,
          },
          {
            label: "Sin préstamos",
            value: false,
          },
        ],

        actions: ACTION_PRESENTATION,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export {
  previewTermination,
  createTermination,
  listTerminations,
  getTerminationById,
  recalculateTermination,
  replaceManualLines,
  submitForApproval,
  approveTermination,
  payTermination,
  generateTerminationBankFile,
  cancelTermination,
  deleteTermination,
  getTerminationLoanSummary,
  getTerminationCatalogs,
};
