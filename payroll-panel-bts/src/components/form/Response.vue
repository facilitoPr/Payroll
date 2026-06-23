<template>
  <div>
    <q-item clickable class="row items-center" @click="ModalActive">
      <div class="col-auto">
        <q-icon name="dns" color="primary" size="25px" />
      </div>
      <div class="q-px-sm col-auto">VER RESPUESTAS</div>
    </q-item>

    <!-- modal -->
    <div>
      <q-dialog
        v-model="openModal"
        persistent
        :maximized="maximizedToggle"
        transition-show="slide-up"
        transition-hide="slide-down"
      >
        <q-card class="bg-primary text-dark bg-white">
          <q-bar class="bg-primary">
            <q-space />
            <q-btn
              dense
              flat
              icon="minimize"
              @click="maximizedToggle = false"
              :disable="!maximizedToggle"
              class="text-white"
            >
              <q-tooltip v-if="maximizedToggle" class="bg-white text-primary"
                >Minimize</q-tooltip
              >
            </q-btn>
            <q-btn
              dense
              flat
              icon="crop_square"
              @click="maximizedToggle = true"
              :disable="maximizedToggle"
              class="text-white"
            >
              <q-tooltip v-if="!maximizedToggle" class="bg-white text-primary"
                >Maximize</q-tooltip
              >
            </q-btn>

            <q-btn dense flat icon="close" v-close-popup class="text-white">
              <q-tooltip class="bg-white text-primary">Close</q-tooltip>
            </q-btn>
          </q-bar>

          <div class="q-px-xl q-mt-sm">
            <div class="col-auto text-bold text-right">
              <small> {{ dateMoment }}</small>
            </div>
            <div class="row items-center">
              <div class="col-auto">
                <q-img
                  src="https://seoclinica.com/wp-content/uploads/2023/01/cropped-Logo-sin-fondo.png"
                  alt=""
                  width="80px"
                  height="80px"
                />
              </div>
              <div
                style="font-size: 18px; text-align: justify"
                class="text-primary col-11"
              >
                {{ data.description }}
              </div>
            </div>

            <div
              style="font-size: 25px; font-weight: bold; text-align: justify"
              class="text-primary"
            >
              <!-- {{ data.description }} -->
              Formulario de control clinico de pacientes
            </div>
          </div>

          <q-card-section class="row q-px-xl">
            <!-- informcaion personal del paciente -->
            <div class="bordere">
              <div
                style="font-weight: bold; font-size: 20px"
                class="text-white text-center bg-primary q-py-xs q-px-md"
              >
                DATOS DEL PACIENTE
              </div>
              <div class="row bordere">
                <div class="col-12 col-md-6 bordere q-py-xs items-center row">
                  <div class="col-auto q-px-md text-bold">
                    Nombre y Apellido
                  </div>
                  <div class="col-auto q-px-md">
                    Osiris ascanio soler Ramirez
                  </div>
                </div>
                <div class="col-12 col-md-3 bordere q-py-xs items-center row">
                  <div class="col-auto q-px-md text-bold">Genero</div>
                  <div class="col-auto q-px-md">
                    <q-radio
                      v-model="shape"
                      size="20px"
                      val="hombre"
                      label="Hombre"
                    />
                    <q-radio
                      v-model="shape"
                      size="20px"
                      val="mujer"
                      label="Mujer"
                    />
                  </div>
                </div>
                <div class="col-12 col-md-3 bordere q-py-xs row">
                  <div class="col-auto q-px-md text-bold">
                    Fecha de nacimiento.
                  </div>
                  <div class="col-auto q-px-md">12/12/1996</div>
                </div>
                <div class="col-12 col-md-3 bordere q-py-xs items-center row">
                  <div class="col-auto q-px-md text-bold">Edad</div>
                  <div class="col-auto q-px-md">35 Años</div>
                </div>

                <div class="col-12 col-md-3 bordere q-py-xs row">
                  <div class="col-auto q-px-md text-bold">
                    Telefono resindencial
                  </div>
                  <div class="col-auto q-px-md">(809)-992-9876</div>
                </div>
                <div class="col-12 col-md-3 bordere q-py-xs row">
                  <div class="col-auto q-px-md text-bold">Celular</div>
                  <div class="col-auto q-px-md">(809)-992-9876</div>
                </div>
                <div class="col-12 col-md-3 bordere q-py-xs row">
                  <div class="col-auto q-px-md text-bold"></div>
                  <div class="col-auto q-px-md"></div>
                </div>

                <div class="bordere col-12">
                  <div
                    style="font-size: 20px"
                    class="text-white bg-primary text-bold text-center q-py-xs q-px-md"
                  >
                    DIRECCION DE RESIDENCIA HABITUAL
                  </div>
                </div>
                <div class="col-12 col-md-5 bordere q-py-xs items-center row">
                  <div class="col-auto q-px-md text-bold">Calle y No</div>
                  <div class="col-auto q-px-md">
                    Gregorio lupero #4 sector brisas del este,
                  </div>
                </div>
                <div class="col-12 col-md-3 bordere q-py-xs items-center row">
                  <div class="col-auto q-px-md text-bold">Pais</div>
                  <div class="col-auto q-px-md">
                    Republica dominicana Republica
                  </div>
                </div>
                <div class="col-12 col-md-2 bordere q-py-xs items-center row">
                  <div class="col-auto q-px-md text-bold">Provincia</div>
                  <div class="col-auto q-px-md">Santo Domingo este,</div>
                </div>
                <div class="col-12 col-md-2 bordere q-py-xs items-center row">
                  <div class="col-auto q-px-md text-bold">Municipio</div>
                  <div class="col-auto q-px-md">Santo Domingo este</div>
                </div>
              </div>
            </div>
            <div
              class="col-12 q-my-md"
              v-for="(item, index) in data.section"
              :key="index"
            >
              <div class="text-h5">
                <q-icon size="1.4em" name="description" color="primary" />
                {{ item.name }}
              </div>
              <div class="q-my-md">
                <q-separator />
              </div>
              <div class="q-pb-md row q-col-gutter-md q-px-md">
                <div
                  class="col-12 col-md-3"
                  v-for="(a, b) in item.input"
                  :key="b"
                >
                  <label>
                    <b>
                      <b class="text-negative">* </b> {{ a.name.toUpperCase() }}
                    </b>
                  </label>

                  <q-input
                    filled
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    dense
                    color="primary"
                    type="text"
                    v-if="a.formType.name == 'text'"
                    disable
                  />

                  <q-input
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    filled
                    dense
                    color="primary"
                    type="password"
                    v-if="a.formType.name == 'password'"
                  />

                  <div
                    class="row"
                    v-if="a.formType.name == 'checkbox'"
                    style="
                      border-radius: 5px;
                      background: #eeeeee;
                      height: 40px;
                    "
                  >
                    <q-checkbox
                      class="q-px-md"
                      v-model="allResponse.find((e) => e.id == a._id).response"
                      filled
                      dense
                      color="primary"
                    />
                  </div>

                  <q-input
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    filled
                    dense
                    color="primary"
                    type="number"
                    v-if="a.formType.name == 'number'"
                  />

                  <q-radio
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    checked-icon="task_alt"
                    unchecked-icon="panorama_fish_eye"
                    val="line"
                    v-if="a.formType.name == 'radio'"
                  />

                  <q-input
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    filled
                    dense
                    type="textarea"
                    v-if="a.formType.name == 'textarea'"
                    aria-required="true"
                  />

                  <q-input
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    filled
                    dense
                    color="primary"
                    type="mail"
                    v-if="a.formType.name == 'email'"
                  />
                  <q-input
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    filled
                    dense
                    v-if="a.formType.name == 'tel'"
                  />
                  <q-input
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    dense
                    filled
                    color="primary"
                    type="date"
                    v-if="a.formType.name == 'date'"
                  />

                  <q-select
                    filled
                    dense
                    color="primary"
                    :options="a.options"
                    v-model="allResponse.find((e) => e.id == a._id).response"
                    option-label="name"
                    label="DEPARTAMENTOS"
                    v-if="a.formType.name == 'select'"
                  >
                  </q-select>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, watch, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import UploadFile from "src/components/form/UploadFile.vue";
import moment from "moment";

moment.updateLocale("es", {
  weekdays: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  months: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
});
const dateMoment = ref(
  moment().format("dddd DD [de] MMMM [de] YYYY hh:mm").toUpperCase()
);

const openModal = ref(false);
const maximizedToggle = ref(true);
const data = ref({});
const allResponse = ref([]);

const ModalActive = () => {
  openModal.value = true;
};

onMounted(() => {
  getResponseByUser();
});

const responseHere = computed(() => {
  let id = "651f30d93b6e5e96e571eaa4";
  return allResponse.value.find((e) => e.id == id).response;
});
const getResponseByUser = async () => {
  let resp = await methodsHttp.getApi(
    `/response/getFormResponse/64dcfeb34bfe47f5baa4f844`
  );
  if (resp.ok) {
    data.value = resp.formResponse.form;
    allResponse.value = resp.formResponse.formResponse;
  }
};
</script>
