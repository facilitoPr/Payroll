export const buildAttendanceMessage = (
  m: any,
  opts: {
    requireNoLate: boolean;
    excludeLincense: boolean;
    minEligibleDays: number;
  },
) => {
  const parts: string[] = [];
  const effectiveEligible = Math.max(
    0,
    m.eligibleDays - (opts.excludeLincense ? m.excludedLincenses : 0),
  );

  if (opts.minEligibleDays && effectiveEligible < opts.minEligibleDays) {
    parts.push(
      `Te faltan ${opts.minEligibleDays - effectiveEligible} días elegibles.`,
    );
  }
  if (opts.requireNoLate && m.lateDays > 0)
    parts.push(`Tienes ${m.lateDays} tardanza(s).`);
  if (m.absentDays > 0) parts.push(`Tienes ${m.absentDays} ausencia(s).`);
  if(m.excludedLincenses) parts.push(`Tienes ${m.excludedLincenses} permisos tomados`);

  return parts.length ? parts.join(" ") : "No alcanzaste la meta aún.";
}

