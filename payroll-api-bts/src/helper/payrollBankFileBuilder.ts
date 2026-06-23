import crypto from "crypto";
import moment from "moment";

/**
 * Inserta un valor en un string fijo de 320 chars, usando posiciones 1-indexed inclusive.
 * - Si el valor es más largo, se corta.
 * - Si es más corto, se rellena según align/padChar.
 */
function putField(
  base: string[],
  start: number,
  end: number,
  rawValue: string,
  opts?: { align?: "left" | "right"; padChar?: string; sanitizeAscii?: boolean }
) {
  const len = end - start + 1;
  const padChar = opts?.padChar ?? " ";
  const align = opts?.align ?? "left";

  let value = rawValue ?? "";
  if (opts?.sanitizeAscii !== false) value = toAsciiSafe(value);

  if (value.length > len) value = value.slice(0, len);

  if (value.length < len) {
    const pad = padChar.repeat(len - value.length);
    value = align === "right" ? pad + value : value + pad;
  }

  // write
  for (let i = 0; i < len; i++) {
    base[start - 1 + i] = value[i];
  }
}

/** Convierte a ASCII “seguro”: quita acentos y reemplaza no-ASCII por espacio. */
function toAsciiSafe(input: string) {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " "); // rango ASCII imprimible
}

/** Solo dígitos (para campos numéricos). */
function onlyDigits(input: string) {
  return (input || "").replace(/\D/g, "");
}

/** N2: convierte monto a centavos (entero). 1250.75 -> 125075 */
function moneyToCents(amount: number) {
  const n = Number(amount || 0);
  return Math.round(n * 100);
}

/** Formatea número a string con ceros a la izquierda. */
function zpad(num: number, width: number) {
  const s = String(Math.max(0, Math.trunc(num)));
  return s.length >= width ? s.slice(-width) : "0".repeat(width - s.length) + s;
}

export type BankFileTipoServicio = "01" | "02" | "03" | "04" | "05" | "06";

export interface BankHeaderPayload {
  /** IDCompania (15) = RNC */
  companyRNC: string;
  /** NombreCompañía (35) */
  companyName: string;

  /** Secuencia Header (7) */
  headerSequence7: string;

  /** TipoServicio (2) */
  tipoServicio2: BankFileTipoServicio;

  /** FechaEfectiva (8) YYYYMMDD: fecha futura de aplicación */
  effectiveDateYYYYMMDD: string;

  /** Email (40) para recibir resultado/errores */
  resultsEmail40: string;

  /** Cuenta Empresa a Usar (1) */
  companyAccountToUse1: string;

  /** NumeroAfiliacion (15) solo si TipoServicio=03; sino ceros. */
  numeroAfiliacion15?: string;

  /** Fecha/Hora envío del archivo */
  sendDateYYYYMMDD: string;
  sendTimeHHMM: string;

  /** Totales: (se calculan) */
  countDB11: number;
  totalDB13N2: number; // centavos
  countCR11: number;
  totalCR13N2: number; // centavos
}

export interface BankTxnPayload {
  /** IDCompania (15) */
  companyRNC: string;
  /** Secuencia Header (7) */
  headerSequence7: string;
  /** SecuenciaTrans (7) */
  txnSequence7: string;

  /** Cuenta Destino (20) */
  accountNumber20: string;
  /** TipoCuenta Destino (1) */
  accountType1: string;

  /** Moneda Destino (3): 214/840/978 */
  currency3: string;

  /** CodBancoDestino (8) */
  bankCode8: string;
  /** DigiVerBancoDestino (1) */
  bankDigit1: string;

  /** CodigoOperacion (2): 22/32/etc */
  operationCode2: string;

  /** MontoTransaccion (13 N2) en centavos */
  amount13N2: number;

  /** TipoIdentificación (2): RN/CE/PS/OT */
  idType2: string;
  /** Identificación (15) */
  idNumber15: string;

  /** Nombre (35) */
  beneficiaryName35: string;

  /** NumeroReferencia (12) */
  reference12: string;

  /** Descripcion Estado Destino (40) */
  description40: string;

  /** FechaVencimiento (4) solo para op 57 */
  dueDate4: string;

  /** Forma de Contacto (1): blanco/1/2/3 */
  contactMethod1: string;
  /** Email beneficiario (40) */
  emailBenef40: string;
  /** Fax/Tel (12) */
  faxOrPhone12: string;

  /** Identificador de adquiriente (2) */
  acquirerId2: string;
}

/**
 * Construye la línea Header H (320 chars).
 * Layout (posiciones) según doc:
 * - TipoRegistro(1)=H, RNC(2-16), Nombre(17-51), Secuencia(52-58), TipoServicio(59-60),
 *   FechaEfectiva(61-68), CantidadDB(69-79), MontoDB(80-92), CantidadCR(93-103),
 *   MontoCR(104-116), NumeroAfiliacion(117-131), Fecha(132-139), Hora(140-143),
 *   Email(144-183), Estatus(184 blank), CuentaEmpresa(212), resto espacios.
 */
export function buildHeaderH(payload: BankHeaderPayload) {
  const base = Array(320).fill(" ");

  putField(base, 1, 1, "H");

  putField(base, 2, 16, payload.companyRNC || "", { align: "left" });
  putField(base, 17, 51, payload.companyName || "", { align: "left" });

  putField(base, 52, 58, onlyDigits(payload.headerSequence7 || ""), {
    align: "right",
    padChar: "0",
  });

  putField(base, 59, 60, onlyDigits(payload.tipoServicio2 || ""), {
    align: "right",
    padChar: "0",
  });

  putField(base, 61, 68, onlyDigits(payload.effectiveDateYYYYMMDD || ""), {
    align: "left",
  });

  putField(base, 69, 79, zpad(payload.countDB11 || 0, 11), {
    align: "right",
    padChar: "0",
  });

  putField(base, 80, 92, zpad(payload.totalDB13N2 || 0, 13), {
    align: "right",
    padChar: "0",
  });

  putField(base, 93, 103, zpad(payload.countCR11 || 0, 11), {
    align: "right",
    padChar: "0",
  });

  putField(base, 104, 116, zpad(payload.totalCR13N2 || 0, 13), {
    align: "right",
    padChar: "0",
  });

  // NumeroAfiliacion 15 (solo TS=03). Si no aplica: ceros.
  const afiliacion = payload.numeroAfiliacion15
    ? onlyDigits(payload.numeroAfiliacion15)
    : "0";
  putField(base, 117, 131, zpad(Number(afiliacion || 0), 15), {
    align: "right",
    padChar: "0",
  });

  putField(base, 132, 139, onlyDigits(payload.sendDateYYYYMMDD || ""), {
    align: "left",
  });
  putField(base, 140, 143, onlyDigits(payload.sendTimeHHMM || ""), {
    align: "left",
  });

  putField(base, 144, 183, payload.resultsEmail40 || "", { align: "left" });

  // Estatus (184) -> blanco (respuesta banco)
  putField(base, 184, 184, " ", { align: "left" });

  // Cuenta empresa a usar (212)
  putField(base, 212, 212, payload.companyAccountToUse1 || " ", {
    align: "left",
  });

  const line = base.join("");
  if (line.length !== 320)
    throw new Error(`Header H no mide 320, mide ${line.length}`);
  return line;
}

/**
 * Construye la línea Transacción N (320 chars).
 * Layout según doc: N + RNC + SecuenciaHeader + SecuenciaTrans + ... + campos respuesta banco en blanco + filler.
 */
export function buildTxnN(tx: BankTxnPayload) {
  const base = Array(320).fill(" ");

  putField(base, 1, 1, "N");
  putField(base, 2, 16, tx.companyRNC || "", { align: "left" });

  putField(base, 17, 23, onlyDigits(tx.headerSequence7 || ""), {
    align: "right",
    padChar: "0",
  });

  putField(base, 24, 30, onlyDigits(tx.txnSequence7 || ""), {
    align: "right",
    padChar: "0",
  });

  // Cuenta destino (20) izquierda
  putField(base, 31, 50, tx.accountNumber20 || "", { align: "left" });

  putField(base, 51, 51, tx.accountType1 || "", { align: "left" });

  putField(base, 52, 54, onlyDigits(tx.currency3 || ""), {
    align: "right",
    padChar: "0",
  });

  putField(base, 55, 62, tx.bankCode8 || "", { align: "left" });
  putField(base, 63, 63, tx.bankDigit1 || "", { align: "left" });

  putField(base, 64, 65, onlyDigits(tx.operationCode2 || ""), {
    align: "right",
    padChar: "0",
  });

  putField(base, 66, 78, zpad(tx.amount13N2 || 0, 13), {
    align: "right",
    padChar: "0",
  });

  putField(base, 79, 80, tx.idType2 || "", { align: "left" });
  putField(base, 81, 95, tx.idNumber15 || "", { align: "left" });

  putField(base, 96, 130, tx.beneficiaryName35 || "", { align: "left" });

  putField(base, 131, 142, tx.reference12 || "", { align: "left" });

  putField(base, 143, 182, tx.description40 || "", { align: "left" });

  putField(base, 183, 186, tx.dueDate4 || "", { align: "left", padChar: "0" });

  putField(base, 187, 187, tx.contactMethod1 || "", { align: "left" });

  putField(base, 188, 227, tx.emailBenef40 || "", { align: "left" });

  // Fax/Tel (12) es numérico según doc; si no hay, se deja en blanco.
  putField(base, 228, 239, tx.faxOrPhone12 || "", {
    align: "right",
    padChar: "0",
  });

  putField(base, 240, 241, tx.acquirerId2 || "00", {
    align: "right",
    padChar: "0",
  });

  // Respuestas del banco (242..268) deben ir en blanco al enviar.
  putField(base, 242, 268, "", { align: "left" });

  // Filler final ya está en espacios (269..320)

  const line = base.join("");
  if (line.length !== 320)
    throw new Error(`Txn N no mide 320, mide ${line.length}`);
  return line;
}

/** Resultado final del builder */
export interface BuildBankFileResult {
  fileName: string;
  content: string;
  sha256: string;
  totals: {
    countCR: number;
    totalCR: number;
    countDB: number;
    totalDB: number;
  };
  warnings: string[];
}

/**
 * Genera el archivo TXT completo (H + N...).
 * - payments: lista de pagos (PayrollPayment) ya creados para el run.
 * - bankResolver: función que te devuelve los datos bancarios por pago (puede usar p.bankSnapshot o User).
 */
export async function buildPayrollBankFile(params: {
  companyAssignedNumber5: string; // para nombre archivo
  header: Omit<
    BankHeaderPayload,
    "countDB11" | "totalDB13N2" | "countCR11" | "totalCR13N2"
  >;
  payments: Array<{
    _id: any;
    user: any;
    employeeName: string;
    snapshot: any;
    bankSnapshot?: any;
  }>;
  /** Si true, incluye neto=0; si false, se omiten. */
  includeZeroNet?: boolean;

  /** Resuelve campos bancarios. Si falta algo, devuélvelo en blanco. */
  bankResolver: (p: any) => Partial<BankTxnPayload>;
}): Promise<BuildBankFileResult> {
  const warnings: string[] = [];
  const includeZeroNet = !!params.includeZeroNet;

  // Fecha/hora envío (para nombre archivo y header)
  const now = moment();
  const mmdd = now.format("MMDD");
  const sendDate = now.format("YYYYMMDD");
  const sendTime = now.format("HHmm");

  // Secuencia header y tipo servicio
  const headerSeq7 = params.header.headerSequence7;
  const tipoServicio2 = params.header.tipoServicio2;

  // Construir transacciones
  const txnLines: string[] = [];
  let countCR = 0;
  let totalCR = 0;

  for (let i = 0; i < params.payments.length; i++) {
    const p = params.payments[i];

    // Monto a depositar: sueldoNetoPeriodo (según tu snapshot)
    const net = Number(p?.snapshot?.totals?.sueldoNetoPeriodo ?? 0);
    if (!includeZeroNet && net <= 0) {
      continue;
    }

    const cents = moneyToCents(net);
    const txnSequence7 = zpad(countCR, 7); // secuencia real en el archivo (sin huecos)

    countCR += 1;
    totalCR += cents;

    // Resolver datos bancarios (puede venir en blanco si faltan)
    const resolved = params.bankResolver(p) || {};

    // Completar payload con defaults (en blanco donde falte)
    const tx: BankTxnPayload = {
      companyRNC: params.header.companyRNC || "",
      headerSequence7: headerSeq7 || "",
      txnSequence7,

      accountNumber20: resolved.accountNumber20 || "", // BLANCO si falta
      accountType1: resolved.accountType1 || "", // BLANCO si falta
      currency3:
        resolved.currency3 || params.header.resultsEmail40
          ? resolved.currency3 || ""
          : resolved.currency3 || "", // se deja tal cual
      bankCode8: resolved.bankCode8 || "",
      bankDigit1: resolved.bankDigit1 || "",
      operationCode2: resolved.operationCode2 || "",

      amount13N2: cents,

      idType2: resolved.idType2 || "",
      idNumber15: resolved.idNumber15 || "",
      beneficiaryName35:
        resolved.beneficiaryName35 || toAsciiSafe(p.employeeName || ""),

      reference12: resolved.reference12 || "",
      description40: resolved.description40 || "NOMINA",
      dueDate4: resolved.dueDate4 || "",
      contactMethod1: resolved.contactMethod1 || "",
      emailBenef40: resolved.emailBenef40 || "",
      faxOrPhone12: resolved.faxOrPhone12 || "",
      acquirerId2: resolved.acquirerId2 || "00",
    };

    // Warning si faltan datos “clave” (pero igual generamos, como pediste)
    if (!tx.accountNumber20 || !tx.bankCode8 || !tx.operationCode2) {
      warnings.push(
        `Payment ${String(
          p._id
        )}: datos bancarios incompletos (cuenta/banco/operacion).`
      );
    }

    txnLines.push(buildTxnN(tx));
  }

  // Header: DB = 0 (nómina típica)
  const headerPayload: BankHeaderPayload = {
    ...params.header,
    sendDateYYYYMMDD: sendDate,
    sendTimeHHMM: sendTime,
    countDB11: 0,
    totalDB13N2: 0,
    countCR11: countCR,
    totalCR13N2: totalCR,
  };

  const headerLine = buildHeaderH(headerPayload);

  // Nombre del archivo según doc: PE + (5) + (TS2) + MMDD + (Seq7) + E.TXT
  const company5 = zpad(
    Number(onlyDigits(params.companyAssignedNumber5) || "0"),
    5
  );
  const fileName = `PE${company5}${tipoServicio2}${mmdd}${onlyDigits(
    headerSeq7
  ).padStart(7, "0")}E.TXT`;

  const content = [headerLine, ...txnLines].join("\r\n") + "\r\n";
  const sha256 = crypto
    .createHash("sha256")
    .update(Buffer.from(content, "ascii"))
    .digest("hex");

  return {
    fileName,
    content,
    sha256,
    totals: { countCR, totalCR, countDB: 0, totalDB: 0 },
    warnings,
  };
}
