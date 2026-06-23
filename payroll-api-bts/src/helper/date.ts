import moment from "moment";

// Calculate Elapsed Time
const calculateElapsedTime = (date: any) => {
  const minutesDifference = moment().diff(date, "minutes");

  const timeUnits = [
    { value: 525600, singular: "yr", plural: "yrs" },
    { value: 43800, singular: "mo", plural: "months" },
    { value: 10080, singular: "wk", plural: "wks" },
    { value: 1440, singular: "day", plural: "days" },
    { value: 60, singular: "hr", plural: "hrs" },
    { value: 1, singular: "min", plural: "mins" },
  ];

  for (const unit of timeUnits) {
    if (minutesDifference >= unit.value) {
      const quantity = Math.floor(minutesDifference / unit.value);
      return `${quantity} ${quantity === 1 ? unit.singular : unit.plural}`;
    }
  }

  return "Just now";
};

const buildDateQuery = (fechaInicio?: string, fechaFin?: string) => {
  if (fechaInicio && fechaFin) return { $gte: fechaInicio, $lte: fechaFin };
  if (fechaInicio) return { $gte: fechaInicio };
  return moment().format("YYYY-MM-DD");
}

const isHHmm = (t: any) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t);

const minutesOfDay = (hhmm: string) => {
  const [hh, mm] = hhmm.split(":").map((x) => parseInt(x, 10));
  return hh * 60 + mm;
};

const parseYMDStrict = (d: any) => {
  const m = moment(String(d || "").trim(), ["YYYY-MM-DD", "YYYY/MM/DD"], true);
  return m.isValid() ? m : null;
};

const formatYMD = (m: moment.Moment) => m.format("YYYY-MM-DD");

const listDatesInclusive = (start: moment.Moment, end: moment.Moment) => {
  const out: moment.Moment[] = [];
  const cur = start.clone().startOf("day");
  const last = end.clone().startOf("day");
  while (cur.isSameOrBefore(last, "day")) {
    out.push(cur.clone());
    cur.add(1, "day");
  }
  return out;
};


const parseYMDToLocalDate = (ymd: string) => {
  // Date local 00:00
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
};


const expectedMinutesFromSchedule = (day: any) => {
  if (!day?.isWorkday) return 0;
  if (!isHHmm(day?.entryTime) || !isHHmm(day?.exitTime)) return 0;

  const a = minutesOfDay(day.entryTime);
  const b = minutesOfDay(day.exitTime);
  return Math.max(0, b - a);
};

export const getCurrentYear = () => new Date().getFullYear();


export {
  calculateElapsedTime,
  buildDateQuery,
  isHHmm,
  minutesOfDay,
  parseYMDStrict,
  formatYMD,
  listDatesInclusive,
  parseYMDToLocalDate,
  expectedMinutesFromSchedule,
};
