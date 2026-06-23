<template>
  <q-dialog
    v-model="modalOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="responsive-card">
      <q-inner-loading
        :showing="isLoading"
        label="Enviando..."
        label-class="text-blue-11"
        label-style="font-size: 1.1em"
      />
      <div class="bg-white row justify-between q-pa-md">
        <div class="text-primary" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <q-icon
              class="col-1"
              name="delete"
              size="40px"
              color="red"
              style="cursor: pointer"
              @click="openModalDelete = true"
            />
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="task" color="primary" />
            </div>
            <div class="col-auto text-primary">
              <b>ASIGNACIONES</b>
            </div>

            <div
              v-if="comercialData?.isManual"
              class="q-ml-sm row items-center"
            >
              <label class="text-grey-7">
                <b> (MANUAL) </b>
              </label>
            </div>

            <div
              v-if="comercialData?.isFederal"
              class="q-ml-sm row items-center"
            >
              <label class="text-green">
                <b> FEDERAL </b>
              </label>
              <q-icon name="check" class="text-green" size="30px" />
            </div>
          </div>
        </div>
        <span
          class="material-icons text-negative"
          style="font-size: 23px; cursor: pointer"
          @click="closeModal()"
        >
          cancel
        </span>
      </div>

      <q-card-section class="q-pt-sm row">
        <div class="col-12 col-md-7 column q-gutter-y-sm">
          <div class="row items-start q-col-gutter-sm">
            <div class="col-12 col-md-4">
              <q-select
                v-model="status"
                option-value="code"
                option-label="name"
                outlined
                dense
                color="primary"
                :options="statusArray"
                emit-value
                map-options
              />
            </div>

            <div class="col-12 col-md-3">
              <q-btn
                style="width: 100%"
                type="submit"
                color="primary"
                label="GUARDAR"
                icon="save"
                dense
                @click="changeStatus"
              />
            </div>

            <div class="col-12 col-md-3">
              <q-btn
                style="width: 100%"
                type="submit"
                color="primary"
                label="CREAR CITA"
                icon="task"
                dense
                @click="openModalAppoitmnetFunct"
              />
            </div>

            <div class="col-12 col-md-2 row">
              <q-icon
                class="col-3"
                name="history"
                size="30px"
                color="primary"
                style="cursor: pointer"
                :onClick="openModalHistoryFunct"
              />
              <q-icon
                class="col-4"
                name="person"
                size="30px"
                color="primary"
                style="cursor: pointer"
                :onClick="openModalRelationshiFunct"
              />
              <q-icon
                class="col-4"
                name="edit"
                size="30px"
                color="primary"
                style="cursor: pointer"
                @click="openEditModal"
              />
            </div>
          </div>

          <!-- Last appointment -->
          <div class="row" v-if="lastAppoitment != null">
            <div
              class="col-12 col-sm-8 col-md-7 q-pa-sm"
              style="border: 1.2px dashed #007ec4; border-radius: 5px"
            >
              <label>
                <b> CITA RECIENTE </b>
              </label>

              <div class="col-12 row q-col-gutter-sm q-mt-xs">
                <div class="col-12 col-md-6">
                  <span><b>Fecha: </b>{{ lastAppoitment?.date }}</span>
                </div>

                <div class="col-12 col-md-6">
                  <span><b>Lugar: </b>{{ lastAppoitment?.zone?.name }}</span>
                </div>

                <div class="col-12 col-md-6">
                  <span><b>Hora: </b>{{ lastAppoitment?.hour }}</span>
                </div>

                <div class="col-12 col-md-6">
                  <span
                    ><b>Confirmación: </b
                    >{{ lastAppoitment?.status?.name }}</span
                  >
                </div>

                <div class="col-12 col-md-6">
                  <span
                    ><b>Operadora: </b>{{ lastAppoitment?.user?.name }}</span
                  >
                </div>

                <div class="col-12 col-md-6">
                  <span
                    ><b>Calendarizada el: </b
                    >{{
                      moment(lastAppoitment?.createdByOperatorDate).format("LL")
                    }}</span
                  >
                </div>

                <div class="col-12 col-md-6">
                  <span
                    ><b>Estado: </b
                    >{{ lastAppoitment?.statusCompleted?.name ?? "-" }}</span
                  >
                </div>

                <!-- 
                                    <div class="column">
                                        <span><b>Fecha: </b>2024-01-01</span>
                                        <span><b>Hora: </b>12:00 PM</span>
                                        <span><b>Hecho por: </b>Karen Caminero</span>
                                        <span><b>Lugar: </b>Mayagüez</span>
                                        <span><b>Confirmación: </b>Confirmado</span>
                                        <span><b>Estado: </b>No asistió</span>
                                    </div> -->
              </div>
            </div>
          </div>

          <div
            class="row q-col-gutter-sm q-mt-md"
            :class="lastAppoitment ? 'col-6' : 'col-10'"
            style="overflow-y: scroll"
          >
            <!-- 
                            <div class="col-12 col-md-4">
                                <label class="text-primary">
                                    <b>
                                        COMENTARIOS ADICIONALES
                                    </b>
                                </label>
                                <p>
                                    {{ comercialData?.ComentariosAdicionales }}
                                </p>
                            </div> -->

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> NUMERO DE IDENTIFICACIÓN DEL MIEMBRO </b>
              </label>
              <p>
                {{ comercialData?.memberIdentificationNumber }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> NOMBRE COMPLETO DEL MIEMBRO </b>
              </label>
              <p>
                {{ comercialData?.MemberFullname }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> CODIGO DE LA EMPRESA </b>
              </label>
              <p>
                {{ comercialData?.CompanyCode }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> RELACIÓN </b>
              </label>
              <p>
                {{ comercialData?.Relationship }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> COMPAÑIA </b>
              </label>
              <p>
                {{ comercialData?.Company }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> NUMERO DE GRUPO </b>
              </label>
              <p>
                {{ comercialData?.GroupNumber }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> GENERO </b>
              </label>
              <p>
                {{ comercialData?.Gender }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> TIPO DE INSCRIPCIÓN </b>
              </label>
              <p>
                {{ comercialData?.enrollType }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> NOMBRE DEL GRUPO </b>
              </label>
              <p>
                {{ comercialData?.GroupName }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> EDAD ACTUAL </b>
              </label>
              <p>
                {{ comercialData?.CurrentAge }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> FECHA DE NACIMIENTO </b>
              </label>
              <p>
                {{ comercialData?.BirthDate }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> DIRECCIÓN FISICA CIUDAD </b>
              </label>
              <p>
                {{ comercialData?.PhysicalAddressCity }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> ESTADO DE DIRECCIÓN FISICA </b>
              </label>
              <p>
                {{ comercialData?.PhysicalAddressState }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> DIRECCIÓN FISICA CODIGO POSTAL </b>
              </label>
              <p>
                {{ comercialData?.PhysicalAddressZipCode }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> TELEFONO DE CASA </b>
              </label>
              <p>
                {{ comercialData?.HomePhone }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> TELEFONO ALTERNATIVO </b>
              </label>
              <p>
                {{ comercialData?.AlternatePhone }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> 12348395592 </b>
              </label>
              <p>
                {{ comercialData?.N12348395592 }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> COMENTARIOS </b>
              </label>
              <p>
                {{ comercialData?.Comentarios }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> CORREO </b>
              </label>
              <p>
                {{ comercialData?.Email }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> SEGUNDO INTENTO DE CONTACTO </b>
              </label>
              <p>
                {{ comercialData?.Segundo_intento_de_contacto }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> COMENTARIOS 2 </b>
              </label>
              <p>
                {{ comercialData?.Comentarios2 }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> TERCER INTENTO DE CONTACTO </b>
              </label>
              <p>
                {{ comercialData?.Tercer_intento_de_contacto }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> COMENTARIOS 3 </b>
              </label>
              <p>
                {{ comercialData?.Comentarios3 }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> FECHA DE CITA </b>
              </label>
              <p>
                {{ comercialData?.FECHA_DE_CITA }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> CBP </b>
              </label>
              <p>
                {{ comercialData?.CBP }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> A1C </b>
              </label>
              <p>
                {{ comercialData?.A1C }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> BCS </b>
              </label>
              <p>
                {{ comercialData?.BCS }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> CCS </b>
              </label>
              <p>
                {{ comercialData?.CCS }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> COL </b>
              </label>
              <p>
                {{ comercialData?.COL }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> EXAMEN DE LOS OJOS </b>
              </label>
              <p>
                {{ comercialData?.EYE_EXAM }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> FLU </b>
              </label>
              <p>
                {{ comercialData?.FLU }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> CCP </b>
              </label>
              <p>
                {{ comercialData?.CCP }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> HERPES Z NUM </b>
              </label>
              <p>
                {{ comercialData?.HerpesZ_Num }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> LAST DOS HERPES Z </b>
              </label>
              <p>
                {{ comercialData?.LastDOS_HerpesZ }}
              </p>
            </div>

            <div class="col-12 col-md-4">
              <label class="text-primary">
                <b> TETANO NUMERO </b>
              </label>
              <p>
                {{ comercialData?.Tetano_Num }}
              </p>
            </div>
          </div>
        </div>

        <q-card
          flat
          bordered
          class="bg-grey-1 q-pa-md col-12 col-md-5"
          style="
            border-radius: 8px;
            max-height: calc(100vh - 160px);
            display: flex;
            flex-direction: column;
          "
        >
          <q-tabs
            v-model="tab"
            dense
            class="text-primary"
            active-color="primary"
            indicator-color="primary"
            align="justify"
          >
            <q-tab name="adicionales" icon="note_add" label="Adicionales" />
            <q-tab name="comentarios" icon="comment" label="Comentarios" />
          </q-tabs>

          <q-separator />

          <q-tab-panels
            v-model="tab"
            animated
            class="q-mt-md"
            style="flex: 1; overflow: hidden"
          >
            <!-- Panel de Comentarios Adicionales -->
            <q-tab-panel
              name="adicionales"
              class="q-pa-none column"
              style="height: 100%"
            >
              <q-input
                v-model="formComment.comment"
                type="textarea"
                outlined
                dense
                label="Nota"
                color="primary"
                class="q-mb-sm"
              />

              <q-btn
                label="Enviar"
                color="primary"
                icon="send"
                class="full-width q-mb-sm"
                @click="createComercialAdditionalComments"
                :disable="formComment.comment === ''"
              />

              <q-scroll-area class="q-mt-sm" style="flex: 1">
                <div
                  v-if="additionalComments.length === 0"
                  class="text-center text-grey q-mt-md"
                >
                  No hay comentarios
                </div>

                <q-card
                  v-for="(item, index) in additionalComments"
                  :key="index"
                  flat
                  bordered
                  class="q-mb-sm bg-grey-3"
                >
                  <q-card-section class="row items-center">
                    <q-avatar>
                      <img
                        :src="
                          item.user.img ||
                          'https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp'
                        "
                      />
                    </q-avatar>
                    <div class="column q-ml-sm">
                      <div class="text-bold text-primary text-uppercase">
                        {{ item.user.name }}
                      </div>
                      <div class="text-caption">
                        {{ `${item.date} - ${item.hour}` }}
                      </div>
                    </div>
                  </q-card-section>
                  <q-separator inset />
                  <q-card-section>{{ item.comment }}</q-card-section>
                </q-card>
              </q-scroll-area>
            </q-tab-panel>

            <!-- Panel de Comentarios -->
            <q-tab-panel
              name="comentarios"
              class="q-pa-none column"
              style="height: 100%"
            >
              <q-select
                v-model="form.typeComment"
                option-value="code"
                option-label="name"
                :options="commentsArray"
                emit-value
                map-options
                outlined
                dense
                label="Opciones"
                color="primary"
                class="q-mb-sm"
              />

              <q-btn
                label="Enviar"
                color="primary"
                icon="send"
                class="full-width q-mb-sm"
                @click="createComment"
                :disable="!form.typeComment"
              />

              <q-scroll-area class="q-mt-sm" style="flex: 1">
                <div
                  v-if="comments.length === 0"
                  class="text-center text-grey q-mt-md"
                >
                  No hay comentarios
                </div>

                <q-card
                  v-for="(item, index) in comments"
                  :key="index"
                  flat
                  bordered
                  class="q-mb-sm bg-grey-3"
                >
                  <q-card-section class="row items-center">
                    <q-avatar>
                      <img
                        :src="
                          item.user.img ||
                          'https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp'
                        "
                      />
                    </q-avatar>
                    <div class="column q-ml-sm">
                      <div class="text-bold text-primary text-uppercase">
                        {{ item.user.name }}
                      </div>
                      <div class="text-caption">
                        {{ `${item.date} - ${item.hour}` }}
                      </div>
                    </div>
                  </q-card-section>
                  <q-separator inset />
                  <q-card-section>
                    <span>{{ item?.typeComment?.name }}</span>
                  </q-card-section>
                </q-card>
              </q-scroll-area>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </q-card-section>
    </q-card>
  </q-dialog>

  <PatientHistoryModal
    :v-model="openModalHistory"
    :openModal="openModalHistory"
    :id="props?.comercial?._id ?? NULL"
    @update:openModal="openModalHistory = $event"
  />

  <CreateAppointmentsModal
    :v-model="openModalAppoitment"
    :openModal="openModalAppoitment"
    :comercial="props?.comercial"
    @update:openModal="openModalAppoitment = $event"
    :editMode="editMode"
    @update:editMode="editMode"
    :isRescheduled="isRescheduled"
  />

  <RelationshipModal
    :v-model="openModalRelationship"
    :openModal="openModalRelationship"
    :comercial="props.comercial"
    @update:openModal="openModalRelationship = $event"
  />

  <ChatModal
    :v-model="openModalChat"
    :openModal="openModalChat"
    @update:openModal="openModalChat = $event"
    :comercial="props.comercial"
  />

  <CreateIndividualComercial
    v-model="openModalEdit"
    :isEdit="true"
    :editData="props.comercial"
    @refresh="handleUpdatedPatient"
  />

  <CreateReportModal
    v-model="showCreateReportModal"
    :openModal="showCreateReportModal"
  />

  <q-dialog v-model="openModalDelete" persistent>
    <q-card class="q-pa-md" style="min-width: 300px">
      <q-card-section class="text-h6">¿Eliminar paciente?</q-card-section>
      <q-card-section>
        Esta acción no se puede deshacer. ¿Estás seguro de que deseas continuar?
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" color="primary" v-close-popup />
        <q-btn
          flat
          label="Eliminar"
          color="negative"
          :loading="isDeleting"
          @click="deleteComercial(comercialData?._id)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <NotificationsVue ref="notify" />
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import PatientHistoryModal from "./PatientHistoryModal.vue";
import CreateAppointmentsModal from "./CreateAppointmentsModal.vue";
import RelationshipModal from "./RelationshipModal.vue";
import ChatModal from "../chats/ChatModal.vue";
import { defineProps, defineEmits, ref, watch, onMounted, computed } from "vue";
import { authStore } from "src/stores/auth-store";
import moment from "moment";
import "moment/dist/locale/es";
import CreateIndividualComercial from "../comertials/CreateIndividualComercial.vue";
import CreateReportModal from "../comertials/CreateReportModal.vue";
moment.locale("es");

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true,
  },
  comercial: {
    type: Object,
    required: false,
    default: null,
  },
  getComercial: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(["update:openModal"]);

const auth = authStore();
const notify = ref(null);
const isLoading = ref(false);

const isRescheduled = ref(false);
const openModalHistory = ref(false);
const openModalAppoitment = ref(false);
const openModalRelationship = ref(false);
const openModalChat = ref(false);
const openModalEdit = ref(false);
const openModalDelete = ref(false);
const showCreateReportModal = ref(false);

const modalOpen = ref(props.openModal);

const statusArray = ref([]);
const status = ref(null);
const commentsArray = ref([]);
const lastAppoitment = ref(null);
const editMode = ref(false);
const tab = ref("adicionales");

const comercialData = ref(null);

const comercialView = computed(
  () => comercialData.value || props.comercial || {},
);
const comments = computed(() => comercialData.value?.comments || []);
const additionalComments = computed(
  () => comercialData.value?.additionalComments || [],
);

const form = ref({
  user: auth.user._id,
  typeComment: null,
});

const formComment = ref({
  comment: "",
  user: auth.user._id,
});

onMounted(() => {
  getStatus();
  getTypeComercialComments();
});

const openModalRelationshiFunct = () => {
  openModalRelationship.value = true;
};

const openModalHistoryFunct = () => {
  openModalHistory.value = true;
};

const openModalAppoitmnetFunct = () => {
  openModalAppoitment.value = true;
};

const openEditModal = () => {
  openModalEdit.value = true;
};

const getStatus = async () => {
  const resp = await methodsHttp.getApi(`status/getStatus`);
  if (resp.ok) {
    statusArray.value = resp.status;
  }
};

const getTypeComercialComments = async () => {
  const resp = await methodsHttp.getApi(`comercial/getTypeComercialComments`);
  if (resp.ok) {
    commentsArray.value = resp.typeComments;
  }
};

const getComercialById = async (id) => {
  try {
    if (!id) return;

    const resp = await methodsHttp.getApi(`comercial/getComercialById/${id}`);

    if (resp.ok) {
      comercialData.value = resp.comercial;
      status.value = resp.comercial?.status?.code || null;
    } else {
      comercialData.value = null;
      status.value = null;
      notify.value?.showNotifyBad(
        resp?.mensaje || "No se pudo cargar el comercial",
      );
    }
  } catch (error) {
    comercialData.value = null;
    status.value = null;
    notify.value?.showNotifyBad("Error al cargar el comercial");
    console.error("Error al obtener comercial por id:", error);
  }
};

const changeStatus = async () => {
  try {
    isLoading.value = true;

    const resp = await methodsHttp.putApi(
      `comercial/changeStatusComercial/${comercialView.value?._id}`,
      { code: status.value },
    );

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      await getComercialById(comercialView.value?._id);
      props?.getComercial();
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al cambiar estado");
    console.error("Error en la operación save:", error);
  } finally {
    isLoading.value = false;
  }
};

const createComment = async () => {
  try {
    isLoading.value = true;

    const resp = await methodsHttp.postApi(
      `comercial/createComercialComments/${comercialView.value?._id}`,
      { ...form.value },
    );

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      form.value.typeComment = null;
      await getComercialById(comercialView.value?._id);
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al crear comentario");
    console.error("Error en createComment:", error);
  } finally {
    isLoading.value = false;
  }
};

const createComercialAdditionalComments = async () => {
  try {
    isLoading.value = true;

    const resp = await methodsHttp.postApi(
      `comercial/createComercialAdditionalComments/${comercialView.value?._id}`,
      { ...formComment.value },
    );

    if (resp?.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      formComment.value.comment = "";
      await getComercialById(comercialView.value?._id);
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al crear comentario adicional");
    console.error("Error en createComercialAdditionalComments:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleUpdatedPatient = async (updatedData) => {
  comercialData.value = {
    ...(comercialData.value || {}),
    ...updatedData,
  };

  notify.value?.showNotifyGood("Datos del paciente actualizados.");

  if (comercialView.value?._id) {
    await getComercialById(comercialView.value._id);
  }
};

const deleteComercial = async (id) => {
  try {
    isLoading.value = true;

    const resp = await methodsHttp.deleteApi(`comercial/deleteComercial/${id}`);

    if (resp.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      props?.getComercial();
      closeModal();
      openModalDelete.value = false;
    } else {
      notify.value?.showNotifyBad(resp.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al eliminar el comercial");
    console.error("Error al eliminar el comercial:", error);
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  emit("update:openModal", false);
  modalOpen.value = false;
};

watch(
  () => props.openModal,
  (newVal) => {
    modalOpen.value = newVal;
  },
);

watch(
  () => [modalOpen.value, props.comercial?._id],
  async ([isOpen, id]) => {
    emit("update:openModal", isOpen);

    if (isOpen && id) {
      await getComercialById(id);
      await getLastAppoitmentComercial(id);
    }
  },
  { immediate: true },
);

const getLastAppoitmentComercial = async (id) => {
  const resp = await methodsHttp.getApi(
    `comercial/getLastAppoitmentComercial/${id}/CONFIRMED`,
  );

  if (resp.ok) {
    lastAppoitment.value = resp.appoitment;
  } else {
    lastAppoitment.value = resp.appoitment;
  }
};
</script>

<style scoped>
.responsive-card {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .responsive-card {
    overflow: scroll;
  }
}
</style>
