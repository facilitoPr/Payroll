import { Request, Response } from "express";
import Comercial, { comercial } from "../model/comercial/comercial";
import { generateRegex } from "../middlewares/cleanText";
import Status, { status } from "../model/status";
import Reminders from "../model/reminders";
import ComercialComments, {
  comercialComments,
} from "../model/comercial/comercialComments";
import ComercialAdditionalComments, {
  comercialAdditionalComments,
} from "../model/comercial/comercialAdditionalComments";
import TypeComercialComments, {
  typeComercialComments,
} from "../model/typeComercialComments";
import ComercialRelationship, {
  comercialRelationship,
} from "../model/comercial/comercialRelationship";
import moment from "moment";

import ComercialDocumenInfo, {
  comercialDocumenInfo,
} from "../model/comercial/comercialDocumenInfo";

import * as fs from "fs";
import csvParser from "csv-parser";

const nonFederalColumnMapper = {
  // Puedes dejar fuera los campos federales si son distintos o más simples
  "Comentarios adicionales": "ComentariosAdicionales",
  memberidentificationnumber: "memberIdentificationNumber",
  MemberFullname: "MemberFullname",
  CompanyCode: "CompanyCode",
  Company: "Company",
  GroupNumber: "GroupNumber",
  GroupName: "GroupName",
  Relationship: "Relationship",
  enrolltype: "enrolltype",
  Gender: "Gender",
  BirthDate: "BirthDate",
  CurrentAge: "CurrentAge",
  PhysicalAddressCity: "PhysicalAddressCity",
  PhysicalAddressState: "PhysicalAddressState",
  PhysicalAddressZipCode: "PhysicalAddressZipCode",
  HomePhone: "HomePhone",
  AlternatePhone: "AlternatePhone",
  Email: "Email",
  "12348395592": "N12348395592",
  Comentarios: "Comentarios",
  "Segundo intento de contacto": "Segundo_intento_de_contacto",
  Comentarios2: "Comentarios2",
  "Tercer intento de contacto": "Tercer_intento_de_contacto",
  Comentarios3: "Comentarios3",
  CBP: "CBP",
  A1C: "A1C",
  BCS: "BCS",
  CCS: "CCS",
  COL: "COL",
  "EYE EXAM": "EYE_EXAM",
  FLU: "FLU",
  CCP: "CCP",
  HerpesZ_Num: "HerpesZ_Num",
  LastDOS_HerpesZ: "LastDOS_HerpesZ",
  Tetano_Num: "Tetano_Num",
  LastDOS_Tetano: "LastDOS_Tetano",
  Neumococo_Num: "Neumococo_Num",
  LastDOS_Neumococo: "LastDOS_Neumococo",
  HepC_Num2: "HepC_Num2",
  LastDOS_HepC2: "LastDOS_HepC2",
  AAA_Num: "AAA_Num",
  LastDOS_AAA: "LastDOS_AAA",
  Densitrometry_Num: "Densitrometry_Num",
  LastDOS_Densitrometry: "LastDOS_Densitrometry",
  HIV_Num: "HIV_Num",
  LastDOS_HIV: "LastDOS_HIV",
  Chlamydia_Num: "Chlamydia_Num",
  LastDOS_Chlamydia: "LastDOS_Chlamydia",
  Gonorrhea_Num: "Gonorrhea_Num",
  LastDOS_Gonorrhea: "LastDOS_Gonorrhea",
  LastPreventive_Visit: "LastPreventive_Visit",
  PreventiveCenter_Name_LastVisit: "PreventiveCenter_Name_LastVisit",
  "Segundo Intento de Contacto": "Segundo_intento_de_contacto",
  "Primer Intento de Contacto": "Primer_intento_de_contacto",
  MemberNumber: "MemberNumber",
};

const federalColumnMapper = {
  // "Comentarios Adicionales": "ComentariosAdicionales",
  "Member Number": "memberIdentificationNumber",
  "Full Name": "MemberFullname",
  Age: "CurrentAge",
  "Birth Date": "BirthDate",
  City: "PhysicalAddressCity",
  // Enrollment Status
  // Last Product Name
  "Phone Number": "HomePhone",
  "Zip Code": "PhysicalAddressZipCode",
  // Primer Intento de Contacto
  Comentarios: "Comentarios",
  "Segundo Intento de Contacto": "Segundo_intento_de_contacto",
  Comentario2: "Comentarios2",
  "Tercer Intento de Contacto": "Tercer_intento_de_contacto",
  Comentario3: "Comentarios3",
  "FECHA DE CITA": "FECHA_DE_CITA",
  // AISINFL
  // BCS_E
  CBP: "CBP",
  CCS: "CCS",
  COL: "COL",
  // HBD1
  // HerpesZ_Den
  HerpesZ_Num: "HerpesZ_Num",
  LastDOS_HerpesZ: "LastDOS_HerpesZ",
  // Tetano_Den
  Tetano_Num: "Tetano_Num",
  LastDOS_Tetano: "LastDOS_Tetano",
  // Neumococo_Den
  Neumococo_Num: "Neumococo_Num",
  LastDOS_Neumococo: "LastDOS_Neumococo",
  // HepC_Den2
  HepC_Num2: "HepC_Num2",
  LastDOS_HepC2: "LastDOS_HepC2",
  // AAA_Den
  AAA_Num: "AAA_Num",
  LastDOS_AAA: "LastDOS_AAA",
  // Densitrometry_Den
  Densitrometry_Num: "Densitrometry_Num",
  LastDOS_Densitrometry: "LastDOS_Densitrometry",
  // HIV_Den
  HIV_Num: "HIV_Num",
  LastDOS_HIV: "LastDOS_HIV",
  // Chlamydia_Den
  Chlamydia_Num: "Chlamydia_Num",
  LastDOS_Chlamydia: "LastDOS_Chlamydia",
  // Gonorrhea_Den
  Gonorrhea_Num: "Gonorrhea_Num",
  LastDOS_Gonorrhea: "LastDOS_Gonorrhea",
  // LastPreventiveVisit_ServiceDate
  // LastVisitPreventiveCenter_Name
  LastPreventiveVisit_ServiceDate: "LastPreventive_Visit",
  LastVisitPreventiveCenter_Name: "PreventiveCenter_Name_LastVisit",

  "Company Code": "CompanyCode",
  Relationship: "Relationship",
  Company: "Company",
  "Group Number": "GroupNumber",
  Gender: "Gender",
  "Enroll Type": "enrollType",
  "Group Name": "GroupName",
  State: "PhysicalAddressState",
  "Alternate Phone": "AlternatePhone",
  Email: "Email",
  N12348395592: "N12348395592",
  A1C: "A1C",
  BCS: "BCS",
  "EYE EXAM": "EYE_EXAM",
  FLU: "FLU",
  CCP: "CCP",
};

const createComercial = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;
    const { zona } = req.params;

    // 1) Normaliza el memberIdentificationNumber
    const rawMemberId = (data.memberIdentificationNumber ?? "").toString();
    const digitsOnly = rawMemberId.replace(/\D/g, ""); // solo dígitos
    const normalized = digitsOnly.replace(/^0+/, "") || "0"; // quita ceros a la izq.

    // Helper para regex seguro (aunque normalized ya son dígitos)
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 2) Arma búsqueda para detectar duplicados:
    //    - match exacto al valor recibido
    //    - o match a la misma secuencia de dígitos con ceros iniciales opcionales
    let existing: any = null;
    if (rawMemberId) {
      const optionalZerosRe = new RegExp(`^0*${escapeRegex(normalized)}$`, "i");
      existing = await Comercial.findOne({
        $or: [
          { memberIdentificationNumber: rawMemberId },
          { memberIdentificationNumber: { $regex: optionalZerosRe } },
        ],
      });
    }

    if (existing) {
      return res.status(409).send({
        ok: false,
        mensaje:
          "Ya existe un paciente con ese número de contrato (con o sin ceros iniciales).",
        message:
          "There is already a patient with that memberIdentificationNumber (with or without leading zeros).",
      });
    }

    // 3) Status por defecto
    const status = await Status.findOne({ code: "PATIENTLIST" });

    // 4) Crear
    const nuevo = new Comercial({
      ...data,
      zona,
      status,
      memberIdentificationNumber: rawMemberId || "",
    });
    await nuevo.save();

    return res.status(201).send({
      ok: true,
      comercial: nuevo,
      mensaje: "Paciente creado con éxito",
      message: "Patient created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "Error al crear el paciente",
      message: "Ups! Something went wrong",
    });
  }
};

const createComercialDocumentInfo = async (req: Request, res: Response) => {
  try {
    const { zona, name } = req.params;

    const info: comercialDocumenInfo = await new ComercialDocumenInfo({
      name,
      zones: zona,
    });
    await info.save();

    res.status(201).send({
      ok: true,
      comercialDocumenInfo: info,
      mensaje: "Rol creado con éxito",
      message: "Role created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export const processUploadedComercialFile = async (req, res) => {
  try {
    const { zoneId, nameFile } = req.body;
    const isFederal =
      req.body.isFederal === true || req.body.isFederal === "true";
    const filePath = req.file?.path;
    const batchSize = 100;

    if (!filePath) {
      return res.status(400).send({ ok: false, message: "No file uploaded" });
    }

    const docInfo = await new ComercialDocumenInfo({
      name: nameFile,
      zones: zoneId,
      isFederal,
    });
    await docInfo.save();

    const status = await Status.findOne({ code: "PATIENTLIST" });

    const columnMapperToUse = isFederal
      ? federalColumnMapper
      : nonFederalColumnMapper;

    const rows = [];

    fs.createReadStream(filePath)
      .pipe(
        csvParser({
          separator: ",",
          mapHeaders: ({ header }) => header.trim(),
        }),
      )
      .on("data", (row) => {
        const cleaned: any = {};
        for (const key in row) {
          const mappedKey = columnMapperToUse[key] || key;
          let value = row[key];
          if (
            typeof value === "string" &&
            value.trim().toUpperCase() === "NULL"
          ) {
            value = "";
          }
          cleaned[mappedKey] = value?.toString?.().trim() || "";
        }

        // normalizar memberIdentificationNumber si viene mal
        if (cleaned["memberidentificationnumber"]) {
          cleaned["memberIdentificationNumber"] =
            cleaned["memberidentificationnumber"];
          delete cleaned["memberidentificationnumber"];
        }

        const memberId = cleaned["memberIdentificationNumber"]?.trim();
        const fullName = cleaned["memberFullname"]?.trim();

        if (memberId || fullName) {
          rows.push(cleaned);
        }
      })
      .on("end", async () => {
        console.log(`📦 Total filas leídas: ${rows.length}`);

        const uniqueIds = rows
          .map((r) => r.memberIdentificationNumber?.trim())
          .filter(Boolean);

        const existentes = await Comercial.find({
          memberIdentificationNumber: { $in: uniqueIds },
        }).select("memberIdentificationNumber");

        const existentesSet = new Set(
          existentes.map((e) => e.memberIdentificationNumber.trim()),
        );

        const nuevos = rows
          .filter(
            (r) => !existentesSet.has(r.memberIdentificationNumber?.trim()),
          )
          .map((r) => ({
            ...r,
            zona: zoneId,
            isFederal,
            comercialDocumenInfo: docInfo._id,
            status: status?._id,
          }));

        console.log(`✅ Nuevos a insertar: ${nuevos.length}`);
        let insertados = 0;

        for (let i = 0; i < nuevos.length; i += batchSize) {
          const chunk = nuevos.slice(i, i + batchSize);
          await Comercial.insertMany(chunk);
          insertados += chunk.length;
        }

        fs.unlinkSync(filePath);
        res.status(201).json({
          ok: true,
          mensaje: "Archivo procesado correctamente",
          total: rows.length,
          insertados,
          actualizados: existentes.length,
        });
      })
      .on("error", (err) => {
        console.error("❌ Error leyendo CSV:", err);
        res
          .status(500)
          .json({ ok: false, mensaje: "Error leyendo archivo CSV", err });
      });
  } catch (err) {
    console.error("❌ Error general:", err);
    res
      .status(500)
      .json({ ok: false, mensaje: "Error al procesar archivo", err });
  }
};

const getComercialDocumentInfo = async (req: Request, res: Response) => {
  try {
    const info = await ComercialDocumenInfo.find();

    res.status(201).send({
      ok: true,
      comercialDocumenInfo: info,
      mensaje: "Rol creado con éxito",
      message: "Role created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercial = async (req: Request, res: Response) => {
  try {
    const { initial, limit, user, zona } = req.params;

    const limitNum = parseInt(limit) || 10;
    const initialNum = parseInt(initial) || 0;

    const query: any = {};

    if (user !== "null") query.user = user;
    if (zona !== "null") query.zona = zona;

    const count = await Comercial.count(query);
    const comercial = await Comercial.find(query)
      .populate({ path: "user" })
      .populate({ path: "zona" })
      .skip(initialNum)
      .limit(limitNum);

    res.status(200).send({
      ok: true,
      count,
      comercial,
      mensaje: "Rol creado con éxito",
      message: "Role created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialBySearch = async (req: Request, res: Response) => {
  try {
    const { initial, limit, text, user, zona } = req.params;

    const limitNum = parseInt(limit) || 10;
    const initialNum = parseInt(initial) || 0;

    const query: any = {
      $or: [
        { MemberFullname: generateRegex(text) },
        { Gender: generateRegex(text) },
        { ComentariosAdicionales: generateRegex(text) },
        { memberIdentificationNumber: generateRegex(text) },
        { CompanyCode: generateRegex(text) },
        { Relationship: generateRegex(text) },
        { GroupNumber: generateRegex(text) },
        { Company: generateRegex(text) },
        { enrollType: generateRegex(text) },
        { GroupName: generateRegex(text) },
        { CurrentAge: generateRegex(text) },
        { BirthDate: generateRegex(text) },
        { PhysicalAddressCity: generateRegex(text) },
        { PhysicalAddressState: generateRegex(text) },
        { PhysicalAddressZipCode: generateRegex(text) },
        { HomePhone: generateRegex(text) },
        { AlternatePhone: generateRegex(text) },
        { Email: generateRegex(text) },
        { N12348395592: generateRegex(text) },
        { Comentarios: generateRegex(text) },
        { Segundo_intento_de_contacto: generateRegex(text) },
        { Comentarios2: generateRegex(text) },
        { Tercer_intento_de_contacto: generateRegex(text) },
        { Comentarios3: generateRegex(text) },
        { FECHA_DE_CITA: generateRegex(text) },
        { CBP: generateRegex(text) },
        { A1C: generateRegex(text) },
        { BCS: generateRegex(text) },
        { CCS: generateRegex(text) },
        { COL: generateRegex(text) },
        { EYE_EXAM: generateRegex(text) },
        { FLU: generateRegex(text) },
        { CCP: generateRegex(text) },
        { HerpesZ_Num: generateRegex(text) },
        { LastDOS_HerpesZ: generateRegex(text) },
        { Tetano_Num: generateRegex(text) },
        { LastDOS_Tetano: generateRegex(text) },
        { Neumococo_Num: generateRegex(text) },
        { LastDOS_Neumococo: generateRegex(text) },
        { HepC_Num2: generateRegex(text) },
        { LastDOS_HepC2: generateRegex(text) },
        { AAA_Num: generateRegex(text) },
        { LastDOS_AAA: generateRegex(text) },
        { LastDOS_Densitrometry: generateRegex(text) },
        { HIV_Num: generateRegex(text) },
        { LastDOS_HIV: generateRegex(text) },
        { Chlamydia_Num: generateRegex(text) },
        { LastDOS_Chlamydia: generateRegex(text) },
        { Gonorrhea_Num: generateRegex(text) },
        { LastDOS_Gonorrhea: generateRegex(text) },
        { LastPreventive_Visit: generateRegex(text) },
        { PreventiveCenter_Name_LastVisit: generateRegex(text) },
      ],
    };

    if (user !== "null") query.user = user;
    if (zona !== "null") query.zona = zona;

    const count = await Comercial.count(query);
    const comercial = await Comercial.find(query)
      .populate({ path: "user" })
      .populate({ path: "zona" })
      .skip(initialNum)
      .limit(limitNum);

    res.status(200).send({
      ok: true,
      count,
      comercial,
      mensaje: "Rol creado con éxito",
      message: "Role created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialByUser = async (req: Request, res: Response) => {
  try {
    const { initial, limit, user_id, code, zona } = req.params;
    // console.log(initial, limit, user_id, code, zona);
    const limitNum = parseInt(limit) || 10;
    const initialNum = parseInt(initial) || 0;

    const status = await Status.findOne({ code });

    const query: any = { status: status._id };
    if (zona !== "null") query.zona = zona;

    const count = await Comercial.count(query);
    const comercial = await Comercial.find(query)
      // .populate({ path: "user" })
      .select(
        "memberIdentificationNumber MemberFullname CompanyCode Email HomePhone AlternatePhone Gender",
      )
      .populate({ path: "zona" })
      .populate({ path: "status" })
      .limit(limitNum)
      .skip(initialNum);

    res.status(200).send({
      ok: true,
      comercial,
      count,
      mensaje: "Comercials encontrados",
      message: "Comercials found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialByIdentificationNumber = async (
  req: Request,
  res: Response,
) => {
  try {
    const { memberIdentificationNumber } = req.params;

    const comercial = await Comercial.findOne({ memberIdentificationNumber })
      .populate({ path: "zona" })
      .populate({ path: "status" });

    res.status(200).send({
      ok: true,
      comercial,
      mensaje: "Paciente encontrado",
      message: "Patient found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

// const getComercialBySearchAndStatus = async (req: Request, res: Response) => {
//   try {
//     const { initial, limit, text, user, code } = req.params;

//     const limitNum = parseInt(limit) || 10;
//     const initialNum = parseInt(initial) || 0;

//     const query: any = {
//       // status: status._id,
//       // $or: [
//       //   { MemberFullname: generateRegex(text) },
//       //   { Gender: generateRegex(text) },
//       //   { ComentariosAdicionales: generateRegex(text) },
//       //   { memberIdentificationNumber: generateRegex(text) },
//       //   { CompanyCode: generateRegex(text) },
//       //   { Relationship: generateRegex(text) },
//       //   { GroupNumber: generateRegex(text) },
//       //   { Company: generateRegex(text) },
//       //   { enrollType: generateRegex(text) },
//       //   { GroupName: generateRegex(text) },
//       //   { CurrentAge: generateRegex(text) },
//       //   { BirthDate: generateRegex(text) },
//       //   { PhysicalAddressCity: generateRegex(text) },
//       //   { PhysicalAddressState: generateRegex(text) },
//       //   { PhysicalAddressZipCode: generateRegex(text) },
//       //   { HomePhone: generateRegex(text) },
//       //   { AlternatePhone: generateRegex(text) },
//       //   { Email: generateRegex(text) },
//       //   { N12348395592: generateRegex(text) },
//       //   { Comentarios: generateRegex(text) },
//       //   { Segundo_intento_de_contacto: generateRegex(text) },
//       //   { Comentarios2: generateRegex(text) },
//       //   { Tercer_intento_de_contacto: generateRegex(text) },
//       //   { Comentarios3: generateRegex(text) },
//       //   { FECHA_DE_CITA: generateRegex(text) },
//       //   { CBP: generateRegex(text) },
//       //   { A1C: generateRegex(text) },
//       //   { BCS: generateRegex(text) },
//       //   { CCS: generateRegex(text) },
//       //   { COL: generateRegex(text) },
//       //   { EYE_EXAM: generateRegex(text) },
//       //   { FLU: generateRegex(text) },
//       //   { CCP: generateRegex(text) },
//       //   { HerpesZ_Num: generateRegex(text) },
//       //   { LastDOS_HerpesZ: generateRegex(text) },
//       //   { Tetano_Num: generateRegex(text) },
//       //   { LastDOS_Tetano: generateRegex(text) },
//       //   { Neumococo_Num: generateRegex(text) },
//       //   { LastDOS_Neumococo: generateRegex(text) },
//       //   { HepC_Num2: generateRegex(text) },
//       //   { LastDOS_HepC2: generateRegex(text) },
//       //   { AAA_Num: generateRegex(text) },
//       //   { LastDOS_AAA: generateRegex(text) },
//       //   { LastDOS_Densitrometry: generateRegex(text) },
//       //   { HIV_Num: generateRegex(text) },
//       //   { LastDOS_HIV: generateRegex(text) },
//       //   { Chlamydia_Num: generateRegex(text) },
//       //   { LastDOS_Chlamydia: generateRegex(text) },
//       //   { Gonorrhea_Num: generateRegex(text) },
//       //   { LastDOS_Gonorrhea: generateRegex(text) },
//       //   { LastPreventive_Visit: generateRegex(text) },
//       //   { PreventiveCenter_Name_LastVisit: generateRegex(text) },
//       // ],
//       $or: [
//         { MemberFullname: generateRegex(text) },
//         { memberIdentificationNumber: generateRegex(text) },
//         { Email: generateRegex(text) },
//         { HomePhone: generateRegex(text) },
//       ],
//     };

//     if (user !== "null") query.user = user;
//     if (code !== "null") {
//       let status = await Status.findOne({ code });
//       query.status = status._id;
//     }

//     const count = await Comercial.count(query);
//     const comercial = await Comercial.find(query)
//       .populate({ path: "status" })
//       .populate({ path: "user" })
//       .populate({ path: "zona" })
//       .skip(initialNum)
//       .limit(limitNum);

//     res.status(200).send({
//       ok: true,
//       count,
//       comercial,
//       mensaje: "Rol creado con éxito",
//       message: "Role created successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       ok: false,
//       error,
//       mensaje: "¡Ups! Algo salió mal",
//       message: "Ups! Something went wrong",
//     });
//   }
// };

const getComercialBySearchAndStatus = async (req: Request, res: Response) => {
  try {
    const { initial, limit, text = "", user, code } = req.params;

    const limitNum = parseInt(limit) || 10;
    const initialNum = parseInt(initial) || 0;

    // helpers locales
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const digitsOnly = text.replace(/\D/g, ""); // "00123-45" -> "0012345"
    const normalizedDigits = digitsOnly.replace(/^0+/, ""); // "0012345" -> "12345"

    const memberIdOrs: any[] = [
      { memberIdentificationNumber: generateRegex(text) },
    ];

    // Si hay dígitos, añadimos una regex que ignore ceros iniciales
    if (normalizedDigits) {
      // Permite 0 o más ceros antes del número buscado y también funciona si no hay ceros (0* puede ser vacío)
      const ignoreLeadingZeros = new RegExp(
        `0*${escapeRegex(normalizedDigits)}`,
        "i",
      );
      memberIdOrs.push({
        memberIdentificationNumber: { $regex: ignoreLeadingZeros },
      });
    }

    const query: any = {
      $or: [
        { MemberFullname: generateRegex(text) },
        ...memberIdOrs,
        { Email: generateRegex(text) },
        { HomePhone: generateRegex(text) },
      ],
    };

    if (user !== "null") query.user = user;

    if (code !== "null") {
      const status = await Status.findOne({ code });
      if (status?._id) query.status = status._id; // evita crashear si no existe
    }

    const count = await Comercial.countDocuments(query);
    const comercial = await Comercial.find(query)
      .populate({ path: "status" })
      .populate({ path: "user" })
      .populate({ path: "zona" })
      .skip(initialNum)
      .limit(limitNum);

    res.status(200).send({
      ok: true,
      count,
      comercial,
      mensaje: "Rol creado con éxito",
      message: "Role created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const changeStatusComercial = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { ...data } = req.body;

    const status = await Status.findOne({ code: data.code });

    if (!status) {
      return res.status(400).send({
        ok: false,
        mensaje: "Estado no encontrado",
        message: "Status not found",
      });
    }

    const comercial = await Comercial.updateOne(
      { _id },
      { status: status._id },
    );

    res.status(201).send({
      ok: true,
      comercial,
      mensaje: "Comercial actualizado con éxito",
      message: "Comercial updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getPatientHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reminders = await Reminders.find({
      comercial: id,
      isDeleted: false,
    })
      .populate("patient")
      .populate("zone")
      .populate("reminderType")
      .populate("user")
      .populate("status")
      .populate("statusCompleted")
      .populate("comercial");

    res.status(200).send({
      ok: true,
      reminders,
      mensaje: "Citas encontradas con éxito",
      message: "Quotes found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const createTypeComercialComments = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;

    const createComercialComments: typeComercialComments =
      await new TypeComercialComments({ ...data });
    await createComercialComments.save();

    res.status(201).send({
      ok: true,
      comment: createComercialComments,
      mensaje: "Comentario creado con éxito",
      message: "Comment created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getTypeComercialComments = async (req: Request, res: Response) => {
  try {
    const typeComments = await TypeComercialComments.find();

    if (!typeComments || typeComments.length === 0) {
      return res.status(400).send({
        ok: false,
        comments: [],
        mensaje: "No se encontraron comentarios",
        message: "No comments found",
      });
    }
    res.status(200).send({
      ok: true,
      typeComments,
      mensaje: "Comentarios encontrados con éxito",
      message: "Comments found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const updateTypeComercialComments = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { ...data } = req.body;
    const typeComments = await TypeComercialComments.updateOne({ _id }, data);

    res.status(201).send({
      ok: true,
      typeComments,
      mensaje: "Tipo de comentario actualizado con éxito",
      message: "Type comment updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const deleteTypeComercialComments = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    await TypeComercialComments.findByIdAndDelete(_id);

    res.status(201).send({
      ok: true,
      mensaje: "Tipo de comentario eliminado con éxito",
      message: "Type comment deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const createComercialComments = async (req: Request, res: Response) => {
  try {
    const { ...data } = req.body;
    const { _id } = req.params;

    const createComercialComments: comercialComments =
      await new ComercialComments({ ...data, comercial: _id });
    await createComercialComments.save();

    res.status(201).send({
      ok: true,
      comment: createComercialComments,
      mensaje: "Comentario creado con éxito",
      message: "Comment created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [comercial, comments, additionalComments] = await Promise.all([
      Comercial.findById(id)
        .populate({ path: "zona" })
        .populate({ path: "status" }),
      ComercialComments.find({ comercial: id })
        .populate("user")
        .populate("comercial")
        .populate("typeComment")
        .sort({ created_at: -1 }),
      ComercialAdditionalComments.find({ comercial: id })
        .populate("user")
        .populate("comercial")
        .sort({ created_at: -1 }),
    ]);

    if (!comercial) {
      return res.status(404).send({
        ok: false,
        mensaje: "Comercial no encontrado",
        message: "Commercial not found",
      });
    }

    const formattedComments = comments.map((item) => ({
      ...item.toObject(),
      date: moment(item.created_at).format("YYYY-MM-DD"),
      hour: moment(item.created_at).format("hh:mm:ss"),
    }));

    const formattedAdditionalComments = additionalComments.map((item) => ({
      ...item.toObject(),
      date: moment(item.created_at).format("YYYY-MM-DD"),
      hour: moment(item.created_at).format("hh:mm:ss"),
    }));

    res.status(200).send({
      ok: true,
      comercial: {
        ...comercial.toObject(),
        comments: formattedComments,
        additionalComments: formattedAdditionalComments,
      },
      mensaje: "Comercial encontrado con éxito",
      message: "Commercial found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialComments = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const comments = await ComercialComments.find({ comercial: _id })
      .populate("user")
      .populate("comercial")
      .populate("typeComment")
      .sort({ created_at: -1 });

    if (!comments || comments.length === 0) {
      return res.status(400).send({
        ok: false,
        comments: [],
        mensaje: "No se encontraron citas",
        message: "No quotes found",
      });
    }

    const newComments = comments.map((item) => ({
      ...item.toObject(),
      date: moment(item.created_at).format("YYYY-MM-DD"),
      hour: moment(item.created_at).format("hh:mm:ss"),
    }));

    res.status(200).send({
      ok: true,
      comments: newComments,
      mensaje: "Citas encontradas con éxito",
      message: "Quotes found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const createComercialAdditionalComments = async (
  req: Request,
  res: Response,
) => {
  try {
    const { ...data } = req.body;
    const { _id } = req.params;

    const createComercialComments: comercialAdditionalComments =
      await new ComercialAdditionalComments({ ...data, comercial: _id });
    await createComercialComments.save();

    res.status(201).send({
      ok: true,
      comment: createComercialComments,
      mensaje: "Comentario creado con éxito",
      message: "Comment created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialAdditionalComments = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const comments = await ComercialAdditionalComments.find({ comercial: _id })
      .populate("user")
      .populate("comercial")
      .sort({ created_at: -1 });

    if (!comments || comments.length === 0) {
      return res.status(400).send({
        ok: false,
        comments: [],
        mensaje: "No se encontraron citas",
        message: "No quotes found",
      });
    }

    const newComments = comments.map((item) => ({
      ...item.toObject(),
      date: moment(item.created_at).format("YYYY-MM-DD"),
      hour: moment(item.created_at).format("hh:mm:ss"),
    }));

    res.status(200).send({
      ok: true,
      comments: newComments,
      mensaje: "Citas encontradas con éxito",
      message: "Quotes found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getLastAppoitmentComercial = async (req: Request, res: Response) => {
  try {
    const { _id, code } = req.params;

    const status = await Status.findOne({ code });

    const appoitment = await Reminders.findOne({
      comercial: _id,
      status: status._id,
    })
      .populate("patient")
      .populate("zone")
      .populate("reminderType")
      .populate("user")
      .populate("status")
      .populate("statusCompleted")
      .sort({ created_at: -1 });

    console.log(appoitment);

    if (!appoitment) {
      return res.status(400).send({
        ok: false,
        appoitment: null,
        mensaje: "No hemos encontrado una cita",
        message: "Appoitment no found",
      });
    }

    res.status(200).send({
      ok: true,
      appoitment,
      mensaje: "Cita encontradas con éxito",
      message: "Appoitment found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialByPhoneNumber = async (req: Request, res: Response) => {
  try {
    const { skip, limit, number1, number2, memberIdentificationNumber } =
      req.params;

    const query: any = {
      $or: [
        { HomePhone: generateRegex(number1) },
        { AlternatePhone: generateRegex(number1) },
        { HomePhone: generateRegex(number2) },
        { AlternatePhone: generateRegex(number2) },
      ],
      memberIdentificationNumber: { $ne: memberIdentificationNumber }, // Excluye el mismo memberIdentificationNumber
    };

    const count = await Comercial.count(query);
    const comercials = await Comercial.find(query)
      .populate({ path: "user" })
      .populate({ path: "zona" })
      .populate({ path: "status" })
      .limit(Number(limit))
      .skip(Number(skip));
    res.status(200).send({
      ok: true,
      comercials,
      count,
      mensaje: "Comercials encontrados",
      message: "Comercials found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const createOrGetComercialRelationship = async (
  req: Request,
  res: Response,
) => {
  try {
    const { number1, number2, memberIdentificationNumber } = req.params;
    const { ...data } = req.body;

    const query: any = {
      $or: [
        { HomePhone: generateRegex(number1) },
        { AlternatePhone: generateRegex(number1) },
        { HomePhone: generateRegex(number2) },
        { AlternatePhone: generateRegex(number2) },
      ],
      memberIdentificationNumber: { $ne: memberIdentificationNumber },
    };

    // Buscar la relación comercial que contenga el ID del miembro
    let relationship = await ComercialRelationship.findOne({
      members: { $in: data._id },
    }).populate("members");

    const comercials = await Comercial.find(query)
      .populate("user")
      .populate("zona")
      .populate("status");

    if (relationship) {
      const membersIds = relationship.members.map((item) => String(item._id)); // Convertir los _id a string para comparación

      // Hacer una copia del array de members para manipularlo
      let remainingMembers: any = relationship.members.filter(
        (item) => item._id != data._id,
      );

      // Recorrer los comerciales y verificar si son miembros, eliminarlos si es el caso
      for (const comercial of comercials) {
        const isMember = membersIds.includes(String(comercial._id));

        // Si el comercial es miembro, eliminarlo de remainingMembers
        if (isMember) {
          remainingMembers = remainingMembers.filter(
            (member) => String(member._id) !== String(comercial._id),
          );
        }
      }

      // Crear un array combinado con los remainingMembers y los comerciales
      const combinedArray = [
        ...remainingMembers.map((member) => ({
          ...member.toObject(), // Convertir el documento a objeto
          isMember: true, // Todos los remainingMembers deben tener isMember: true
        })),
        ...comercials.map((comercial) => ({
          ...comercial.toObject(), // Convertir cada comercial a objeto
          isMember: membersIds.includes(String(comercial._id)), // Asignar isMember aquí
        })),
      ];

      // Ordenar el array combinado para que los miembros aparezcan primero
      combinedArray.sort((a, b) => (b.isMember ? 1 : -1));

      return res.status(200).send({
        ok: true,
        comercialRelationship: relationship,
        comercials: combinedArray, // Array combinado con los remainingMembers y los comerciales
        mensaje: "Relación ya existente",
        message: "Relationship already exists",
      });
    } else {
      const newRelationship = new ComercialRelationship({
        members: [data._id],
      });
      await newRelationship.save();

      return res.status(201).send({
        ok: true,
        comercialRelationship: newRelationship,
        mensaje: "Relación creada con éxito",
        message: "Relationship created successfully",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const addOrRemoveMembersToComercialRelationship = async (
  req: Request,
  res: Response,
) => {
  try {
    const { _id } = req.params;
    const { ...data } = req.body;

    const relationship = await ComercialRelationship.findByIdAndUpdate(_id);

    if (!relationship) {
      return res.status(400).send({
        ok: false,
        mensaje: "No hay relacion",
        message: "There's not relantionship",
      });
    }

    if (!relationship?.members.includes(data.member)) {
      await ComercialRelationship.findByIdAndUpdate(
        _id,
        {
          $addToSet: { members: data.member },
        },
        { new: true },
      );

      return res.status(201).send({
        ok: true,
        comercialRelationship: relationship,
        mensaje: "Miembro añadido",
        message: "Member added",
      });
    } else {
      await ComercialRelationship.findByIdAndUpdate(
        _id,
        {
          $pull: { members: data.member },
        },
        { new: true },
      );

      return res.status(201).send({
        ok: true,
        comercialRelationship: relationship,
        mensaje: "Miembro eliminado",
        message: "Member removed",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Oops! Something went wrong",
    });
  }
};

const getComercialBySearchRelationship = async (
  req: Request,
  res: Response,
) => {
  try {
    const { text, _id } = req.params;

    const query: any = {
      $or: [
        { MemberFullname: generateRegex(text) },
        { Gender: generateRegex(text) },
        { ComentariosAdicionales: generateRegex(text) },
        { memberIdentificationNumber: generateRegex(text) },
        { CompanyCode: generateRegex(text) },
        { Relationship: generateRegex(text) },
        { GroupNumber: generateRegex(text) },
        { Company: generateRegex(text) },
        { enrollType: generateRegex(text) },
        { GroupName: generateRegex(text) },
        { CurrentAge: generateRegex(text) },
        { BirthDate: generateRegex(text) },
        { PhysicalAddressCity: generateRegex(text) },
        { PhysicalAddressState: generateRegex(text) },
        { PhysicalAddressZipCode: generateRegex(text) },
        { HomePhone: generateRegex(text) },
        { AlternatePhone: generateRegex(text) },
        { Email: generateRegex(text) },
        { N12348395592: generateRegex(text) },
        { Comentarios: generateRegex(text) },
        { Segundo_intento_de_contacto: generateRegex(text) },
        { Comentarios2: generateRegex(text) },
        { Tercer_intento_de_contacto: generateRegex(text) },
        { Comentarios3: generateRegex(text) },
        { FECHA_DE_CITA: generateRegex(text) },
        { CBP: generateRegex(text) },
        { A1C: generateRegex(text) },
        { BCS: generateRegex(text) },
        { CCS: generateRegex(text) },
        { COL: generateRegex(text) },
        { EYE_EXAM: generateRegex(text) },
        { FLU: generateRegex(text) },
        { CCP: generateRegex(text) },
        { HerpesZ_Num: generateRegex(text) },
        { LastDOS_HerpesZ: generateRegex(text) },
        { Tetano_Num: generateRegex(text) },
        { LastDOS_Tetano: generateRegex(text) },
        { Neumococo_Num: generateRegex(text) },
        { LastDOS_Neumococo: generateRegex(text) },
        { HepC_Num2: generateRegex(text) },
        { LastDOS_HepC2: generateRegex(text) },
        { AAA_Num: generateRegex(text) },
        { LastDOS_AAA: generateRegex(text) },
        { LastDOS_Densitrometry: generateRegex(text) },
        { HIV_Num: generateRegex(text) },
        { LastDOS_HIV: generateRegex(text) },
        { Chlamydia_Num: generateRegex(text) },
        { LastDOS_Chlamydia: generateRegex(text) },
        { Gonorrhea_Num: generateRegex(text) },
        { LastDOS_Gonorrhea: generateRegex(text) },
        { LastPreventive_Visit: generateRegex(text) },
        { PreventiveCenter_Name_LastVisit: generateRegex(text) },
      ],
    };

    // Buscar la relación comercial que contenga el ID del miembro
    let relationship = await ComercialRelationship.findOne({
      members: { $in: _id },
    }).populate("members");

    const members = relationship.members.map(String); // Convertir los _id a string para comparación

    // const count = await Comercial.count(query);
    const comercial = await Comercial.find(query)
      .populate({ path: "user" })
      .populate({ path: "zona" });

    // Añadir campo isMember a cada comercial en el resultado de la consulta
    const comercialsWithMembership = comercial.map((comercial) => ({
      ...comercial.toObject(),
      isMember: members.includes(String(comercial._id)),
    }));
    comercialsWithMembership.sort((a, b) => (b.isMember ? 1 : -1));

    res.status(200).send({
      ok: true,
      comercial: comercialsWithMembership,
      mensaje: "Rol creado con éxito",
      message: "Role created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const getComercialForExcel = async (req: Request, res: Response) => {
  try {
    const { doc } = req.params;
    // Obtener todos los comerciales con sus datos relacionados
    const comercials = await Comercial.find({ comercialDocumenInfo: doc })
      .populate({ path: "user" })
      .populate({ path: "zona" })
      .populate({ path: "status" });

    // Obtener todos los comentarios adicionales de los comerciales
    const additionalComments = await ComercialAdditionalComments.find();
    const comments = await ComercialComments.find().populate("typeComment");

    // Agrupar los comentarios adicionales por comercial
    const commentsAdditionalByComercial = additionalComments.reduce(
      (acc, comment: any) => {
        if (!acc[comment.comercial]) {
          acc[comment.comercial] = [];
        }
        acc[comment.comercial].push(comment.comment); // Asumiendo que el campo del comentario se llama "comment"
        return acc;
      },
      {},
    );

    // Agrupar los comentarios por comercial
    const commentsByComercial = comments.reduce((acc, comment: any) => {
      if (!acc[comment.comercial]) {
        acc[comment.comercial] = [];
      }
      acc[comment.comercial].push(comment); // Almacenar todo el comentario
      return acc;
    }, {});

    const comercialsForExcel = comercials.map((comercial) => {
      // Obtener los primeros tres comentarios correspondientes al comercial
      const comentarios = commentsByComercial[comercial._id] || [];
      const firstComment = comentarios[0] || {};
      const secondComment = comentarios[1] || {};
      const thirdComment = comentarios[2] || {};

      // Comentarios adicionales del comercial
      const comentariosAdicionales = commentsAdditionalByComercial[
        comercial._id
      ]
        ? commentsAdditionalByComercial[comercial._id].join(", ")
        : "";

      // Formatear las fechas de los comentarios con moment
      const formatDate = (comment: any) =>
        comment.created_at
          ? moment(comment.created_at).format("MM/DD/YYYY")
          : "";

      // Condición para mantener los valores existentes o tomar los de los comentarios
      const primerIntentoComentario =
        comercial.Comentarios || firstComment?.typeComment?.name || "";
      const primerIntentoFecha =
        comercial.N12348395592 || formatDate(firstComment);

      const segundoIntentoComentario =
        comercial.Comentarios2 || secondComment?.typeComment?.name || "";
      const segundoIntentoFecha =
        comercial.Segundo_intento_de_contacto || formatDate(secondComment);

      const tercerIntentoComentario =
        comercial.Comentarios3 || thirdComment?.typeComment?.name || "";
      const tercerIntentoFecha =
        comercial.Tercer_intento_de_contacto || formatDate(thirdComment);

      return {
        ComentariosAdicionales: `${
          comercial.ComentariosAdicionales || ""
        }, ${comentariosAdicionales}`,
        memberIdentificationNumber: comercial.memberIdentificationNumber || "",
        MemberFullname: comercial.MemberFullname || "",
        CompanyCode: comercial.CompanyCode || "",
        Company: comercial.Company || "",
        GroupNumber: comercial.GroupNumber || "",
        GroupName: comercial.GroupName || "",
        Relationship: comercial.Relationship || "",
        enrolltype: comercial.enrollType || "",
        Gender: comercial.Gender || "",
        BirthDate: comercial.BirthDate || "",
        CurrentAge: comercial.CurrentAge || "",
        PhysicalAddressCity: comercial.PhysicalAddressCity || "",
        PhysicalAddressState: comercial.PhysicalAddressState || "",
        PhysicalAddressZipCode: comercial.PhysicalAddressZipCode || "",
        HomePhone: comercial.HomePhone || "",
        AlternatePhone: comercial.AlternatePhone || "",
        Email: comercial.Email || "",

        // Asignar primer, segundo y tercer intento de contacto
        N12348395592: primerIntentoFecha, // Fecha del primer comentario
        Comentarios: primerIntentoComentario, // Nombre del primer comentario

        Segundo_intento_de_contacto: segundoIntentoFecha, // Fecha del segundo comentario
        Comentarios2: segundoIntentoComentario, // Nombre del segundo comentario

        Tercer_intento_de_contacto: tercerIntentoFecha, // Fecha del tercer comentario
        Comentarios3: tercerIntentoComentario, // Nombre del tercer comentario

        // Otros campos
        FECHA_DE_CITA: comercial.FECHA_DE_CITA || "",
        CBP: comercial.CBP || "",
        A1C: comercial.A1C || "",
        BCS: comercial.BCS || "",
        CCS: comercial.CCS || "",
        COL: comercial.COL || "",
        EYE_EXAM: comercial.EYE_EXAM || "",
        FLU: comercial.FLU || "",
        CCP: comercial.CCP || "",
        HerpesZ_Num: comercial.HerpesZ_Num || "",
        LastDOS_HerpesZ: comercial.LastDOS_HerpesZ || "",
        Tetano_Num: comercial.Tetano_Num || "",
        LastDOS_Tetano: comercial.LastDOS_Tetano || "",
        Neumococo_Num: comercial.Neumococo_Num || "",
        LastDOS_Neumococo: comercial.LastDOS_Neumococo || "",
        HepC_Num2: comercial.HepC_Num2 || "",
        LastDOS_HepC2: comercial.LastDOS_HepC2 || "",
        AAA_Num: comercial.AAA_Num || "",
        LastDOS_AAA: comercial.LastDOS_AAA || "",
        Densitrometry_Num: comercial.Densitrometry_Num || "",
        LastDOS_Densitrometry: comercial.LastDOS_Densitrometry || "",
        HIV_Num: comercial.HIV_Num || "",
        LastDOS_HIV: comercial.LastDOS_HIV || "",
        Chlamydia_Num: comercial.Chlamydia_Num || "",
        LastDOS_Chlamydia: comercial.LastDOS_Chlamydia || "",
        Gonorrhea_Num: comercial.Gonorrhea_Num || "",
        LastDOS_Gonorrhea: comercial.LastDOS_Gonorrhea || "",
        LastPreventive_Visit: comercial.LastPreventive_Visit || "",
        PreventiveCenter_Name_LastVisit:
          comercial.PreventiveCenter_Name_LastVisit || "",
      };
    });

    res.status(200).send({
      ok: true,
      comercialsForExcel,
      mensaje: "Comercials encontrados",
      message: "Comercials found successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

const updateComercial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ...data } = req.body;
    const comercial = await Comercial.findByIdAndUpdate(id, data, { new: true })
      .populate({ path: "zona" })
      .populate({ path: "status" });

    res.status(200).send({
      ok: true,
      comercial,
      mensaje: "Paciente actualizado con éxito",
      message: "Patient updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "Error al crear el paciente",
      message: "Ups! Something went wrong",
    });
  }
};

const deleteComercial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Comercial.findByIdAndDelete(id);

    res.status(200).send({
      ok: true,
      mensaje: "Paciente eliminado con éxito",
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      error,
      mensaje: "¡Ups! Algo salió mal",
      message: "Ups! Something went wrong",
    });
  }
};

export {
  createComercial,
  getComercial,
  getComercialByUser,
  getComercialBySearch,
  changeStatusComercial,
  getComercialBySearchAndStatus,
  getPatientHistory,
  getComercialComments,
  createComercialComments,
  createTypeComercialComments,
  getTypeComercialComments,
  getLastAppoitmentComercial,
  getComercialByPhoneNumber,
  createOrGetComercialRelationship,
  addOrRemoveMembersToComercialRelationship,
  getComercialBySearchRelationship,
  createComercialAdditionalComments,
  getComercialById,
  getComercialAdditionalComments,
  updateTypeComercialComments,
  deleteTypeComercialComments,
  getComercialForExcel,
  createComercialDocumentInfo,
  getComercialDocumentInfo,
  updateComercial,
  deleteComercial,
  getComercialByIdentificationNumber,
};
