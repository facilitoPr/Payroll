import mongoose, { Schema, model, Types } from "mongoose";

export interface comercial extends mongoose.Document {
  ComentariosAdicionales: string;
  memberIdentificationNumber: string;
  MemberFullname: string;
  CompanyCode: string;
  Relationship: string;
  Company: string;
  GroupNumber: string;
  created_at: string;
  updated_at: string;
  Gender: string;
  enrollType: string;
  GroupName: string;
  CurrentAge: string;
  BirthDate: string;
  PhysicalAddressCity: string;
  PhysicalAddressState: string;
  PhysicalAddressZipCode: string;
  HomePhone: string;
  AlternatePhone: string;
  Email: string;
  N12348395592: string;
  Primer_intento_de_contacto: string;
  Comentarios: string;
  Segundo_intento_de_contacto: string;
  Comentarios2: string;
  Tercer_intento_de_contacto: string;
  Comentarios3: string;
  FECHA_DE_CITA: string;
  CBP: string;
  A1C: string;
  BCS: string;
  CCS: string;
  COL: string;
  EYE_EXAM: string;
  FLU: string;
  CCP: string;
  HerpesZ_Num: string;
  LastDOS_HerpesZ: string;
  Tetano_Num: string;
  LastDOS_Tetano: string;
  Neumococo_Num: string;
  LastDOS_Neumococo: string;
  HepC_Num2: string;
  LastDOS_HepC2: string;
  AAA_Num: string;
  LastDOS_AAA: string;
  Densitrometry_Num: string;
  LastDOS_Densitrometry: string;
  HIV_Num: string;
  LastDOS_HIV: string;
  Chlamydia_Num: string;
  LastDOS_Chlamydia: string;
  Gonorrhea_Num: string;
  LastDOS_Gonorrhea: string;
  LastPreventive_Visit: string;
  PreventiveCenter_Name_LastVisit: string;
  MemberNumber: string;
  user: Types.ObjectId;
  zona: Types.ObjectId;
  status: Types.ObjectId;
  isMember: boolean;
  comercialDocumenInfo: Types.ObjectId;
  isFederal: boolean;
  isManual: boolean;
}

const comercialSchema = new Schema({
  MemberNumber: {
    type: String,
    require: false,
    default: "",
  },
  ComentariosAdicionales: {
    type: String,
    require: false,
    default: "",
  },
  memberIdentificationNumber: {
    type: String,
    require: false,
    default: "",
  },
  MemberFullname: {
    type: String,
    require: false,
    default: "",
  },

  CompanyCode: {
    type: String,
    require: false,
    default: "",
  },
  Company: {
    type: String,
    require: false,
    default: "",
  },
  GroupNumber: {
    type: String,
    require: false,
    default: "",
  },
  GroupName: {
    type: String,
    require: false,
    default: "",
  },
  Relationship: {
    type: String,
    require: false,
    default: "",
  },
  enrollType: {
    type: String,
    require: false,
    default: "",
  },
  Gender: {
    type: String,
    require: false,
    default: "",
  },
  BirthDate: {
    type: String,
    require: false,
    default: "",
  },
  CurrentAge: {
    type: String,
    require: false,
    default: "",
  },
  PhysicalAddressCity: {
    type: String,
    require: false,
    default: "",
  },
  PhysicalAddressState: {
    type: String,
    require: false,
    default: "",
  },
  PhysicalAddressZipCode: {
    type: String,
    require: false,
    default: "",
  },
  HomePhone: {
    type: String,
    require: false,
    default: "",
  },
  AlternatePhone: {
    type: String,
    require: false,
    default: "",
  },
  Email: {
    type: String,
    require: false,
    default: "",
  },
  N12348395592: {
    type: String,
    require: false,
    default: "",
  },
  Primer_intento_de_contacto: {
    type: String,
    require: false,
    default: "",
  },
  Comentarios: {
    type: String,
    require: false,
    default: "",
  },
  Segundo_intento_de_contacto: {
    type: String,
    require: false,
    default: "",
  },
  Comentarios2: {
    type: String,
    require: false,
    default: "",
  },
  Tercer_intento_de_contacto: {
    type: String,
    require: false,
    default: "",
  },
  Comentarios3: {
    type: String,
    require: false,
    default: "",
  },
  FECHA_DE_CITA: {
    type: String,
    require: false,
    default: "",
  },

  CBP: {
    type: String,
    require: false,
    default: "",
  },

  A1C: {
    type: String,
    require: false,
    default: "",
  },

  BCS: {
    type: String,
    require: false,
    default: "",
  },
  CCS: {
    type: String,
    require: false,
    default: "",
  },
  COL: {
    type: String,
    require: false,
    default: "",
  },
  EYE_EXAM: {
    type: String,
    require: false,
    default: "",
  },
  FLU: {
    type: String,
    require: false,
    default: "",
  },
  CCP: {
    type: String,
    require: false,
    default: "",
  },
  HerpesZ_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_HerpesZ: {
    type: String,
    require: false,
    default: "",
  },
  Tetano_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_Tetano: {
    type: String,
    require: false,
    default: "",
  },
  Neumococo_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_Neumococo: {
    type: String,
    require: false,
    default: "",
  },
  HepC_Num2: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_HepC2: {
    type: String,
    require: false,
    default: "",
  },
  AAA_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_AAA: {
    type: String,
    require: false,
    default: "",
  },
  Densitrometry_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_Densitrometry: {
    type: String,
    require: false,
    default: "",
  },
  HIV_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_HIV: {
    type: String,
    require: false,
    default: "",
  },
  Chlamydia_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_Chlamydia: {
    type: String,
    require: false,
    default: "",
  },
  Gonorrhea_Num: {
    type: String,
    require: false,
    default: "",
  },
  LastDOS_Gonorrhea: {
    type: String,
    require: false,
    default: "",
  },
  LastPreventive_Visit: {
    type: String,
    require: false,
    default: "",
  },
  PreventiveCenter_Name_LastVisit: {
    type: String,
    require: false,
    default: "",
  },
  isFederal: {
    type: Boolean,
    require: false,
  },
  isManual: {
    type: Boolean,
    require: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    require: false,
  },
  zona: {
    type: Schema.Types.ObjectId,
    ref: "Zones",
    require: true,
  },
  status: {
    type: Schema.Types.ObjectId,
    ref: "Status",
    require: true,
    // default: "pending",
  },
  comercialDocumenInfo: {
    type: Schema.Types.ObjectId,
    ref: "ComercialDocumenInfo",
    require: true,
  },
  created_at: {
    type: String,
    default: new Date().toISOString(),
    require: true,
  },
  updated_at: {
    type: String,
    default: new Date().toISOString(),
    require: true,
  },
});

export default model<comercial>("Comercial", comercialSchema);

// Índices para acelerar búsquedas comunes
comercialSchema.index({ MemberFullname: 1 });
comercialSchema.index({ memberIdentificationNumber: 1 });
comercialSchema.index({ Email: 1 });
comercialSchema.index({ HomePhone: 1 });
comercialSchema.index({ status: 1, user: 1 });
