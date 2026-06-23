# CODEX_CONTEXT.md

## Proyecto

Sistema de nómina / recursos humanos con:

- Empleados.
- Nómina.
- Vacaciones.
- Préstamos a empleados.
- Desvinculación laboral.
- Generación de archivos TXT bancarios.
- Archivo muerto de empleados desvinculados.

Stack:

- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB.
- Frontend: Vue 3 + Quasar.
- Fechas: usar `America/Santo_Domingo`.

---

# 1. Módulo de préstamos de empleados

## Regla actual del préstamo

El empleado ya no debe escribir el monto que quiere solicitar.

Ahora el empleado solo selecciona la cantidad de días de vacaciones que desea usar para el préstamo.

El backend debe calcular automáticamente el monto equivalente:

```ts
requestedAmount = guaranteedDays * vacationDayAmount;
```

El frontend puede mostrar el monto calculado, pero no debe permitir editarlo.

---

## Valor de cada día

El valor del día depende de la configuración del producto:

```ts
vacationDayValueMode:
  | "DAILY_SALARY"
  | "CUSTOM_AMOUNT"
  | "NONE";
```

Reglas:

```ts
if vacationDayValueMode === "DAILY_SALARY":
  vacationDayAmount = salarySnapshot.dailySalary;

if vacationDayValueMode === "CUSTOM_AMOUNT":
  vacationDayAmount = productConfig.customVacationDayAmount;

if vacationDayValueMode === "NONE":
  no debe permitir préstamo bajo el flujo por días.
```

---

## Configuración del producto de préstamo

Modelo:

```ts
EmployeeLoanProductConfig;
```

Campos relevantes:

```ts
minLoanAmount: number;
maxLoanAmount: number;
minInstallments: number;
maxInstallments: number;
interestRate: number;
interestRateType: "ANNUAL" | "MONTHLY" | "FIXED";
defaultPaymentFrequency:
  | "WEEKLY"
  | "BIWEEKLY"
  | "SEMIMONTHLY"
  | "MONTHLY";
distributeInterestInInstallments: boolean;
amortizePrincipal: boolean;
minimumVacationDaysRequired: number;
maxVacationDaysGuaranteePercent: number;
maxVacationGuaranteeDays: number;
vacationDayValueMode:
  | "DAILY_SALARY"
  | "CUSTOM_AMOUNT"
  | "NONE";
customVacationDayAmount?: number;
allowUseAllVacationDays: boolean;
allowWithoutVacationGuarantee: boolean;
```

Se agregó:

```ts
maxVacationGuaranteeDays: number;
```

Regla:

- Si `maxVacationGuaranteeDays > 0`, funciona como tope fijo de días.
- Si `maxVacationGuaranteeDays === 0`, no aplica tope fijo y solo se usa el porcentaje.

---

## Máximo real de días para préstamo

El máximo real de días debe calcularse como el menor valor entre:

```ts
availableForLoanDays
maxGuaranteeDaysByPercent
maxVacationGuaranteeDays, si es mayor que 0
maxDaysByProductAmount
```

Donde:

```ts
maxGuaranteeDaysByPercent = Math.floor(
  (availableForLoanDays * maxVacationDaysGuaranteePercent) / 100,
);
```

Y:

```ts
maxDaysByProductAmount = Math.floor(maxLoanAmount / vacationDayAmount);
```

Cuando `maxLoanAmount` sea 0 o no exista, no debe limitar por monto máximo.

---

## Seguridad obligatoria en backend

Nunca confiar en `requestedAmount` enviado por frontend.

Aunque el frontend mande `requestedAmount`, el backend debe ignorarlo y recalcular:

```ts
const requestedAmount = round2(
  calculateVacationGuaranteeAmount({
    guaranteedDays,
    dailySalary: salarySnapshot.dailySalary,
    productConfig,
  }),
);
```

Esto aplica en:

- Cotización del préstamo.
- Firma del contrato.
- Creación final de la solicitud.
- Cualquier endpoint que genere amortización.

---

## Payload esperado desde frontend

```ts
{
  guaranteedDays: number;
  requestedInstallments: number;
  purpose?: string;
  employeeComment?: string;
}
```

No depender de:

```ts
requestedAmount;
```

Aunque venga en el body.

---

## Validaciones obligatorias del préstamo

Validar:

1. `guaranteedDays` requerido.
2. `guaranteedDays` mayor que 0.
3. `guaranteedDays` entero.
4. `guaranteedDays` no puede superar `maxGuaranteeDays`.
5. `guaranteedDays` no puede superar `availableForLoanDays`.
6. El monto calculado debe ser mayor o igual a `minLoanAmount`.
7. El monto calculado no debe superar `maxLoanAmount`.
8. Las cuotas deben estar entre `minInstallments` y `maxInstallments`.
9. Si la frecuencia de pago del empleado no es quincenal o mensual, no permitir cotizar ni firmar préstamo.

---

## Respuesta esperada de elegibilidad

La elegibilidad debe incluir:

```ts
eligibility: {
  maxGuaranteeDaysByPercent: number;
  maxVacationGuaranteeDays: number;
  maxGuaranteeDays: number;
  vacationDayAmount: number;
  maxGuaranteeAmount: number;
  maxAllowedAmount: number;
  minimumGuaranteeDaysByAmount: number;
  canRequestLoan: boolean;

  minLoanAmount: number;
  maxLoanAmount: number;
  minInstallments: number;
  maxInstallments: number;

  availableForLoanDays: number;
  accruedPaymentDays: number;
  payableVacationDays: number;
  netPayableVacationDays: number;

  productConfigSource?: string;
}
```

---

# 2. Módulo de vacaciones

## Separación entre vacaciones disfrutables y garantía de préstamo

Antes, cuando un empleado solicitaba un préstamo, se reservaban días y eso reducía sus días disponibles para disfrutar vacaciones.

Eso debe cambiar.

Regla actual:

- La reserva del préstamo sigue existiendo.
- La reserva representa garantía económica.
- La reserva no debe bloquear el disfrute normal de vacaciones.
- El empleado debe poder disfrutar sus días normales aunque tenga días reservados por préstamo.

---

## Modelo de balance de vacaciones

Modelo:

```ts
EmployeeVacationBalance;
```

Campos relevantes:

```ts
enjoyableDays: number;
accruedPaymentDays: number;
carryOverDays: number;
adjustmentDays: number;
usedDays: number;
reservedDays: number;

availableDays: number;
availableForLoanDays: number;
payableVacationDays: number;
netPayableVacationDays: number;
```

---

## Fórmulas correctas

```ts
const enjoyableBase =
  Number(enjoyableDays || 0) +
  Number(carryOverDays || 0) +
  Number(adjustmentDays || 0);

const paymentBase =
  Number(accruedPaymentDays || 0) +
  Number(carryOverDays || 0) +
  Number(adjustmentDays || 0);

const usedDays = Number(usedDays || 0);
const reservedDays = Number(reservedDays || 0);

availableDays = Math.max(0, enjoyableBase - usedDays);

availableForLoanDays = Math.max(0, paymentBase - usedDays - reservedDays);

payableVacationDays = Math.max(0, paymentBase - usedDays);

netPayableVacationDays = Math.max(0, paymentBase - usedDays - reservedDays);
```

Interpretación:

```ts
availableDays:
  días que puede disfrutar.
  No descuenta reservas de préstamo.

availableForLoanDays:
  días disponibles para garantizar otro préstamo.
  Sí descuenta reservas activas.

payableVacationDays:
  días pagables brutos.

netPayableVacationDays:
  días pagables netos considerando garantías activas.
```

Ejemplo:

```ts
enjoyableDays = 14;
usedDays = 0;
reservedDays = 11;

availableDays = 14;
availableForLoanDays = 3;
payableVacationDays = 14;
netPayableVacationDays = 3;
```

---

## Solicitud de vacaciones

Para validar días que el empleado puede disfrutar, usar:

```ts
balance.availableDays;
```

No usar:

```ts
balance.availableForLoanDays;
```

para vacaciones normales.

---

## Solicitud de préstamo

Para validar días que el empleado puede usar como garantía, usar:

```ts
balance.availableForLoanDays;
```

Así se evita que los mismos días garanticen varios préstamos.

---

## Reserva del préstamo

Modelo:

```ts
VacationDayReservation;
```

La reserva debe seguir existiendo.

Estados:

```ts
"ACTIVE";
"RELEASED";
"CONSUMED";
"CANCELLED";
```

Sources:

```ts
"LOAN";
"MANUAL";
"OTHER";
"EMPLOYEE_LOAN_REQUEST";
```

Cuando se crea o firma un préstamo:

```ts
balance.reservedDays += guaranteedDays;
```

Pero eso no debe reducir:

```ts
availableDays;
```

Solo debe reducir:

```ts
availableForLoanDays;
netPayableVacationDays;
```

Cuando se cancela, libera o paga el préstamo:

```ts
balance.reservedDays = Math.max(
  0,
  balance.reservedDays - reservation.reservedDays,
);
```

---

# 3. Amortización según calendario de pago

## Regla

Las fechas de la tabla de amortización deben basarse en los días de pago reales del empleado.

No usar una fecha genérica sumando 15, 30 o X días.

---

## Frecuencias aceptadas

Aceptar solamente:

```ts
"BIWEEKLY";
"SEMIMONTHLY";
"MONTHLY";
```

Para este negocio:

```ts
BIWEEKLY y SEMIMONTHLY = días 15 y 30
MONTHLY = día mensual configurado
```

---

## Frecuencias no aceptadas

No permitir préstamos para:

```ts
"WEEKLY";
"DAILY";
"HOURLY";
"UNKNOWN";
```

Mensaje sugerido:

```ts
"Los préstamos solo están disponibles para empleados con pago quincenal o mensual.";
```

---

## Pago quincenal

Si el empleado cobra quincenal:

```ts
paymentDays = [15, 30];
```

Las cuotas deben caer en los próximos días 15 y 30.

Si el mes no tiene día 30, usar el último día del mes.

Ejemplo:

Si hoy es 17 de junio de 2026:

```ts
Cuota 1: 30/06/2026
Cuota 2: 15/07/2026
Cuota 3: 30/07/2026
Cuota 4: 15/08/2026
```

---

## Pago mensual

Si el empleado cobra mensual:

```ts
paymentDays = [25];
```

Las cuotas deben caer en el día 25 de cada mes.

Si el mes no tiene ese día, usar el último día del mes.

---

## Payment schedule esperado

El empleado debe cargar su calendario de pago.

Ideal:

```ts
employee.paymentSchedule.paymentDays;
```

Ejemplos:

```ts
// Quincenal
paymentDays: [15, 30];

// Mensual
paymentDays: [25];
```

También se puede soportar compatibilidad con campos existentes:

```ts
monthlyPaymentDay;
monthlyPayDay;
paymentDay;
payDay;
dayOfMonth;
monthlyDay;
salaryPaymentDay;
paymentDays;
payDays;
days;
daysOfMonth;
```

---

## Respuesta esperada de `paymentSchedule`

La elegibilidad debe incluir:

```ts
paymentSchedule: {
  supported: boolean;
  frequencyCode: string;
  normalizedFrequency:
    | "BIWEEKLY"
    | "SEMIMONTHLY"
    | "MONTHLY"
    | "UNSUPPORTED";
  frequencyLabel: string;
  paymentsPerYear: number;
  paymentDays: number[];
  monthlyPaymentDay: number | null;
  message: string;
}
```

---

## Respuesta esperada de amortización

Cada cuota debe incluir:

```ts
{
  installmentNumber: number;
  dueDate: Date;
  openingBalance: number;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  closingBalance: number;
  status: "PENDING";
}
```

---

# 4. Frontend de solicitud de préstamo

Componente:

```ts
EmployeeLoanCreateRequestDialog.vue;
```

Reglas:

1. No mostrar input editable para monto solicitado.
2. Mostrar input de días.
3. Mostrar monto equivalente calculado readonly.
4. Validar máximo de días.
5. Validar mínimo de días para alcanzar `minLoanAmount`.
6. Validar cuotas.
7. Si `paymentSchedule.supported === false`, bloquear cálculo y firma.
8. La tabla de amortización debe usar las fechas devueltas por backend.

---

# 5. Desvinculación laboral

## Objetivo

Continuar el módulo de desvinculación laboral.

Se necesita:

1. Registrar pago de la desvinculación.
2. Generar TXT bancario cuando el método de pago sea transferencia bancaria.
3. Marcar el empleado como desvinculado.
4. Mandar el empleado a archivo muerto.
5. Mantener el detalle de la desvinculación para consulta.

---

## Estado del empleado

No usar solamente:

```ts
isActive = false;
```

como estado principal de desvinculación.

Agregar o utilizar un campo formal:

```ts
employmentStatus:
  | "ACTIVE"
  | "INACTIVE"
  | "TERMINATED";
```

Cuando el empleado sea desvinculado y pagado:

```ts
employee.employmentStatus = "TERMINATED";
employee.isActive = false;
employee.terminatedAt = termination.effectiveDate || new Date();
employee.terminationRecord = termination._id;
```

El archivo muerto debe listar empleados con:

```ts
employmentStatus: "TERMINATED";
```

o con:

```ts
terminatedAt: {
  $exists: true;
}
```

según la estructura existente.

---

## Flujo recomendado

Cuando se calcula la desvinculación:

```ts
termination.status = "DRAFT" | "CALCULATED";
employee.employmentStatus = "ACTIVE";
employee.isActive = true;
```

Cuando RRHH aprueba la desvinculación:

```ts
termination.status = "APPROVED";
termination.paymentStatus = "PENDING";
```

Cuando se registra el pago:

```ts
termination.paymentStatus = "PAID";
termination.status = "CLOSED";
termination.paidAt = new Date();
termination.paidBy = req.uid;

employee.employmentStatus = "TERMINATED";
employee.isActive = false;
employee.terminatedAt = termination.effectiveDate || new Date();
employee.terminationRecord = termination._id;
```

---

## Payment method

Métodos sugeridos:

```ts
paymentMethod:
  | "BANK_TRANSFER"
  | "CHECK"
  | "CASH"
  | "OTHER";
```

Generar TXT solo cuando:

```ts
paymentMethod === "BANK_TRANSFER";
```

---

## Campos sugeridos en EmployeeTermination

Agregar o verificar:

```ts
paymentStatus:
  | "PENDING"
  | "TXT_GENERATED"
  | "PAID"
  | "FAILED";

paymentMethod:
  | "BANK_TRANSFER"
  | "CHECK"
  | "CASH"
  | "OTHER";

paidAt?: Date;
paidBy?: ObjectId;
paymentReference?: string;
paymentBankFileUrl?: string;
paymentBankFileName?: string;
paymentBankFileGeneratedAt?: Date;
paymentBankFileGeneratedBy?: ObjectId;
paymentNotes?: string;
```

---

## Endpoint sugerido

Crear o modificar:

```ts
POST /employee-termination/:id/register-payment
```

Payload:

```ts
{
  paymentMethod: "BANK_TRANSFER",
  paymentReference: "AUTH-12345",
  paymentDate: "2026-06-18",
  notes: "Pago realizado por transferencia"
}
```

Respuesta esperada:

```ts
{
  ok: true,
  mensaje: "Pago de desvinculación registrado correctamente.",
  termination,
  employee,
  bankFile: {
    fileName,
    url,
    generatedAt
  }
}
```

---

## Validaciones antes de registrar pago

Validar:

1. La desvinculación existe.
2. No está eliminada.
3. Está aprobada o lista para pago.
4. No está ya pagada.
5. El monto neto a pagar es mayor que 0.
6. Si el método es transferencia, el empleado tiene banco, número de cuenta y tipo de cuenta.
7. Si falla la generación del TXT, no marcar como pagado.
8. Si falla el pago, no marcar empleado como `TERMINATED`.
9. Usar transacción de MongoDB si el proyecto ya usa sesiones.

---

## TXT bancario de desvinculación

Cuando el método sea transferencia bancaria, generar un TXT similar al TXT que ya genera la nómina.

Buscar primero cómo se genera actualmente el TXT de nómina.

No duplicar toda la lógica si ya existe helper.

Crear helper reutilizable si aplica:

```ts
buildBankTransferTxtFile({
  company,
  paymentDate,
  payments,
  concept,
});
```

Datos mínimos para cada pago:

```ts
{
  employeeId,
  employeeName,
  identificationNumber,
  bankCode,
  accountNumber,
  accountType,
  amount,
  concept: "PAGO DESVINCULACION",
  reference,
}
```

El monto debe ser el neto final de la liquidación:

```ts
termination.totals.netPayableAmount;
```

o el campo equivalente existente.

---

# 6. Frontend de desvinculación

En la pantalla de detalle de desvinculación:

1. Agregar botón `Registrar pago`.
2. Mostrar modal con:
   - Método de pago.
   - Fecha de pago.
   - Referencia/autorización bancaria.
   - Notas.

3. Si el método es transferencia, mostrar aviso:

```ts
"Se generará un archivo TXT bancario para realizar el pago.";
```

4. Al confirmar:
   - Llamar endpoint `register-payment`.
   - Mostrar link o descargar TXT generado.
   - Refrescar la desvinculación.
   - El empleado debe desaparecer de empleados activos.
   - El empleado debe aparecer en archivo muerto.

---

# 7. Archivo muerto

Agregar o ajustar listado para mostrar empleados desvinculados.

Filtro recomendado:

```ts
employmentStatus: "TERMINATED";
```

Columnas recomendadas:

- Nombre.
- Documento.
- Cargo.
- Departamento.
- Fecha de ingreso.
- Fecha de desvinculación.
- Motivo.
- Monto pagado.
- Estado de pago.
- Acción: ver detalle de desvinculación.

---

# 8. Instrucción para la próxima tarea

Antes de modificar código:

1. Buscar cómo se genera actualmente el TXT de nómina.
2. Buscar el modelo de empleado.
3. Buscar el modelo/controlador de desvinculación.
4. Buscar cómo se registra actualmente el pago de nómina.
5. Buscar helpers bancarios existentes.
6. Reutilizar helpers existentes.
7. No romper el flujo actual de cálculo de liquidación.
8. No marcar empleado como `TERMINATED` si falla el registro del pago.
9. No generar TXT para métodos que no sean transferencia bancaria.
10. Mantener compatibilidad con datos viejos.

Objetivo inmediato:

Implementar el registro de pago de desvinculación con generación de TXT bancario para transferencia y mover el empleado a archivo muerto mediante `employmentStatus: "TERMINATED"`.
