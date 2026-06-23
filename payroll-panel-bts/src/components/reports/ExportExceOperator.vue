<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Exportar Reporte de Citas</div>
      </q-card-section>

      <q-card-section class="q-gutter-md row">
        <q-input
          v-model="startDate"
          type="date"
          label="Fecha inicio"
          outlined
          dense
          class="col-12 col-md-4"
        />
        <q-input
          v-model="endDate"
          type="date"
          label="Fecha fin"
          outlined
          dense
          class="col-12 col-md-4"
        />
        <q-btn
          label="Buscar y Exportar Excel"
          color="primary"
          @click="buscarYExportar"
          :loading="loading"
          class="col-12 col-md-4"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import { Notify } from "quasar";

const startDate = ref("");
const endDate = ref("");
const loading = ref(false);

const buscarYExportar = async () => {
  if (!startDate.value) {
    return Notify.create({
      type: "warning",
      message: "Debes seleccionar una fecha de inicio",
    });
  }

  loading.value = true;

  try {
    // Usamos methodsHttp con configuración manual para recibir blob
    const response = await methodsHttp.postApi2(
      "reminders/getRemindersGroupedByOperator",
      {
        startDate: startDate.value.replace(/-/g, "/"),
        endDate: endDate.value ? endDate.value.replace(/-/g, "/") : undefined,
      },
      {
        responseType: "blob",
      }
    );

    // Crear el archivo descargable
    const blob = new Blob([response], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte-citas.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error(error);
    Notify.create({ type: "negative", message: "Error al generar el Excel" });
  } finally {
    loading.value = false;
  }
};
</script>
