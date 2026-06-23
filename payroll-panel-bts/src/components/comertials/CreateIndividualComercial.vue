<template>
  <q-dialog v-model="open" persistent>
    <q-card style="width: 650px; max-width: 90vw">
      <q-inner-loading
        :showing="isLoading"
        label="Enviando..."
        label-class="text-blue-11"
        label-style="font-size: 1.1em"
      />

      <div class="bg-primary row justify-between q-pa-md">
        <div class="text-white" style="font-size: 19px; font-weight: 500">
          <div class="row items-center">
            <div class="col-auto q-mx-sm">
              <q-icon size="2em" name="people" color="white" />
            </div>
            <div class="col-auto text-white">
              <b>{{ props.isEdit ? "EDITAR PACIENTE" : "CREAR PACIENTE" }}</b>
            </div>
          </div>
        </div>
        <span
          class="material-icons text-white"
          style="font-size: 23px; cursor: pointer"
          @click="closeModal"
        >
          cancel
        </span>
      </div>

      <q-form @submit.prevent="submitPatient" ref="formRef">
        <q-card-section class="q-pt-sm">
          <div class="q-pt-sm row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <label
                ><b><b class="text-negative">* </b>NOMBRE COMPLETO</b></label
              >
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.MemberFullname"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <label
                ><b
                  ><b class="text-negative">* </b>TELEFONO DE LA CASA</b
                ></label
              >
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.HomePhone"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <label> <b class="text-negative">* </b> <b>GENERO</b></label>
              <q-select
                v-model="form.Gender"
                :options="['M', 'F']"
                label="Género"
                dense
                outlined
                :rules="[(val) => !!val || 'Genero requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <label
                ><b><b class="text-negative">* </b>TIPO DE CLIENTE</b></label
              >
              <q-select
                v-model="clientType"
                :options="['Comercial', 'Federal']"
                label="Tipo de Cliente"
                dense
                outlined
                :rules="[(val) => !!val || 'Tipo requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <label
                ><b><b class="text-negative">* </b>ZONA</b></label
              >
              <q-select
                v-model="zonaSelected"
                :options="zones"
                option-label="name"
                option-value="_id"
                label="Zona"
                dense
                outlined
                :rules="[(val) => !!val || 'Zona requerida']"
              />
            </div>

            <div class="col-12 col-md-6">
              <label><b>NUMERO DE CONTRATO</b></label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.memberIdentificationNumber"
                type="number"
              />
            </div>

            <div class="col-12 col-md-6">
              <label><b>EDAD ACTUAL</b></label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.CurrentAge"
                type="number"
              />
            </div>

            <div class="col-12 col-md-6">
              <label><b>FECHA DE NACIMIENTO</b></label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.BirthDate"
                type="date"
                
              />
            </div>

            <div class="col-12 col-md-6">
              <label><b>TELEFONO ALTERNATIVO</b></label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.AlternatePhone"
              />
            </div>

            <div class="col-12 col-md-6">
              <label><b>COMPAÑIA</b></label>
              <q-input outlined dense color="primary" v-model="form.Company" />
            </div>

            <div class="col-12 col-md-6">
              <label><b>CODIGO DE EMPRESA</b></label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.CompanyCode"
              />
            </div>

            <div class="col-12 col-md-6">
              <label><b>CORREO ELECTRÓNICO</b></label>
              <q-input
                outlined
                dense
                color="primary"
                v-model="form.Email"
                type="email"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="closeModal" />
          <!-- <q-btn label="Guardar" type="submit" color="primary" /> -->
          <q-btn
            :label="props.isEdit ? 'Actualizar' : 'Guardar'"
            type="submit"
            color="primary"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from "vue";
import { useQuasar } from "quasar";
import methodsHttp from "src/api/methodsHttp";

const $q = useQuasar();
const emit = defineEmits(["close", "refresh"]);

// const props = defineProps({
//   modelValue: {
//     type: Boolean,
//     required: true,
//   },
// });


// watch(
//   () => props.modelValue,
//   (val) => {
//     open.value = val;
//   }
// );

// watch(open, (val) => {
//   emit("update:modelValue", val);
//   if (!val) resetForm();
// });

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  isEdit: { type: Boolean, default: false },
  editData: { type: Object, default: () => ({}) },
});

const open = ref(props.modelValue);


watch(
  () => props.modelValue,
  (val) => {
    open.value = val;
    if (val && props.isEdit) loadEditData();
  }
);

watch(open, (val) => {
  emit("update:modelValue", val);
  if (!val) resetForm();
});

function formatToYYYYMMDD(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const loadEditData = () => {
  const data = props.editData;
  form.value = {
    memberIdentificationNumber: data.memberIdentificationNumber || "",
    MemberFullname: data.MemberFullname || "",
    CurrentAge: data.CurrentAge || "",
    BirthDate: formatToYYYYMMDD(data.BirthDate), // <- aquí la conversión
    HomePhone: data.HomePhone || "",
    AlternatePhone: data.AlternatePhone || "",
    Company: data.Company || "",
    CompanyCode: data.CompanyCode || "",
    Gender: data.Gender || "",
    Email: data.Email || "",
  };
  zonaSelected.value = data.zona || null;
  clientType.value = data.isFederal ? "Federal" : "Comercial";
};

const isLoading = ref(false);
const zones = ref([]);
const zonaSelected = ref(null);
const formRef = ref(null);
const clientType = ref(null); // 'Comercial' o 'Federal'

const form = ref({
  memberIdentificationNumber: "",
  MemberFullname: "",
  CurrentAge: "",
  BirthDate: "",
  HomePhone: "",
  AlternatePhone: "",
  Company: "",
  CompanyCode: "",
  Gender: "",
});

onMounted(async () => {
  const resp = await methodsHttp.getApi("zones/getZonesActived");
  if (resp.ok) zones.value = resp.zones;
});

// const submitPatient = async () => {
//   const formValid = await formRef.value.validate();
//   if (!formValid || !zonaSelected.value || !clientType.value) {
//     if (!zonaSelected.value) {
//       $q.notify({ type: "negative", message: "La zona es obligatoria." });
//     }
//     if (!clientType.value) {
//       $q.notify({
//         type: "negative",
//         message: "El tipo de cliente es obligatorio.",
//       });
//     }
//     return;
//   }

//   isLoading.value = true;

//   const payload = {
//     ...form.value,
//     isFederal: clientType.value === "Federal",
//     PhysicalAddressState: "PR",
//     PhysicalAddressCity: zonaSelected.value.name,
//     isManual: true,
//   };

//   const resp = await methodsHttp.postApi(
//     `comercial/createComercial/${zonaSelected.value._id}`,
//     payload
//   );

//   isLoading.value = false;

//   if (resp.ok) {
//     $q.notify({ type: "positive", message: "Paciente creado correctamente." });
//     emit("refresh");
//     open.value = false;
//   } else {
//     $q.notify({
//       type: "negative",
//       message: resp?.msg || "Error al crear paciente.",
//     });
//   }
// };

const submitPatient = async () => {
  const formValid = await formRef.value.validate();
  if (!formValid || !zonaSelected.value || !clientType.value) {
    if (!zonaSelected.value) {
      $q.notify({ type: "negative", message: "La zona es obligatoria." });
    }
    if (!clientType.value) {
      $q.notify({
        type: "negative",
        message: "El tipo de cliente es obligatorio.",
      });
    }
    return;
  }

  isLoading.value = true;

  const payload = {
    ...form.value,
    isFederal: clientType.value === "Federal",
    PhysicalAddressState: "PR",
    PhysicalAddressCity: zonaSelected.value.name,
  };

  const url = props.isEdit
    ? `comercial/updateComercial/${props.editData._id}`
    : `comercial/createComercial/${zonaSelected.value._id}`;

  const resp = props.isEdit
    ? await methodsHttp.putApi(url, payload)
    : await methodsHttp.postApi(url, { ...payload, isManual: true });

  isLoading.value = false;

  if (resp.ok) {
    $q.notify({
      type: "positive",
      message: resp.mensaje,
    });
    // emit("refresh");

    emit("refresh", resp.comercial || payload);

    open.value = false;
  } else {
    $q.notify({
      type: "negative",
      message: resp?.mensaje || "Error al guardar paciente.",
    });
  }
};

const closeModal = () => {
  open.value = false;
};

// const resetForm = () => {
//   form.value = {
//     memberIdentificationNumber: "",
//     MemberFullname: "",
//     CurrentAge: "",
//     BirthDate: "",
//     HomePhone: "",
//     AlternatePhone: "",
//     Company: "",
//     CompanyCode: "",
//     Gender: "",
//     Email: "",
//   };
//   zonaSelected.value = null;
//   clientType.value = null;
// };

const resetForm = () => {
  form.value = {
    memberIdentificationNumber: "",
    MemberFullname: "",
    CurrentAge: "",
    BirthDate: "",
    HomePhone: "",
    AlternatePhone: "",
    Company: "",
    CompanyCode: "",
    Gender: "",
    Email: "",
  };
  zonaSelected.value = null;
  clientType.value = null;
};
</script>
