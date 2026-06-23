const money = (n: any) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

export function buildEmployeePayslipHTML(payload: any) {
  const s = payload?.snapshot || {};
  const emp = s.employee || {};
  const period = s.period || {};
  const totals = s.totals || {};
  const legal = Array.isArray(s.legalDeductions) ? s.legalDeductions : [];
  const other = Array.isArray(s.otherDeductions) ? s.otherDeductions : [];
  const earnings = Array.isArray(s.earnings) ? s.earnings : [];

  const companyName = payload?.company?.name || "Empresa";
  const employeeName = emp?.name || "N/A";

  const payDateStr = period.payDate
    ? new Date(period.payDate).toLocaleDateString("es-DO")
    : "N/A";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Volante de Pago</title>
</head>

<body style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:24px 0;">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table width="750" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; max-width:750px; width:100%;">
          
          <!-- HEADER (mismo estilo) -->
          <tr>
            <td style="background:linear-gradient(90deg,#005aa5,#00a6e7); padding:16px 24px; color:#ffffff;">
              <h2 style="margin:0; font-size:20px; line-height:1.2;">${companyName}</h2>
              <p style="margin:4px 0 0; font-size:13px; opacity:0.95;">
                Volante de pago • ${employeeName}
              </p>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px; color:#333; margin:0 0 10px;">
                Hola <strong>${employeeName}</strong>,
              </p>

              <p style="font-size:13px; color:#333; line-height:1.5; margin:0 0 14px;">
                Aquí tienes el detalle de tu volante de pago del período indicado.
              </p>

              <!-- RESUMEN -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:10px 0 18px; font-size:13px; color:#333;">
                <tr>
                  <td style="padding:6px 0; width:140px; font-weight:bold;">Empleado:</td>
                  <td style="padding:6px 0;">${employeeName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Período:</td>
                  <td style="padding:6px 0;">${period.start || ""} a ${
    period.end || ""
  }</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Fecha de pago:</td>
                  <td style="padding:6px 0;">${payDateStr}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:bold;">Frecuencia:</td>
                  <td style="padding:6px 0;">${
                    period.frecuenciaPago.toUpperCase() || "N/A"
                  }</td>
                </tr>
              </table>

              <hr style="border:none; border-top:1px solid #eee; margin:14px 0;" />

              <!-- INGRESOS -->
              <h3 style="margin:12px 0 6px; font-size:15px; color:#111;">Ingresos</h3>
              <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse; font-size:13px;">
                ${earnings
                  .map(
                    (e: any) => `
                  <tr>
                    <td style="border-bottom:1px solid #eee;">${e.nombre}</td>
                    <td align="right" style="border-bottom:1px solid #eee;">${money(
                      e.montoPeriodo
                    )}</td>
                  </tr>`
                  )
                  .join("")}
                <tr>
                  <td style="padding-top:10px;"><b>Total ingresos</b></td>
                  <td align="right" style="padding-top:10px;"><b>${money(
                    totals.totalEarningsPeriodo ||
                      totals.sueldoBrutoPeriodo ||
                      0
                  )}</b></td>
                </tr>
              </table>

              <!-- DEDUCCIONES LEGALES -->
              <h3 style="margin:16px 0 6px; font-size:15px; color:#111;">Deducciones legales</h3>
              <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse; font-size:13px;">
                ${legal
                  .map(
                    (d: any) => `
                  <tr>
                    <td style="border-bottom:1px solid #eee;">${d.nombre}</td>
                    <td align="right" style="border-bottom:1px solid #eee;">${money(
                      d.montoPeriodo
                    )}</td>
                  </tr>`
                  )
                  .join("")}
                <tr>
                  <td style="padding-top:10px;"><b>Total legales</b></td>
                  <td align="right" style="padding-top:10px;"><b>${money(
                    totals.totalDeduccionesLegalesPeriodo || 0
                  )}</b></td>
                </tr>
              </table>

              <!-- OTRAS DEDUCCIONES -->
              <h3 style="margin:16px 0 6px; font-size:15px; color:#111;">Otras deducciones</h3>
              <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse; font-size:13px;">
                ${
                  other.length
                    ? other
                        .map(
                          (d: any) => `
                        <tr>
                          <td style="border-bottom:1px solid #eee;">${
                            d.nombre
                          }</td>
                          <td align="right" style="border-bottom:1px solid #eee;">${money(
                            d.montoPeriodo
                          )}</td>
                        </tr>`
                        )
                        .join("")
                    : `<tr><td style="color:#666;">No aplica</td><td></td></tr>`
                }
                <tr>
                  <td style="padding-top:10px;"><b>Total otras</b></td>
                  <td align="right" style="padding-top:10px;"><b>${money(
                    totals.totalOtrasDeduccionesPeriodo || 0
                  )}</b></td>
                </tr>
              </table>

              <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />

              <!-- TOTALES -->
              <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse; font-size:14px;">
                <tr>
                  <td><b>Total deducciones</b></td>
                  <td align="right"><b>${money(
                    totals.totalDeduccionesPeriodo || 0
                  )}</b></td>
                </tr>
                <tr>
                  <td style="font-size:16px;"><b>Neto a pagar</b></td>
                  <td align="right" style="font-size:16px;"><b>${money(
                    totals.sueldoNetoPeriodo || 0
                  )}</b></td>
                </tr>
              </table>

              <p style="margin-top:16px; font-size:12px; color:#666; line-height:1.5;">
                Este volante es un resumen generado automáticamente. Si notas alguna discrepancia,
                por favor comunícate con RRHH.
              </p>

              <p style="font-size:13px; color:#333; margin-top:16px;">
                Saludos,<br/>
                <strong>Equipo de RRHH</strong><br/>
                ${companyName}
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f0f0f0; padding:12px 24px; text-align:center; font-size:11px; color:#777;">
              Este mensaje se generó automáticamente desde el módulo de nómina.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


export function buildAdminClosePayrollHTML(run: any, results: any) {
  const totals = run?.totals || {};
  return `
  <div style="font-family: Arial, sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0;">Confirmación: Nómina cerrada</h2>

    <div style="font-size:13px; margin-bottom:10px;">
      <div><b>Período:</b> ${run.periodStart} a ${run.periodEnd}</div>
      <div><b>Fecha de pago:</b> ${new Date(run.payDate).toLocaleDateString(
        "es-DO"
      )}</div>
      <div><b>Requiere días confirmados:</b> ${
        run.requireConfirmedDays ? "Sí" : "No"
      }</div>
      <div><b>Empleados:</b> ${run.employeeCount}</div>
    </div>

    <hr />

    <h3 style="margin:12px 0 6px;">Totales</h3>
    <table width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse; font-size:13px;">
      <tr><td>Bruto período</td><td align="right">${money(
        totals.grossPeriod
      )}</td></tr>
      <tr><td>Deducciones legales período</td><td align="right">${money(
        totals.totalLegalDeductionsPeriod
      )}</td></tr>
      <tr><td>Otras deducciones período</td><td align="right">${money(
        totals.totalOtherDeductionsPeriod
      )}</td></tr>
      <tr><td><b>Neto período</b></td><td align="right"><b>${money(
        totals.netPeriod
      )}</b></td></tr>
    </table>

    <h3 style="margin:12px 0 6px;">Emails</h3>
    <div style="font-size:13px;">
      <div><b>Enviados OK:</b> ${run.emailStats?.employeesEmailOk || 0}</div>
      <div><b>Fallidos:</b> ${run.emailStats?.employeesEmailFail || 0}</div>
    </div>

    <p style="margin-top:16px; font-size:12px; color:#666;">
      Snapshot guardado para auditoría.
    </p>
  </div>
  `;
}
