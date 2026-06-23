# Análisis bts-payroll-prod-copy

- Migración: `BTS_PAYROLL_PROD_COPY_TO_CURRENT_VERSION_V1`
- Generado: 2026-06-20T15:38:37.104Z
- Colecciones: 138
- BLOCKER: 2
- WARNING: 4
- INFO: 58

## Colecciones

| Colección | Docs | Modelo | Campos frecuentes |
| --- | --- | --- | --- |
| accountsessions | 0 | CURRENT_MODEL |  |
| ads | 0 | LIKELY_CURRENT_MODEL |  |
| adscategories | 0 | UNKNOWN_OR_LEGACY |  |
| aiagents | 6 | CURRENT_MODEL | __v, _id, code, config, createdAt, description, isActive, isDeleted |
| applications | 9 | LIKELY_CURRENT_MODEL | __v, _id, code, isActived, isDeleted, name, img, primaryColor |
| appointments | 1 | UNKNOWN_OR_LEGACY | __v, _id, code, createdAt, date, finalHour, initHour, isActived |
| appointmentsrequests | 0 | UNKNOWN_OR_LEGACY |  |
| articles | 6 | UNKNOWN_OR_LEGACY | __v, _id, application, created_at, description, img, information, isActived |
| auditlogs | 66 | CURRENT_MODEL | __v, _id, action, changedBy, changes, context, context.ip, context.meta |
| callsdailyclosures | 340 | UNKNOWN_OR_LEGACY | _id, answeredCalls, createdAt, date, dateKey, endedByOperatorCalls, generatedAt, generatedByCron |
| callsreports | 210709 | CURRENT_MODEL | __v, _id, callDay, callId, callTime, cost, direction, endByOperator |
| chatreviews | 0 | UNKNOWN_OR_LEGACY |  |
| chats | 0 | UNKNOWN_OR_LEGACY |  |
| cities | 78 | UNKNOWN_OR_LEGACY | __v, _id, created_at, isActived, isDeleted, name, updated_at |
| classificationtemplates | 1 | CURRENT_MODEL | __v, _id, code, createdAt, isActive, isDeleted, name, sections |
| clientspaymentmanagements | 5593 | UNKNOWN_OR_LEGACY | __v, _id, accountType, address, business_name, contact_person_name, created_at, customer_number |
| clientspaymentnotes | 12288 | UNKNOWN_OR_LEGACY | __v, _id, amountPayment, callDate, clientsPaymentManagement, created_at, createdAt, isActived |
| comercialadditionalcomments | 667 | CURRENT_MODEL | __v, _id, comercial, comment, created_at, user |
| comercialcomments | 11108 | CURRENT_MODEL | __v, _id, comercial, created_at, typeComment, user |
| comercialdocumeninfos | 22 | CURRENT_MODEL | __v, _id, created_at, name, updated_at, zones, isFederal |
| comercialimportrows | 85014 | UNKNOWN_OR_LEGACY | __v, _id, A1C, AAA_Num, AlternatePhone, BCS, BirthDate, CBP |
| comercialmarkhistories | 566 | UNKNOWN_OR_LEGACY | _id, action, comercial, comercialDocumenInfo, createdAt, isActive, isDeleted, mark |
| comercialrelationships | 21457 | CURRENT_MODEL | __v, _id, members |
| comercials | 81738 | CURRENT_MODEL | __v, _id, A1C, AAA_Num, AlternatePhone, BCS, BirthDate, CBP |
| companies | 0 | CURRENT_MODEL |  |
| companyprofiles | 1 | CURRENT_MODEL | __v, _id, address, agreementCode, bankFileLayoutVersion, code, contactName, coverUrl |
| days | 7 | CURRENT_MODEL | __v, _id, created_at, day, isActive, isDeleted, order, updated_at |
| deductiontypes | 5 | CURRENT_MODEL | __v, _id, code, createdAt, description, fixedAmount, isActive, isLegal |
| departments | 6 | CURRENT_MODEL | __v, _id, code, created_at, description, isActive, isDeleted, managers |
| directions | 1 | UNKNOWN_OR_LEGACY | __v, _id, address_1, address_2, alias, city, created_at, latitude |
| disciplinaryactions | 29 | CURRENT_MODEL | __v, _id, audit, audit.createdVia, audit.ip, category, createdAt, createdBy |
| docs | 0 | UNKNOWN_OR_LEGACY |  |
| employeedeductions | 133 | CURRENT_MODEL | __v, _id, createdAt, customAmount, customPercentage, deductionType, isEnabled, updatedAt |
| employeeloanintegrationclients | 0 | CURRENT_MODEL |  |
| employeeloanpolicies | 0 | CURRENT_MODEL |  |
| employeeloanproductconfigs | 0 | CURRENT_MODEL |  |
| employeeloanrequesthistories | 0 | CURRENT_MODEL |  |
| employeeloanrequests | 0 | CURRENT_MODEL |  |
| employeesalaryhistories | 0 | CURRENT_MODEL |  |
| employeeterminations | 0 | CURRENT_MODEL |  |
| employeevacationbalances | 0 | CURRENT_MODEL |  |
| expedientattachments | 49 | CURRENT_MODEL | __v, _id, checksum, createdAt, expedient, isActive, isDeleted, itemKey |
| expedients | 14 | CURRENT_MODEL | __v, _id, classification, classification.expedientCode, classification.notes, classification.owner, createdAt, createdBy |
| favoritepatientdoctors | 0 | UNKNOWN_OR_LEGACY |  |
| forms | 65 | LIKELY_CURRENT_MODEL | __v, _id, content, created_at, description, helperText, isActived, isCompressed |
| formservices | 81 | UNKNOWN_OR_LEGACY | __v, _id, created_at, form, order, services, updated_at |
| genders | 2 | UNKNOWN_OR_LEGACY | __v, _id, code, name |
| historyuserquotes | 3229 | UNKNOWN_OR_LEGACY | __v, _id, created_at, memberIdentificationNumber |
| images | 0 | UNKNOWN_OR_LEGACY |  |
| incentiveachievements | 413 | CURRENT_MODEL | _id, appliesTo, createdAt, createdBy, evidence, isActive, isDeleted, message |
| incentiveprograms | 2 | CURRENT_MODEL | __v, _id, code, createdAt, createdBy, description, endMonth, isActive |
| incentiverecalclocks | 62 | CURRENT_MODEL | __v, _id, createdAt, expiresAt, key, updatedAt |
| incentiverules | 5 | CURRENT_MODEL | __v, _id, appliesTo, code, config, config.period, createdAt, createdBy |
| incentivescopesnapshots | 20 | CURRENT_MODEL | _id, createdAt, createdBy, isActive, isDeleted, membersCount, memberUserIds, month |
| incometaxrds | 1 | CURRENT_MODEL | __v, _id, brackets, createdAt, exemptAmount, isActive, isDeleted, notes |
| jobpositions | 6 | CURRENT_MODEL | __v, _id, createdAt, department, employmentType, isActive, isDeleted, modality |
| laborterminationpolicyrds | 0 | CURRENT_MODEL |  |
| leavepolicies | 0 | CURRENT_MODEL |  |
| medicalconsultations | 0 | UNKNOWN_OR_LEGACY |  |
| medicinereminderlogs | 0 | UNKNOWN_OR_LEGACY |  |
| menus | 0 | CURRENT_MODEL |  |
| messages | 0 | UNKNOWN_OR_LEGACY |  |
| notificationrecipients | 1170 | CURRENT_MODEL | __v, _id, createdAt, isActive, isDeleted, notification, updatedAt, user |
| notifications | 1168 | CURRENT_MODEL | __v, _id, createdAt, createdBy, entityId, entityType, isActive, isDeleted |
| patientreminders | 0 | LIKELY_CURRENT_MODEL |  |
| patients | 4 | UNKNOWN_OR_LEGACY | __v, _id, address, alergies, application, birthDate, city, created_at |
| paymentfrequencies | 3 | CURRENT_MODEL | __v, _id, code, description, name |
| paymentperiods | 1 | CURRENT_MODEL | __v, _id, createdAt, deductions, grossSalary, isPaid, netSalary, periodEnd |
| paymentschedules | 1 | CURRENT_MODEL | __v, _id, description, isActive, name, payDays, paymentFrequency, weeklyDays |
| payrollaccruals | 0 | CURRENT_MODEL |  |
| payrollbankfiles | 14 | CURRENT_MODEL | __v, _id, content, createdAt, currency, fileName, generatedAt, headerSequence |
| payrollearningentries | 0 | CURRENT_MODEL |  |
| payrollearningtypes | 12 | CURRENT_MODEL | __v, _id, code, createdAt, description, isActive, isDeleted, name |
| payrollpayments | 194 | CURRENT_MODEL | __v, _id, bankSnapshot, bankSnapshot.accountNumber, bankSnapshot.accountType, bankSnapshot.acquirerId, bankSnapshot.bankCode, bankSnapshot.bankDigit |
| payrollpolicies | 0 | CURRENT_MODEL |  |
| payrollruns | 11 | CURRENT_MODEL | __v, _id, bankAuthorizationNumber, bankDepositedAt, bankDepositedBy, createdAt, createdBy, emailStats |
| permissionrequesthistories | 101 | CURRENT_MODEL | __v, _id, action, comment, createdAt, performedAt, permissionRequest, previousData |
| permissionrequests | 71 | CURRENT_MODEL | __v, _id, category, createdAt, endDate, performedBy, permissionType, reason |
| permissiontypes | 11 | CURRENT_MODEL | __v, _id, category, code, createdAt, description, isActive, name |
| placetopayrequestids | 0 | UNKNOWN_OR_LEGACY |  |
| planads | 0 | UNKNOWN_OR_LEGACY |  |
| problemreports | 311 | CURRENT_MODEL | _id, createdAt, createdBy, date, images, isActived, isDeleted, isRead |
| projects | 5 | CURRENT_MODEL | __v, _id, created_at, description, endDate, isActive, isDeleted, name |
| promotionads | 0 | CURRENT_MODEL |  |
| punchhistories | 13720 | CURRENT_MODEL | __v, _id, createdAt, date, img, isDeleted, punchStep, punchType |
| punchtypes | 3 | CURRENT_MODEL | __v, _id, code, createdAt, description, expectedPunches, isActive, name |
| recruitmentapplications | 33 | CURRENT_MODEL | __v, _id, aiAgent, aiDecision, aiDecision.agentId, aiDecision.decision, aiDecision.evaluatedAt, aiDecision.interview |
| recruitmentforms | 12 | CURRENT_MODEL | __v, _id, createdAt, createdBy, fields, isActive, isDeleted, publicToken |
| reminders | 14856 | CURRENT_MODEL | __v, _id, comercial, created_at, date, hour, isActived, isDeleted |
| reminderstypes | 6 | CURRENT_MODEL | __v, _id, code, isActived, isDeleted, name, description, icon |
| rolepermissions | 0 | CURRENT_MODEL |  |
| roles | 11 | CURRENT_MODEL | __v, _id, code, name |
| salarytypes | 2 | CURRENT_MODEL | __v, _id, code, description, name |
| schedules | 6 | LIKELY_CURRENT_MODEL | __v, _id, created_at, day, finalHour, initHour, isActived, isDeleted |
| serviceanswers | 15 | UNKNOWN_OR_LEGACY | __v, _id, amountPaid, answer, created_at, isDeleted, isPaid, patient |
| servicedocuments | 4 | UNKNOWN_OR_LEGACY | __v, _id, created_at, data, pdfFile, pdfFile.buffer, pdfFile.buffer.0, pdfFile.buffer.1 |
| servicedocumentstemplates | 0 | UNKNOWN_OR_LEGACY |  |
| services | 15 | UNKNOWN_OR_LEGACY | __v, _id, application, code, created_at, description, img, isActived |
| shifts | 0 | UNKNOWN_OR_LEGACY |  |
| specialties | 34 | UNKNOWN_OR_LEGACY | __v, _id, created_at, isActived, isDeleted, name, updated_at |
| status | 26 | CURRENT_MODEL | __v, _id, code, name |
| storebillingdetails | 0 | UNKNOWN_OR_LEGACY |  |
| storebillings | 0 | UNKNOWN_OR_LEGACY |  |
| storecarts | 2 | UNKNOWN_OR_LEGACY | __v, _id, amount, created_at, patient, productPrice, store, storeProduct |
| storecategories | 6 | UNKNOWN_OR_LEGACY | __v, _id, created_at, img, isActived, isDeleted, name, nom |
| storedrivers | 0 | UNKNOWN_OR_LEGACY |  |
| storehistoryorders | 10 | UNKNOWN_OR_LEGACY | __v, _id, amount, code, created_at, isSent, municipalTax, patient |
| storeorders | 37 | UNKNOWN_OR_LEGACY | __v, _id, amount, code, created_at, direction, isSent, municipalTax |
| storeproducts | 43 | UNKNOWN_OR_LEGACY | __v, _id, amount, amountToNotify, created_at, description, img, imgs |
| storeproductsactionshistories | 1 | UNKNOWN_OR_LEGACY | __v, _id, created_at, description, store, storeProduct |
| storerequeststatussends | 1 | LIKELY_CURRENT_MODEL | __v, _id, created_at, isSent, patient, store, updated_at |
| stores | 1 | UNKNOWN_OR_LEGACY | __v, _id, account_name, address, application, bank_account, banking_institute, code |
| storestatuses | 7 | LIKELY_CURRENT_MODEL | __v, _id, code, created_at, description, name, nombre, updated_at |
| storestatushistorybillings | 0 | LIKELY_CURRENT_MODEL |  |
| storesuborderdetails | 7 | UNKNOWN_OR_LEGACY | __v, _id, amount, created_at, patient, price, storeProduct, storeSubOrder |
| storesuborderdrivers | 0 | UNKNOWN_OR_LEGACY |  |
| storesuborders | 6 | UNKNOWN_OR_LEGACY | __v, _id, amount, code, created_at, direction, isSent, municipalTax |
| storetaxes | 1 | UNKNOWN_OR_LEGACY | __v, _id, isActiveMunicipalTax, isActiveProcessingFee, isActiveStateTax, isActiveTransationFee, isDisabled, municipalTax |
| storeyoutubevideos | 0 | UNKNOWN_OR_LEGACY |  |
| supporttickets | 0 | CURRENT_MODEL |  |
| terminationloanpayrollpendingpayments | 0 | CURRENT_MODEL |  |
| terminationpayments | 0 | CURRENT_MODEL |  |
| togglemodules | 0 | UNKNOWN_OR_LEGACY |  |
| traininganswers | 0 | CURRENT_MODEL |  |
| trainingattempts | 0 | CURRENT_MODEL |  |
| trainingcontentblocks | 0 | CURRENT_MODEL |  |
| trainingquestions | 0 | CURRENT_MODEL |  |
| trainings | 0 | CURRENT_MODEL |  |
| traininguserassignments | 0 | CURRENT_MODEL |  |
| typecomercialcomments | 16 | CURRENT_MODEL | __v, _id, created_at, name |
| typeofforms | 12 | UNKNOWN_OR_LEGACY | __v, _id, code, created_at, isActived, isDeleted, name, updated_at |
| users | 49 | CURRENT_MODEL | __v, _id, code, created_at, email, img, isActived, isDeleted |
| vacationbalancemovements | 0 | CURRENT_MODEL |  |
| vacationdayreservations | 0 | CURRENT_MODEL |  |
| worksummaries | 4074 | CURRENT_MODEL | __v, _id, confirmedToPay, createdAt, date, dateString, isDeleted, isIncomplete |
| worksummarydocumentations | 22 | CURRENT_MODEL | __v, _id, createdAt, createdBy, documents, images, isActive, isDeleted |
| youtubevideos | 0 | UNKNOWN_OR_LEGACY |  |
| zones | 4 | CURRENT_MODEL | __v, _id, code, isActived, isDeleted, link, name |

## Colecciones Sin Match Directo

- adscategories
- appointments
- appointmentsrequests
- articles
- callsdailyclosures
- chatreviews
- chats
- cities
- clientspaymentmanagements
- clientspaymentnotes
- comercialimportrows
- comercialmarkhistories
- directions
- docs
- favoritepatientdoctors
- formservices
- genders
- historyuserquotes
- images
- medicalconsultations
- medicinereminderlogs
- messages
- patients
- placetopayrequestids
- planads
- serviceanswers
- servicedocuments
- servicedocumentstemplates
- services
- shifts
- specialties
- storebillingdetails
- storebillings
- storecarts
- storecategories
- storedrivers
- storehistoryorders
- storeorders
- storeproducts
- storeproductsactionshistories
- stores
- storesuborderdetails
- storesuborderdrivers
- storesuborders
- storetaxes
- storeyoutubevideos
- togglemodules
- typeofforms
- youtubevideos

## Colecciones Actuales Faltantes

- banners
- employeeloanexternalsynclogs
- migrationbackups
- migrationruns

## Hallazgos

| Prioridad | Colección | Mensaje | Conteo |
| --- | --- | --- | --- |
| BLOCKER | users | Empleado activo sin tipo de salario ni salario base/tarifa por hora. | 6 |
| WARNING | users | Empleado activo sin compañía. | 28 |
| WARNING | users | Empleado activo sin horario. | 7 |
| WARNING | users | Empleado activo sin calendario/frecuencia de pago. | 6 |
| INFO | users | Usuarios sin employmentStatus formal; migración debe derivar ACTIVE/INACTIVE/TERMINATED de forma conservadora. | 49 |
| INFO | users | Usuarios sin payrollCalculationMode; migración debe asignar default compatible. | 49 |
| WARNING | users | Correos duplicados en usuarios activos/no eliminados. | 6 |
| INFO | worksummaries | WorkSummary sin PunchHistory. Puede ser día especial, permiso, ausencia o dato incompleto. | 1390 |
| BLOCKER | worksummaries | WorkSummary duplicado por empleado y fecha. | 1 |
| INFO | payrollpayments | PayrollPayment histórico sin metadata de asistencia. Debe tratarse como FULL_PERIOD sin recalcular montos. | 194 |
| INFO | users | Usuarios inactivos sin registro formal de desvinculación; no deben marcarse TERMINATED sin evidencia. | 18 |
| INFO | adscategories | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | appointments | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | appointmentsrequests | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | articles | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | callsdailyclosures | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | chatreviews | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | chats | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | cities | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | clientspaymentmanagements | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | clientspaymentnotes | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | comercialimportrows | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | comercialmarkhistories | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | directions | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | docs | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | favoritepatientdoctors | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | formservices | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | genders | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | historyuserquotes | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | images | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | medicalconsultations | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | medicinereminderlogs | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | messages | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | patients | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | placetopayrequestids | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | planads | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | serviceanswers | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | servicedocuments | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | servicedocumentstemplates | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | services | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | shifts | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | specialties | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storebillingdetails | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storebillings | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storecarts | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storecategories | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storedrivers | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storehistoryorders | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storeorders | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storeproducts | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storeproductsactionshistories | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | stores | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storesuborderdetails | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storesuborderdrivers | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storesuborders | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storetaxes | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | storeyoutubevideos | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | togglemodules | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | typeofforms | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | youtubevideos | Colección sin modelo actual detectado por heurística. Revisar si es legacy, externa o nueva no registrada. |  |
| INFO | banners | Colección esperada por modelos actuales no existe en la copia. |  |
| INFO | employeeloanexternalsynclogs | Colección esperada por modelos actuales no existe en la copia. |  |
| INFO | migrationbackups | Colección esperada por modelos actuales no existe en la copia. |  |
| INFO | migrationruns | Colección esperada por modelos actuales no existe en la copia. |  |

## Mapa De Migración Propuesto

| Origen legacy/actual | Modelo objetivo | Estrategia | Riesgo |
| --- | --- | --- | --- |
| users | User | Completar employmentStatus y payrollCalculationMode solo si faltan; no inferir TERMINATED sin EmployeeTermination. | Medio |
| worksummaries + punchhistories | WorkSummary/PunchHistory + snapshot.attendance.days | Conservar históricos; nuevos cierres generan ledger. Históricos quedan FULL_PERIOD compatible. | Alto si se recalculan montos |
| payrollruns + payrollpayments | PayrollRun/PayrollPayment | No cambiar montos cerrados; añadir metadata segura solo bajo ejecución confirmada. | Alto |
| employeevacationbalances | EmployeeVacationBalance | Recalcular fórmulas nuevas de disponibilidad usando campos existentes y reservas ACTIVE. | Medio |
| employeeloanrequests | EmployeeLoanRequest + VacationDayReservation | Crear reservas solo si guaranteedDays existe y el préstamo está vigente. | Medio |
| employeeterminations + terminationpayments | EmployeeTermination/TerminationPayment | Vincular estado TERMINATED solo cuando exista desvinculación válida. | Medio |
| colecciones desconocidas | Revisión manual | No modificar; reportar como legacy/externas. | Bajo |
