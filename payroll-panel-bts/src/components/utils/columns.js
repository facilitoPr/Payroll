import { formatCurrency } from "app/utils";
import moment from "moment";

export default {
  columnsUsers(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "center",
      },
      {
        name: "name",
        label: "ROL",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "email",
        label: "EMAIL",
        align: "left",
      },
      {
        name: "phone",
        label: "PHONE",
        align: "left",
      },
      {
        name: "name",
        label: "CODIGO DE EMPLEADO",
        align: "left",
      },

      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsEmployeesByAdmin(text) {
    return [
      { name: "actions", label: "ACCIONES", align: "left" },

      {
        name: "image",
        label: "IMAGE",
        align: "center",
      },
      {
        name: "cv",
        label: "CV",
        align: "center",
      },
      {
        name: "contract",
        label: "CONTRATO",
        align: "center",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      // {
      //   name: "email",
      //   label: "EMAIL",
      //   align: "left",
      // },
      {
        name: "phone",
        label: "PHONE",
        align: "left",
      },

      {
        name: "project",
        label: "PROYECTO",
        align: "left",
      },
      {
        name: "department",
        label: "DEPARTAMENTO",
        align: "left",
      },
      {
        name: "codeEmployee",
        label: "CODIGO DE EMPLEADO",
        align: "left",
      },
      {
        name: "ext",
        label: "EXT",
        align: "left",
      },
      {
        name: "salaryType",
        label: "TIPO DE SALARIO",
        align: "left",
      },
      {
        name: "salary",
        label: "SALARIO",
        align: "left",
      },
      {
        name: "schedulePayment",
        label: "DIAS Y FORMAS DE PAGO",
        align: "left",
      },

      {
        name: "contractDate",
        label: "FECHA DE CONTRATACION",
        align: "left",
      },
      {
        name: "hourWork",
        label: "HORAS DE TRABAJO",
        align: "left",
      },
      {
        name: "status",
        label: "ESTADO",
        align: "left",
      },
      {
        name: "punchType",
        label: "TIPO DE PONCHE",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "HORARIO",
      //   align: "left",
      // },
    ];
  },
  columnsEmployeesByManager(text) {
    return [
      { name: "actions", label: "ACCIONES", align: "left" },

      {
        name: "image",
        label: "IMAGE",
        align: "center",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "phone",
        label: "PHONE",
        align: "left",
      },

      {
        name: "project",
        label: "PROYECTO",
        align: "left",
      },
      {
        name: "department",
        label: "DEPARTAMENTO",
        align: "left",
      },
      {
        name: "codeEmployee",
        label: "CODIGO DE EMPLEADO",
        align: "left",
      },
      {
        name: "ext",
        label: "EXT",
        align: "left",
      },
      {
        name: "contractDate",
        label: "FECHA DE CONTRATACION",
        align: "left",
      },
      {
        name: "hourWork",
        label: "HORAS DE TRABAJO",
        align: "left",
      },
      {
        name: "status",
        label: "ESTADO",
        align: "left",
      },
      {
        name: "punchType",
        label: "TIPO DE PONCHE",
        align: "left",
      },
    ];
  },

  columnsTimeReport() {
    return [
      {
        name: "name",
        label: "IMAGE",
        align: "center",
      },
      {
        name: "name",
        label: "EMPLEADO",
        align: "center",
      },
      {
        name: "name",
        label: "FECHA",
        align: "center",
      },
      // {
      //   name: "name",
      //   label: "GANANCIA ESTIMADA",
      //   align: "center",
      // },
      {
        name: "name",
        label: "HORAS TRABAJADAS",
        align: "center",
      },

      {
        name: "name",
        label: "INCOMPLETO",
        align: "center",
      },
      {
        name: "name",
        label: "PASOS REGISTRADO",
        align: "center",
      },
      {
        name: "name",
        label: "PASOS FALTANTES",
        align: "center",
      },
    ];
  },

  columnsMyRequest(text) {
    return [
      {
        name: "name",
        label: "",
        align: "center",
      },
      {
        name: "name",
        label: "TIPO",
        align: "center",
      },
      {
        name: "name",
        label: "FECHAS",
        align: "center",
      },
      {
        name: "name",
        label: "CATEGORIA",
        align: "center",
      },
      {
        name: "name",
        label: "MOTIVO",
        align: "left",
      },
      {
        name: "name",
        label: "TIPO DE PERMISO",
        align: "left",
      },
      {
        name: "name",
        label: "DURACION",
        align: "left",
      },
      {
        name: "name",
        label: "REALIZADO POR",
        align: "left",
      },
      {
        name: "name",
        label: "COMENTARIO",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
      {
        name: "name",
        label: "ACCIONES",
        align: "center",
      },
    ];
  },
  columnsMyRequestAdmin() {
    return [
      {
        name: "name",
        label: "",
        align: "center",
      },
      {
        name: "name",
        label: "ACCIONES",
        align: "center",
      },
      {
        name: "name",
        label: "EMPLEADO",
        align: "center",
      },

      {
        name: "name",
        label: "TIPO",
        align: "center",
      },
      {
        name: "name",
        label: "FECHAS",
        align: "center",
      },
      {
        name: "name",
        label: "CATEGORIA",
        align: "center",
      },
      {
        name: "name",
        label: "MOTIVO",
        align: "left",
      },
      {
        name: "name",
        label: "TIPO DE PERMISO",
        align: "left",
      },
      {
        name: "name",
        label: "DURACION",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
      {
        name: "name",
        label: "REALIZADO POR",
        align: "center",
      },
      {
        name: "name",
        label: "COMENTARIO",
        align: "center",
      },
    ];
  },
  columnsMyRequestAdminHistory() {
    return [
      {
        name: "name",
        label: "empleado",
        align: "center",
      },

      {
        name: "name",
        label: "TIPO",
        align: "center",
      },
      {
        name: "name",
        label: "FECHAS",
        align: "center",
      },
      {
        name: "name",
        label: "CATEGORIA",
        align: "center",
      },
      {
        name: "name",
        label: "MOTIVO",
        align: "left",
      },
      {
        name: "name",
        label: "TIPO DE PERMISO",
        align: "left",
      },
      {
        name: "name",
        label: "DURACION",
        align: "left",
      },
      {
        name: "name",
        label: "realizado por",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
      {
        name: "name",
        label: "COMENTARIO",
        align: "center",
      },
    ];
  },
  columnsArticles(text) {
    return [
      { name: "actions", label: "ACCIONES", align: "left" },
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "TITULO",
        align: "left",
      },
      // {
      //   name: "email",
      //   label: "ESCRITOR",
      //   align: "left",
      // },
      {
        name: "application",
        label: "APLICACIÓN",
        align: "left",
      },
      {
        name: "description",
        label: "DESCRIPCIÓN",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
    ];
  },
  columnsServiceInfo(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "TITULO",
        align: "left",
      },
      {
        name: "description",
        label: "DESCRIPCIÓN",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsZones(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsPatients(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "center",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      // {
      //   name: "zone",
      //   label: "ZONA",
      //   align: "left",
      // },
      {
        name: "email",
        label: "EMAIL",
        align: "left",
      },
      {
        name: "phone",
        label: "PHONE",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsCitas(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "name",
        label: "TITULO",
        align: "left",
      },

      {
        name: "name",
        label: "FECHA",
        align: "left",
      },

      {
        name: "name",
        label: "HORA INICIAR",
        align: "left",
      },

      {
        name: "name",
        label: "HORA FINAL",
        align: "left",
      },
      {
        name: "name",
        label: "DESCRIPCION",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },

      {
        name: "name",
        label: "ACCIONES",
        align: "left",
      },
    ];
  },
  columnsCitas2(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },

      {
        name: "name",
        label: "FECHA",
        align: "left",
      },

      {
        name: "name",
        label: "HORA INICIAR",
        align: "left",
      },

      {
        name: "name",
        label: "HORA FINAL",
        align: "left",
      },

      {
        name: "name",
        label: "ACCIONES",
        align: "left",
      },
    ];
  },
  columnsCitasReport() {
    return [
      // {
      //   name: "image",
      //   label: "IMAGE",
      //   align: "left",
      // },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },

      {
        name: "name",
        label: "FECHA",
        align: "left",
      },

      {
        name: "name",
        label: "HORA INICIAR",
        align: "left",
      },

      {
        name: "name",
        label: "HORA FINAL",
        align: "left",
      },
      {
        name: "name",
        label: "DESCRIPCION",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
    ];
  },
  columnsCitasReport2(text) {
    return [
      {
        name: "turnNumber",
        label: "NUMERO DE TURNO",
        align: "left",
      },
      {
        name: "user",
        label: "MEDICO",
        align: "left",
      },
      {
        name: "patients",
        label: "PACIENTES",
        align: "left",
      },

      {
        name: "date",
        label: "FECHA",
        align: "left",
      },

      {
        name: "initHour",
        label: "HORA INICIAl",
        align: "left",
      },
      {
        name: "finalHour",
        label: "HORA FINAL",
        align: "left",
      },
      {
        name: "description",
        label: "DESCRIPCION",
        align: "left",
      },
      {
        name: "status",
        label: "ESTADO",
        align: "left",
      },
      {
        name: "code",
        label: "CODIGO",
        align: "left",
      },
    ];
  },
  columnsComercial(text) {
    return [
      {
        name: "memberIdentificationNumber",
        label: "NUMERO DE IDENTIFICACION DEL MIEMBRO",
        align: "left",
      },
      {
        name: "MemberFullname",
        label: "NOMBRE COMPLETO DEL MIEBRO",
        align: "left",
      },
      {
        name: "CompanyCode",
        label: "CODIGO DE LA EMPRESA",
        align: "left",
      },
      {
        name: "Relationship",
        label: "RELACION",
        align: "left",
      },

      {
        name: "Company",
        label: "COMPAÑIA",
        align: "left",
      },
      {
        name: "GroupNumber",
        label: "NUMERO DE GRUPO",
        align: "left",
      },
      {
        name: "Gender",
        label: "GENERO",
        align: "left",
      },
      {
        name: "enrollType",
        label: "TIPO DE INSCRIPCION",
        align: "left",
      },
      {
        name: "GroupName",
        label: "NOMBRE DEL GRUPO",
        align: "left",
      },

      {
        name: "CurrentAge",
        label: "EDAD ACTUAL",
        align: "left",
      },
      {
        name: "BirthDate",
        label: "FECHA DE NACIMIENTO",
        align: "left",
      },
      {
        name: "PhysicalAddressCity",
        label: "DIRECCION FISICA CIUDAD",
        align: "left",
      },
      {
        name: "PhysicalAddressState",
        label: "ESTADO DE DIRECCION FÍSICA",
        align: "left",
      },
      {
        name: "PhysicalAddressZipCode",
        label: "DIRECCION FÍSACA CÓDIGO POSTAL",
        align: "left",
      },
      {
        name: "HomePhone",
        label: "TELEFONO DE CASA",
        align: "left",
      },
      {
        name: "AlternatePhone",
        label: "TELEFONO ALTERNATIVO",
        align: "left",
      },
      {
        name: "Email",
        label: "CORREO",
        align: "left",
      },
      {
        name: "N12348395592",
        label: "12348395592",
        align: "left",
      },
      {
        name: "Comentarios",
        label: "COMENTARIOS",
        align: "left",
      },
      {
        name: "Segundo_intento_de_contacto",
        label: "SEGUNDO INTENTO DE CONTACTO",
        align: "left",
      },
      {
        name: "Comentarios2",
        label: "COMENTARIOS 2",
        align: "left",
      },
      {
        name: "Tercer_intento_de_contacto",
        label: "TERCER INTENTO DE CONTACTO",
        align: "left",
      },
      {
        name: "Comentarios3",
        label: "COMENTARIOS 3",
        align: "left",
      },
      {
        name: "FECHA_DE_CITA",
        label: "FECHA DE CITA",
        align: "left",
      },
      {
        name: "CBP",
        label: "CBP",
        align: "left",
      },
      {
        name: "A1C",
        label: "A1C",
        align: "left",
      },
      {
        name: "BCS",
        label: "BCS",
        align: "left",
      },
      {
        name: "CCS",
        label: "CCS",
        align: "left",
      },
      {
        name: "COL",
        label: "COL",
        align: "left",
      },
      {
        name: "EYE_EXAM",
        label: "EXAMEN DE LA OJOS",
        align: "left",
      },
      {
        name: "FLU",
        label: "FLU",
        align: "left",
      },
      {
        name: "CCP",
        label: "CCP",
        align: "left",
      },
      {
        name: "HerpesZ_Num",
        label: "HerpesZ_Num",
        align: "left",
      },
      {
        name: "LastDOS_HerpesZ",
        label: "LastDOS_HerpesZ",
        align: "left",
      },

      {
        name: "Tetano_Num",
        label: "Tetano_Num",
        align: "left",
      },
      {
        name: "LastDOS_Tetano",
        label: "LastDOS_Tetano",
        align: "left",
      },
      {
        name: "Neumococo_Num",
        label: "Neumococo_Num",
        align: "left",
      },
      {
        name: "LastDOS_Neumococo",
        label: "LastDOS_Neumococo",
        align: "left",
      },
      {
        name: "HepC_Num2",
        label: "HepC_Num2",
        align: "left",
      },
      {
        name: "LastDOS_HepC2",
        label: "LastDOS_HepC2",
        align: "left",
      },
      {
        name: "AAA_Num",
        label: "AAA_Num",
        align: "left",
      },
      {
        name: "LastDOS_AAA",
        label: "LastDOS_AAA",
        align: "left",
      },
      {
        name: "LastDOS_Densitrometry",
        label: "LastDOS_Densitrometry",
        align: "left",
      },
      {
        name: "HIV_Num",
        label: "HIV_Num",
        align: "left",
      },

      {
        name: "LastDOS_HIV",
        label: "LastDOS_HIV",
        align: "left",
      },
      {
        name: "Chlamydia_Num",
        label: "Chlamydia_Num",
        align: "left",
      },
      {
        name: "LastDOS_Chlamydia",
        label: "LastDOS_Chlamydia",
        align: "left",
      },
      {
        name: "Gonorrhea_Num",
        label: "Gonorrhea_Num",
        align: "left",
      },
      {
        name: "LastDOS_Gonorrhea",
        label: "LastDOS_Gonorrhea",
        align: "left",
      },
      {
        name: "LastPreventive_Visit",
        label: "ÚLTIMA VISITA PREVENTIVA",
        align: "left",
      },
      {
        name: "PreventiveCenter_Name_LastVisit",
        label: "NOMBRE DEL CENTRO PREVENTIVO ÚLTIMA VISITA",
        align: "left",
      },

      {
        name: "name",
        label: "ZONA",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "OPERADORA",
      //   align: "left",
      // },
    ];
  },

  columnsCallsReports(text) {
    return [
      {
        name: "user",
        label: "Operadora",
        align: "left",
      },
      {
        name: "callTime",
        label: "Fecha y hora",
        align: "left",
      },
      {
        name: "from",
        label: "De",
        align: "left",
      },
      {
        name: "to",
        label: "Para",
        align: "left",
      },
      // {
      //   name: "direction",
      //   label: "Dirección",
      //   align: "left",
      // },
      {
        name: "status",
        label: "Estado",
        align: "left",
      },
      {
        name: "ringing",
        label: "Timbrando",
        align: "left",
      },
      {
        name: "talking",
        label: "Tiempo en llamada",
        align: "left",
      },
      {
        name: "endByOperator",
        label: "Finalizada por la operadora",
        align: "left",
      },
      // {
      //   name: "callTime",
      //   label: "Hora de la llamada",
      //   align: "left",
      // },
      // {
      //   name: "cost",
      //   label: "Costo",
      //   align: "left",
      // },
    ];
  },
  columnsCallsReportsOperator(text) {
    return [
      {
        name: "callTime",
        label: "Fecha y hora",
        align: "left",
      },
      {
        name: "from",
        label: "De",
        align: "left",
      },
      {
        name: "to",
        label: "Para",
        align: "left",
      },
      // {
      //   name: "direction",
      //   label: "Dirección",
      //   align: "left",
      // },
      {
        name: "status",
        label: "Estado",
        align: "left",
      },
      {
        name: "ringing",
        label: "Timbrando",
        align: "left",
      },
      {
        name: "talking",
        label: "Tiempo en llamada",
        align: "left",
      },
      {
        name: "endByOperator",
        label: "Finalizada por la operadora",
        align: "left",
      },
      // {
      //   name: "callTime",
      //   label: "Hora de la llamada",
      //   align: "left",
      // },
      // {
      //   name: "cost",
      //   label: "Costo",
      //   align: "left",
      // },
    ];
  },

  conwaste() {
    return [
      {
        name: "name",
        label: "",
        align: "left",
      },
      {
        name: "business_name",
        label: "NOMBRE DE NEGOCIO",
        align: "left",
      },
      {
        name: "accountType",
        label: "TIPO DE CUENTA",
        align: "left",
      },
      {
        name: "customer_number",
        label: "NUMERO DE CLIENTE",
        align: "left",
      },

      {
        name: "industry",
        label: "INDUSTRIA",
        align: "left",
      },
      {
        name: "contact_person_name",
        label: "CONTACTO DE NOMBRE PERSONAL",
        align: "left",
      },
      {
        name: "phone_number",
        label: "NUMERO DE TELEFONO",
        align: "left",
      },

      {
        name: "address",
        label: "DIRECCION",
        align: "left",
      },
      {
        name: "town",
        label: "CIUDAD",
        align: "left",
      },
    ];
  },
  conwasteHistorial() {
    return [
      {
        name: "customer_number",
        label: "REALIZADO POR",
        align: "left",
      },
      {
        name: "customer_number",
        label: "COMENTARIO",
        align: "left",
      },

      {
        name: "accountType",
        label: "TIPO DE CUENTA",
        align: "left",
      },
      {
        name: "customer_number",
        label: "NUMERO DE CLIENTE",
        align: "left",
      },
      {
        name: "customer_number",
        label: "TIPO DE SERVICIO",
        align: "left",
      },
      {
        name: "customer_number",
        label: "NUMERO DE CHEQUE ",
        align: "left",
      },
      {
        name: "customer_number",
        label: "MONTO DE CHEQUE ",
        align: "left",
      },
      {
        name: "customer_number",
        label: "NUMERO DE FACTURA",
        align: "left",
      },

      {
        name: "customer_number",
        label: "FECHA DE LLAMADA",
        align: "left",
      },
      {
        name: "customer_number",
        label: "COMPROMISO DE PAGO",
        align: "left",
      },

      {
        name: "business_name",
        label: "NOMBRE DE NEGOCIO",
        align: "left",
      },
      {
        name: "industry",
        label: "INDUSTRIA",
        align: "left",
      },
      {
        name: "contact_person_name",
        label: "CONTACTO DE NOMBRE PERSONAL",
        align: "left",
      },
      {
        name: "phone_number",
        label: "NUMERO DE TELEFONO",
        align: "left",
      },

      {
        name: "address",
        label: "DIRECCION",
        align: "left",
      },
      {
        name: "town",
        label: "PUEBLO",
        align: "left",
      },
      {
        name: "town",
        label: "TIPO DE GESTION",
        align: "left",
      },
    ];
  },
  columnsComercialAll(text) {
    return [
      // {
      //   name: "name",
      //   label: "OPERADORA ENCARGADA",
      //   align: "center",
      // },
      {
        name: "name",
        label: "NUMERO DE IDENTIFICACION DEL MIEMBRO",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE COMPLETO DEL MIEBRO",
        align: "left",
      },
      // {
      //   name: "phone",
      //   label: "CODIGO DE LA EMPRESA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "RELACION",
      //   align: "left",
      // },

      // {
      //   name: "name",
      //   label: "COMPAÑIA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "NUMERO DE GRUPO",
      //   align: "left",
      // },
      {
        name: "name",
        label: "GENERO",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "TIPO DE INSCRIPCION",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "NOMBRE DEL GRUPO",
      //   align: "left",
      // },

      // {
      //   name: "name",
      //   label: "EDAD ACTUAL",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "FECHA DE NACIMIENTO",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "DIRECCION FISICA CIUDAD",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "ESTADO DE DIRECCION FÍSICA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "DIRECCION FÍSACA CÓDIGO POSTAL",
      //   align: "left",
      // },
      {
        name: "name",
        label: "TELEFONO DE CASA",
        align: "left",
      },
      {
        name: "name",
        label: "TELEFONO ALTERNATIVO",
        align: "left",
      },
      {
        name: "name",
        label: "CORREO",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "12348395592",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "COMENTARIOS",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "SEGUNDO INTENTO DE CONTACTO",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "COMENTARIOS 2",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "TERCER INTENTO DE CONTACTO",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "COMENTARIOS 3",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "FECHA DE CITA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "CBP",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "A1C",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "BCS",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "CCS",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "COL",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "EXAMEN DE LA OJOS",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "FLU",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "CCP",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "HerpesZ_Num",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_HerpesZ",
      //   align: "left",
      // },

      // {
      //   name: "name",
      //   label: "Tetano_Num",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_Tetano",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "Neumococo_Num",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_Neumococo",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "HepC_Num2",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_HepC2",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "AAA_Num",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_AAA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_Densitrometry",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "HIV_Num",
      //   align: "left",
      // },

      // {
      //   name: "name",
      //   label: "LastDOS_HIV",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "Chlamydia_Num",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_Chlamydia",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "Gonorrhea_Num",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "LastDOS_Gonorrhea",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "ÚLTIMA VISITA PREVENTIVA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "NOMBRE DEL CENTRO PREVENTIVO ÚLTIMA VISITA",
      //   align: "left",
      // },

      {
        name: "name",
        label: "LOCALIDAD",
        align: "left",
      },
    ];
  },
  columnsComercialRelationship(text) {
    return [
      {
        name: "name",
        label: "RELACION CONFIRMADA",
        align: "center",
      },
      // {
      //   name: "name",
      //   label: "OPERADORA ENCARGADA",
      //   align: "center",
      // },
      {
        name: "name",
        label: "NUMERO DE IDENTIFICACION DEL MIEMBRO",
        align: "left",
      },
      {
        name: "email",
        label: "NOMBRE COMPLETO DEL MIEBRO",
        align: "left",
      },
      {
        name: "phone",
        label: "CODIGO DE LA EMPRESA",
        align: "left",
      },
      {
        name: "name",
        label: "RELACION",
        align: "left",
      },

      {
        name: "name",
        label: "COMPAÑIA",
        align: "left",
      },
      {
        name: "name",
        label: "NUMERO DE GRUPO",
        align: "left",
      },
      {
        name: "name",
        label: "GENERO",
        align: "left",
      },
      {
        name: "name",
        label: "TIPO DE INSCRIPCION",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE DEL GRUPO",
        align: "left",
      },

      {
        name: "name",
        label: "EDAD ACTUAL",
        align: "left",
      },
      {
        name: "name",
        label: "FECHA DE NACIMIENTO",
        align: "left",
      },
      {
        name: "name",
        label: "DIRECCION FISICA CIUDAD",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO DE DIRECCION FÍSICA",
        align: "left",
      },
      {
        name: "name",
        label: "DIRECCION FÍSACA CÓDIGO POSTAL",
        align: "left",
      },
      {
        name: "name",
        label: "TELEFONO DE CASA",
        align: "left",
      },
      {
        name: "name",
        label: "TELEFONO ALTERNATIVO",
        align: "left",
      },
      {
        name: "name",
        label: "CORREO",
        align: "left",
      },
      {
        name: "name",
        label: "12348395592",
        align: "left",
      },
      {
        name: "name",
        label: "COMENTARIOS",
        align: "left",
      },
      {
        name: "name",
        label: "SEGUNDO INTENTO DE CONTACTO",
        align: "left",
      },
      {
        name: "name",
        label: "COMENTARIOS 2",
        align: "left",
      },
      {
        name: "name",
        label: "TERCER INTENTO DE CONTACTO",
        align: "left",
      },
      {
        name: "name",
        label: "COMENTARIOS 3",
        align: "left",
      },
      {
        name: "name",
        label: "FECHA DE CITA",
        align: "left",
      },
      {
        name: "name",
        label: "CBP",
        align: "left",
      },
      {
        name: "name",
        label: "A1C",
        align: "left",
      },
      {
        name: "name",
        label: "BCS",
        align: "left",
      },
      {
        name: "name",
        label: "CCS",
        align: "left",
      },
      {
        name: "name",
        label: "COL",
        align: "left",
      },
      {
        name: "name",
        label: "EXAMEN DE LA OJOS",
        align: "left",
      },
      {
        name: "name",
        label: "FLU",
        align: "left",
      },
      {
        name: "name",
        label: "CCP",
        align: "left",
      },
      {
        name: "name",
        label: "HerpesZ_Num",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_HerpesZ",
        align: "left",
      },

      {
        name: "name",
        label: "Tetano_Num",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_Tetano",
        align: "left",
      },
      {
        name: "name",
        label: "Neumococo_Num",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_Neumococo",
        align: "left",
      },
      {
        name: "name",
        label: "HepC_Num2",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_HepC2",
        align: "left",
      },
      {
        name: "name",
        label: "AAA_Num",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_AAA",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_Densitrometry",
        align: "left",
      },
      {
        name: "name",
        label: "HIV_Num",
        align: "left",
      },

      {
        name: "name",
        label: "LastDOS_HIV",
        align: "left",
      },
      {
        name: "name",
        label: "Chlamydia_Num",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_Chlamydia",
        align: "left",
      },
      {
        name: "name",
        label: "Gonorrhea_Num",
        align: "left",
      },
      {
        name: "name",
        label: "LastDOS_Gonorrhea",
        align: "left",
      },
      {
        name: "name",
        label: "ÚLTIMA VISITA PREVENTIVA",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE DEL CENTRO PREVENTIVO ÚLTIMA VISITA",
        align: "left",
      },

      {
        name: "name",
        label: "ZONA",
        align: "left",
      },
    ];
  },
  columnsReminders(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "PACIENTE",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "OPERADORA",
      //   align: "left",
      // },
      {
        name: "name",
        label: "HORA",
        align: "left",
      },
      {
        name: "name",
        label: "ZONA",
        align: "left",
      },
      {
        name: "name",
        label: "CLASIFICACIÓN",
        align: "left",
      },
      {
        name: "name",
        label: "CONFIRMACIÓN",
        align: "left",
      },
      {
        name: "name",
        label: "STATUS",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "NOTA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "ESTADO",
      //   align: "left",
      // },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsRemindersWithDate(text) {
    return [
      { name: "marks", label: "", align: "left" },
      { name: "actions", label: "ACCIONES", align: "left" },
      {
        name: "name",
        label: "OPERADORA",
        align: "left",
      },
      {
        name: "name",
        label: "PACIENTE",
        align: "left",
      },
      {
        name: "name",
        label: "NUMERO DE CONTRATO",
        align: "left",
      },
      {
        name: "name",
        label: "FECHA",
        align: "left",
      },
      {
        name: "name",
        label: "HORA",
        align: "left",
      },
      {
        name: "name",
        label: "ZONA",
        align: "left",
      },
      {
        name: "name",
        label: "CLASIFICACIÓN",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "CONFIRMACIÓN",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "STATUS",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "NOTA",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "ESTADO",
      //   align: "left",
      // },
    ];
  },
  columnsRemindersAppointments(text) {
    return [
      // {
      //   name: "image",
      //   label: "IMAGE",
      //   align: "left",
      // },
      {
        name: "name",
        label: "PACIENTE",
        align: "left",
      },
      {
        name: "name",
        label: "OPERADORA",
        align: "left",
      },
      {
        name: "name",
        label: "HORA",
        align: "left",
      },
      {
        name: "name",
        label: "ZONA",
        align: "left",
      },
      {
        name: "name",
        label: "CLASIFICACIÓN",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "CONFIRMACIÓN",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "STATUS",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "NOTA",
      //   align: "left",
      // },
    ];
  },
  columnsTypeComments(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsReminders(text) {
    return [
      {
        name: "name",
        label: "OPERADORA",
        align: "left",
      },
      {
        name: "name",
        label: "PACIENTE",
        align: "left",
      },
      {
        name: "name",
        label: "NUMERO DE CONTRATO",
        align: "left",
      },
      {
        name: "name",
        label: "TELEFONO",
        align: "left",
      },
      {
        name: "name",
        label: "DIA Y HORA",
        align: "left",
      },
      {
        name: "name",
        label: "CENTRO PREVENTIVO",
        align: "left",
      },
    ];
  },
  columnsDates(text) {
    return [
      {
        name: "",
        label: "",
        align: "left",
      },
      {
        name: "name",
        label: "FECHA INICIAL",
        align: "left",
      },
      {
        name: "name",
        label: "FECHA FINAL",
        align: "left",
      },
    ];
  },
  columnsDatesReports(text) {
    return [
      {
        name: "name",
        label: "CENTRO PREVENTIVO",
        align: "left",
      },
      {
        name: "name",
        label: "CANTIDAD",
        align: "left",
      },
      {
        name: "name",
        label: "PROMEDIO",
        align: "left",
      },
    ];
  },
  columnsServices(text) {
    return [
      {
        name: "image",
        label: "IMAGEN",
        align: "left",
      },
      {
        name: "application",
        label: "APLICACION",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "code",
        label: "CODIGO",
        align: "left",
      },
      {
        name: "price",
        label: "PRECIO",
        align: "left",
      },
      {
        name: "description",
        label: "DESCRIPCION",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "NOTA",
      //   align: "left",
      // },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsForm(text) {
    return [
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "label",
        label: "LABEL",
        align: "left",
      },
      {
        name: "code",
        label: "TIPO DE INPUT",
        align: "left",
      },
      {
        name: "placeholder",
        label: "PLACEHOLDER",
        align: "left",
      },
      {
        name: "required",
        label: "REQUERIDO",
        align: "left",
      },
      {
        name: "isActived",
        label: "ESTADO",
        align: "left",
      },
      // {
      //   name: "services",
      //   label: "SERVICIOS",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "NOTA",
      //   align: "left",
      // },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsTypeOfForm(text) {
    return [
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "code",
        label: "CODIGO",
        align: "left",
      },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsFormService(text) {
    return [
      {
        name: "name",
        label: "SERVICE",
        align: "left",
      },
      {
        name: "code",
        label: "ORDER",
        align: "left",
      },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsMyServices(text) {
    return [
      {
        name: "name",
        label: "SERVICE",
        align: "left",
      },
      { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
  columnsServiceAnswers(text) {
    return [
      { name: "actions", label: "ACCIONES", align: "left" },
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "SERVICE",
        align: "left",
      },
      {
        name: "name",
        label: "PATIENT",
        align: "left",
      },
      {
        name: "name",
        label: "STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "AMOUNT PAID",
        align: "left",
      },
      {
        name: "name",
        label: "DATE",
        align: "left",
      },
      {
        name: "name",
        label: "UPDATED",
        align: "left",
      },
    ];
  },

  // Store

  columnsStores(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "APLICACION",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "name",
        label: "CORREO",
        align: "left",
      },
      {
        name: "name",
        label: "ZONA",
        align: "left",
      },
      {
        name: "name",
        label: "DIRECCIÓN",
        align: "left",
      },
      {
        name: "name",
        label: "ZIP",
        align: "left",
      },
      {
        name: "name",
        label: "TELEFONO",
        align: "left",
      },
      {
        name: "isActived",
        label: "ESTADO",
        align: "left",
      },

      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsCategories(text) {
    return [
      { name: "name", label: "ACTIONS", align: "left" },
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "NOMBRE",
      //   align: "left",
      // },
      // {
      //   name: "name",
      //   label: "NOM",
      //   align: "left",
      // },
      {
        name: "isActived",
        label: "STATUS",
        align: "left",
      },
    ];
  },
  columnsCategoriesAdmin(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "STORE",
        align: "left",
      },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "name",
        label: "NOM",
        align: "left",
      },
      {
        name: "isActived",
        label: "STATUS",
        align: "left",
      },

      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsProducts(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "description",
        label: "DESCRIPTION",
        align: "left",
      },
      {
        name: "storeCategory_id",
        label: "CATEGORY",
        align: "left",
      },
      {
        name: "amount",
        label: "AMOUNT",
        align: "left",
      },
      {
        name: "price",
        label: "PRICE",
        align: "left",
      },
      {
        name: "isActived",
        label: "STATUS",
        align: "left",
      },

      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsProductsAdmin(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "name",
        label: "STORE",
        align: "left",
      },
      {
        name: "description",
        label: "DESCRIPTION",
        align: "left",
      },
      {
        name: "storeCategory_id",
        label: "CATEGORY",
        align: "left",
      },
      {
        name: "amount",
        label: "AMOUNT",
        align: "left",
      },
      {
        name: "price",
        label: "PRICE",
        align: "left",
      },
      {
        name: "isActived",
        label: "STATUS",
        align: "left",
      },

      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsDrivers(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "name",
        label: "EMAIL",
        align: "left",
      },
      {
        name: "isActived",
        label: "STATUS",
        align: "left",
      },

      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsDriversRequest(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "name",
        label: "EMAIL",
        align: "left",
      },
      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsDriversAdmin(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "STORE",
        align: "left",
      },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "name",
        label: "EMAIL",
        align: "left",
      },
      {
        name: "isActived",
        label: "STATUS",
        align: "left",
      },

      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsProductsActionsHistory(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "PRODUCT",
        align: "left",
      },
      {
        name: "description",
        label: "DESCRIPTION",
        align: "left",
      },
      {
        name: "name",
        label: "TIME",
        align: "left",
      },
      {
        name: "name",
        label: "DATE",
        align: "left",
      },
      // { name: "name", label: "ACTIONS", align: "left" },
    ];
  },

  columnTaxes(text) {
    return [
      {
        name: "name",
        label: "STATE TAX",
        align: "left",
      },
      {
        name: "name",
        label: "MUNICIPAL TAX",
        align: "left",
      },
      {
        name: "name",
        label: "TRANSATION FEE",
        align: "left",
      },
      {
        name: "name",
        label: "PROCESSING FEE",
        align: "left",
      },
      {
        name: "name",
        label: "STATE TAX STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "MUNICIPAL TAX STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "TRANSATION FEE STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "PROCESSING FEE STATUS",
        align: "left",
      },
      {
        name: "disabled",
        label: "STATUS",
        align: "left",
      },

      // { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnAsociados(text) {
    return [
      {
        name: "name",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "NOMBRE",
        align: "left",
      },
      {
        name: "name",
        label: "CORREO",
        align: "left",
      },
      {
        name: "name",
        label: "ROL",
        align: "left",
      },
      {
        name: "name",
        label: "ESTADO",
        align: "left",
      },
      {
        name: "name",
        label: "ACCION",
        align: "left",
      },
    ];
  },
  columnHorario() {
    return [
      {
        name: "actions",
        label: "ACCIONES",
        align: "left",
      },
      {
        name: "name",
        label: "DIAS",
        align: "left",
      },
      {
        name: "init",
        label: "HORA INICIAL",
        align: "left",
      },
      {
        name: "end",
        label: "HORA FINAL",
        align: "left",
      },
      // {
      //   name: "city",
      //   label: "PUEBLO",
      //   align: "left",
      // },
    ];
  },
  columnTaxesAdmin(text) {
    return [
      {
        name: "name",
        label: "STORE",
        align: "left",
      },
      {
        name: "name",
        label: "STATE TAX",
        align: "left",
      },
      {
        name: "name",
        label: "MUNICIPAL TAX",
        align: "left",
      },
      {
        name: "name",
        label: "TRANSATION FEE",
        align: "left",
      },
      {
        name: "name",
        label: "PROCESSING FEE",
        align: "left",
      },
      {
        name: "name",
        label: "STATE TAX STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "MUNICIPAL TAX STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "TRANSATION FEE STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "PROCESSING FEE STATUS",
        align: "left",
      },
      {
        name: "disabled",
        label: "STATUS",
        align: "left",
      },

      { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsSubOrdersTable(text) {
    return [
      {
        name: "name",
        label: "CODE",
        align: "left",
      },
      {
        name: "name",
        label: "CLIENT",
        align: "left",
      },
      {
        name: "name",
        label: "DATE",
        align: "left",
      },
      {
        name: "name",
        label: "TIME",
        align: "left",
      },
      {
        name: "name",
        label: "STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "AMOUNT",
        align: "left",
      },
      {
        name: "name",
        label: "STATE TAX",
        align: "left",
      },
      {
        name: "name",
        label: "MUNICIPAL TAX",
        align: "left",
      },
      {
        name: "name",
        label: "TRASANTION FEE",
        align: "left",
      },
      {
        name: "name",
        label: "PROCESSING FEE",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL TO DESPOSIT",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL TO DISCOUNT",
        align: "left",
      },
      {
        name: "name",
        label: "SHIPPED",
        align: "left",
      },
      {
        name: "name",
        label: "SHIPPING PRICE",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL IVU",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL",
        align: "left",
      },

      // { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsSubOrders(text) {
    return [
      {
        name: "name",
        label: "CODE",
        align: "left",
      },
      {
        name: "name",
        label: "STORE",
        align: "left",
      },
      {
        name: "name",
        label: "CLIENT",
        align: "left",
      },
      {
        name: "name",
        label: "STATUS",
        align: "left",
      },
      {
        name: "name",
        label: "AMOUNT",
        align: "left",
      },
      {
        name: "name",
        label: "STATE TAX",
        align: "left",
      },
      {
        name: "name",
        label: "MUNICIPAL TAX",
        align: "left",
      },
      {
        name: "name",
        label: "TRASANTION FEE",
        align: "left",
      },
      {
        name: "name",
        label: "PROCESSING FEE",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL TO DESPOSIT",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL TO DISCOUNT",
        align: "left",
      },
      {
        name: "name",
        label: "SHIPPED",
        align: "left",
      },
      {
        name: "name",
        label: "SHIPPING PRICE",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL IVU",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL",
        align: "left",
      },
    ];
  },
  columnsSubOrderDetails(text) {
    return [
      { name: "name", label: "IMAGE", align: "left" },
      {
        name: "name",
        label: "NAME",
        align: "left",
      },
      {
        name: "name",
        label: "DESCRIPTION",
        align: "left",
      },
      {
        name: "name",
        label: "AMOUNT",
        align: "left",
      },
      {
        name: "name",
        label: "PRICE",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL",
        align: "left",
      },
      // { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsOrdersPayments(text) {
    return [
      {
        name: "code",
        label: "CODE",
        align: "left",
        field: "code",
        field: (row) => row.code,
      },
      {
        name: "name",
        label: "STORE",
        align: "left",
        field: (row) => row?.store?.name,
      },
      {
        name: "name",
        label: "CLIENT",
        align: "left",
        field: (row) => row?.patient?.name,
      },
      {
        name: "name",
        label: "DATE",
        align: "left",
        field: (row) => moment(row.created_at).format("YYYY/MM/DD"),
      },
      {
        name: "name",
        label: "TIME",
        align: "left",
        field: "elapsedTime",
      },
      {
        name: "name",
        label: "AMOUNT",
        align: "left",
        field: (row) => formatCurrency(row.amount),
      },
      {
        name: "name",
        label: "STATE TAX",
        align: "left",
        field: (row) => formatCurrency(row.stateTax),
      },
      {
        name: "name",
        label: "MUNICIPAL TAX",
        align: "left",
        field: (row) => formatCurrency(row.municipalTax),
      },
      {
        name: "name",
        label: "TRASANTION FEE",
        align: "left",
        field: (row) => formatCurrency(row.transationFee),
      },
      {
        name: "name",
        label: "PROCESSING FEE",
        align: "left",
        field: (row) => formatCurrency(row.processingFee),
      },
      {
        name: "name",
        label: "TOTAL TO DESPOSIT",
        align: "left",
        field: (row) => formatCurrency(row.processingFee),
      },
      {
        name: "name",
        label: "TOTAL TO DISCOUNT",
        align: "left",
        field: (row) => formatCurrency(row.totalToDeposit),
      },
      {
        name: "name",
        label: "SHIPPING PRICE",
        align: "left",
        field: (row) => formatCurrency(row.shippingPrice),
      },
      {
        name: "name",
        label: "TOTAL IVU",
        align: "left",
        field: (row) => formatCurrency(row.totalIVU),
      },
      {
        name: "name",
        label: "TOTAL",
        align: "left",
        field: (row) => formatCurrency(row.total),
      },

      // { name: "name", label: "ACTIONS", align: "left" },
    ];
  },
  columnsBill() {
    return [
      {
        name: "name",
        label: "AMOUNT",
        align: "center",
      },
      {
        name: "name",
        label: "DATE",
        align: "center",
      },
      {
        name: "name",
        label: "DISCOUNT",
        align: "center",
      },
      {
        name: "name",
        label: "TOTAL",
        align: "center",
      },
    ];
  },
  columnsBillingDetails() {
    return [
      {
        name: "status_name",
        label: "STATUS",
        field: "status_name",
        align: "left",
      },
      { name: "code", label: "CODE", field: "code", align: "left" },
      {
        name: "date",
        label: "DATE TO DEPOSITE",
        field: "created_at",
        align: "left",
      },
    ];
  },
  columnsHistoryUser(text) {
    return [
      {
        name: "image",
        label: "IMAGE",
        align: "left",
      },
      {
        name: "name",
        label: "PACIENTE",
        align: "left",
      },
      {
        name: "name",
        label: "NUMERO DE INDENTIFICACIÓN",
        align: "left",
      },
    ];
  },
  columnsOrders(text) {
    return [
      {
        name: "name",
        label: "CODE",
        align: "left",
      },
      // {
      //   name: "name",
      //   label: "STORE",
      //   align: "left",
      // },
      {
        name: "name",
        label: "CLIENT",
        align: "left",
      },
      {
        name: "name",
        label: "DATE",
        align: "left",
      },
      {
        name: "name",
        label: "TIME",
        align: "left",
      },
      {
        name: "name",
        label: "AMOUNT",
        align: "left",
      },
      {
        name: "name",
        label: "STATE TAX",
        align: "left",
      },
      {
        name: "name",
        label: "MUNICIPAL TAX",
        align: "left",
      },
      {
        name: "name",
        label: "TRASANTION FEE",
        align: "left",
      },
      {
        name: "name",
        label: "PROCESSING FEE",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL TO DESPOSIT",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL TO DISCOUNT",
        align: "left",
      },
      {
        name: "name",
        label: "SHIPPING PRICE",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL IVU",
        align: "left",
      },
      {
        name: "name",
        label: "TOTAL",
        align: "left",
      },

      // { name: "name", label: "ACTIONS", align: "left" },
    ];
  },

  columnsErrors(text) {
    return [
      {
        name: "createdBy",
        label: "OPERADORA",
        align: "left",
      },
      {
        name: "comercial",
        label: "PACIENTE",
        align: "left",
      },
      {
        name: "reminder",
        label: "DIA DE LA CITA",
        align: "left",
      },
      {
        name: "date",
        label: "FECHA DEL REPORTE",
        align: "left",
      },
      {
        name: "status",
        label: "STATUS",
        align: "left",
      },
      // { name: "actions", label: "ACCIONES", align: "left" },
    ];
  },
};
