<template>
  <!-- modal -->
  <div>
    <q-dialog v-model="openModal" persistent>
      <q-card style="width: 600px; max-width: 80vw">
        <div class="bg-white row justify-between q-pa-md">
          <div class="text-white" style="font-size: 19px; font-weight: 500">
            <div class="row items-center">
              <div class="col-auto q-mx-sm">
                <q-icon size="2em" name="analytics" color="primary" />
              </div>
              <div class="col-auto text-primary">
                <b>{{ editMode ? "EDITAR INPUT" : "CREAR INPUT" }}</b>
              </div>
            </div>

            <!-- groups -->
          </div>
          <span
            class="material-icons text-negative"
            style="font-size: 23px; cursor: pointer"
            @click="
              openModal = false;
              clear();
              props.editMode = false;
            "
          >
            cancel
          </span>
        </div>

        <q-card-section class="q-pt-sm">
          <div class="q-pt-sm row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b> NOMBRE </b>
              </label>
              <q-input outlined dense color="primary" v-model="form.name">
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b> LABEL </b>
              </label>
              <q-input outlined dense color="primary" v-model="form.label">
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b> PLACEHOLDER </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.placeholder"
              >
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b> TIPO DE INPUT </b>
              </label>
              <q-select
                v-model="form.typeOfForm"
                use-input
                option-label="name"
                outlined
                color="primary"
                :options="typeOfForm"
                emit-value
                map-options
                dense
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div
              class="col-12 col-md-6"
              v-if="
                form.typeOfForm.code == 'TEXT' ||
                form.typeOfForm.code == 'TEXTAREA'
              "
            >
              <label>
                <b> MIN LENGTH </b>
              </label>
              <q-input outlined dense color="primary" v-model="form.minLength">
              </q-input>
            </div>

            <div
              class="col-12 col-md-6"
              v-if="
                form.typeOfForm.code == 'TEXT' ||
                form.typeOfForm.code == 'TEXTAREA'
              "
            >
              <label>
                <b> MAX LENGTH </b>
              </label>
              <q-input outlined dense color="primary" v-model="form.maxLength">
              </q-input>
            </div>

            <div class="col-12">
              <label>
                <b> HELPER TEXT </b>
              </label>
              <q-input outlined dense color="primary" v-model="form.helperText">
              </q-input>
            </div>

            <div class="col-12" v-if="form.typeOfForm.code == 'VIDEO'">
              <label>
                <b> YOUTUBE LINK </b>
              </label>
              <q-input outlined dense color="primary" v-model="form.url">
              </q-input>
            </div>

            <div class="col-12">
              <label>
                <b> <b class="text-negative">* </b> DESCRIPCION </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                type="textarea"
                v-model="form.description"
              >
              </q-input>
            </div>

            <div class="col-12" v-if="form.typeOfForm.code == 'HTML'">
              <label>
                <b> <b class="text-negative">* </b> TEXTO EN HTML </b>
              </label>
              <q-editor
                v-model="form.content"
                :dense="$q.screen.lt.md"
                :toolbar="[
                  [
                    {
                      label: $q.lang.editor.align,
                      icon: $q.iconSet.editor.align,
                      fixedLabel: true,
                      list: 'only-icons',
                      options: ['left', 'center', 'right', 'justify'],
                    },
                    {
                      label: $q.lang.editor.align,
                      icon: $q.iconSet.editor.align,
                      fixedLabel: true,
                      options: ['left', 'center', 'right', 'justify'],
                    },
                  ],
                  [
                    'bold',
                    'italic',
                    'strike',
                    'underline',
                    'subscript',
                    'superscript',
                  ],
                  ['token', 'hr', 'link', 'custom_btn'],
                  ['print', 'fullscreen'],
                  [
                    {
                      label: $q.lang.editor.formatting,
                      icon: $q.iconSet.editor.formatting,
                      list: 'no-icons',
                      options: [
                        'p',
                        'h1',
                        'h2',
                        'h3',
                        'h4',
                        'h5',
                        'h6',
                        'code',
                      ],
                    },
                    {
                      label: $q.lang.editor.fontSize,
                      icon: $q.iconSet.editor.fontSize,
                      fixedLabel: true,
                      fixedIcon: true,
                      list: 'no-icons',
                      options: [
                        'size-1',
                        'size-2',
                        'size-3',
                        'size-4',
                        'size-5',
                        'size-6',
                        'size-7',
                      ],
                    },
                    {
                      label: $q.lang.editor.defaultFont,
                      icon: $q.iconSet.editor.font,
                      fixedIcon: true,
                      list: 'no-icons',
                      options: [
                        'default_font',
                        'arial',
                        'arial_black',
                        'comic_sans',
                        'courier_new',
                        'impact',
                        'lucida_grande',
                        'times_new_roman',
                        'verdana',
                      ],
                    },
                    'removeFormat',
                  ],
                  ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

                  ['undo', 'redo'],
                  ['viewsource'],
                ]"
                :fonts="{
                  arial: 'Arial',
                  arial_black: 'Arial Black',
                  comic_sans: 'Comic Sans MS',
                  courier_new: 'Courier New',
                  impact: 'Impact',
                  lucida_grande: 'Lucida Grande',
                  times_new_roman: 'Times New Roman',
                  verdana: 'Verdana',
                }"
              />
            </div>

            <div
              class="col-12"
              v-if="['RADIO', 'CHECKBOX', 'HTML'].includes(form.typeOfForm.code)"
            >
              <label>
                <b> OPCIONES </b>
              </label>
              <q-input
                v-model="optionsInput"
                outlined
                dense
                color="primary"
                placeholder="Añadir opción y presionar Enter"
                @keyup.enter="addOption(optionsInput)"
              >
                <template v-slot:append>
                  <q-btn flat round icon="add" @click="addOption" />
                </template>
              </q-input>

              <q-chip
                class="q-mt-sm"
                v-for="(option, index) in form.options"
                :key="index"
                removable
                @remove="form.options.splice(index, 1)"
              >
                {{ option.label }}
              </q-chip>
            </div>

            <div
              class="col-12"
              v-if="['RADIO', 'CHECKBOX', 'HTML'].includes(form.typeOfForm.code)"
            >
              <div
                v-for="(opt, index) in form.options"
                :key="index"
                class="row q-col-gutter-sm q-mb-sm"
              >
                <div class="col-4">
                  <q-input
                    v-model="opt.label"
                    label="Nombre de la opción"
                    dense
                    outlined
                  />
                </div>
                <div class="col-4">
                  <q-input v-model="opt.value" label="Valor" dense outlined />
                </div>
                <div class="col-3">
                  <q-input
                    v-model.number="opt.price"
                    label="Precio"
                    type="number"
                    dense
                    outlined
                  />
                </div>
                <div class="col-1 flex items-center">
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    round
                    @click="removeOption(index)"
                  />
                </div>
              </div>
            </div>

            <div class="col-12 col-md-4 row q-col-gutter-sm">
              <label class="col-12">
                <b> ES REQUERIDO? </b>
              </label>
              <q-toggle color="blue" v-model="form.required" val="blue" />
            </div>

            <div class="col-12 col-md-4 row q-col-gutter-sm">
              <label class="col-12">
                <b> ACTIVAR INPUT </b>
              </label>
              <q-toggle color="blue" v-model="form.isActived" val="blue" />
            </div>

            <div
              class="col-12 col-md-4 row q-col-gutter-sm"
              v-if="['HTML'].includes(form.typeOfForm.code)"
            >
              <label class="col-12">
                <b> COMPRIMIR EN BOTON? </b>
              </label>
              <q-toggle color="blue" v-model="form.isCompressed" val="blue" />
            </div>

            <!-- <div class="col-12">
                            <label>
                                <b>
                                    <b class="text-negative">* </b> SERVICIOS
                                </b>
                            </label>
                            <q-select v-model="form.services" use-input option-value="_id" option-label="name" outlined
                                color="primary" :options="services" emit-value map-options use-chips multiple>
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-grey">
                                            No results
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </div> -->

            <div class="col-12 q-my-sm text-center">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                class="q-mx-sm"
                @click="
                  openModal = false;
                  clear();
                "
              />

              <q-btn
                type="submit"
                color="primary"
                label="guardar"
                icon="save"
                @click="save"
                :disable="
                  form.name == '' ||
                  form.typeOfForm == '' ||
                  //   form.description == '' ||
                  form.typeOfForm == []
                "
              />
            </div>
          </div>
        </q-card-section>

        <q-inner-loading
          :showing="modalLoading"
          label="Please wait..."
          label-class="text-blue-11"
          label-style="font-size: 1.5em"
        />
      </q-card>
    </q-dialog>
  </div>
  <NotificationsVue ref="notify" />
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import methodsHttp from "src/api/methodsHttp";
import { authStore } from "src/stores/auth-store";
import NotificationsVue from "src/components/utils/Notifications.vue";
const auth = authStore();

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true,
  },
  getForm: {
    type: Function,
    required: false,
  },
  formData: {
    type: Object,
    required: true,
  },
  editMode: {
    type: Boolean,
    required: true,
  },
});

const openModal = ref(props.openModal);
const mode = ref(props.mode);

const form = ref({
  name: "",
  label: "",
  placeholder: "",
  typeOfForm: "",
  description: "",
  isActived: false,
  required: false,
  options: [],
  content: "",
  maxLength: null,
  minLength: null,
  helperText: "",
  url: "",
  isCompressed: false,
});
const modalLoading = ref(false);
const notify = ref(null);
const typeOfForm = ref([]);
const services = ref([]);
const optionsInput = ref("");

onMounted(() => {
  getTypeOfForm();
  getServices();
});

const getTypeOfForm = async () => {
  const resp = await methodsHttp.getApi(`services/getTypeOfForm`);

  if (resp.ok) {
    typeOfForm.value = resp.typeOfForm;
  }
};

const getServices = async () => {
  const resp = await methodsHttp.getApi(`services/getServices`);

  if (resp.ok) {
    services.value = resp.services;
  }
};

const addOption = (item) => {
  // const inputValue = optionsInput.value?.trim();
  // if (inputValue) {
  //   form.value.options.push(inputValue);
  //   optionsInput.value = "";
  // }
  form.value.options.push({ label: item, value: null, price: 0 });
  optionsInput.value = "";
};

const removeOption = (index) => {
  form.value.options.splice(index, 1);
};

const save = async () => {
  try {
    modalLoading.value = true;
    if (!props.editMode) {
      let resp = await methodsHttp.postApi("services/createForm", form.value);
      if (resp.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        props.editMode = false;
        props.getForm();
        clear();
      } else {
        notify.value?.showNotifyBad(resp.mensaje);
      }
    } else {
      delete form.value.img;
      let resp = await methodsHttp.putApi(
        `services/updateForm/${props.formData._id}`,
        form.value
      );

      if (resp.ok) {
        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        props.editMode = false;
        props.getForm();
        clear();
      } else {
        notify.value?.showNotifyBad(resp.mensaje);
      }
    }
  } catch (error) {
    console.log(error);
    notify.value?.showNotifyBad("An error has ocurred");
  } finally {
    modalLoading.value = false;
  }
};

const clear = () => {
  form.value._id = null;
  form.value.name = "";
  form.value.typeOfForm = "";
  form.value.description = "";
  form.value.label = "";
  form.value.placeholder = "";
  form.value.isActived = false;
  form.value.required = false;
  form.value.options = [];
  form.value.content = "";
  form.value.helperText = "";
  form.value.maxLength = null;
  form.value.minLength = null;
  form.value.url = "";
  form.value.isCompressed = false;
};

//

const emit = defineEmits(["update:openModal", "update:mode"]);

watch(
  () => props.openModal,
  (newVal) => {
    openModal.value = newVal;
  }
);

// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
  emit("update:openModal", false);
  openModal.value = false;
};

// Observa cambios en openModal para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo
watch(openModal, (newVal) => {
  emit("update:openModal", newVal);
  if (props.editMode) {
    form.value = props.formData;
  }
});
</script>
