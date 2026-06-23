import moment from "moment-timezone";
import net from "net";
import CallsReports from "./model/callsReports";
import { getSocketIO } from "./config/socket";
import User from "./model/account/user";

type CallsReportLike = {
  user?: string;
  ext: string;
  from: string; // aquí pondremos nombre o número según el caso
  to: string; // idem
  status: "Answered" | "Unanswered";
  direction: "Outbound" | "Inbound" | "Internal";
  ringing: string;
  talking: string;
  callTime: string;
  callDay?: string;
  callId?: string;
  endByOperator: boolean;
  userName?: string; // nombre del operador principal (ext)
};

const SOURCE_TZ = process.env.CDR_SOURCE_TZ || "UTC";
const TARGET_TZ = process.env.CDR_TARGET_TZ || "America/Santo_Domingo";

const parseInTz = (raw?: string) =>
  raw ? moment.tz(raw.trim(), SOURCE_TZ).tz(TARGET_TZ) : null;

const pad = (n: number) => String(n).padStart(2, "0");
const hms = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600),
    m = Math.floor((sec % 3600) / 60),
    s = Math.floor(sec % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};
const looksLikeExt = (v?: string) => !!v && /^\d{2,6}$/.test(v.trim());
const looksLikePhone = (v?: string) =>
  !!v && /^\d{7,15}$/.test((v || "").replace(/\D/g, ""));

// Derivar dirección desde los "types" de 3CX (más fiable que chain)
function deriveDirectionFromTypes(
  parts: string[]
): "Inbound" | "Outbound" | "Internal" | null {
  const norm = (v?: string) => (v || "").toLowerCase().trim();
  const isType = (v?: string) =>
    /^(extension|external_line|provider)$/i.test(norm(v));

  // Toma la primera pareja srcType/dstType
  const types: string[] = [];
  for (const p of parts) {
    if (isType(p)) types.push(norm(p));
    if (types.length >= 2) break;
  }
  if (types.length < 2) return null;

  const [srcType, dstType] = types;

  if (
    srcType === "external_line" &&
    (dstType === "extension" || dstType === "provider")
  )
    return "Inbound";
  if (
    (srcType === "extension" || srcType === "provider") &&
    dstType === "external_line"
  )
    return "Outbound";
  if (srcType === "extension" && dstType === "extension") return "Internal";

  return null;
}

// Nombre legible que manda 3CX después del bloque de types (ej. "Operadora 2", "Facturacion")
function pickDisplayNameAfterTypes(parts: string[]): string | undefined {
  const norm = (v?: string) => (v || "").toLowerCase().trim();
  const isType = (v?: string) =>
    /^(extension|external_line|provider|outbound_rule|ring_group_ring_all)$/i.test(
      norm(v)
    );
  let seenType = false;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (isType(p)) {
      seenType = true;
      continue;
    }
    if (seenType) {
      if (/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p || "")) return (p || "").trim();
    }
  }
  return undefined;
}

// Respaldo si no hay types
function pickDirection(
  ext?: string,
  fromNo?: string,
  toNo?: string
): "Outbound" | "Inbound" | "Internal" {
  const extOk = looksLikeExt(ext);
  const fromLooksPhone = looksLikePhone(fromNo);
  const toLooksPhone = looksLikePhone(toNo);
  if (extOk && toLooksPhone && !looksLikeExt(toNo)) return "Outbound";
  if (extOk && fromLooksPhone && !looksLikeExt(fromNo)) return "Inbound";
  return extOk && (looksLikeExt(fromNo) || looksLikeExt(toNo))
    ? "Internal"
    : "Internal";
}

// === Mapper principal ===
async function mapCdrLineToCallsReport(line: string): Promise<CallsReportLike> {
  const parts = line.split(",").map((s) => (s || "").trim());
  if (!parts[0]?.startsWith("Call "))
    throw new Error("Línea no inicia con 'Call '");

  const reason = parts.find((p) => /terminated/i.test(p)) || "";
  const callId = parts[0].replace(/^Call\s+/, "").trim();

  // Chain
  const chainToken =
    parts.find((p) => /^chain:/i.test(p)) ||
    parts.find((p) => /(^|,\s*)Chain:/i.test(p)) ||
    "";
  const chainStr = chainToken.replace(/^\s*chain:\s*/i, "");
  const chainItems = chainStr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const chainExts = chainItems
    .map((i) => i.match(/Ext\.(\d{2,6})/i)?.[1] || "")
    .filter(Boolean);

  const chainPhones = chainItems
    .map((i) => i.replace(/\D/g, ""))
    .filter((n) => looksLikePhone(n));

  // ====== NUEVO: detectar ReplacedDst => Ext.xxx (destino final transferido)
  let replacedDstExt: string | undefined;
  const repIdx = parts.findIndex((p) => /^ReplacedDst$/i.test(p));
  if (repIdx >= 0) {
    // Intentamos leer la forma "Ext.xxx" y/o el número que a veces viene después
    const token1 = parts[repIdx + 1] || "";
    const token2 = parts[repIdx + 2] || "";
    const m1 = token1.match(/Ext\.(\d{2,6})/i);
    const m2 = token2.match(/^(\d{2,6})$/);
    replacedDstExt = m1?.[1] || m2?.[1] || undefined;
  }

  // ext principal (operador local):
  // 1) Si hubo transferencia (ReplacedDst), el "dueño" debe ser el destino final.
  // 2) Si no, usa la primera ext encontrada en la línea o del Chain.
  let ext =
    (replacedDstExt && looksLikeExt(replacedDstExt) && replacedDstExt) ||
    line.match(/Ext\.(\d{2,6})/i)?.[1] ||
    chainExts[0] ||
    "";
  if (!ext) {
    const maybeExt = parts.find((p) => looksLikeExt(p));
    if (maybeExt) ext = maybeExt;
  }

  // teléfono externo principal
  let externalPhone = chainPhones[0] || "";
  if (!externalPhone) {
    const phones = parts
      .map((p) => p.replace(/\D/g, ""))
      .filter((n) => looksLikePhone(n) && n !== ext);
    externalPhone = phones[0] || "";
  }

  // Fechas: tokens exactos "YYYY/MM/DD HH:mm:ss"
  const dtTokens = parts.filter((p) =>
    /^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(p)
  );

  // Parse estricto + TZ y RESTA 5 MINUTOS
  const startZ = dtTokens[0]
    ? moment
        .tz(dtTokens[0], "YYYY/MM/DD HH:mm:ss", true, SOURCE_TZ)
        .tz(TARGET_TZ)
        .subtract(5, "minutes")
    : null;
  const answerZ = dtTokens[1]
    ? moment
        .tz(dtTokens[1], "YYYY/MM/DD HH:mm:ss", true, SOURCE_TZ)
        .tz(TARGET_TZ)
        .subtract(5, "minutes")
    : null;
  const endZ = dtTokens[2]
    ? moment
        .tz(dtTokens[2], "YYYY/MM/DD HH:mm:ss", true, SOURCE_TZ)
        .tz(TARGET_TZ)
        .subtract(5, "minutes")
    : null;

  const callDay = startZ ? startZ.format("YYYY/MM/DD") : "";
  const callTime = startZ ? startZ.format("YYYY-MM-DD[T]HH:mm:ss") : "";

  // Duraciones
  let ringingSec = 0;
  let talkingSec = 0;
  if (startZ && answerZ)
    ringingSec = Math.max(0, answerZ.diff(startZ, "seconds"));
  if (answerZ && endZ) talkingSec = Math.max(0, endZ.diff(answerZ, "seconds"));
  // si no hubo answer, cuenta timbrado como end-start
  if (!answerZ && startZ && endZ)
    ringingSec = Math.max(0, endZ.diff(startZ, "seconds"));

  const ringing = hms(ringingSec);
  const talking = hms(talkingSec);

  // Status: forzar Unanswered si no hubo conversación
  const status: CallsReportLike["status"] =
    talkingSec > 0 ? "Answered" : "Unanswered";

  // Direction por types
  let direction = deriveDirectionFromTypes(parts);
  if (!direction) {
    // respaldo por heurística si no encontramos types
    direction = pickDirection(ext, parts[6], parts[7] || externalPhone);
  }

  // Lookup de usuario por ext (principal)
  let userId: string | undefined;
  let userName: string | undefined;

  if (looksLikeExt(ext)) {
    const u = await User.findOne({ ext: Number(ext), isActived: true, isDeleted: false })
      .select("_id name")
      .lean();
    if (u?._id) userId = String(u._id);
    if (u?.name) userName = String(u.name);
  }
  // Fallback a nombre legible de 3CX si no hay en DB
  if (!userName) userName = pickDisplayNameAfterTypes(parts) || undefined;

  // Segunda extensión/nombre si es interna
  let toUserName: string | undefined;
  let toExt: string | undefined;
  if (direction === "Internal" && chainExts.length > 1) {
    toExt = chainExts.find((e) => e !== ext) || chainExts[1];
    if (toExt) {
      const u2 = await User.findOne({ ext: Number(toExt) })
        .select("name")
        .lean();
      if (u2?.name) toUserName = String(u2.name);
    }
    if (!toUserName) toUserName = pickDisplayNameAfterTypes(parts) || undefined;
  }

  // Asignación visible
  let fromVisible = "";
  let toVisible = "";
  if (direction === "Inbound") {
    fromVisible = externalPhone || "Unknown";
    toVisible = userName || ext || "Unknown";
  } else if (direction === "Outbound") {
    fromVisible = userName || ext || "Unknown";
    toVisible = externalPhone || "Unknown";
  } else {
    fromVisible = userName || ext || "Unknown";
    toVisible = toUserName || toExt || "Unknown";
  }

  // Quién colgó: según reason + quién inició
  let callerIsOperator = false;
  let calleeIsOperator = false;

  if (direction === "Inbound") {
    callerIsOperator = false; // externo
    calleeIsOperator = true; // operador
  } else if (direction === "Outbound") {
    callerIsOperator = true; // operador
    calleeIsOperator = false; // externo
  } else {
    // Internal: usa el orden de chainExts
    const firstChainExt = chainExts[0];
    const secondChainExt = chainExts[1];
    if (firstChainExt) {
      callerIsOperator = String(firstChainExt) === String(ext);
      calleeIsOperator = !!secondChainExt;
    } else {
      callerIsOperator = true;
      calleeIsOperator = !!secondChainExt;
    }
  }

  let endByOperator = false;
  if (/src_participant_terminated/i.test(reason)) {
    endByOperator = callerIsOperator;
  } else if (/dst_participant_terminated/i.test(reason)) {
    endByOperator = calleeIsOperator;
  } else {
    endByOperator = false;
  }

  return {
    user: userId,
    userName,
    ext: String(ext || ""),
    from: fromVisible,
    to: toVisible,
    status,
    direction,
    ringing,
    talking,
    callTime,
    callDay,
    callId,
    endByOperator,
  };
}

// --- servidor TCP (igual que ya tienes) ---
export const startCdrTcpServer = (port: number, host = "0.0.0.0") => {
  const io = getSocketIO();
  const server = net.createServer((socket) => {
    console.log(
      "Nueva conexión CDR desde:",
      socket.remoteAddress,
      socket.remotePort
    );
    let buffer = "";
    socket.on("data", async (buf) => {
      buffer += buf.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        try {
          // console.log("CRUDO: ", line);
          const obj = await mapCdrLineToCallsReport(line);

          if (obj.user) {
            await CallsReports.create({ ...obj });

            io.to(`user:${obj.user}`).emit(`callReport:created`, {
              data: obj,
            });
          }

          // console.log("CallsReport object:", obj); // SOLO imprimir
        } catch (e: any) {
          console.error(
            "No se pudo mapear CDR:",
            e?.message || e,
            "\nLINE:",
            line
          );
        }
      }
    });
    socket.on("error", (err) =>
      console.error("Error socket CDR:", err.message)
    );
  });
  server.listen(port, host, () =>
    console.log(`Escuchando CDR en ${host}:${port}`)
  );
};
