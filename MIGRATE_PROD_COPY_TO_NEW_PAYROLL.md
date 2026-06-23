# MIGRATE_PROD_COPY_TO_NEW_PAYROLL.md

## Misión

Tengo una base MongoDB llamada:

```text
bts-payroll-prod-copy
```

Es una copia de producción de una versión antigua de `bts-payroll`.

Necesito adaptar esa copia a la versión actual del sistema para poder hacer pruebas reales de:

* Nómina.
* Asistencia y ponches.
* Cálculo por período, días y horas.
* Vacaciones.
* Permisos.
* Feriados.
* Préstamos con garantía de vacaciones.
* Desvinculación.
* Auditoría.
* Generación de TXT bancario.

La tarea no es crear una base vacía ni reemplazar datos reales con seeders genéricos. Debe conservarse la información original y construir los nuevos modelos, campos, relaciones, snapshots y datos derivados que hagan falta para probar correctamente la nueva versión.

---

# Regla crítica de seguridad

## Base permitida

Solo se permite conectar, leer y modificar esta base:

```text
bts-payroll-prod-copy
```

Nunca ejecutar migraciones contra:

```text
bts-payroll
production
prod
```

ni contra una URI que no confirme explícitamente que la base final es:

```text
bts-payroll-prod-copy
```

Implementar una protección obligatoria en el script:

```ts
const ALLOWED_DATABASE_NAME = "bts-payroll-prod-copy";

if (mongoose.connection.name !== ALLOWED_DATABASE_NAME) {
  throw new Error(
    `Migration blocked. Expected database "${ALLOWED_DATABASE_NAME}" but connected to "${mongoose.connection.name}".`,
  );
}
```

Además, exigir una bandera explícita para ejecutar cambios:

```bash
ALLOW_PROD_COPY_MIGRATION=true
```

y una confirmación:

```bash
--confirm-database=bts-payroll-prod-copy
```

Sin ambas condiciones, ejecutar solamente en modo lectura o `dry-run`.

---

# Contexto del proyecto

Stack:

```text
Backend: Node.js + Express + TypeScript + Mongoose + MongoDB
Frontend: Vue 3 + Quasar
Timezone: America/Santo_Domingo
```

Antes de modificar o migrar datos, leer:

```text
AGENTS.md
CODEX_CONTEXT.md
PAYROLL_ATTENDANCE_CONTEXT.md
```

También inspeccionar los modelos, controladores, servicios, helpers, rutas y pantallas existentes.

---

# Objetivo de migración

Crear un proceso seguro e idempotente que:

1. Analice todas las colecciones existentes.
2. Detecte qué estructura pertenece a la versión antigua.
3. Compare los documentos con los modelos actuales.
4. Complete campos nuevos usando datos reales existentes cuando sea posible.
5. Cree documentos derivados necesarios para que el sistema nuevo funcione.
6. No modifique pagos históricos cerrados.
7. No invente movimientos financieros históricos que parezcan reales.
8. Cree escenarios realistas de prueba solo para empleados explícitamente de prueba.
9. Genere un reporte antes y después de la migración.
10. Permita ejecutar el proceso más de una vez sin duplicar datos.

---

# Entregables obligatorios

Crear estos archivos o equivalentes dentro del repositorio:

```text
scripts/migrations/analyzeBtsPayrollProdCopy.ts
scripts/migrations/adaptBtsPayrollProdCopyToCurrentVersion.ts
scripts/migrations/validateBtsPayrollProdCopyMigration.ts
scripts/migrations/rollbackBtsPayrollProdCopyMigration.ts
scripts/migrations/README.md
```

También crear, si no existe algo equivalente:

```text
MigrationRun
MigrationBackup
```

o usar colecciones internas con ese propósito.

Cada ejecución debe registrar:

```ts
{
  migrationKey: "BTS_PAYROLL_PROD_COPY_TO_CURRENT_VERSION_V1",
  startedAt: Date,
  finishedAt?: Date,
  status: "DRY_RUN" | "RUNNING" | "COMPLETED" | "FAILED" | "ROLLED_BACK",
  databaseName: "bts-payroll-prod-copy",
  executedBy: "script",
  createdCounts: Record<string, number>,
  updatedCounts: Record<string, number>,
  skippedCounts: Record<string, number>,
  warningCounts: Record<string, number>,
  errors: Array<{
    collection?: string;
    documentId?: string;
    message: string;
  }>,
  reportPath?: string,
}
```

El script debe aceptar:

```bash
npm run migrate:prod-copy:analyze

npm run migrate:prod-copy:dry-run

npm run migrate:prod-copy:execute -- \
  --confirm-database=bts-payroll-prod-copy

npm run migrate:prod-copy:validate

npm run migrate:prod-copy:rollback -- \
  --migration-run=<migrationRunId> \
  --confirm-database=bts-payroll-prod-copy
```

Adaptar los comandos a la estructura real de `package.json`, pero mantener la intención.

---

# Fase 0: análisis completo antes de cambiar datos

Primero crear un análisis de solamente lectura.

Debe enumerar todas las colecciones de MongoDB y producir un reporte Markdown y JSON.

Ejemplo de salida:

```text
reports/bts-payroll-prod-copy-analysis-YYYYMMDD-HHmmss.md
reports/bts-payroll-prod-copy-analysis-YYYYMMDD-HHmmss.json
```

El análisis debe incluir:

```text
- Nombre de colección.
- Cantidad de documentos.
- Campos más frecuentes.
- Campos faltantes respecto a los modelos actuales.
- Referencias rotas.
- Documentos duplicados.
- Documentos sin compañía.
- Usuarios sin salario.
- Usuarios sin horario.
- Usuarios sin frecuencia de pago.
- Usuarios sin calendario de pago.
- WorkSummary sin PunchHistory.
- PunchHistory sin WorkSummary.
- PayrollRun sin PayrollPayment.
- PayrollPayment sin empleado.
- Vacaciones sin balance.
- Préstamos activos sin reserva de vacaciones.
- Empleados inactivos sin motivo.
- Empleados con datos insuficientes para nómina.
- Registros con fechas inválidas.
- Colecciones antiguas que no tienen modelo actual.
```

No asumir nombres de colecciones. Inspeccionarlos primero.

El reporte debe clasificar problemas por prioridad:

```text
BLOCKER
WARNING
INFO
```

Ejemplos:

```text
BLOCKER:
Empleado activo sin salario ni tipo de salario.

WARNING:
Empleado fijo sin PaymentSchedule configurado.

INFO:
PayrollPayment histórico sin snapshot detallado de asistencia.
```

---

# Reglas de conservación de datos

## Nunca hacer esto

No:

* Eliminar documentos originales.
* Recalcular y sobrescribir nóminas cerradas.
* Cambiar montos de pagos históricos.
* Marcar nuevas asistencias como pagadas en períodos antiguos.
* Inventar préstamos históricos.
* Inventar vacaciones tomadas por empleados reales.
* Inventar notas o documentos a nombre de empleados reales.
* Inventar cuentas bancarias, cédulas, bancos o salarios.
* Modificar la base de producción.
* Asumir que un empleado inactivo está desvinculado.
* Cambiar el estado laboral de empleados sin evidencia de desvinculación.

## Sí se puede hacer

* Completar campos nuevos con defaults seguros.
* Crear snapshots y balances derivados cuando la fuente sea verificable.
* Crear registros de migración con metadata.
* Crear registros iniciales de movimientos, marcados como migración.
* Crear balances de vacaciones derivados de fecha de ingreso y políticas existentes.
* Crear calendario laboral y feriados para escenarios futuros.
* Crear datos de prueba únicamente para empleados o compañías claramente marcados como test.
* Crear una compañía o empleados de prueba separados si no existen.
* Etiquetar todos los datos sintéticos.

Todo documento creado por la migración debe tener, cuando el schema lo permita:

```ts
metadata: {
  migrationKey: "BTS_PAYROLL_PROD_COPY_TO_CURRENT_VERSION_V1",
  migrationRunId: ObjectId,
  source: "MIGRATION",
  sourceDocumentIds?: ObjectId[],
  isDerived: true,
  isSyntheticFixture: false,
  createdFromVersion: "legacy-production-copy",
}
```

Para datos ficticios de prueba:

```ts
metadata: {
  migrationKey: "BTS_PAYROLL_PROD_COPY_TO_CURRENT_VERSION_V1",
  source: "MIGRATION_TEST_FIXTURE",
  isSyntheticFixture: true,
}
```

---

# Idempotencia

La migración debe ser segura si se ejecuta varias veces.

Antes de crear un documento, verificar si ya existe uno creado por la migración usando:

```ts
migrationKey
migrationRunId
sourceDocumentIds
user + year
employee + date
employee + payrollRun
```

Ejemplos de claves naturales:

```text
EmployeeVacationBalance:
user + year + isDeleted:false

VacationDayReservation:
loanRequest + status:"ACTIVE"

VacationPaymentLedger:
employee + vacationBalance + paymentType + payrollPayment

CompanyWorkCalendarDay:
company + branch + date + isDeleted:false

PayrollDayLedger:
payrollRun + employee + date
```

No duplicar balances, reservas, movimientos, calendarios ni fixtures.

---

# Migración de empleados

Inspeccionar primero el modelo actual de empleado, usuario, contrato, salario, tipo de salario, horario, frecuencia de pago y calendario de pago.

Completar solo campos que puedan deducirse de datos existentes.

## Estado laboral

Agregar o adaptar:

```ts
employmentStatus:
  | "ACTIVE"
  | "INACTIVE"
  | "TERMINATED";
```

Reglas:

```text
Empleado activo existente:
employmentStatus = "ACTIVE"

Empleado inactivo sin registro de desvinculación:
employmentStatus = "INACTIVE"

Empleado con una EmployeeTermination válida:
employmentStatus = "TERMINATED"
isActive = false
terminatedAt = fecha efectiva de desvinculación
terminationRecord = referencia a EmployeeTermination
```

No marcar como `TERMINATED` solo porque `isActive === false`.

## Modalidad de cálculo de nómina

Agregar o adaptar:

```ts
payrollCalculationMode:
  | "FULL_PERIOD"
  | "FULL_PERIOD_WITH_DAY_ADJUSTMENTS"
  | "PAY_SELECTED_DAYS_ONLY"
  | "PAY_SELECTED_HOURS_ONLY";
```

Reglas de migración:

```text
Empleado con salario fijo:
FULL_PERIOD_WITH_DAY_ADJUSTMENTS

Empleado con tipo salarial por horas:
PAY_SELECTED_HOURS_ONLY

Empleado con pago diario o temporal claramente identificado:
PAY_SELECTED_DAYS_ONLY

Empleado sin evidencia suficiente:
FULL_PERIOD
```

No asumir tipo de salario si no existe. Reportar el caso como `WARNING`.

---

# Migración de balances de vacaciones

Inspeccionar todos los modelos anteriores relacionados con:

```text
vacaciones
balances
permisos
solicitudes de vacaciones
días usados
días pagados
liquidaciones
préstamos
```

Usar los helpers actuales del proyecto para calcular vacaciones. No duplicar fórmulas si ya existe un helper confiable.

Modelo objetivo:

```text
EmployeeVacationBalance
```

Campos relevantes:

```ts
assignedDays
paymentBaseDays
accruedPaymentDays
enjoyableDays
usedDays
adjustmentDays
reservedDays
availableDays
availableForLoanDays
payableVacationDays
netPayableVacationDays
carryOverDays
expiredDays
serviceMonths
serviceYears
cycleStartDate
cycleEndDate
lastCalculatedAt
```

## Fórmulas vigentes

```ts
const enjoyableBase =
  enjoyableDays +
  carryOverDays +
  adjustmentDays;

const paymentBase =
  accruedPaymentDays +
  carryOverDays +
  adjustmentDays;

availableDays = Math.max(
  0,
  enjoyableBase - usedDays,
);

availableForLoanDays = Math.max(
  0,
  paymentBase - usedDays - reservedDays,
);

payableVacationDays = Math.max(
  0,
  paymentBase - usedDays,
);

netPayableVacationDays = Math.max(
  0,
  paymentBase - usedDays - reservedDays,
);
```

Reglas:

1. Crear o actualizar un `EmployeeVacationBalance` por empleado y año.
2. Usar fecha de ingreso, empresa, política y solicitudes existentes.
3. Usar días de vacaciones aprobados o consumidos reales para `usedDays`.
4. No inventar días usados.
5. Si faltan datos para calcular con certeza, usar el cálculo más conservador permitido por la política y registrar una advertencia.
6. No reducir `availableDays` por reservas de préstamo.
7. Sí reducir `availableForLoanDays` y `netPayableVacationDays` por reservas activas.
8. No sobrescribir balances creados manualmente en la nueva versión sin revisar metadata y timestamps.

Crear un movimiento inicial de migración, solamente cuando sea necesario:

```ts
type: "INITIAL_ASSIGNMENT" | "VACATION_ACCRUAL_RECALCULATION"
```

Con metadata:

```ts
{
  source: "MIGRATION",
  isOpeningBalance: true,
  reason: "Balance inicial creado al adaptar base legacy."
}
```

No fabricar un historial diario de movimientos que no existió.

---

# Migración de préstamos y reservas de vacaciones

Inspeccionar préstamos existentes y solicitudes de préstamo.

Para préstamos o solicitudes activas que realmente tengan:

```text
guaranteedDays > 0
```

crear o validar:

```text
VacationDayReservation
```

Reglas:

```text
- Crear reserva solo para préstamos activos o vigentes.
- No crear reserva para préstamos cancelados, rechazados o pagados/liberados.
- No usar el monto para adivinar días garantizados si el campo no existe.
- Si no se puede determinar guaranteedDays, reportar el préstamo para revisión manual.
- Recalcular reservedDays como suma de reservas ACTIVE válidas.
- No afectar availableDays.
- Sí afectar availableForLoanDays y netPayableVacationDays.
```

La reserva debe apuntar a:

```ts
user
company
balance
year
loanRequest
reservedDays
status: "ACTIVE"
source: "LOAN" | "EMPLOYEE_LOAN_REQUEST"
reason
createdBy
```

---

# Migración de vacaciones pagadas por adelantado

Inspeccionar si los datos antiguos contienen pagos de vacaciones, pagos anticipados, liquidaciones, conceptos de nómina o registros donde se pagaron vacaciones.

Modelo objetivo sugerido:

```text
VacationPaymentLedger
```

Crear ledger solamente cuando exista evidencia financiera real de que esas vacaciones fueron pagadas.

Nunca crear un ledger ficticio para empleados reales.

Ejemplo:

```ts
{
  paymentType: "VACATION_ADVANCE",
  paidDays: number,
  consumedDays: number,
  remainingPrepaidDays: number,
  dayValue: number,
  totalAmount: number,
  paidAt: Date,
  status: "ACTIVE" | "FULLY_CONSUMED",
}
```

Los días pagados por adelantado:

```text
- No se vuelven a pagar.
- No se tratan como ausencia.
- Sí pueden disfrutarse.
- Deben consumirse cuando el empleado toma vacaciones.
```

---

# Calendario anual de feriados y días laborales

Crear o adaptar un modelo tipo:

```text
CompanyWorkCalendarDay
```

Debe permitir que RRHH registre desde antes los feriados del año siguiente.

No crear un feriado por empleado.

Aplicar por:

```text
empresa
sucursal, si aplica
fecha
```

Campos importantes:

```ts
date
year
name
dayType
isPaid
countsAsPaidDayForDayBasedPayroll
requiresAttendance
holidayWorkPaymentMode
holidayWorkTargetMultiplier
appliesTo
source
isActive
isDeleted
```

## Datos de feriados

Primero detectar el país, empresa, política o configuración existente.

Para compañías en República Dominicana, crear los feriados del próximo año solamente si:

* El país o jurisdicción de la compañía está definido como República Dominicana.
* O existe una configuración de calendario que lo indique.
* O se crea una política explícita de calendario de prueba.

Para feriados cuyo tratamiento oficial pueda variar, almacenar:

```ts
source: "OFFICIAL" | "MANUAL" | "COMPANY"
```

y documentar su origen.

No asumir feriados de un país si la compañía no está configurada para ese país.

## Regla de nómina

Feriado pagado no trabajado:

```text
- No genera ausencia.
- No genera descuento.
- En pago por días puede contar como día pagable.
```

Feriado trabajado:

```text
- Debe clasificarse como HOLIDAY_WORKED.
- Debe generar prima según multiplicador configurado.
- Con multiplicador 2:
  - FULL_PERIOD: agregar solo 1 unidad extra.
  - PAY_SELECTED_DAYS_ONLY: pagar 2 unidades.
```

---

# Nómina, asistencia y snapshots

Conservar el flujo existente:

```text
WorkSummary + PunchHistories
        ↓
PayrollRun
        ↓
PayrollPayment
        ↓
Cierre / TXT bancario
```

No reemplazarlo.

Agregar o adaptar el detalle diario dentro de:

```text
PayrollPayment.snapshot.attendance.days
```

o crear una colección separada solo si el modelo existente lo requiere.

Cada fecha del período debe evaluarse aunque no exista WorkSummary.

Estados sugeridos:

```ts
type PayrollDayStatus =
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

Acciones:

```ts
type PayrollDayPaymentAction =
  | "PAY"
  | "DO_NOT_PAY"
  | "REVIEW"
  | "EXCLUDE"
  | "ALREADY_PAID";
```

Para pagos históricos cerrados:

```text
- No recalcular montos.
- No cambiar su estado.
- No inventar detalle diario histórico.
- Completar solo campos seguros de compatibilidad, usando defaults.
```

Para PayrollRun nuevos, borradores o escenarios de prueba:

```text
- Generar detalle diario completo.
- Usar WorkSummary, PunchHistories, permisos, vacaciones y feriados.
- Mantener snapshot inmutable al cerrar.
```

---

# Permisos y vacaciones

Integrar permisos y vacaciones con la evaluación diaria de nómina.

Reglas:

```text
Vacación aprobada:
- FULL_PERIOD: no descuenta ni agrega dinero extra.
- PAY_SELECTED_DAYS_ONLY: puede contar como día pagable.
- Si fue pagada previamente: VACATION_ALREADY_PAID, no volver a pagar.

Permiso pagado:
- No descuenta.
- Puede sumar minutos/día pagable según modalidad.

Permiso no pagado:
- Reduce el pago por día, horas o minutos.

Permiso parcial:
- Debe mantener paidMinutes y unpaidMinutes.
```

No cambiar solicitudes históricas sin necesidad.

---

# Notas, documentos y auditoría

Crear o adaptar soporte para notas de asistencia por día.

El empleado debe poder explicar:

```text
- tardanza
- salida temprana
- falta de ponche
- ausencia
- trabajo fuera de oficina
- situación médica
- comentario general
```

Para empleados reales de la copia:

```text
No crear notas ficticias.
No crear documentos ficticios.
```

Para empleados de prueba:

```text
Se pueden crear notas y documentos sintéticos,
siempre etiquetados como isSyntheticFixture: true.
```

El frontend debe mostrar por día:

```text
- indicador de nota
- cantidad de documentos
- cantidad de cambios
- estado de revisión de RRHH
- historial legible
```

La auditoría debe ser legible, por ejemplo:

```text
Ana Gómez cambió el día 18/06/2026 de “Pendiente de revisión” a “No pagar”.
Motivo: Ausencia no justificada.

Juan Pérez agregó una explicación de tardanza.
Adjuntos: 1 documento.

RRHH aplicó un descuento de 3 horas.
Motivo: Salida anticipada no justificada.
```

No mostrar JSON técnico como interfaz principal.

---

# Fixtures realistas de prueba

No contaminar empleados reales con datos ficticios.

Buscar primero empleados ya identificados como prueba, por ejemplo:

```text
correo @bts.test
nombre con TEST
company de pruebas
metadata.isTest
```

Si no existen, crear una compañía de pruebas o un conjunto de empleados de pruebas claramente separado.

Nombre sugerido:

```text
BTS Payroll Migration Test Fixtures
```

Todos los fixtures deben tener:

```ts
metadata: {
  isSyntheticFixture: true,
  migrationKey: "BTS_PAYROLL_PROD_COPY_TO_CURRENT_VERSION_V1",
}
```

Crear escenarios verificables:

## Fixture 1: empleado fijo

```text
Modo: FULL_PERIOD
Tiene un solo WorkSummary dentro de una quincena.
Resultado esperado: cobra quincena completa.
```

## Fixture 2: empleado fijo con descuentos

```text
Modo: FULL_PERIOD_WITH_DAY_ADJUSTMENTS
Tiene días sin ponche.
RRHH marca 2 días como no pagados.
Resultado esperado: descuenta exactamente 2 días.
```

## Fixture 3: empleado por día

```text
Modo: PAY_SELECTED_DAYS_ONLY
Trabajó 3 días.
Tiene 3 días de vacaciones aprobadas.
Tiene 1 feriado pagado.
Resultado esperado: 7 días pagables.
```

## Fixture 4: empleado por horas

```text
Modo: PAY_SELECTED_HOURS_ONLY
Trabajó 40 horas.
Tiene 8 horas de permiso pagado.
Resultado esperado: 48 horas pagables.
```

## Fixture 5: feriado trabajado

```text
Feriado configurado con multiplicador 2.
Empleado trabaja ese día.
Resultado esperado:
- FULL_PERIOD: agrega solo 1 día extra.
- PAY_SELECTED_DAYS_ONLY: paga 2 unidades.
```

## Fixture 6: vacaciones pagadas por adelantado

```text
VacationPaymentLedger:
paidDays: 14
consumedDays: 0
remainingPrepaidDays: 14
```

Luego crear vacaciones aprobadas por 3 días.

Resultado esperado:

```text
- Se consumen 3 días de vacaciones.
- remainingPrepaidDays queda en 11.
- La nómina marca VACATION_ALREADY_PAID.
- No paga esos 3 días otra vez.
```

## Fixture 7: notas y auditoría

Crear una nota sintética por falta de ponche y una por tardanza, con adjuntos sintéticos no personales o referencias de prueba.

Resultado esperado:

```text
- La tabla muestra icono de nota.
- La tabla muestra contador de documentos.
- RRHH puede revisar y cambiar el estado.
- La auditoría muestra quién, cuándo, antes, después y motivo.
```

---

# Validación posterior a la migración

Crear un script de validación que compruebe:

```text
1. La conexión fue exclusivamente a bts-payroll-prod-copy.
2. No se modificaron PayrollRun cerrados en valores financieros.
3. No se duplicaron EmployeeVacationBalance por usuario y año.
4. reservedDays coincide con reservas ACTIVE.
5. availableDays no descuenta reservedDays.
6. availableForLoanDays sí descuenta reservedDays.
7. netPayableVacationDays sí descuenta reservedDays.
8. No existen feriados duplicados para misma empresa/sucursal/fecha.
9. No existen fixtures sintéticos en empleados reales.
10. No existen VacationPaymentLedger duplicados.
11. No existen PayrollDayLedger duplicados por empleado, fecha y PayrollRun.
12. Los fixtures generan los resultados esperados.
13. Los documentos creados por migración tienen metadata correcta.
14. Los datos originales se pueden rastrear mediante sourceDocumentIds.
15. La migración se puede volver a ejecutar sin crear duplicados.
```

El reporte final debe incluir:

```text
- Conteos antes y después por colección.
- Documentos creados.
- Documentos actualizados.
- Documentos omitidos.
- Advertencias que requieren revisión manual.
- Errores.
- Empleados con información insuficiente.
- Préstamos activos no migrados por falta de guaranteedDays.
- Balances de vacaciones creados o actualizados.
- Calendarios y feriados creados.
- Fixtures creados.
- Resultado de pruebas de consistencia.
```

---

# Orden de trabajo

## Paso 1

Leer los archivos de contexto y revisar la arquitectura actual.

## Paso 2

Hacer análisis de solo lectura de `bts-payroll-prod-copy`.

## Paso 3

Entregar el reporte y el mapa de migración:

```text
Colección antigua → modelo nuevo → estrategia → riesgos
```

## Paso 4

Crear scripts de migración, respaldo, rollback y validación.

## Paso 5

Ejecutar `dry-run`.

## Paso 6

Corregir problemas detectados en el dry-run.

## Paso 7

Ejecutar migración real solamente contra:

```text
bts-payroll-prod-copy
```

## Paso 8

Ejecutar validación posterior.

## Paso 9

Crear fixtures sintéticos solamente para usuarios o compañías de prueba.

## Paso 10

Entregar reporte final de cambios y comandos para repetir el proceso.

---

# Resultado esperado

Al terminar, la base `bts-payroll-prod-copy` debe permitir probar la versión nueva con datos históricos reales y escenarios seguros de prueba:

```text
- Empleados reales conservados.
- Nóminas históricas intactas.
- Balances de vacaciones funcionales.
- Reservas de préstamos correctas.
- Días disfrutables no bloqueados por préstamos.
- Calendario de feriados preparado.
- Pago doble de feriado configurable.
- Permisos y vacaciones ligados a nómina.
- Cálculo por período, días u horas.
- Notas y documentos por día.
- Auditorías legibles.
- Datos de prueba aislados y claramente identificados.
- Migración repetible, segura e idempotente.
```
