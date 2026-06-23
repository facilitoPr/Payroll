import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

const validarFields = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const mappedErrors = errors.mapped();
    const firstErrorKey = Object.keys(mappedErrors)[0];
    const firstErrorMessage = mappedErrors[firstErrorKey]?.msg;

    res.status(400).json({
      ok: false,
      errors: mappedErrors,
      message: firstErrorMessage,
      mensaje: firstErrorMessage,
    });
    return;
  }

  next();
};

export { validarFields };
