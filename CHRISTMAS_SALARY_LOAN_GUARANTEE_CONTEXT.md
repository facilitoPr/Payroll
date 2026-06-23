# CHRISTMAS_SALARY_LOAN_GUARANTEE_CONTEXT.md

## Objetivo

Implementar una nueva garantía de préstamos basada en el acumulado del salario de Navidad o doble sueldo del empleado.

La nueva garantía debe funcionar junto con la lógica existente de vacaciones, sin eliminarla.

La empresa decide qué garantía usa el producto de préstamo:

```ts
type EmployeeLoanGuaranteeSource =
  | "CHRISTMAS_SALARY"
  | "VACATION_DAYS";
```

Para nuevas configuraciones, el valor predeterminado debe ser:

```ts
loanGuaranteeSource: "CHRISTMAS_SALARY";
```

El empleado nunca debe elegir entre vacaciones o doble sueldo al solicitar un préstamo.

La garantía se determina exclusivamente por la configuración activa de la empresa o producto de préstamo.

---

# Reglas críticas

## No eliminar lógica existente

No eliminar, romper ni migrar automáticamente la lógica existente de:

```text
- VacationDayReservation
- EmployeeVacationBalance
- availableForLoanDays
- reservedDays
- préstamos existentes garantizados por vacaciones
- solicitudes existentes
- historial de préstamos
```

La garantía de vacaciones debe permanecer disponible como alternativa configurable.

Solo debe dejar de utilizarse para nuevas solicitudes cuando:

```ts
productConfig.loanGuaranteeSource ===
  "CHRISTMAS_SALARY";
```

## Mantener garantía original en préstamos existentes

Cada préstamo debe guardar una foto inmutable de la garantía usada al momento de aprobación o firma:

```ts
guaranteeSourceSnapshot:
  | "CHRISTMAS_SALARY"
  | "VACATION_DAYS";
```

Reglas:

```text
Préstamos antiguos:
- Mantienen su garantía original.
- No convertir automáticamente vacaciones a doble sueldo.

Préstamos nuevos:
- Usan la garantía configurada en el producto.
- Normalmente CHRISTMAS_SALARY.

Cambio futuro de configuración:
- Solo afecta nuevas solicitudes.
- No cambia préstamos ya aprobados.
```

---

# Concepto de doble sueldo acumulado

El sistema debe acumular el salario de Navidad con base en los ingresos ordinarios realmente incluidos en pagos de nómina cerrados.

No aumentar un monto manualmente cada mes sin referencia a una nómina.

La acumulación debe producirse cada vez que se cierre una nómina y quede creado o confirmado un `PayrollPayment`.

Esto aplica tanto para:

```text
- Nómina mensual.
- Nómina quincenal.
- Nómina semanal, si existiera.
- Empleados por hora.
- Empleados por día.
- Empleados con salario fijo.
- Empleados con comisiones.
- Empleados con salario mixto.
```

La fuente debe ser siempre el ingreso ordinario que califica para salario de Navidad según la configuración y reglas del sistema.

---

# Regla de cálculo del acumulado

Cada pago de nómina cerrado debe aportar:

```ts
christmasSalaryAccrualAmount =
  eligibleOrdinaryEarnings / 12;
```

Ejemplo quincenal:

```text
Pago ordinario quincenal: RD$15,000.00
Acumulado generado de doble sueldo:
RD$15,000.00 / 12 = RD$1,250.00
```

Dos pagos quincenales normales durante el mes:

```text
RD$1,250.00 + RD$1,250.00 = RD$2,500.00
```

## No usar una estimación fija si existe nómina real

No calcular el acumulado usando solamente:

```text
salario mensual actual / 12
```

cuando existan pagos de nómina reales.

Debe usarse el detalle real de ingresos ordinarios pagados, porque el empleado puede tener:

```text
- comisiones
- bonos salariales configurados como ordinarios
- cambios de salario
- entradas o salidas durante el año
- trabajo por horas
- pagos por días
- períodos parciales
```

---

# Clasificación de ingresos para doble sueldo

Inspeccionar los tipos de ingreso y conceptos de nómina existentes.

Agregar o adaptar un campo en los tipos de ingreso:

```ts
countsTowardChristmasSalary: boolean;
```

Ejemplos esperados:

```ts
{
  code: "BASE_SALARY",
  countsTowardChristmasSalary: true,
}
```

```ts
{
  code: "COMMISSION",
  countsTowardChristmasSalary: true,
}
```

```ts
{
  code: "OVERTIME",
  countsTowardChristmasSalary: false,
}
```

```ts
{
  code: "EMPLOYEE_LOAN",
  countsTowardChristmasSalary: false,
}
```

```ts
{
  code: "REIMBURSEMENT",
  countsTowardChristmasSalary: false,
}
```

No asumir que todos los conceptos existentes califican.

Primero inspeccionar cómo se estructuran los earnings actuales y configurar explícitamente los que correspondan.

El cálculo debe quedar trazable por concepto.

---

# Modelo: balance anual de doble sueldo

Crear o adaptar un modelo:

```ts
EmployeeChristmasSalaryBalance
```

Estructura sugerida:

```ts
import { Schema, model, Document, Types } from "mongoose";

export interface IEmployeeChristmasSalaryBalance
  extends Document {
  employee: Types.ObjectId;
  company?: Types.ObjectId | null;

  /**
   * Año calendario del acumulado.
   */
  year: number;

  /**
   * Suma de los ingresos ordinarios que califican
   * para el salario de Navidad.
   */
  eligibleOrdinaryEarnings: number;

  /**
   * Acumulado bruto de doble sueldo.
   * Generalmente eligibleOrdinaryEarnings / 12.
   */
  accruedChristmasSalaryAmount: number;

  /**
   * Monto reservado por préstamos activos
   * garantizados con doble sueldo.
   */
  reservedGuaranteeAmount: number;

  /**
   * Monto disponible para respaldar nuevos préstamos.
   */
  availableGuaranteeAmount: number;

  /**
   * Monto de doble sueldo ya pagado.
   * Normalmente se utiliza en diciembre.
   */
  paidChristmasSalaryAmount: number;

  /**
   * Monto del acumulado incluido o pagado dentro
   * de una desvinculación.
   */
  appliedToTerminationAmount: number;

  /**
   * Fecha del último cálculo o reconciliación.
   */
  lastCalculatedAt?: Date | null;

  /**
   * Fecha en que se pagó el doble sueldo del año,
   * cuando aplique.
   */
  paidAt?: Date | null;

  /**
   * PayrollPayment más reciente considerado.
   */
  lastPayrollPayment?: Types.ObjectId | null;

  metadata?: Record<string, any>;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

Índice único recomendado:

```ts
employeeVacationBalanceSchema.index(
  { employee: 1, year: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);
```

Adaptar el nombre del schema e índice al archivo real.

---

# Fórmulas del balance

La fórmula principal:

```ts
availableGuaranteeAmount = Math.max(
  0,
  accruedChristmasSalaryAmount -
    reservedGuaranteeAmount -
    paidChristmasSalaryAmount -
    appliedToTerminationAmount,
);
```

Debe recalcularse siempre que ocurra cualquiera de estos eventos:

```text
- cierre de nómina
- reverso o anulación de nómina
- creación de préstamo garantizado
- aplicación de cuota de préstamo
- liberación de garantía
- cancelación de préstamo
- pago del doble sueldo
- creación o ajuste de desvinculación
- corrección manual autorizada
```

Nunca permitir valores negativos.

---

# Modelo: movimientos del acumulado

Crear un ledger de movimientos para auditoría e idempotencia.

Nombre sugerido:

```ts
ChristmasSalaryAccrualMovement
```

```ts
export type ChristmasSalaryAccrualMovementType =
  | "PAYROLL_ACCRUAL"
  | "PAYROLL_REVERSAL"
  | "MANUAL_CORRECTION"
  | "LOAN_RESERVATION"
  | "LOAN_RESERVATION_REDUCTION"
  | "LOAN_RELEASE"
  | "DECEMBER_PAYMENT"
  | "TERMINATION_SETTLEMENT"
  | "MIGRATION_OPENING_BALANCE";

export interface IChristmasSalaryAccrualMovement
  extends Document {
  balance: Types.ObjectId;
  employee: Types.ObjectId;
  company?: Types.ObjectId | null;
  year: number;

  payrollRun?: Types.ObjectId | null;
  payrollPayment?: Types.ObjectId | null;
  loanRequest?: Types.ObjectId | null;
  termination?: Types.ObjectId | null;

  type: ChristmasSalaryAccrualMovementType;

  /**
   * Base salarial que generó el acumulado.
   */
  ordinaryEarningsBase?: number;

  /**
   * Monto positivo o negativo aplicado.
   */
  amount: number;

  /**
   * Saldo anterior y posterior para auditoría.
   */
  previousAccruedAmount: number;
  newAccruedAmount: number;

  previousReservedAmount: number;
  newReservedAmount: number;

  previousAvailableAmount: number;
  newAvailableAmount: number;

  reason: string;

  performedBy?: Types.ObjectId | null;

  metadata?: Record<string, any>;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

## Idempotencia

No permitir más de un movimiento de acumulación por:

```ts
employee +
year +
payrollPayment +
type: "PAYROLL_ACCRUAL"
```

Antes de crear la acumulación, verificar si ya existe.

Si ya existe, no duplicar el monto.

---

# Integración con cierre de nómina

Cuando un `PayrollRun` se cierre correctamente:

```text
PayrollRun CLOSED
        ↓
PayrollPayment confirmado
        ↓
Calcular ingresos ordinarios elegibles
        ↓
Crear movimiento PAYROLL_ACCRUAL
        ↓
Actualizar EmployeeChristmasSalaryBalance
        ↓
Actualizar perfil y elegibilidad de préstamo
```

## Reglas

1. Solo generar acumulación para pagos cerrados o aprobados.
2. No generar acumulación para borradores.
3. No generar acumulación si el pago fue cancelado o revertido.
4. Si un pago cerrado se revierte, crear movimiento `PAYROLL_REVERSAL`.
5. No sobrescribir balances manuales sin guardar auditoría.
6. Ejecutar dentro de transacción si el flujo actual de cierre ya usa sesión MongoDB.
7. Si falla la acumulación, no dejar la nómina en estado inconsistente.
8. Usar una estrategia de compensación o reintento idempotente si la operación es parcialmente exitosa.

---

# Reserva de doble sueldo para préstamos

No basta con consultar el acumulado.

Cuando un préstamo es aprobado o firmado, debe reservarse una parte del doble sueldo para impedir que el mismo saldo garantice varios préstamos.

Crear un modelo genérico o adaptar el modelo de reservas existente.

Nombre sugerido:

```ts
EmployeeLoanGuaranteeReservation
```

```ts
export type EmployeeLoanGuaranteeReservationStatus =
  | "ACTIVE"
  | "RELEASED"
  | "CONSUMED"
  | "CANCELLED";

export interface IEmployeeLoanGuaranteeReservation
  extends Document {
  employee: Types.ObjectId;
  company?: Types.ObjectId | null;

  loanRequest: Types.ObjectId;

  guaranteeSource:
    | "CHRISTMAS_SALARY"
    | "VACATION_DAYS";

  /**
   * Para garantía de doble sueldo.
   */
  christmasSalaryBalance?: Types.ObjectId | null;

  /**
   * Para garantía de vacaciones.
   */
  vacationBalance?: Types.ObjectId | null;

  /**
   * Monto reservado cuando la garantía es doble sueldo.
   */
  reservedAmount?: number;

  /**
   * Días reservados cuando la garantía es vacaciones.
   */
  reservedDays?: number;

  status: EmployeeLoanGuaranteeReservationStatus;

  reservedAt: Date;
  releasedAt?: Date | null;
  consumedAt?: Date | null;
  cancelledAt?: Date | null;

  createdBy: Types.ObjectId;
  releasedBy?: Types.ObjectId | null;

  reason: string;
  metadata?: Record<string, any>;

  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

## Regla de monto reservado

Configurar qué cubre la reserva:

```ts
guaranteeCoverageBasis:
  | "OUTSTANDING_BALANCE"
  | "OUTSTANDING_PRINCIPAL";
```

Valor predeterminado:

```ts
guaranteeCoverageBasis: "OUTSTANDING_BALANCE";
```

La reserva inicial puede ser:

```ts
reservedAmount = loan.totalAmount;
```

o el campo equivalente real en el modelo actual.

Cuando se aplique una cuota:

```text
saldo pendiente del préstamo baja
        ↓
reserva activa debe bajar
        ↓
disponible de doble sueldo puede aumentar
```

Ejemplo:

```text
Acumulado de doble sueldo: RD$20,000.00
Préstamo original: RD$12,000.00
Reserva inicial: RD$12,000.00
Disponible: RD$8,000.00

Después de pagar RD$3,000.00:
Saldo pendiente: RD$9,000.00
Reserva activa: RD$9,000.00
Disponible: RD$11,000.00
```

La reserva no debe reducirse por un pago pendiente o una cuota creada.

Solo debe reducirse cuando la cuota realmente quede aplicada o confirmada.

## Liberación de reserva

Liberar o cancelar la reserva cuando:

```text
- préstamo pagado completamente
- préstamo cancelado
- préstamo rechazado
- firma de préstamo falla
- solicitud expira
- préstamo se anula
```

No liberar reserva por una cotización.

La reserva debe crearse solamente cuando el préstamo alcance el estado aprobado o firmado que ya represente una obligación real.

---

# Configuración del producto de préstamo

Extender `EmployeeLoanProductConfig`.

No eliminar los campos actuales relacionados con vacaciones.

Agregar:

```ts
loanGuaranteeSource: {
  type: String,
  enum: ["CHRISTMAS_SALARY", "VACATION_DAYS"],
  default: "CHRISTMAS_SALARY",
  required: true,
},

christmasSalaryGuaranteeEnabled: {
  type: Boolean,
  default: true,
},

/**
 * Porcentaje máximo del acumulado disponible que se
 * permite usar como garantía.
 */
maxChristmasSalaryGuaranteePercent: {
  type: Number,
  default: 100,
  min: 0,
  max: 100,
},

/**
 * Monto mínimo de doble sueldo disponible requerido
 * antes de permitir solicitud.
 */
minimumChristmasSalaryAccumulatedAmount: {
  type: Number,
  default: 0,
  min: 0,
},

/**
 * Meses en los que no se aceptan nuevas solicitudes.
 * 1 = enero, 12 = diciembre.
 */
blockedLoanRequestMonths: {
  type: [Number],
  default: [1, 12],
},

/**
 * Meses donde no puede caer una cuota.
 */
blockedInstallmentMonths: {
  type: [Number],
  default: [12],
},

/**
 * Exigir que todas las cuotas terminen antes de los
 * meses protegidos.
 */
requireLoanSettlementBeforeProtectedMonths: {
  type: Boolean,
  default: true,
},

guaranteeCoverageBasis: {
  type: String,
  enum: [
    "OUTSTANDING_BALANCE",
    "OUTSTANDING_PRINCIPAL",
  ],
  default: "OUTSTANDING_BALANCE",
},
```

Mantener los campos de vacaciones:

```ts
minimumVacationDaysRequired
maxVacationDaysGuaranteePercent
maxVacationGuaranteeDays
vacationDayValueMode
customVacationDayAmount
allowUseAllVacationDays
allowWithoutVacationGuarantee
```

## Regla de configuración

```ts
if (
  productConfig.loanGuaranteeSource ===
  "CHRISTMAS_SALARY"
) {
  // Usar doble sueldo.
  // No consultar availableForLoanDays.
  // No crear VacationDayReservation.
  // No modificar reservedDays de vacaciones.
}
```

```ts
if (
  productConfig.loanGuaranteeSource ===
  "VACATION_DAYS"
) {
  // Mantener la lógica actual de garantía por vacaciones.
  // Usar availableForLoanDays.
  // Crear VacationDayReservation.
}
```

---

# Elegibilidad de préstamo

La elegibilidad debe detectar la fuente configurada.

## Garantía basada en doble sueldo

Calcular:

```ts
const accruedChristmasSalaryAmount =
  christmasSalaryBalance.accruedChristmasSalaryAmount;

const reservedGuaranteeAmount =
  christmasSalaryBalance.reservedGuaranteeAmount;

const configuredPercent =
  productConfig.maxChristmasSalaryGuaranteePercent;

const maximumByPercent =
  accruedChristmasSalaryAmount *
  (configuredPercent / 100);

const availableGuaranteeByPolicy = Math.max(
  0,
  maximumByPercent -
    reservedGuaranteeAmount,
);

const availableGuaranteeAmount = Math.max(
  0,
  Math.min(
    christmasSalaryBalance.availableGuaranteeAmount,
    availableGuaranteeByPolicy,
  ),
);

const maximumLoanAmount = Math.min(
  availableGuaranteeAmount,
  productConfig.maxLoanAmount || Number.POSITIVE_INFINITY,
);
```

Validar:

```text
- existe balance del año actual
- acumulado mayor que cero
- disponible mayor que cero
- cumple minimumChristmasSalaryAccumulatedAmount
- monto solicitado no supera límite de garantía
- monto solicitado no supera máximo del producto
- la frecuencia de pago está soportada
- calendario de cuotas no cae en meses bloqueados
- no se solicita en mes bloqueado
```

## Respuesta de elegibilidad

Agregar:

```ts
guarantee: {
  source: "CHRISTMAS_SALARY",

  label: "Doble sueldo acumulado",

  year: number,

  accruedChristmasSalaryAmount: number,
  reservedGuaranteeAmount: number,
  availableGuaranteeAmount: number,

  maxGuaranteeByPolicy: number,
  maxAllowedLoanAmount: number,

  minimumRequiredAmount: number,

  blockedLoanRequestMonths: number[],
  blockedInstallmentMonths: number[],

  isRequestMonthBlocked: boolean,
  canRequestLoan: boolean,
  reasons: string[],
}
```

Cuando la fuente sea vacaciones, devolver una estructura equivalente:

```ts
guarantee: {
  source: "VACATION_DAYS",
  label: "Días de vacaciones",
  ...
}
```

No romper los campos existentes de elegibilidad.

Agregar los nuevos campos manteniendo compatibilidad.

---

# Reglas de enero y diciembre

Configuración inicial:

```ts
blockedLoanRequestMonths: [1, 12];
blockedInstallmentMonths: [12];
requireLoanSettlementBeforeProtectedMonths: true;
```

## Diciembre

En diciembre:

```text
- No permitir nuevas solicitudes.
- No permitir que nuevas cuotas caigan en diciembre.
- Toda solicitud nueva debe terminar antes del mes bloqueado.
```

## Enero

En enero:

```text
- No permitir nuevas solicitudes.
- El acumulado del año nuevo inicia desde cero.
- Mostrar mensaje de que la disponibilidad se acumulará
  nuevamente conforme se cierren nóminas del año actual.
```

## Febrero y meses posteriores

Permitir solicitud solo según el acumulado real generado por nóminas cerradas.

No asumir que en febrero el empleado tiene un salario mensual completo acumulado.

El monto disponible depende de los pagos ordinarios reales acumulados.

## Préstamos previos que cruzan diciembre

No alterar préstamos existentes ni marcarlos automáticamente como inválidos.

Para préstamos antiguos:

```text
- Mantener calendario y estado existentes.
- Mostrar advertencia administrativa si cruzan diciembre.
- No aplicar la nueva restricción retroactivamente.
```

Para préstamos nuevos:

```text
- Bloquear quote y sign-contract si alguna cuota cae en mes bloqueado.
```

---

# Perfil del empleado

Agregar una sección visible en el perfil del empleado.

Nombre sugerido:

```text
Doble sueldo acumulado
```

Debe mostrar:

```text
Año actual
Acumulado bruto
Monto comprometido por préstamos
Monto disponible como garantía
Monto pagado de doble sueldo
Monto aplicado en desvinculación, si aplica
Última nómina considerada
Última actualización
```

Ejemplo visual:

```text
Doble sueldo acumulado

Acumulado del año:          RD$18,750.00
Comprometido en préstamos:  RD$6,000.00
Disponible como garantía:   RD$12,750.00

Última acumulación:
Nómina quincenal 16-30 de junio de 2026
Monto acumulado en ese pago: RD$1,250.00
```

Agregar un historial desplegable o tab:

```text
Fecha
Tipo de movimiento
Base ordinaria
Monto acumulado
Monto reservado
Disponible después del movimiento
Referencia
```

Ejemplo:

```text
30/06/2026
Acumulación de nómina
Base ordinaria: RD$15,000.00
Acumulado: +RD$1,250.00
Disponible: RD$8,750.00

30/06/2026
Reserva de préstamo
Reservado: -RD$5,000.00
Disponible: RD$3,750.00
```

## Reglas de acceso

Empleado:

```text
- Puede ver su propio acumulado.
- Puede ver el monto comprometido.
- Puede ver el monto disponible.
- Puede ver por qué no puede solicitar.
- No puede modificar movimientos.
- No puede elegir la fuente de garantía.
```

RRHH / administrador:

```text
- Puede ver el detalle completo.
- Puede revisar movimientos.
- Puede crear correcciones manuales con permiso.
- Puede ver reservas por préstamo.
- Puede ejecutar reconciliación.
- Puede ver advertencias e inconsistencias.
```

---

# Portal del empleado: solicitud de préstamo

Actualizar el componente de solicitud de préstamo.

No mostrar selector:

```text
Vacaciones o doble sueldo
```

La fuente debe ser automática según configuración.

Cuando la fuente sea doble sueldo, mostrar:

```text
Garantía del préstamo:
Doble sueldo acumulado

Acumulado del año:
RD$8,250.00

Monto comprometido:
RD$2,000.00

Disponible para préstamo:
RD$6,250.00

Monto máximo permitido:
RD$6,250.00
```

Mostrar claramente:

```text
Meses no disponibles:
Diciembre y enero

Regla de cuotas:
La última cuota debe quedar antes de diciembre.
```

## Flujo de solicitud

Para garantía de doble sueldo:

```text
- El empleado puede indicar monto solicitado.
- El empleado puede elegir cantidad de cuotas permitidas.
- El backend genera amortización.
- El backend valida disponibilidad real.
- El backend valida meses bloqueados.
- El backend reserva monto al aprobar o firmar.
```

No pedir días de vacaciones si la garantía configurada es `CHRISTMAS_SALARY`.

Para garantía de vacaciones, mantener la interfaz actual de días y monto calculado.

La interfaz debe cambiar dinámicamente según `guarantee.source`.

---

# Pantalla administrativa del producto de préstamo

Agregar una sección clara:

```text
Garantía del préstamo
```

Campos:

```text
Fuente de garantía:
[ Doble sueldo acumulado ]
[ Días de vacaciones ]

Porcentaje máximo de doble sueldo utilizable:
[ 100 ] %

Monto mínimo acumulado para solicitar:
[ RD$ 0.00 ]

Meses bloqueados para nuevas solicitudes:
[ Enero ] [ Diciembre ]

Meses bloqueados para cuotas:
[ Diciembre ]

Exigir que el préstamo termine antes de meses protegidos:
[ Activado ]

Base de cobertura:
[ Saldo pendiente total ]
[ Capital pendiente ]
```

## Reglas de frontend

* Al seleccionar `CHRISTMAS_SALARY`, ocultar o deshabilitar campos de vacaciones dentro de esa sección, pero no borrarlos.
* Al seleccionar `VACATION_DAYS`, mostrar configuración de vacaciones.
* Mostrar advertencia al cambiar fuente de garantía:

```text
Este cambio solo afectará nuevas solicitudes.
Los préstamos existentes conservarán la garantía con la que fueron creados.
```

* Validar meses entre 1 y 12.
* No permitir meses duplicados.
* Mostrar etiquetas legibles:

```text
1 = Enero
2 = Febrero
...
12 = Diciembre
```

---

# Administración de acumulados de doble sueldo

Crear una pantalla o tab administrativo:

```text
Acumulados de doble sueldo
```

Filtros:

```text
- Empresa
- Año
- Empleado
- Estado laboral
- Tiene reserva activa
- Tiene disponibilidad
- Tiene diferencias o advertencias
```

Columnas:

```text
Empleado
Año
Ingresos ordinarios acumulados
Doble sueldo acumulado
Monto reservado
Monto disponible
Monto pagado
Monto aplicado a desvinculación
Última actualización
Acciones
```

Acciones:

```text
Ver detalle
Ver movimientos
Ver préstamos relacionados
Recalcular
Ajuste manual
Ver perfil
```

## Ajustes manuales

Solo usuarios autorizados pueden hacer ajustes.

El ajuste requiere:

```text
Monto
Tipo
Motivo
Documento opcional
Confirmación
```

Tipos:

```ts
"MANUAL_CORRECTION"
"OPENING_BALANCE"
"REVERSAL"
```

Todo ajuste debe:

```text
- recalcular disponible
- crear movimiento
- guardar usuario
- guardar fecha
- guardar motivo
- mostrarlo en auditoría
```

No permitir editar directamente el balance sin crear movimiento.

---

# Integración con cuota y pago de préstamo

Al aplicar una cuota real:

```text
Pago de cuota confirmado
        ↓
Actualizar saldo pendiente del préstamo
        ↓
Recalcular reserva necesaria
        ↓
Reducir reserva de doble sueldo
        ↓
Actualizar balance disponible
        ↓
Crear movimiento LOAN_RESERVATION_REDUCTION
```

Ejemplo:

```text
Reserva anterior: RD$10,000.00
Cuota aplicada: RD$2,000.00
Nueva reserva: RD$8,000.00
Monto liberado: RD$2,000.00
```

No reducir reserva cuando:

```text
- solo se creó la cuota
- la cuota está pendiente
- se generó archivo bancario pero no fue confirmado
- hubo error bancario
```

---

# Integración con desvinculación

El acumulado de doble sueldo debe formar parte de la liquidación de un empleado desvinculado.

No usar solamente una fórmula aislada dentro del controlador de desvinculación si ya existe un balance confiable.

La liquidación debe consultar:

```ts
EmployeeChristmasSalaryBalance
```

del año de la fecha efectiva de desvinculación.

## Datos que debe incluir la vista previa de desvinculación

Agregar una sección:

```text
Salario de Navidad / doble sueldo
```

Mostrar:

```text
Año de cálculo
Ingresos ordinarios acumulados
Doble sueldo acumulado bruto
Monto previamente pagado
Monto aplicado previamente a otra liquidación
Monto pendiente por pagar
Reservas activas por préstamos
Saldo pendiente de préstamos
```

Campos sugeridos en el snapshot de liquidación:

```ts
christmasSalary: {
  year: number;

  eligibleOrdinaryEarnings: number;

  accruedAmount: number;

  alreadyPaidAmount: number;

  previouslyAppliedToTerminationAmount: number;

  pendingPayableAmount: number;

  activeLoanGuaranteeReservedAmount: number;

  outstandingLoanBalance: number;

  balanceId?: Types.ObjectId | null;
}
```

## Fórmula de monto pendiente de doble sueldo

```ts
pendingChristmasSalaryPayableAmount = Math.max(
  0,
  accruedChristmasSalaryAmount -
    paidChristmasSalaryAmount -
    appliedToTerminationAmount,
);
```

La liquidación debe guardar una foto del cálculo.

No recalcular automáticamente una liquidación ya aprobada solo porque luego cambie el balance.

## Regla de pagos y préstamos durante desvinculación

La garantía de doble sueldo sirve para:

```text
- medir exposición de riesgo
- mostrar monto reservado
- informar el saldo pendiente del préstamo
- soportar decisiones internas de aprobación
```

No descontar automáticamente del doble sueldo acumulado por un préstamo sin que exista el flujo contractual, autorización y política correspondiente.

Implementar un paso explícito si el negocio decide compensar una deuda:

```text
Evaluar deuda de préstamo pendiente
        ↓
Mostrar propuesta de compensación
        ↓
Requerir autorización y motivo
        ↓
Guardar documento o evidencia
        ↓
Aplicar movimiento auditado
```

No hacer compensación automática en el primer alcance.

## Cuando se paga la desvinculación

Al registrar pago de una desvinculación:

```text
- Guardar cuánto doble sueldo se incluyó.
- Crear movimiento TERMINATION_SETTLEMENT.
- Actualizar appliedToTerminationAmount.
- Recalcular disponible.
- Guardar referencias al EmployeeTermination.
```

Ejemplo:

```ts
{
  type: "TERMINATION_SETTLEMENT",
  termination: termination._id,
  amount: -pendingChristmasSalaryPayableAmount,
  reason:
    "Monto de salario de Navidad incluido en liquidación por desvinculación.",
}
```

El signo y la forma de guardar el movimiento deben ser coherentes con el ledger existente.

---

# API sugerida

No cambiar endpoints existentes sin necesidad.

Agregar o adaptar:

```text
GET /employee-christmas-salary/me
GET /employee-christmas-salary/me/movements
GET /employee-christmas-salary/employee/:employeeId
GET /employee-christmas-salary/employee/:employeeId/movements
GET /employee-christmas-salary/company-summary
POST /employee-christmas-salary/employee/:employeeId/recalculate
POST /employee-christmas-salary/employee/:employeeId/manual-adjustment
POST /employee-christmas-salary/reconcile-year
```

Para préstamos:

```text
GET /employee-loan/requests/eligibility
```

Debe devolver la garantía configurada y el balance disponible.

No obligar al frontend a hacer consultas adicionales para obtener el monto disponible durante la solicitud.

Para desvinculación:

```text
POST /employee-termination/preview
POST /employee-termination
GET /employee-termination/:id
```

Debe incluir la sección de doble sueldo dentro del cálculo.

---

# Auditoría legible

Crear eventos legibles para RRHH y administración.

Eventos sugeridos:

```ts
type ChristmasSalaryAuditEventType =
  | "PAYROLL_ACCRUAL_CREATED"
  | "PAYROLL_ACCRUAL_REVERSED"
  | "LOAN_GUARANTEE_RESERVED"
  | "LOAN_GUARANTEE_REDUCED"
  | "LOAN_GUARANTEE_RELEASED"
  | "MANUAL_BALANCE_ADJUSTMENT"
  | "DECEMBER_PAYMENT_REGISTERED"
  | "TERMINATION_AMOUNT_APPLIED"
  | "PRODUCT_GUARANTEE_CONFIGURATION_CHANGED";
```

Ejemplos visibles:

```text
La nómina quincenal del 16 al 30 de junio acumuló RD$1,250.00 de doble sueldo.

Se reservó RD$5,000.00 del doble sueldo acumulado como garantía del préstamo PR-000124.

La cuota PR-000124 liberó RD$1,250.00 de la garantía de doble sueldo.

Recursos Humanos corrigió el acumulado del año por RD$500.00.
Motivo: ajuste de comisión ordinaria omitida en nómina anterior.

La liquidación de desvinculación incluyó RD$8,750.00 de salario de Navidad acumulado.
```

Toda auditoría debe mostrar:

```text
Fecha y hora
Usuario
Acción
Empleado
Antes
Después
Monto
Motivo
Referencia relacionada
```

No mostrar JSON técnico como interfaz principal.

---

# Backfill y migración

Crear scripts seguros para calcular el balance del año actual usando nóminas históricas cerradas.

No modificar montos de `PayrollPayment` ya cerrados.

## Backfill del año actual

Para cada empleado activo o con pagos en el año:

```text
1. Buscar PayrollPayment cerrados o confirmados.
2. Identificar ingresos ordinarios elegibles.
3. Calcular el acumulado por cada pago.
4. Crear movimientos MIGRATION_OPENING_BALANCE o PAYROLL_ACCRUAL.
5. Crear o actualizar EmployeeChristmasSalaryBalance.
6. No duplicar movimientos.
7. Generar reporte de diferencias.
```

## Datos faltantes

Si un `PayrollPayment` histórico no tiene detalle suficiente para clasificar ingresos:

```text
- No inventar montos.
- Usar el dato más confiable disponible.
- Marcar WARNING.
- Incluir el empleado y pago en reporte de revisión.
```

## Préstamos existentes

No convertir préstamos existentes de vacaciones a doble sueldo.

Para préstamos futuros:

```text
- Usar CHRISTMAS_SALARY si es la fuente configurada.
```

---

# Pruebas obligatorias

## Caso 1: empleado quincenal fijo

```text
Nómina 1:
Ingreso ordinario: RD$15,000.00
Acumulado doble sueldo: RD$1,250.00

Nómina 2:
Ingreso ordinario: RD$15,000.00
Acumulado total: RD$2,500.00
```

## Caso 2: empleado por horas

```text
Ingreso ordinario real: RD$12,000.00
Acumulado: RD$1,000.00
```

## Caso 3: comisión ordinaria

```text
Salario fijo: RD$15,000.00
Comisión ordinaria: RD$5,000.00
Base elegible: RD$20,000.00
Acumulado: RD$1,666.67
```

## Caso 4: préstamo con garantía de doble sueldo

```text
Acumulado: RD$10,000.00
Reserva activa: RD$2,000.00
Disponible: RD$8,000.00

Solicitud por RD$8,500.00:
Debe rechazarse.

Solicitud por RD$7,000.00:
Puede cotizar, si cumple demás reglas.
```

## Caso 5: pago de cuota

```text
Reserva inicial: RD$7,000.00
Cuota aplicada: RD$2,000.00
Nueva reserva: RD$5,000.00
Disponible aumenta en RD$2,000.00.
```

## Caso 6: diciembre

```text
Solicitud nueva durante diciembre:
Debe bloquearse.

Nueva cotización con cuota en diciembre:
Debe bloquearse.

Préstamo antiguo que ya cruza diciembre:
No modificar automáticamente.
Mostrar advertencia administrativa.
```

## Caso 7: enero

```text
Solicitud nueva durante enero:
Debe bloquearse.

El perfil muestra acumulado del nuevo año en cero
hasta que cierre la primera nómina elegible.
```

## Caso 8: febrero

```text
Debe permitir solicitud solo hasta el acumulado real
generado por nóminas cerradas.
```

## Caso 9: garantía por vacaciones

```text
Producto configurado con VACATION_DAYS:
Debe seguir funcionando exactamente como antes.
No debe consultar ni reservar doble sueldo.
```

## Caso 10: desvinculación

```text
Empleado con doble sueldo acumulado:
La vista previa de liquidación muestra el monto pendiente.

El cálculo guarda snapshot del acumulado.

Al registrar pago de desvinculación:
Se registra movimiento TERMINATION_SETTLEMENT.

No compensar préstamo automáticamente sin flujo explícito.
```

---

# Orden de implementación

## Fase 1: análisis

1. Revisar modelos actuales de:

   * PayrollRun
   * PayrollPayment
   * EmployeeLoanProductConfig
   * EmployeeLoanRequest
   * cuotas y pagos de préstamos
   * EmployeeTermination
   * salary types
   * earning types
   * usuarios y empleados

2. Identificar el punto exacto donde se cierra una nómina.

3. Identificar los conceptos ordinarios existentes.

4. Identificar cómo se aplican cuotas de préstamos.

5. Identificar la lógica actual de liquidación y salario de Navidad.

## Fase 2: backend de acumulación

1. Crear balance anual.
2. Crear movimientos.
3. Integrar acumulación con cierre de nómina.
4. Crear reconciliación y backfill.
5. Crear endpoints de consulta.
6. Agregar auditoría.

## Fase 3: préstamos

1. Extender configuración de producto.
2. Agregar fuente de garantía.
3. Actualizar elegibilidad.
4. Actualizar cotización.
5. Actualizar firma.
6. Crear reserva de doble sueldo.
7. Reducir reserva al aplicar cuotas.
8. Bloquear enero, diciembre y cuotas en diciembre.

## Fase 4: frontend

1. Perfil del empleado.
2. Portal de solicitud de préstamo.
3. Configuración administrativa.
4. Tabla administrativa de acumulados.
5. Historial y auditoría legible.
6. Mensajes claros de bloqueo y elegibilidad.

## Fase 5: desvinculación

1. Integrar balance de doble sueldo.
2. Agregar snapshot al preview.
3. Agregar monto a liquidación.
4. Registrar movimiento al pagar.
5. Mostrar reservas y préstamos pendientes.
6. Mantener compensación de deuda como flujo explícito y auditado.

---

# Resultado esperado

Al finalizar:

```text
- El doble sueldo se acumula automáticamente con cada nómina cerrada.
- El empleado ve su acumulado, comprometido y disponible.
- La empresa controla la fuente de garantía desde configuración.
- El empleado no decide si usa vacaciones o doble sueldo.
- Nuevos préstamos usan doble sueldo por defecto.
- Las vacaciones siguen disponibles como garantía alternativa configurable.
- Los préstamos no pueden solicitarse en enero o diciembre por configuración inicial.
- Las nuevas cuotas no pueden llegar a diciembre.
- Las reservas se liberan conforme se pagan cuotas.
- El acumulado aparece en la liquidación de desvinculación.
- La liquidación conserva snapshot del cálculo.
- No se descuenta automáticamente el doble sueldo por préstamos.
- Todo cambio queda auditado y visible de forma legible.
- No se rompen préstamos ni vacaciones existentes.
```
