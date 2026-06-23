# Validación bts-payroll-prod-copy

- Migración: `BTS_PAYROLL_PROD_COPY_TO_CURRENT_VERSION_V1`
- Generado: 2026-06-20T15:39:01.691Z
- BLOCKER: 0
- WARNING: 2
- INFO: 1

## Hallazgos

| Prioridad | Colección | Mensaje | Conteo |
| --- | --- | --- | --- |
| WARNING | users | Usuarios sin employmentStatus luego de la migración. | 46 |
| WARNING | users | Usuarios sin payrollCalculationMode luego de la migración. | 46 |
| INFO | payrollpayments | PayrollPayment histórico sin snapshot.attendance.version. Es válido si todavía no se ejecutó la migración. | 194 |
