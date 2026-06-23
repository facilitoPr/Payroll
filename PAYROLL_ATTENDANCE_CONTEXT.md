# PAYROLL_ATTENDANCE_CONTEXT.md

## Objetivo

Implementar y mejorar el manejo completo de asistencia, vacaciones, feriados, descuentos, cálculo de nómina y auditoría de cambios, tanto en backend como frontend.

El sistema ya tiene un flujo funcional que no debe romperse:

```text
WorkSummary + PunchHistories
        ↓
PayrollRun
        ↓
PayrollPayment
        ↓
Cierre de nómina / TXT bancario
```

Actualmente, un empleado que tenga al menos un `WorkSummary` dentro del período puede entrar a nómina y recibir la quincena completa, salvo que RRHH aplique descuentos o ajustes manuales.

La nueva solución debe conservar ese comportamiento como una modalidad válida, pero agregar opciones configurables y auditables para pagar por días, por horas, por período completo, aplicar vacaciones, feriados, permisos y descuentos correctamente.

---

# Reglas generales obligatorias

## Antes de modificar código

1. Inspeccionar los modelos actuales relacionados con:
   - `WorkSummary`
   - `PunchHistory`
   - `PayrollRun`
   - `PayrollPayment`
   - empleados
   - horarios
   - frecuencias de pago
   - vacaciones
   - permisos
   - solicitudes de ausencia
   - auditorías
   - archivos/documentos
   - generación de TXT bancario

2. Buscar helpers existentes antes de crear otros nuevos.

3. No duplicar la lógica que ya exista para:
   - cálculo salarial
   - cálculo de días
   - horas trabajadas
   - descuentos
   - vacaciones
   - permisos
   - archivos
   - auditoría
   - generación de TXT

4. Mantener compatibilidad con:
   - `PayrollRun` existentes
   - `PayrollPayment` existentes
   - `WorkSummary` existentes
   - solicitudes antiguas de vacaciones y permisos
   - empleados antiguos sin los nuevos campos

5. No eliminar campos ni cambiar nombres de endpoints existentes sin necesidad.

6. Usar migraciones o scripts de backfill seguros cuando sea necesario.

7. No modificar pagos históricos cerrados.

8. Usar transacciones MongoDB para operaciones que modifiquen simultáneamente:
   - nómina
   - pagos individuales
   - días de trabajo
   - vacaciones
   - permisos
   - auditorías
   - documentos

9. Todos los cambios manuales deben guardar:
   - usuario que realizó el cambio
   - fecha
   - motivo
   - valores anteriores
   - valores nuevos

10. El frontend debe mostrar información legible para RRHH, no JSON técnico.

---

# Flujo actual que debe conservarse

Actualmente:

```text
El usuario abre la pantalla de nómina.
        ↓
Selecciona un período de pago, por ejemplo 16 al 30.
        ↓
Se buscan WorkSummary dentro de ese rango.
        ↓
Cada WorkSummary contiene PunchHistories del día.
        ↓
Se genera PayrollRun.
        ↓
Se generan PayrollPayment individuales.
        ↓
Al cerrar, los WorkSummary utilizados quedan marcados como pagados.
```

Esto debe mantenerse, pero se debe mejorar con una capa de evaluación diaria para no depender únicamente de que exista o no un `WorkSummary`.

Un día puede ser pagable aunque no tenga ponche, por ejemplo:

- Feriado pagado.
- Vacaciones aprobadas.
- Permiso pagado.
- Día manualmente aprobado por RRHH.
- Día previamente pagado como vacaciones.
- Día justificado por una nota o documento del empleado.

Y un día con `WorkSummary` puede no ser pagable completamente, por ejemplo:

- Trabajó menos horas.
- RRHH descontó parte del día.
- Se marcó como ausencia parcial.
- Hubo una corrección manual.

---

# Nuevo concepto: detalle diario de nómina

La nómina debe construir un detalle diario por empleado durante el período.

Nombre sugerido:

```ts
PayrollDayLedger;
```

No es obligatorio crear una colección separada si ya existe un lugar adecuado dentro de:

```ts
PayrollPayment.snapshot.attendance.days;
```

Primero inspeccionar la estructura actual y elegir la opción que permita:

- Mostrar el detalle durante el borrador de nómina.
- Guardar la foto histórica al cerrar.
- Mantener auditoría.
- Consultar fácilmente el detalle desde frontend.

Cada día del período debe existir en el cálculo aunque no haya `WorkSummary`.

---

# Estados diarios de nómina

Usar o adaptar estos estados:

```ts
export type PayrollDayStatus =
  | "WORKED"
  | "PARTIALLY_WORKED"
  | "MISSING_ATTENDANCE"
  | "UNPAID_ABSENCE"
  | "PAID_VACATION"
  | "VACATION_ALREADY_PAID"
  | "PAID_PERMISSION"
  | "UNPAID_PERMISSION"
  | "PAID_HOLIDAY"
  | "HOLIDAY_WORKED"
  | "REST_DAY"
  | "FUTURE_DAY"
  | "MANUAL_PAID"
  | "MANUAL_UNPAID"
  | "JUSTIFIED"
  | "EXCLUDED";
```

Acción de pago por día:

```ts
export type PayrollDayPaymentAction =
  | "PAY"
  | "DO_NOT_PAY"
  | "REVIEW"
  | "EXCLUDE"
  | "ALREADY_PAID";
```

Origen del día:

```ts
export type PayrollDaySource =
  | "WORK_SUMMARY"
  | "VACATION"
  | "PERMISSION"
  | "HOLIDAY"
  | "WORK_CALENDAR"
  | "MANUAL"
  | "SYSTEM";
```

Estructura sugerida:

```ts
interface IPayrollDayLedger {
  date: string;

  workSummary?: Types.ObjectId | null;
  vacationRequest?: Types.ObjectId | null;
  permissionRequest?: Types.ObjectId | null;
  calendarDay?: Types.ObjectId | null;

  source: PayrollDaySource;
  status: PayrollDayStatus;
  paymentAction: PayrollDayPaymentAction;

  scheduledMinutes: number;
  workedMinutes: number;
  payableMinutes: number;

  /**
   * Unidades base de pago:
   * 1 = día completo
   * 0.5 = medio día
   * 0 = no paga
   */
  basePayUnits: number;

  /**
   * Unidades adicionales por conceptos especiales,
   * por ejemplo feriado trabajado con pago doble.
   */
  premiumPayUnits: number;

  /**
   * Unidades que ya se pagaron previamente,
   * por ejemplo vacaciones pagadas por adelantado.
   */
  alreadyPaidUnits: number;

  isHoliday: boolean;
  holidayMultiplier?: number;

  manualOverride: boolean;
  manualReason?: string;

  employeeNoteCount: number;
  employeeDocumentCount: number;
  changeCount: number;

  amount?: number;
}
```

---

# Modos de cálculo de nómina

Agregar o adaptar un modo de cálculo por empleado.

El empleado puede tener un modo predeterminado, pero RRHH debe poder cambiarlo en una nómina específica.

```ts
export type PayrollCalculationMode =
  | "FULL_PERIOD"
  | "FULL_PERIOD_WITH_DAY_ADJUSTMENTS"
  | "PAY_SELECTED_DAYS_ONLY"
  | "PAY_SELECTED_HOURS_ONLY";
```

Guardar:

```ts
payrollCalculationMode: PayrollCalculationMode;
```

También guardar override por nómina:

```ts
payrollCalculationModeOverride?: PayrollCalculationMode;
payrollCalculationModeOverrideReason?: string;
payrollCalculationModeOverrideBy?: Types.ObjectId;
payrollCalculationModeOverrideAt?: Date;
```

## 1. FULL_PERIOD

Para empleados fijos.

La nómina inicia con el monto completo del período.

```text
Salario quincenal o mensual completo
+ bonos
+ horas extra
+ extras de feriado trabajado
- préstamos
- deducciones legales
- descuentos manuales aprobados
= pago final
```

La falta de un ponche no descuenta automáticamente.

Las vacaciones, permisos pagados y feriados no deben agregar dinero adicional porque el salario base del período ya los cubre; solamente evitan que esos días se traten como ausencias.

## 2. FULL_PERIOD_WITH_DAY_ADJUSTMENTS

Este debe ser el modo recomendado para empleados fijos.

La nómina inicia con el salario completo del período.

El sistema detecta días sin asistencia y los deja como:

```ts
"MISSING_ATTENDANCE";
```

con acción:

```ts
"REVIEW";
```

RRHH puede:

- Justificar el día.
- Marcarlo como vacaciones.
- Marcarlo como permiso pagado.
- Marcarlo como día no pagado.
- Descontar medio día.
- Descontar horas específicas.
- Mantenerlo como pagado.
- Agregar una nota.

Solo los días confirmados como no pagados deben generar descuento.

## 3. PAY_SELECTED_DAYS_ONLY

Para empleados por día, temporales o casos donde RRHH quiera pagar únicamente ciertos días.

Pago base:

```text
Días trabajados seleccionados
+ vacaciones pagables
+ permisos pagados
+ feriados pagados
+ días manuales pagados
+ extras por feriados trabajados
= días pagables
```

Ejemplo:

```text
Días trabajados: 3
Vacaciones pagables: 3
Feriados pagados: 1

Total días base: 7
```

RRHH debe poder marcar manualmente cuáles días pagan y cuáles no.

También debe ser posible elegir este modo para un empleado fijo solamente en una nómina particular, dejando motivo y auditoría.

## 4. PAY_SELECTED_HOURS_ONLY

Para empleados por hora.

Pago base:

```text
Horas trabajadas
+ horas pagadas por vacaciones
+ horas pagadas por permisos
+ horas pagadas por feriados
+ horas manuales aprobadas
+ horas extra
= horas pagables
```

El monto debe usar la tarifa por hora del empleado o la lógica existente de salario por horas.

---

# Períodos de nómina y días futuros

No marcar días futuros como ausencias.

Ejemplo:

```text
Hoy: día 20
Período seleccionado: 16 al 30
```

Los días 21 al 30 deben quedar como:

```ts
status = "FUTURE_DAY";
paymentAction = "EXCLUDE";
```

No deben:

- generar descuento
- marcarse como pagados
- generar ausencia
- aparecer como falta de ponche

Agregar o reutilizar:

```ts
attendanceCutoffDate: Date;
```

para definir hasta qué fecha se consideran asistencias.

Para una nómina regular:

```ts
canClosePayroll = currentDate >= periodEnd;
```

Si se necesita pagar antes del final del período, usar un tipo explícito:

```ts
export type PayrollRunType = "REGULAR" | "PARTIAL" | "ADVANCE" | "ADJUSTMENT";
```

Ejemplo:

```text
Período contractual: 16 al 30
Corte de asistencia: 20
Tipo: PARTIAL
```

---

# Calendario anual de feriados y días no laborables

Crear o adaptar un calendario anual de trabajo por compañía.

Debe permitir que RRHH registre los feriados del año siguiente antes de que inicie el año.

No crear un registro de feriado por empleado.

El calendario se aplica automáticamente a los empleados elegibles de la empresa o sucursal.

Modelo sugerido:

```ts
export type CompanyCalendarDayType =
  | "WORKING_DAY"
  | "HOLIDAY"
  | "REST_DAY"
  | "SPECIAL_NON_WORKING_DAY";

export interface ICompanyWorkCalendarDay {
  company: Types.ObjectId;
  branch?: Types.ObjectId | null;

  date: Date;
  year: number;

  name: string;

  dayType: CompanyCalendarDayType;

  /**
   * No genera ausencia si no hay ponche.
   */
  isPaid: boolean;

  /**
   * Cuenta como día pagable cuando el empleado se paga por días.
   */
  countsAsPaidDayForDayBasedPayroll: boolean;

  /**
   * Generalmente false para feriados.
   */
  requiresAttendance: boolean;

  /**
   * Configuración del pago cuando se trabaja un feriado.
   */
  holidayWorkPaymentMode: "NO_EXTRA_PAYMENT" | "TARGET_MULTIPLIER";

  /**
   * Ejemplo:
   * 2 = pago total doble.
   * 1.5 = pago total de una vez y media.
   */
  holidayWorkTargetMultiplier: number;

  appliesTo: "ALL_ACTIVE_EMPLOYEES" | "SCHEDULED_EMPLOYEES_ONLY";

  source: "OFFICIAL" | "COMPANY" | "MANUAL";

  isActive: boolean;
  isDeleted: boolean;
}
```

Ejemplo:

```ts
{
  date: new Date("2027-01-01"),
  year: 2027,
  name: "Año Nuevo",
  dayType: "HOLIDAY",
  isPaid: true,
  countsAsPaidDayForDayBasedPayroll: true,
  requiresAttendance: false,
  holidayWorkPaymentMode: "TARGET_MULTIPLIER",
  holidayWorkTargetMultiplier: 2,
  appliesTo: "ALL_ACTIVE_EMPLOYEES",
  source: "OFFICIAL",
}
```

## Regla del feriado no trabajado

Si el empleado no trabaja un feriado pagado:

```ts
status = "PAID_HOLIDAY";
```

No se debe considerar ausencia.

En modo `PAY_SELECTED_DAYS_ONLY`, contará como día pagable si:

```ts
countsAsPaidDayForDayBasedPayroll === true;
```

En modo `FULL_PERIOD`, no debe agregar dinero adicional porque ya está incluido en la base del período.

## Regla del feriado trabajado

Si el empleado tiene `WorkSummary` o ponches válidos en un feriado:

```ts
status = "HOLIDAY_WORKED";
```

Si la empresa configuró pago doble:

```ts
holidayWorkTargetMultiplier = 2;
```

No duplicar erróneamente el pago.

### Empleado con FULL_PERIOD

La quincena ya incluye un día base.

Por tanto, para llegar a doble pago se agrega solamente:

```text
1 unidad adicional
```

Ejemplo:

```text
Valor diario: RD$1,000
Salario base del período ya incluye RD$1,000
Extra de feriado trabajado: RD$1,000
Total por ese día: RD$2,000
```

### Empleado con PAY_SELECTED_DAYS_ONLY

El día trabajado se paga con:

```text
basePayUnits: 1
premiumPayUnits: 1
```

Resultado:

```text
2 unidades pagables
```

El multiplicador debe ser configurable, no fijo.

---

# Integración con vacaciones

Los permisos y vacaciones deben estar enlazados al detalle diario de nómina.

No duplicar lógica si ya existen modelos de `VacationRequest`, `PermissionRequest`, balances de vacaciones o aprobaciones.

## Vacaciones aprobadas

Cuando existe una solicitud de vacaciones aprobada para una fecha:

```ts
status = "PAID_VACATION";
```

según las reglas de pago.

### En FULL_PERIOD o FULL_PERIOD_WITH_DAY_ADJUSTMENTS

La vacación:

- No genera ausencia.
- No genera descuento.
- No agrega dinero extra porque ya existe salario base del período.

### En PAY_SELECTED_DAYS_ONLY

La vacación puede contar como día pagable.

```ts
basePayUnits = 1;
paymentAction = "PAY";
```

### En PAY_SELECTED_HOURS_ONLY

La vacación debe convertirse a horas pagables según el horario del empleado o política existente.

---

# Vacaciones pagadas por adelantado

Debe existir una forma de pagar todas las vacaciones de un empleado por adelantado, por ejemplo los 14 días o la cantidad que corresponda según su balance.

Ese pago debe dejar evidencia detallada, no solamente un booleano.

Crear o adaptar un ledger de pago de vacaciones:

```ts
export interface IVacationPaymentLedger {
  employee: Types.ObjectId;
  company?: Types.ObjectId | null;

  vacationBalance: Types.ObjectId;
  year: number;

  payrollRun?: Types.ObjectId | null;
  payrollPayment?: Types.ObjectId | null;

  paymentType: "VACATION_ADVANCE" | "VACATION_PAYOUT" | "TERMINATION";

  paidDays: number;
  consumedDays: number;
  remainingPrepaidDays: number;

  dayValue: number;
  totalAmount: number;

  paidAt: Date;
  paidBy: Types.ObjectId;

  status: "ACTIVE" | "FULLY_CONSUMED" | "CANCELLED";

  notes?: string;
}
```

## Regla de vacaciones pagadas por adelantado

Cuando RRHH paga, por ejemplo, 14 días completos de vacaciones:

```text
paidDays: 14
consumedDays: 0
remainingPrepaidDays: 14
```

El empleado conserva el derecho a disfrutar esos días.

Cuando luego toma vacaciones:

```text
usedDays del balance aumenta
consumedDays del ledger aumenta
remainingPrepaidDays disminuye
```

El día de vacaciones se debe mostrar como:

```ts
status = "VACATION_ALREADY_PAID";
paymentAction = "ALREADY_PAID";
```

Eso significa:

- No se trata como ausencia.
- No se descuenta.
- No se vuelve a pagar.
- Sí consume los días disfrutados reales.
- Debe aparecer claramente en la pantalla de nómina.

Ejemplo:

```text
Vacaciones pagadas por adelantado: 14 días
Vacaciones disfrutadas luego: 3 días
Saldo de vacaciones ya pagadas: 11 días
```

Cuando se agoten los días pagados por adelantado, las próximas vacaciones deben seguir las políticas normales de pago.

El cálculo de desvinculación también debe considerar este ledger para evitar pagar dos veces vacaciones ya pagadas.

---

# Integración con permisos

Los permisos deben estar enlazados a los días de nómina.

Cada permiso aprobado debe indicar o inferir:

```ts
permissionPaymentType:
  | "PAID"
  | "UNPAID"
  | "PARTIAL";
```

Para permisos parciales, guardar:

```ts
paidMinutes: number;
unpaidMinutes: number;
```

Reglas:

```text
Permiso pagado:
  no descuenta y puede contar como tiempo pagable.

Permiso no pagado:
  descuenta el día o las horas correspondientes.

Permiso parcial:
  paga solo los minutos aprobados.
```

---

# Descuentos manuales por día y horas

RRHH debe poder descontar:

- Día completo.
- Medio día.
- Cantidad específica de horas.
- Cantidad específica de minutos.
- Monto manual, solo si la política lo permite.

No usar únicamente campos ambiguos como “reducir día”.

Cada ajuste debe generar un registro explícito.

Modelo sugerido:

```ts
export type PayrollManualAdjustmentType =
  | "PAID_DAY"
  | "UNPAID_DAY"
  | "PAID_HOURS"
  | "UNPAID_HOURS"
  | "PAID_MINUTES"
  | "UNPAID_MINUTES"
  | "FIXED_EARNING"
  | "FIXED_DEDUCTION"
  | "DAY_STATUS_OVERRIDE";

export interface IPayrollManualAdjustment {
  payrollRun: Types.ObjectId;
  payrollPayment?: Types.ObjectId | null;
  employee: Types.ObjectId;

  date?: Date | null;

  type: PayrollManualAdjustmentType;

  days?: number;
  hours?: number;
  minutes?: number;
  amount?: number;

  reason: string;

  createdBy: Types.ObjectId;
  createdAt: Date;

  revertedAt?: Date | null;
  revertedBy?: Types.ObjectId | null;
  revertedReason?: string | null;

  isActive: boolean;
}
```

Reglas de cálculo:

```text
UNPAID_DAY:
  reduce unidades pagables según valor del día.

UNPAID_HOURS:
  reduce minutos/horas pagables y monto proporcional.

PAID_DAY:
  agrega una unidad pagable o marca la fecha como pagada.

PAID_HOURS:
  agrega horas pagables.

FIXED_DEDUCTION:
  deduce el monto configurado.

FIXED_EARNING:
  agrega el monto configurado.
```

No permitir que un mismo ajuste se aplique dos veces.

---

# Notas y documentos del empleado por día

El empleado debe poder agregar una nota o documentación por un día de trabajo, tardanza, ausencia o problema de ponche.

Ejemplos:

- “El reloj biométrico no funcionó.”
- “Llegué tarde por una emergencia médica.”
- “Estuve trabajando fuera de oficina.”
- “Adjunto constancia médica.”
- “El supervisor aprobó mi salida anticipada.”

No modificar directamente el `WorkSummary` histórico sin auditoría.

Crear o adaptar una entidad de soporte, por ejemplo:

```ts
EmployeeAttendanceDayNote;
```

Estructura sugerida:

```ts
export interface IEmployeeAttendanceDayNote {
  employee: Types.ObjectId;
  company?: Types.ObjectId | null;

  workSummary?: Types.ObjectId | null;

  date: Date;

  noteType:
    | "LATE_EXPLANATION"
    | "MISSING_PUNCH_EXPLANATION"
    | "ABSENCE_EXPLANATION"
    | "EARLY_EXIT_EXPLANATION"
    | "WORK_LOCATION_EXPLANATION"
    | "GENERAL";

  message: string;

  attachments: Array<{
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    uploadedAt: Date;
  }>;

  status: "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED" | "CLOSED";

  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewComment?: string;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

Reutilizar el servicio existente de subida de documentos, por ejemplo S3, Spaces o almacenamiento ya implementado en el proyecto.

## Reglas de las notas

- El empleado puede crear notas para fechas permitidas.
- No puede editar una nota revisada sin crear una nueva revisión o versión.
- RRHH puede ver todas las notas y adjuntos.
- RRHH puede aprobar, rechazar o dejar comentario.
- La aprobación de una nota no debe cambiar el pago automáticamente a menos que RRHH decida aplicar una acción de nómina.
- La nota debe ayudar a RRHH a tomar la decisión sobre descuento, justificación o pago.

---

# Indicadores visuales en frontend

En las tablas de asistencia y nómina, cada día debe mostrar claramente:

- Estado del día.
- Si tiene nota del empleado.
- Cantidad de documentos.
- Cantidad de cambios manuales.
- Si fue revisado por RRHH.
- Si genera pago.
- Si genera descuento.
- Si es feriado.
- Si es vacaciones.
- Si ya fue pagado por adelantado.

Ejemplo de columnas o indicadores:

```text
Fecha
Estado
Entrada / salida
Minutos trabajados
Acción de pago
Vacaciones / permiso / feriado
Nota
Documentos
Cambios
Revisión RRHH
```

Usar iconos, chips y tooltips.

Ejemplos:

```text
Nota:
  icono de comentario + contador.

Documentos:
  icono de adjunto + contador.

Cambios:
  icono de historial + contador.

Feriado:
  chip “Feriado”.

Vacaciones:
  chip “Vacaciones”.

Vacaciones ya pagadas:
  chip “Vacaciones ya pagadas”.

Pendiente de revisión:
  chip amarillo.
```

No ocultar información importante solo dentro de un modal.

---

# Auditoría legible para RRHH

La auditoría no debe mostrar objetos JSON sin formato.

Crear o adaptar un servicio para registrar eventos legibles.

Modelo sugerido:

```ts
export type PayrollAuditEventType =
  | "DAY_STATUS_CHANGED"
  | "PAYMENT_ACTION_CHANGED"
  | "MANUAL_ADJUSTMENT_CREATED"
  | "MANUAL_ADJUSTMENT_REVERTED"
  | "EMPLOYEE_NOTE_CREATED"
  | "EMPLOYEE_NOTE_REVIEWED"
  | "VACATION_LINKED"
  | "VACATION_PAYMENT_APPLIED"
  | "PERMISSION_LINKED"
  | "HOLIDAY_PAYMENT_APPLIED"
  | "PAYROLL_MODE_CHANGED"
  | "PAYROLL_RECALCULATED"
  | "PAYROLL_CLOSED";

export interface IPayrollAuditLog {
  company?: Types.ObjectId | null;
  payrollRun?: Types.ObjectId | null;
  payrollPayment?: Types.ObjectId | null;
  employee?: Types.ObjectId | null;

  date?: Date | null;

  eventType: PayrollAuditEventType;

  title: string;
  description: string;

  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;

  performedBy: Types.ObjectId;
  performedAt: Date;

  metadata?: Record<string, any>;
}
```

Ejemplos de auditoría legible:

```text
María Rodríguez cambió el día 18/06/2026 de “Pendiente de revisión” a “Ausencia no pagada”.

José Pérez agregó una explicación de tardanza para el día 19/06/2026.

Ana Gómez aplicó un descuento de 3 horas el 20/06/2026.
Motivo: salida anticipada no justificada.

Carlos Sánchez marcó el 16/06/2026 como feriado trabajado con pago doble.

RRHH cambió la modalidad de pago de “Quincena completa” a “Solo días seleccionados”.
Motivo: empleado temporal incorporado durante el período.
```

## Frontend de auditoría

Mostrar una línea de tiempo clara:

```text
Fecha y hora
Usuario
Acción
Día afectado
Antes
Después
Motivo
```

Ejemplo:

```text
20/06/2026 10:35 AM
Ana Gómez - Recursos Humanos

Cambió acción de pago:
Antes: Pendiente de revisión
Después: No pagar

Fecha afectada: 18/06/2026
Motivo: Ausencia no justificada
```

Los valores técnicos deben traducirse:

```text
"UNPAID_ABSENCE" → "Ausencia no pagada"
"PAID_VACATION" → "Vacaciones pagadas"
"HOLIDAY_WORKED" → "Feriado trabajado"
"PAY_SELECTED_DAYS_ONLY" → "Pago solo por días seleccionados"
```

---

# Pantalla de nómina

La pantalla de nómina debe permitir:

## Por empleado

- Ver salario base del período.
- Ver modalidad de cálculo.
- Cambiar modalidad si tiene permisos.
- Ver días trabajados.
- Ver días pagables.
- Ver días no pagados.
- Ver vacaciones pagadas.
- Ver vacaciones ya pagadas.
- Ver permisos pagados y no pagados.
- Ver feriados pagados.
- Ver feriados trabajados.
- Ver horas trabajadas.
- Ver horas pagables.
- Ver descuentos por horas o días.
- Ver notas y documentos del empleado.
- Ver historial de cambios.
- Ajustar manualmente días, horas o montos.
- Recalcular el pago.
- Ver el monto final antes de cerrar.

## Acciones por día

RRHH debe poder ejecutar:

```text
Pagar
No pagar
Marcar como vacaciones
Marcar como vacaciones ya pagadas
Marcar como permiso pagado
Marcar como permiso no pagado
Marcar como feriado
Marcar como feriado trabajado
Justificar
Descontar día completo
Descontar medio día
Descontar horas
Agregar pago manual
Agregar nota de RRHH
Ver notas del empleado
Ver documentos
Ver historial del día
```

Todas las acciones manuales deben solicitar un motivo.

---

# Flujo de pre-nómina

## Paso 1: generar borrador

Al abrir o generar nómina:

```text
PayrollRun.status = DRAFT
```

Construir días para todos los empleados elegibles dentro del período.

Para cada fecha:

1. Determinar si es día futuro.
2. Determinar si es descanso según horario.
3. Buscar feriado en calendario.
4. Buscar vacaciones aprobadas.
5. Buscar permisos aprobados.
6. Buscar `WorkSummary`.
7. Buscar notas/documentos del empleado.
8. Aplicar ajustes manuales existentes.
9. Clasificar el día.
10. Calcular unidades, horas y monto preliminar.

## Paso 2: revisión

RRHH revisa los días pendientes.

```text
MISSING_ATTENDANCE
REVIEW
```

RRHH decide si paga, descuenta, justifica, marca vacaciones, permiso u otro estado.

## Paso 3: recalcular

Toda modificación debe recalcular:

- unidades pagables
- minutos pagables
- extras de feriados
- descuentos
- salario bruto
- deducciones
- neto

## Paso 4: cierre

No cerrar una nómina regular antes de terminar el período, salvo que sea:

```text
PARTIAL
ADVANCE
ADJUSTMENT
```

Al cerrar:

- congelar snapshot completo en `PayrollPayment`
- guardar auditoría
- marcar `WorkSummary` aplicables como pagados
- no marcar como pagados días futuros
- no marcar como pagados días excluidos
- no duplicar vacaciones ya pagadas
- no duplicar feriados
- generar TXT bancario según flujo actual
- impedir edición directa luego del cierre, salvo proceso formal de ajuste

---

# Campos recomendados en snapshot de PayrollPayment

Agregar o adaptar:

```ts
snapshot: {
  attendance: {
    calculationMode: PayrollCalculationMode;

    scheduledDays: number;
    workedDays: number;

    paidVacationDays: number;
    alreadyPaidVacationDays: number;

    paidHolidayDays: number;
    workedHolidayDays: number;

    paidPermissionDays: number;
    unpaidPermissionDays: number;

    unpaidAbsenceDays: number;
    missingAttendanceDays: number;

    manualPaidDays: number;
    manualUnpaidDays: number;

    scheduledMinutes: number;
    workedMinutes: number;
    payableMinutes: number;

    paidHours: number;
    unpaidHours: number;

    totalLateMinutes: number;
    totalNotWorkedMinutes: number;

    totalAbsenceDiscount: number;
    totalHoursDiscount: number;
    totalManualDiscount: number;
    totalHolidayPremium: number;

    days: IPayrollDayLedger[];
  };
}
```

---

# API y endpoints

No cambiar endpoints existentes sin necesidad.

Crear o adaptar endpoints para:

```text
GET    /payroll-runs/:id/employees/:employeeId/day-ledger
PUT    /payroll-runs/:id/employees/:employeeId/calculation-mode
POST   /payroll-runs/:id/employees/:employeeId/day-ledger/:date/adjustments
PUT    /payroll-runs/:id/employees/:employeeId/day-ledger/:date/status
POST   /payroll-runs/:id/recalculate
GET    /payroll-runs/:id/audits
GET    /payroll-runs/:id/employees/:employeeId/audits
```

Para notas del empleado:

```text
POST   /attendance/day-notes
GET    /attendance/day-notes/mine
GET    /attendance/day-notes/employee/:employeeId
PUT    /attendance/day-notes/:id/review
```

Para calendario:

```text
GET    /work-calendar
POST   /work-calendar
PUT    /work-calendar/:id
DELETE /work-calendar/:id
POST   /work-calendar/import-year
```

Para vacaciones pagadas por adelantado:

```text
POST   /vacations/payment-ledger
GET    /vacations/payment-ledger/employee/:employeeId
```

Adaptar rutas existentes en lugar de duplicarlas cuando ya exista una ruta equivalente.

---

# Validaciones importantes

1. No permitir cerrar una nómina regular antes de que termine el período.
2. No permitir pagar dos veces el mismo día de vacaciones.
3. No permitir marcar vacaciones ya pagadas sin ledger válido.
4. No permitir aplicar ajuste manual sin motivo.
5. No permitir descontar más horas que las programadas para el día.
6. No permitir descuento de días u horas que vuelva el pago negativo sin autorización explícita.
7. No permitir que un feriado genere ausencia.
8. No permitir doble pago de un feriado si ya fue aplicado.
9. No permitir que una modificación afecte nómina cerrada sin flujo de ajuste.
10. No permitir que una nota del empleado cambie automáticamente el pago sin revisión de RRHH.
11. No permitir duplicar un `PayrollDayLedger` para la misma fecha, empleado y nómina.
12. No perder relaciones entre:
    - WorkSummary
    - vacaciones
    - permisos
    - feriados
    - notas
    - ajustes
    - PayrollPayment
    - auditoría

---

# Backfill y compatibilidad

No modificar pagos históricos cerrados.

Para datos antiguos:

- Tratar la modalidad existente como `FULL_PERIOD`.
- Mantener `PayrollPayment` existentes sin requerir nuevos campos.
- Usar defaults seguros.
- Los nuevos snapshots detallados aplican principalmente a nuevos borradores o nóminas recalculadas explícitamente.
- Crear scripts de backfill solamente cuando sean necesarios y que puedan ejecutarse una sola vez.
- No generar artificialmente vacaciones, permisos o feriados históricos sin revisión.

---

# Pruebas obligatorias

Crear o adaptar pruebas para estos casos.

## Caso 1: empleado fijo con un solo día trabajado

```text
Modo: FULL_PERIOD
Resultado: cobra quincena completa.
```

## Caso 2: empleado fijo con descuento manual

```text
Modo: FULL_PERIOD_WITH_DAY_ADJUSTMENTS
Base quincenal: RD$15,000
Dos días no pagados aprobados
Valor diario: RD$1,000
Resultado: RD$13,000 antes de otras deducciones.
```

## Caso 3: pago solo por días

```text
Modo: PAY_SELECTED_DAYS_ONLY
Trabajó: 3 días
Vacaciones pagables: 3 días
Feriado pagado: 1 día
Resultado: 7 días pagables.
```

## Caso 4: empleado por hora

```text
Modo: PAY_SELECTED_HOURS_ONLY
Horas trabajadas: 40
Permiso pagado: 8 horas
Resultado: 48 horas pagables.
```

## Caso 5: feriado pagado no trabajado

```text
No genera ausencia.
No genera descuento.
En modo por días puede contar como día pagable si la política lo define.
```

## Caso 6: feriado trabajado con pago doble

```text
Modo FULL_PERIOD:
  agregar solo el extra necesario para llegar al doble.

Modo PAY_SELECTED_DAYS_ONLY:
  pagar 2 unidades si el multiplicador es 2.
```

## Caso 7: vacaciones pagadas por adelantado

```text
Vacaciones prepagadas: 14 días.
Luego disfruta 3 días.
Resultado:
  usa 3 días disfrutables,
  consume 3 días del ledger,
  no vuelve a pagar esos 3 días.
```

## Caso 8: día futuro

```text
No se trata como ausencia.
No se paga.
No se marca como pagado.
```

## Caso 9: nota del empleado

```text
Empleado registra nota y adjunta documento.
RRHH ve icono de nota y cantidad de adjuntos.
RRHH revisa y decide si mantiene, justifica o descuenta.
```

## Caso 10: auditoría

```text
RRHH cambia un día de “Pendiente de revisión” a “No pagar”.
La auditoría debe mostrar:
  quién,
  cuándo,
  día afectado,
  valor anterior,
  valor nuevo,
  motivo.
```

---

# Orden de implementación recomendado

## Fase 1

- Inspeccionar arquitectura actual.
- Crear o adaptar calendario anual de feriados.
- Construir clasificación diaria de nómina.
- Implementar snapshots detallados de días.
- Mantener comportamiento actual como `FULL_PERIOD`.

## Fase 2

- Agregar modalidades de cálculo.
- Agregar descuentos por día, horas y minutos.
- Agregar acciones manuales con auditoría.
- Agregar recalculación segura.

## Fase 3

- Integrar vacaciones, permisos y vacaciones pagadas por adelantado.
- Crear o adaptar ledger de pago de vacaciones.
- Evitar duplicidad de pagos.

## Fase 4

- Agregar notas y documentos por día de asistencia.
- Agregar revisión de RRHH.
- Mostrar indicadores y auditorías legibles en frontend.

## Fase 5

- Refinar pantallas.
- Agregar filtros y reportes.
- Validar casos de feriados trabajados.
- Validar generación de TXT bancario luego del cierre.

---

# Resultado esperado

El sistema debe permitir, por empleado y por período:

```text
1. Pagar quincena o mes completo aunque tenga pocos ponches.

2. Pagar quincena completa y descontar días específicos.

3. Pagar solo días seleccionados o realmente trabajados.

4. Pagar solo horas seleccionadas o realmente trabajadas.

5. Contar vacaciones pagables como días pagados en modalidades por día.

6. Evitar doble pago si las vacaciones fueron pagadas previamente.

7. No descontar feriados pagados.

8. Agregar pago extra por feriados trabajados según multiplicador configurado.

9. Permitir al empleado explicar tardanzas, faltas, errores de ponche o situaciones especiales.

10. Permitir a RRHH revisar notas, adjuntos, cambios y tomar decisiones justificadas.

11. Mantener historial de auditoría legible y completo.

12. No romper el flujo actual de PayrollRun, PayrollPayment, WorkSummary, cierre de nómina ni TXT bancario.
```
