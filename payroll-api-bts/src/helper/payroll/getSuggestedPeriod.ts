type SuggestedPeriod = {
  periodStart: Date;
  periodEnd: Date;
  periodStartString: string; // YYYY/MM/DD
  periodEndString: string; // YYYY/MM/DD
  meta: {
    todayString: string;
    prevPayDateString: string;
    nextPayDateString: string;
    effectivePayDaysThisMonth: number[];
    effectivePayDaysNextMonth: number[];
  };
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function daysInMonth(year: number, monthIndex0: number) {
  // monthIndex0: 0-11
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function makeDate(year: number, monthIndex0: number, day: number) {
  return new Date(year, monthIndex0, day, 0, 0, 0, 0);
}

function uniqueSorted(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

/**
 * payDays: ej [15, 30] (quincenal) o [5, 20] etc.
 * - Si el mes no tiene el día (30/31), se usa el último día del mes.
 * - Si payDays colapsan al mismo día (30 y 31 en abril), se deduplica.
 */
function buildEffectivePayDatesForMonth(
  payDays: number[],
  year: number,
  monthIndex0: number
) {
  const dim = daysInMonth(year, monthIndex0);

  const effectiveDays = uniqueSorted(
    (Array.isArray(payDays) ? payDays : []).map((d) =>
      Math.max(1, Math.min(Number(d) || 1, dim))
    )
  );

  const dates = effectiveDays.map((d) => makeDate(year, monthIndex0, d));
  return { effectiveDays, dates };
}

/**
 * Devuelve el rango sugerido (prevPayDate+1 → nextPayDate)
 * Si hoy es payday, sugiere (prevPayDate+1 → hoy).
 */
export function getSuggestedPeriodFromPayDays(
  payDays: number[],
  today = new Date()
): SuggestedPeriod {
  const t = startOfDay(today);

  // Construimos paydates para: mes anterior, actual y siguiente (para cubrir bordes)
  const prevMonth = new Date(t.getFullYear(), t.getMonth() - 1, 1);
  const thisMonth = new Date(t.getFullYear(), t.getMonth(), 1);
  const nextMonth = new Date(t.getFullYear(), t.getMonth() + 1, 1);

  const pm = buildEffectivePayDatesForMonth(
    payDays,
    prevMonth.getFullYear(),
    prevMonth.getMonth()
  );
  const cm = buildEffectivePayDatesForMonth(
    payDays,
    thisMonth.getFullYear(),
    thisMonth.getMonth()
  );
  const nm = buildEffectivePayDatesForMonth(
    payDays,
    nextMonth.getFullYear(),
    nextMonth.getMonth()
  );

  const allPayDates = [...pm.dates, ...cm.dates, ...nm.dates]
    .map(startOfDay)
    .sort((a, b) => a.getTime() - b.getTime());

  // Encontrar nextPayDate (>= hoy) y prevPayDate (< nextPayDate)
  let nextPayDate: Date | null = null;
  for (const d of allPayDates) {
    if (d.getTime() >= t.getTime()) {
      nextPayDate = d;
      break;
    }
  }

  // Si por alguna razón no hay next (muy raro), usamos el último
  if (!nextPayDate) nextPayDate = allPayDates[allPayDates.length - 1];

  // prev: el paydate inmediatamente anterior a nextPayDate
  const idx = allPayDates.findIndex(
    (d) => d.getTime() === nextPayDate!.getTime()
  );
  const prevPayDate = idx > 0 ? allPayDates[idx - 1] : allPayDates[0];

  // Si hoy ES payday, el periodo termina hoy (no “next”).
  const isTodayPayDay = nextPayDate.getTime() === t.getTime();
  const periodEnd = isTodayPayDay ? t : nextPayDate;

  // Inicio: día siguiente del paydate anterior (si cae fuera del mes, Date lo corrige a 1 del sig mes)
  const periodStart = addDays(prevPayDate, 1);

  return {
    periodStart,
    periodEnd,
    periodStartString: ymd(periodStart),
    periodEndString: ymd(periodEnd),
    meta: {
      todayString: ymd(t),
      prevPayDateString: ymd(prevPayDate),
      nextPayDateString: ymd(nextPayDate),
      effectivePayDaysThisMonth: cm.effectiveDays,
      effectivePayDaysNextMonth: nm.effectiveDays,
    },
  };
}

export function getSuggestedPeriodFromSchedule(input: {
  payDays: number[];
  weeklyDays?: number[];
  today?: Date;
}) {
  const payDays = Array.isArray(input.payDays) ? input.payDays : [];

  // Caso quincenal/multi-día por payDays
  if (payDays.length > 0) {
    return getSuggestedPeriodFromPayDays(payDays, input.today || new Date());
  }

  // Si no hay payDays, aquí podrías manejar semanal por weeklyDays, etc.
  return null;
}
