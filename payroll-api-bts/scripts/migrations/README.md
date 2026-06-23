# Migración `bts-payroll-prod-copy`

Estos scripts están limitados a la base `bts-payroll-prod-copy`. Todos fuerzan el nombre de base desde `DB_CNN` y bloquean la ejecución si la conexión no apunta a esa base.

## Orden Recomendado

1. Análisis solo lectura:

```bash
npm run migrate:prod-copy:analyze
```

2. Dry-run del plan de adaptación, sin escribir en MongoDB:

```bash
npm run migrate:prod-copy:dry-run
```

3. Validación solo lectura:

```bash
npm run migrate:prod-copy:validate
```

4. Ejecución real, solo cuando el análisis haya sido revisado:

```bash
ALLOW_PROD_COPY_MIGRATION=true npm run migrate:prod-copy:execute -- --confirm-database=bts-payroll-prod-copy
```

5. Rollback de una ejecución específica:

```bash
ALLOW_PROD_COPY_MIGRATION=true npm run migrate:prod-copy:rollback -- --confirm-database=bts-payroll-prod-copy --migration-run=<MigrationRunObjectId>
```

## Guardas De Seguridad

- La única base permitida es `bts-payroll-prod-copy`.
- El modo `execute` exige `ALLOW_PROD_COPY_MIGRATION=true`.
- El modo `execute` y el rollback exigen `--confirm-database=bts-payroll-prod-copy`.
- El dry-run no crea `MigrationRun` ni `MigrationBackup`, porque debe ser lectura contra MongoDB.
- La ejecución real crea un `MigrationRun` y un `MigrationBackup` por cada documento alterado o creado.
- El rollback restaura desde `MigrationBackup` en orden inverso.

## Qué Migra

- `users`: completa `employmentStatus` y `payrollCalculationMode` solo si faltan.
- `payrollpayments`: agrega `snapshot.attendance` legacy para compatibilidad, sin recalcular montos cerrados.
- `employeevacationbalances`: normaliza fórmulas de días disponibles, pagables y reservados usando reservas activas.
- `employeeloanrequests` + `vacationdayreservations`: crea reservas activas para préstamos vigentes con días garantizados cuando no exista una reserva activa y haya datos suficientes.

## Qué No Migra Automáticamente

- No recalcula nóminas históricas.
- No modifica montos de `PayrollRun` ni `PayrollPayment`.
- No marca empleados como `TERMINATED` sin evidencia de desvinculación.
- No resuelve duplicados críticos; los reporta como `BLOCKER`.
- No crea fixtures, calendarios o datos sintéticos de producción.

## Reportes

Cada script escribe archivos en `reports/`:

- `bts-payroll-prod-copy-analysis-*.json|md`
- `bts-payroll-prod-copy-migration-dry-run-*.json|md`
- `bts-payroll-prod-copy-validation-*.json|md`
- `bts-payroll-prod-copy-rollback-*.json|md`
