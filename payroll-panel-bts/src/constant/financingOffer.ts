export const interestTypeOptions = [
  { label: "Fija", value: "FIXED" },
  { label: "Variable", value: "VARIABLE" },
];

export const availableTerms = [12, 24, 36, 48, 60, 72, 84].map((v) => ({
  label: `${v} meses`,
  value: v,
}));

export const availableDocuments = [
  "Copia de cédula",
  "Carta de trabajo",
  "Comprobantes de ingresos",
  "Estados de cuenta bancarios",
  "Declaración de impuestos",
  "Referencia bancaria",
  "Cotización del vehículo",
  "Matrícula del vehículo",
  "Seguro del vehículo",
];

export const availableConditions = [
  "Sujeto a verificación de crédito",
  "Sujeto a validación de ingresos",
  "Sujeto a tasación de la unidad",
  "Sujeto a confirmación de empleo",
  "Sujeto a revisión de documentos originales",
  "Requiere firma presencial en sucursal",
];
