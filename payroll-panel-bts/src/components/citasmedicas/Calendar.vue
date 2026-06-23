<template>
  <div>
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, defineProps, defineEmits } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import esLocale from "@fullcalendar/core/locales/es";

const emit = defineEmits(["seeAppoimentData"]);

const props = defineProps({
  appointments: {
    type: Array,
    required: true,
  },
});

const calendarRef = ref(null);

const calendarOptions = ref({
  plugins: [dayGridPlugin],
  initialView: "dayGridMonth",
  locale: esLocale,
  weekends: true,

  // IMPORTANT: arranca vacío; luego lo seteamos con watch
  events: [],

  editable: false,
  selectable: false,
  dayMaxEvents: true,

  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth",
  },

  eventClick: (info) => {
    emit("seeAppoimentData", {
      ...info.event.extendedProps,
      date: info.event.startStr,
      title: info.event.title,
      id: info.event.id,
    });
  },
});

// Normaliza por si tus appointments vienen con "date" en vez de "start"
function normalizeEvents(list = []) {
  return (Array.isArray(list) ? list : []).map((e) => ({
    ...e,
    // FullCalendar usa start/end:
    start: e.start ?? e.date ?? e.fecha,
    end: e.end ?? e.endDate ?? e.fechaFin,
    title: e.title ?? e.name ?? e.nombre ?? "Cita",
  }));
}

watch(
  () => props.appointments,
  async (newVal) => {
    const events = normalizeEvents(newVal);

    await nextTick();

    const api = calendarRef.value?.getApi?.();
    if (api) {
      api.removeAllEvents();
      api.addEventSource(events);
    } else {
      // fallback por si aún no existe el api
      calendarOptions.value.events = events;
    }
  },
  { immediate: true, deep: true }
);
</script>
