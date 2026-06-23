<template>
  <div>
    <div
      class="text-white bg-primary text-center text-bold q-pa-sm table-title"
    >
      TABLA DE CITA POR DÍAS
    </div>

    <div v-if="rows.length > 0" class="table-wrap">
      <table class="q-table-style">
        <thead>
          <tr class="bg-grey-3">
            <th colspan="2">NOMBRE DE LA OPERADORA</th>
            <th colspan="4">{{ props.item?.name || "N/A" }}</th>
            <th colspan="2">Ext: {{ props.item?.ext || "N/A" }}</th>
          </tr>

          <tr class="bg-grey-2">
            <th colspan="8">
              FECHA: {{ moment(props.date).format("YYYY/MM/DD") }} -
              {{
                props.endDate
                  ? moment(props.endDate).format("YYYY/MM/DD")
                  : "N/A"
              }}
            </th>
          </tr>

          <!-- Cabecera columnas -->
          <tr class="bg-primary text-white">
            <th>Nombre del cliente</th>
            <th>Número de contrato</th>
            <th>Teléfono</th>
            <th>Día y hora de la cita</th>
            <th>Centro preventivo</th>
            <th>Fecha de calendarización</th>
            <th class="text-center">Acción</th>
            <th class="text-center">Checkmarks</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="row?._id || i"
            :class="i % 2 === 0 ? 'bg-grey-1' : ''"
            class="table-row"
          >
            <td>{{ row?.comercial?.MemberFullname || "N/A" }}</td>
            <td>{{ row?.comercial?.memberIdentificationNumber || "N/A" }}</td>
            <td>{{ row?.comercial?.HomePhone || "N/A" }}</td>
            <td>{{ formatAppointmentDateTime(row) }}</td>
            <td>{{ row?.zone?.name || "N/A" }}</td>
            <td>{{ moment(row?.createdByOperatorDate).format("LL") }}</td>

            <!-- Acciones -->
            <td>
              <div class="row no-wrap items-center justify-center q-gutter-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="event_repeat"
                  color="amber-8"
                  @click="recoordinateAppointment(row)"
                >
                  <q-tooltip>Recoordinar</q-tooltip>
                </q-btn>

                <q-btn
                  flat
                  dense
                  round
                  icon="edit"
                  color="primary"
                  @click="editAppoitment(row)"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>

                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  @click="openModalDelete(row)"
                >
                  <q-tooltip>Eliminar</q-tooltip>
                </q-btn>
              </div>
            </td>

            <!-- Checkmarks -->
            <td class="marks-cell">
              <div class="marks-wrap">
                <q-chip
                  v-for="m in MARKS"
                  :key="m.code"
                  clickable
                  dense
                  :outline="!hasMark(row, m.code)"
                  :color="hasMark(row, m.code) ? m.color : 'grey-7'"
                  :text-color="hasMark(row, m.code) ? 'white' : 'grey-8'"
                  :disable="isUpdating(row?._id)"
                  class="mark-chip"
                  @click="toggleMark(row, m.code)"
                >
                  <q-icon :name="m.icon" size="16px" class="q-mr-xs" />
                  <span class="mark-label">{{ m.short }}</span>

                  <q-tooltip>
                    {{ m.label }}
                    {{
                      hasMark(row, m.code)
                        ? " (click para quitar)"
                        : " (click para marcar)"
                    }}
                  </q-tooltip>
                </q-chip>
              </div>
            </td>
          </tr>

          <tr class="bg-grey-3 text-bold">
            <td colspan="1" class="text-right">TOTAL: {{ rows.length }}</td>
            <td colspan="7"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- <CreateAppointmentsModal
      :openModal="openModalAppoitment"
      :comercial="appointmentData?.comercial"
      @update:openModal="openModalAppoitment = $event"
      :editMode="editMode"
      @update:editMode="editMode"
      :reminderData="appointmentData"
      :getReminders="props.getReminders"
    /> -->

    <CreateAppointmentsModal
      :openModal="openModalAppoitment"
      :comercial="appointmentData?.comercial"
      @update:openModal="openModalAppoitment = $event"
      :editMode="editMode"
      @update:editMode="editMode = $event"
      :reminderData="appointmentData"
      :getReminders="props.getReminders"
      :isRescheduled="isRescheduled"
      :rescheduledFromId="rescheduledFromId"
    />

    <Delete ref="deleteInfo" @deleteGood="props.getReminders" />
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { defineProps, ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import CreateAppointmentsModal from "../asignments/CreateAppointmentsModal.vue";
import Delete from "../utils/Delete.vue";
import NotificationsVue from "src/components/utils/Notifications.vue";
import { MARKS } from "src/data/appointmentMarks";

moment.locale("es");

const props = defineProps({
  item: { type: Object, default: null },
  rows: { type: Array, default: () => [] },
  date: { type: String, default: null },
  endDate: { type: String, default: null },
  zone: { type: String, default: null },
  getReminders: { type: Function, required: false },
});

const notify = ref(null);
const openModalAppoitment = ref(false);
const editMode = ref(false);
const appointmentData = ref(null);
const deleteInfo = ref(null);

const updatingIds = ref(new Set());
const isRescheduled = ref(false);
const rescheduledFromId = ref(null);

const isUpdating = (id) => {
  if (!id) return false;
  return updatingIds.value.has(String(id));
};

const formatAppointmentDateTime = (row) => {
  const d = row?.date;
  const h = row?.hour;
  if (!d || !h) return "N/A";
  return moment(`${d} ${h}`).format("LLLL");
};

const editAppoitment = (data) => {
  isRescheduled.value = false;
  rescheduledFromId.value = null;

  openModalAppoitment.value = true;
  editMode.value = true;
  appointmentData.value = data;
};

const recoordinateAppointment = (row) => {
  openModalAppoitment.value = true;

  // ✅ modo crear (no editar)
  editMode.value = false;

  // ✅ marcar que viene por recoordinación
  isRescheduled.value = true;
  rescheduledFromId.value = row?._id ? String(row._id) : null;

  // ✅ prellenar con la cita actual (sin depender del _id para crear)
  appointmentData.value = {
    ...row,
    _id: undefined,
  };
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "reminders/deteleReminder",
  };
  deleteInfo.value?.openDelete(data);
};

const hasMark = (reminder, code) => {
  const arr = Array.isArray(reminder?.marks) ? reminder.marks : [];
  return arr.includes(code);
};

const toggleMark = async (reminder, code) => {
  if (!reminder?._id) return;

  const id = String(reminder._id);
  if (isUpdating(id)) return;

  const current = Array.isArray(reminder?.marks) ? [...reminder.marks] : [];
  const exists = current.includes(code);

  const nextMarks = exists
    ? current.filter((x) => x !== code)
    : [...current, code];

  updatingIds.value.add(id);

  try {
    const resp = await methodsHttp.putApi(`reminders/updateReminder/${id}`, {
      marks: nextMarks,
      isMarks: true, // <-- bandera sugerida (ajústala si tu backend usa otro nombre)
    });

    if (resp?.ok) {
      notify.value?.showNotifyGood("Cita actualizada correctamente");
      props.getReminders?.(); // refresca tabla
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al actualizar checkmarks");
    console.error("Error en toggleMark:", error);
  } finally {
    updatingIds.value.delete(id);
  }
};
</script>

<style scoped>
.table-title {
  border-radius: 10px 10px 0 0;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e6e6e6;
  border-top: 0;
  border-radius: 0 0 10px 10px;
  background: white;
}

.q-table-style {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.q-table-style th,
.q-table-style td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.q-table-style thead th {
  white-space: nowrap;
}

.table-row:hover {
  background: #f7f9ff !important;
}

/* Celda de marcas: ancho mínimo y wrap real */
.marks-cell {
  min-width: 260px; /* ajusta si quieres más ancho */
  white-space: normal !important;
  padding: 8px;
}

/* ✅ Grid 3xN */
.marks-wrap {
  display: grid;
  grid-template-columns: repeat(3, max-content); /* 3 chips por fila */
  gap: 6px 8px; /* row-gap col-gap */
  justify-content: center; /* centra el bloque de chips */
  align-items: center;
}

/* Para que los chips queden uniformes y no "salten" */
.mark-chip {
  margin: 0;
  justify-self: center;
  min-width: 74px; /* para que se vean parejos */
  justify-content: center;
}

.mark-label {
  font-weight: 700;
  letter-spacing: 0.2px;
}
</style>
