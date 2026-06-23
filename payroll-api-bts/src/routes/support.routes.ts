import { Router } from "express";
import { check } from "express-validator";
import { validarFields } from "../middlewares/validate-fields";
import * as supportTicket from "../controllers/supportTicket.controller";
import { validateJWT } from "../middlewares/validate-jwt";

const supportRouter: any = Router();

supportRouter.use(validateJWT);

supportRouter.post(
  "/tickets",
  [
    check("title", "El título es obligatorio").not().isEmpty(),
    check("title", "El título debe tener máximo 120 caracteres").isLength({
      max: 120,
    }),
    check("description", "La descripción es obligatoria").not().isEmpty(),
    check(
      "description",
      "La descripción debe tener al menos 10 caracteres",
    ).isLength({ min: 10 }),
    validarFields,
  ],
  supportTicket.createSupportTicket,
);

supportRouter.get("/tickets", supportTicket.getMySupportTickets);
supportRouter.get("/tickets/:id", supportTicket.getSupportTicketById);

// admin
supportRouter.get("/admin/tickets", supportTicket.getAllSupportTickets);
supportRouter.get(
  "/admin/tickets/:id",
  supportTicket.getAdminSupportTicketById,
);
supportRouter.put(
  "/admin/tickets/:id",
  [
    check("status")
      .optional()
      .isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
      .withMessage("Estado inválido"),
    check("responseMessage")
      .optional({ nullable: true })
      .isString()
      .withMessage("La respuesta debe ser texto"),
    validarFields,
  ],
  supportTicket.updateSupportTicketStatus,
);

export default supportRouter;
