import { JobPosition } from "../model/rrhh/jobPosition";

const normalizeJobPositionCode = (name: string) => {
  const base = String(name || "")
    .trim()
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-zA-Z0-9\s_-]/g, "") // quita caracteres raros
    .replace(/[\s-]+/g, "_") // espacios/guiones -> _
    .replace(/_+/g, "_") // colapsa underscores
    .replace(/^_+|_+$/g, "") // trim underscores
    .toUpperCase();

  return base || "JOB_POSITION";
};

export const generateUniqueCode = async (name: string) => {
  const base = normalizeJobPositionCode(name);

  // intenta base, luego base_2, base_3...
  let code = base;
  let suffix = 2;

  // OJO: por tu índice único parcial (code + isDeleted:false)
  // buscamos solo los no borrados
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await JobPosition.findOne({ code, isDeleted: false }).select(
      "_id",
    );
    if (!exists) return code;
    code = `${base}_${suffix}`;
    suffix += 1;
  }
};
