<template>
  <div class="bg-white">
    <q-table
      :loading="props.tableLoading"
      flat
      bordered
      row-key="_id"
      :rows="props.rows"
      :columns="columns.columnsRemindersWithDate()"
      hide-pagination
      :rows-per-page-options="[10]"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="marks" :props="props" class="marks-cell">
            <div class="marks-grid">
              <q-chip
                v-for="m in MARKS"
                :key="m.code"
                clickable
                dense
                :disable="isUpdating(props.row?._id)"
                :outline="!hasMark(props.row, m.code)"
                :color="hasMark(props.row, m.code) ? m.color : 'grey-7'"
                :text-color="hasMark(props.row, m.code) ? 'white' : 'grey-8'"
                class="mark-chip cursor-pointer"
                @click="onMarkClick(props.row, m)"
              >
                <q-icon :name="m.icon" size="16px" class="q-mr-xs" />
                {{ m.short }}
                <q-tooltip>
                  <template v-if="m.onlyManager && !canMarkCrystal">
                    Solo managers pueden marcar esto
                  </template>
                  <template v-else>
                    {{ m.label }}
                    {{
                      hasMark(props.row, m.code)
                        ? " (click para quitar)"
                        : " (click para marcar)"
                    }}
                  </template>
                </q-tooltip>
              </q-chip>
            </div>
          </q-td>

          <q-td key="actions" :props="props">
            <div class="row col-12">
              <q-btn
                v-if="props.row.marks.includes('CITA_CRISTAL')"
                class="col-6"
                flat
                dense
                round
                icon="diamond"
                color="primary"
                @click="viewCrystalNote(props.row)"
              >
                <q-tooltip>Ver nota cita cristal</q-tooltip>
              </q-btn>

              <q-btn
                class="col-6"
                flat
                dense
                round
                icon="event_repeat"
                color="amber-8"
                @click="recoordinateAppointment(props.row)"
              >
                <q-tooltip>Recoordinar</q-tooltip>
              </q-btn>

              <q-btn
                class="col-6"
                flat
                dense
                round
                icon="edit"
                color="primary"
                @click="openModalEdit(props.row)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn
                class="col-6"
                flat
                dense
                round
                icon="delete"
                color="negative"
                @click="openModalDelete(props.row)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </div>
          </q-td>

          <q-td key="name" :props="props" style="cursor: pointer">
            {{ props.row?.user?.name }}
          </q-td>

          <q-td key="name" :props="props">
            {{ props.row?.comercial?.MemberFullname }}
          </q-td>

          <q-td key="name" :props="props">
            {{ props.row?.comercial?.memberIdentificationNumber }}
          </q-td>

          <q-td key="name" :props="props">
            {{ props.row?.date }}
          </q-td>

          <q-td key="name" :props="props">
            {{ props.row?.hour }}
          </q-td>

          <q-td key="name" :props="props">
            {{ props.row?.zone?.name }}
          </q-td>

          <q-td key="name" :props="props">
            {{ props.row?.reminderType?.name }}
          </q-td>

          <!-- <q-td key="name" :props="props">
              <q-select
                v-model="props.row.status"
                :options="statusOptions"
                option-label="name"
                option-value="_id"
                @update:model-value="
                  (item) => changeStatus(props.row._id, item, true)
                "
                dense
                outlined
                :style="getBackgroundColor(props.row.status)"
              />
            </q-td> -->
        </q-tr>
      </template>
    </q-table>

    <CreateAppointmentsModal
      :v-model="openModalAppoitment"
      :openModal="openModalAppoitment"
      :reminderData="reminderData"
      @update:openModal="openModalAppoitment = $event"
      :editMode="editMode"
      :getPatientHistory="props.getPatientHistory"
      @update:editMode="editMode = $event"
      :comercial="comercial"
      :getReminders="props.getReminders"
      :isRescheduled="isRescheduled"
      :rescheduledFromId="rescheduledFromId"
    />

    <q-dialog v-model="openViewCrystalNote">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section class="bg-purple text-white row items-center">
          <div class="text-h6">Nota de “Cita de cristal”</div>
          <q-space />
          <q-btn flat dense round icon="close" color="white" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-body1" style="white-space: pre-wrap">
            {{ crystalNoteToView || "—" }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="openCrystalNote" persistent>
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section class="bg-purple text-white">
          <div class="text-h6">Nota para “Cita de cristal”</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="crystalNote"
            type="textarea"
            autogrow
            outlined
            label="Escribe la nota"
            :error="crystalNoteError"
            error-message="La nota es requerida (mínimo 3 caracteres)."
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancelar"
            color="grey-8"
            @click="closeCrystalDialog"
          />
          <q-btn
            unelevated
            label="Guardar"
            color="purple"
            :loading="savingCrystal"
            @click="saveCrystalNote"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
    <Delete
      ref="deleteInfo"
      @deleteGood="props.getPatientHistory(comercial?._id)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ActionsButtons from "src/components/table/ActionsButtons.vue";
import CreateAppointmentsModal from "../asignments/CreateAppointmentsModal.vue";
import { MARKS } from "src/data/appointmentMarks";
import { authStore } from "src/stores/auth-store";

const auth = authStore();
const notify = ref(null);
const deleteInfo = ref(null);
const statusOptions = ref([]);
const statusOptionsCompleted = ref([]);
const openModalAppoitment = ref(false);
const comercial = ref(null);
const reminderData = ref(null);
const editMode = ref(false);

const isManager = computed(() => {
  const role = auth?.user?.rol?.code;

  return (
    auth?.user?.isManager === true || role === "ADMIN" || role === "SUPERADMIN"
  );
});
const isRescheduled = ref(false);
const rescheduledFromId = ref(null);

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  tableLoading: {
    type: Boolean,
    required: true,
  },
  getPatientHistory: {
    type: Function,
    required: false,
  },
  isHistory: {
    type: Boolean,
    required: false,
    default: false,
  },
  getReminders: {
    type: Function,
    required: false,
  },
});

const openCrystalNote = ref(false);
const crystalNote = ref("");
const crystalNoteError = ref(false)
const crystalRowId = ref(null);
const crystalRowComercial = ref(null);
const savingCrystal = ref(false);

const canMarkCrystal = computed(() => {
  const role = auth?.user?.rol?.code;
  return auth?.user?.isManager || ["ADMIN", "SUPERADMIN"].includes(role);
});

onMounted(() => {
  getStatus();
});

const openModalEdit = (item) => {
  comercial.value = item.comercial;
  openModalAppoitment.value = true;
  editMode.value = true;

  isRescheduled.value = false;
  rescheduledFromId.value = null;
  reminderData.value = { ...item };
};

const recoordinateAppointment = (row) => {
  openModalAppoitment.value = true;
  comercial.value = row.comercial;

  // ✅ modo crear (no editar)
  editMode.value = false;

  // ✅ marcar que viene por recoordinación
  isRescheduled.value = true;
  rescheduledFromId.value = row?._id ? String(row._id) : null;

  // ✅ prellenar con la cita actual (sin depender del _id para crear)
  reminderData.value = {
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

const getStatus = async () => {
  const resp = await methodsHttp.getApi(`status/getReminderStatus`);
  if (resp.ok) {
    statusOptions.value = resp.status;
    statusOptionsCompleted.value = resp.statusCompleted;
  }
};

const closeCrystalDialog = () => {
  openCrystalNote.value = false;
  crystalNote.value = "";
  crystalRowId.value = null;
  crystalRowComercial.value = null
};

const openCrystalDialog = (row) => {
  crystalRowId.value = row?._id ? String(row._id) : null;
  crystalRowComercial.value = row?.comercial._id ? String(row?.comercial._id) : null
  crystalNote.value = ""; // si quieres prellenar: row.noteWroteByOperator || ""
  openCrystalNote.value = true;
};

const openViewCrystalNote = ref(false);
const crystalNoteToView = ref("");

const viewCrystalNote = (row) => {
  const note = String(row?.noteWroteByOperator || "").trim();

  if (!note) {
    notify.value?.showNotifyBad("Esta cita no tiene nota de cristal.");
    return;
  }

  crystalNoteToView.value = note;
  openViewCrystalNote.value = true;
};

const updatingIds = ref(new Set());
const isUpdating = (id) => updatingIds.value.has(String(id));

const hasMark = (row, code) => {
  const arr = Array.isArray(row?.marks) ? row.marks : [];
  return arr.includes(code);
};

// ✅ Click handler central
const onMarkClick = async (row, mark) => {
  const id = row?._id;
  if (!id) return;

  // bloquear si solo manager
  // if (mark?.onlyManager && !canMarkCrystal.value) return;
  // console.log(mark?.onlyManager && !canMarkCrystal.value);

  const enabled = !hasMark(row, mark.code);

  // ✅ si requiere nota y se está habilitando => abrir modal
  if (mark?.requiresNote && enabled) {
    openCrystalDialog(row);
    return;
  }

  // si no requiere nota (o se está quitando), sigue normal
  await toggleMark(row, mark.code);
};

const toggleMark = async (row, code, extraPayload = {}) => {
  const id = row?._id;
  if (!id) return;

  const rowId = String(id);
  if (isUpdating(rowId)) return;

  const enabled = !hasMark(row, code);
  updatingIds.value.add(rowId);

  try {
    const resp = await methodsHttp.putApi(`reminders/updateReminder/${rowId}`, {
      markCode: code,
      enabled,
      isMarks: true,
      ...extraPayload,
    });

    if (resp?.ok) {
      notify.value?.showNotifyGood("Cita actualizada correctamente");
      props.getReminders?.();
      props.getPatientHistory?.(row?.comercial?._id);
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (e) {
    console.error(e);
    notify.value?.showNotifyBad("Error al actualizar checkmarks");
  } finally {
    updatingIds.value.delete(rowId);
  }
};

// ✅ Guardar nota y marcar “cristal”
const saveCrystalNote = async () => {
      crystalNoteError.value = false
  const id = crystalRowId.value;
  if (!id && !crystalRowComercial.value) return;

  const note = (crystalNote.value || "").trim();
  if (note.length < 3) {
    crystalNoteError.value = true
    return
  } 

  savingCrystal.value = true;

  try {
    // aquí asumimos que el mark code es CRISTAL (ajusta si tu code es otro)
    const resp = await methodsHttp.putApi(`reminders/updateReminder/${id}`, {
      markCode: "CITA_CRISTAL",
      enabled: true,
      isMarks: true,
      noteWroteByOperator: note, // ✅ guardar nota
    });

    if (resp?.ok) {
      notify.value?.showNotifyGood("Cita marcada como cristal + nota guardada");
      closeCrystalDialog();
      props.getReminders?.();
      props.getPatientHistory?.(crystalRowComercial.value);
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (e) {
    console.error(e);
    notify.value?.showNotifyBad("Error al guardar nota de cristal");
  } finally {
    savingCrystal.value = false;
  }
};
</script>

<style scoped>
.marks-cell {
  min-width: 260px;
  white-space: normal !important;
}

.marks-grid {
  display: grid;
  grid-template-columns: repeat(3, max-content); /* ✅ 3 por fila */
  gap: 6px 8px;
  justify-content: center;
}

.mark-chip {
  margin: 0;
  min-width: 74px;
  justify-content: center;
}
</style>
