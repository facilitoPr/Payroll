function parseDateLoose(input: any): Date | null {
  if (!input) return null;

  // Si ya es Date
  if (input instanceof Date && !isNaN(input.getTime())) return input;

  const s = String(input).trim();
  if (!s) return null;

  // Normaliza "YYYY/MM/DD" -> "YYYY-MM-DD"
  const normalized = s.replace(/\//g, "-");

  // Si es "YYYY-MM-DD" (o empieza así), parseamos manual para evitar TZ issues
  const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d); // local time
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Fallback para ISO completo u otros formatos compatibles
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function fullYearsBetween(from: Date, to: Date): number {
  // años cumplidos (como differenceInYears de date-fns)
  let years = to.getFullYear() - from.getFullYear();

  const hasNotHadBirthdayYet =
    to.getMonth() < from.getMonth() ||
    (to.getMonth() === from.getMonth() && to.getDate() < from.getDate());

  if (hasNotHadBirthdayYet) years -= 1;
  return years;
}

export function buildHumanProfileFromAnswers(
  answers: Record<string, any> = {}
) {
  const get = (k: string, def: string = "No especificado") =>
    answers[k] !== undefined && answers[k] !== null && answers[k] !== ""
      ? String(answers[k])
      : def;

  // Edad aproximada desde birthDate
  let ageText = "No especificada";
  if (answers.birthDate) {
    const birth = parseDateLoose(answers.birthDate);
    if (birth) {
      const years = fullYearsBetween(birth, new Date());
      ageText = `${years} años (nacido el ${birth.toISOString().slice(0, 10)})`;
    } else {
      ageText = `Fecha inválida: ${answers.birthDate}`;
    }
  }

  // Experiencia en años (diferencia entre expStartDate y expEndDate o hoy)
  let expYearsText = "No especificada";
  if (answers.expStartDate) {
    const start = parseDateLoose(answers.expStartDate);
    const end = answers.expEndDate
      ? parseDateLoose(answers.expEndDate)
      : new Date();

    if (start && end) {
      const years = fullYearsBetween(start, end);
      expYearsText = `${years} años aprox.`;
    } else {
      expYearsText = "No se pudo calcular (fechas inválidas)";
    }
  }

  const yesNo = (k: string) => {
    const v = (answers[k] || "").toString().toLowerCase();
    if (!v) return "No especificado";
    if (["si", "sí", "yes", "y"].includes(v)) return "Sí";
    if (["no", "n"].includes(v)) return "No";
    return answers[k];
  };

  const motivacion = [
    `- ¿Por qué desea trabajar aquí?: ${get("whyWorkHere", "No responde")}`,
    `- ¿Qué valor puede aportar al puesto?: ${get(
      "valueToAdd",
      "No responde"
    )}`,
    `- Mayor logro profesional: ${get("biggestAchievement", "No especifica")}`,
  ].join("\n");

  const riesgos = [
    `- ¿Tiene procesos en otras empresas?: ${yesNo("otherProcesses")}`,
    `- ¿Ha sido desvinculado recientemente?: ${yesNo("recentDismissal")}`,
  ].join("\n");

  return `
RESUMEN DEL PERFIL DEL CANDIDATO (DERIVADO DEL FORMULARIO)
---------------------------------------------------------

1) DATOS PERSONALES
- Nombre completo: ${get("fullName")}
- Edad: ${ageText}
- Nacionalidad: ${get("nationality")}
- Estado civil: ${get("maritalStatus")}
- Teléfono móvil: ${get("mobilePhone")}
- Email: ${get("email")}
- Dirección: ${get("address")}
- Licencia de conducir: ${yesNo("hasDriverLicense")} (tipo: ${get(
    "driverLicenseType",
    "No indica"
  )})

2) PUESTO AL QUE APLICA
- Puesto deseado: ${get("desiredPosition")}
- Departamento / área: ${get("department")}
- Jornada disponible: ${get("scheduleAvailable")}
- Fecha para iniciar: ${get("startDateAvailable")}
- Pretensión salarial: ${get("salaryExpectation", "No indica")}
- Fuente de la vacante: ${get("vacancySource")}

3) EXPERIENCIA LABORAL (último empleo declarado)
- Empresa: ${get("companyName")}
- Cargo: ${get("positionHeld")}
- País/ciudad: ${get("countryCity")}
- Desde: ${get("expStartDate")}
- Hasta: ${get("expEndDate", "Actualidad / no indica")}
- Años de experiencia en este puesto: ${expYearsText}
- Funciones principales: ${get("functionsDescription")}
- Logros principales: ${get("mainAchievements", "No especifica")}
- Salario mensual (opcional): ${get("monthlySalaryOptional", "No indica")}
- Motivo de salida: ${get("exitReason", "No indica")}

4) EDUCACIÓN
- Nivel educativo: ${get("educationLevel")}
- Título: ${get("degreeTitle")}
- Institución: ${get("institution")}
- País: ${get("educationCountry")}
- Estudios desde: ${get("educationStart", "No indica")} hasta: ${get(
    "educationEnd",
    "No indica"
  )}
- Certificaciones adicionales: ${get("extraCerts", "No indica")}

5) HABILIDADES Y COMPETENCIAS
- Idiomas y nivel: ${get("languages")}
- Software / herramientas: ${get("softwareTools")}
- Competencias blandas: ${get("softSkills", "No indica")}
- Competencias técnicas: ${get("techSkills", "No indica")}
- Cursos o entrenamientos relevantes: ${get("relevantCourses", "No indica")}

6) INFORMACIÓN ADICIONAL
- ¿Está dispuesto a viajar?: ${yesNo("willingToTravel")}
- ¿Está dispuesto a reubicarse?: ${yesNo("willingToRelocate")}
- ¿Posee vehículo propio?: ${yesNo("hasVehicle")}
- Disponibilidad de horario: ${get("timeAvailability", "No indica")}
- Expectativas de crecimiento profesional: ${get(
    "growthExpectations",
    "No indica"
  )}

7) REFERENCIA LABORAL (principal)
- Nombre: ${get("refName")}
- Relación: ${get("refRelation")}
- Empresa: ${get("refCompany", "No indica")}
- Teléfono: ${get("refPhone")}
- Correo: ${get("refEmail", "No indica")}
- Tiempo de relación: ${get("refTime", "No indica")}

8) MOTIVACIÓN Y RIESGOS DECLARADOS
${motivacion}

RIESGOS DECLARADOS:
${riesgos}

9) CONSENTIMIENTOS
- Autoriza verificación de referencias: ${yesNo("refCheckAuth")}
- Consiente uso de datos: ${yesNo("dataUseConsent")}
- Confirma veracidad de información: ${yesNo("infoTruthConfirm")}
- Firma digital: ${get("digitalSignature")}
- Fecha del formulario: ${get("formDate")}
`.trim();
}
