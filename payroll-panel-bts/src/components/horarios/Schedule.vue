<template>
  <div class="row">
    <div class="col-12 q-mb-sm">
      <label>
        <b> <b class="text-negative">* </b> TIPO DE HORARIO </b>
      </label>
      <q-select
        v-model="tiposRapidosSeleted"
        :options="tiposRapidos"
        label="Selecciona cómo quieres definir el horario"
        outlined
        emit-value
        map-options
        dense
      />
    </div>

    <!-- Mostrar grupo solo si se selecciona tipo grupo -->
    <q-card
      v-if="tiposRapidosSeleted === 'grupo'"
      flat
      bordered
      class="q-mb-md col-12"
    >
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="modoRapido.dias"
              :options="diasSemana"
              option-value="key"
              option-label="label"
              multiple
              label="Días a configurar"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="modoRapido.entryTime"
              label="Entrada"
              type="time"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="modoRapido.lunchStartTime"
              label="Inicio Almuerzo"
              type="time"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="modoRapido.lunchEndTime"
              label="Fin Almuerzo"
              type="time"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="modoRapido.exitTime"
              label="Salida"
              type="time"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-auto flex items-center">
            <q-btn
              label="Aplicar a días"
              color="primary"
              @click="aplicarModoRapido"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mostrar edición manual solo si se selecciona tipo manual -->
    <div v-if="tiposRapidosSeleted === 'manual'" class="col-auto row">
      <div
        v-for="dia in diasSemana"
        :key="dia.key + '-' + tiposRapidosSeleted"
        class="q-mb-md col-auto q-ma-sm"
      >
        <q-card flat bordered >
          <q-card-section>
            <div class="row items-center justify-between q-gutter-md">
              <div class="col-12 col-md-2 text-bold">{{ dia.label }}</div>
              <div class="col-auto">
                <q-toggle
                  v-model="horario[dia.key].isActive"
                  label="Activo"
                  color="primary"
                />
              </div>
            </div>

            <div
              v-if="horario[dia.key].isActive"
              class="row q-col-gutter-md q-mt-sm"
            >
              <div class="col-12 col-sm-3">
                <q-input
                  v-model="horario[dia.key].entryTime"
                  type="time"
                  label="Entrada"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-3">
                <q-input
                  v-model="horario[dia.key].lunchStartTime"
                  type="time"
                  label="Inicio almuerzo"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-3">
                <q-input
                  v-model="horario[dia.key].lunchEndTime"
                  type="time"
                  label="Fin almuerzo"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-3">
                <q-input
                  v-model="horario[dia.key].exitTime"
                  type="time"
                  label="Salida"
                  outlined
                  dense
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRaw, watch, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const diasSemana = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const tiposRapidos = [
  { label: "Manual por día", value: "manual" },
  { label: "Aplicar a varios días", value: "grupo" },
];

const tiposRapidosSeleted = ref("manual");

const horario = reactive({});

function inicializarHorario() {
  diasSemana.forEach((d) => {
    if (!horario[d.key]) {
      horario[d.key] = {
        isActive: false,
        entryTime: "",
        lunchStartTime: "",
        lunchEndTime: "",
        exitTime: "",
      };
    }
  });
}

inicializarHorario();

const modoRapido = reactive({
  dias: [],
  entryTime: "",
  lunchStartTime: "",
  lunchEndTime: "",
  exitTime: "",
});

function aplicarModoRapido() {
  modoRapido.dias.forEach((diaKey) => {
    horario[diaKey].isActive = true;
    horario[diaKey].entryTime = modoRapido.entryTime;
    horario[diaKey].lunchStartTime = modoRapido.lunchStartTime;
    horario[diaKey].lunchEndTime = modoRapido.lunchEndTime;
    horario[diaKey].exitTime = modoRapido.exitTime;
  });
  emit("update:modelValue", toRaw(horario));
}

watch(
  horario,
  () => {
    emit("update:modelValue", toRaw(horario));
  },
  { deep: true }
);
</script>

<style scoped>
.text-bold {
  font-weight: bold;
}
</style>