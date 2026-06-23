import moment from "moment";
import * as XLSX from "xlsx";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

const formatCurrency = (value) => {
  let number = Number(value);
  if (isNaN(number)) {
    // throw new Error("Invalid number");
    return 0
  }
  return formatter.format(number);
};

const round = (value) => {
  console.log(value);
  return Math.round(value);
};

const formatDateTime = (dateString) => {
  const date = moment(dateString);
  const now = moment();

  if (date.isSame(now, "day")) {
    // Devuelve solo la hora si es hoy
    return date.format("h:mm A");
  } else if (date.isSame(now.clone().subtract(1, "day"), "day")) {
    // Devuelve "Ayer a las" + hora si es ayer
    return `Ayer a las ${date.format("h:mm A")}`;
  } else {
    // Devuelve solo la fecha en formato MM/DD/YYYY para fechas anteriores
    return date.format("MM/DD/YYYY");
  }
};

const generarMongoId = () => {
  return (
    Math.floor(Date.now() / 1000).toString(16) + // Timestamp
    "xxxxxxxxxxxxxxxx"
      .replace(/[x]/g, () => ((Math.random() * 16) | 0).toString(16))
      .toLowerCase()
  );
};

const formatearTelefono = (input) => {
  const cleaned = input.replace(/\D/g, ""); // Solo dígitos

  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!match) return input;

  const [, area, central, line] = match;
  let resultado = "";

  if (area) resultado += `(${area}`;
  if (area.length === 3) resultado += ") ";
  if (central) resultado += central;
  if (central.length === 3) resultado += " - ";
  if (line) resultado += line;

  return resultado;
};

const formatter2 = (money) => {
  return money ? money.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,") : "0.00";
};

const getNextQuincenalPayDayNumber = (baseDay) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const diasEnElMes = new Date(year, month + 1, 0).getDate(); // último día del mes

  if (baseDay < 1 || baseDay > diasEnElMes) {
    return null; // día inválido
  }

  const proximoDia = baseDay + 15;

  if (proximoDia <= diasEnElMes) {
    return proximoDia;
  } else {
    return null; // no hay espacio suficiente de 15 días en este mes
  }
};

const exportRemindersExcel = (groupedData, dateRange) => {
  if (!Array.isArray(groupedData)) {
    console.error("groupedData no es un arreglo:", groupedData);
    return;
  }

  const wb = XLSX.utils.book_new();
  const hoja = [];

  groupedData.forEach((group, index) => {
    const operadora = group.operadora || "N/A";
    const operatorNameNumber =
      group.operatorNameNumber || `Operadora ${index + 1}`;
    const citas = group.citas || [];

    // Fila 1: Título
    hoja.push(["TABLA DE CITA POR DÍAS"]);
    hoja.push([
      "NOMBRE DE LA CORDINADORA",
      operadora,
      operatorNameNumber,
      "FECHA",
      dateRange,
    ]);

    // Fila encabezado
    hoja.push([
      "Nombre del cliente",
      "Número de contrato",
      "Número de teléfono",
      "Día y hora de la cita",
      "Centro preventivo",
    ]);

    // Citas
    citas.forEach((cita) => {
      hoja.push([
        cita.MemberFullname,
        cita.memberIdentificationNumber,
        cita.HomePhone,
        cita.fechaHora,
        cita.zona,
      ]);
    });

    // Fila total
    hoja.push(["", "", "", "TOTAL", citas.length]);

    // Espacio antes de la próxima operadora
    hoja.push([], []);
  });

  const ws = XLSX.utils.aoa_to_sheet(hoja);
  XLSX.utils.book_append_sheet(wb, ws, "Reporte General");
  XLSX.writeFile(wb, "reporte-citas.xlsx");
}

const buildInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const isImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".svg")
  );
};

export {
  formatter,
  round,
  formatCurrency,
  formatDateTime,
  generarMongoId,
  formatearTelefono,
  formatter2,
  getNextQuincenalPayDayNumber,
  exportRemindersExcel,
  buildInitials,
  isImageUrl,
};
