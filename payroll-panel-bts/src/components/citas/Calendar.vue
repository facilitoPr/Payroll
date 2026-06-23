<template>
  <div>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, defineProps, defineEmits } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import methodsHttp from "src/api/methodsHttp";
const props = defineProps({
  appointments: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["editTable"]);
const calendarOptions = ref({
  plugins: [dayGridPlugin],
  initialView: "dayGridMonth",
  weekends: true,
  events: [
    ...props.appointments,
    // { title: `Osiris soler 1:30 pm - 2:00pm`, date: "2024-12-01", id: 1, textColor:'red', startEditable:true},
    // { title: "carlos 2:00 pm - 2:030pm", date: "2024-11-01", id: 1 },
    // { title: "event 2", date: "2024-11-05", id: 2 },
    // { title: "event 3", date: "2024-11-05", id: 2 },
    // { title: "event 4", date: "2024-11-05", id: 2 },
  ],
  locales: "es",
  locale: "es",
  editable: false,
  selectable: false,
  selectMirror: true,
  dayMaxEvents: true,

  day: true,
  headerToolbar: {
    left: "prev,next, today",
    center: "title",
    right: "dayGridMonth,",
  },
  titleFormat: {},
  eventClick: (events) => {
    // console.log(events.event, "click");
    editar({
      ...events.event.extendedProps,
      title: events.event.title,
      date: events.event.startStr,
    });
  },

  select: (selecciono) => {
    console.log("selecciono");
  },
  eventsSet: () => {
    console.log("eventsSet");
  },
  //   currentEvents: [],
});

onMounted(async () => {
  // getRemindersPanel();
  // nextTick();
  // calendarOptions.value.events = props.appointments;
});
const getRemindersPanel = async () => {
  // const resp = await methodsHttp.getApi(`reminders/getRemindersPanel`);
  //   getAppointments.value = resp.getAppointments;
  // calendarOptions.value.events = resp.reminders
};

const editar = async (item) => {
  await emit("editTable", item);
  // console.log(item, "item")
};

defineExpose({ getRemindersPanel });
</script>
<style lang='css'>
h2 {
  margin: 0;
  font-size: 16px;
}

ul {
  margin: 0;
  padding: 0 0 0 1.5em;
}

li {
  margin: 1.5em 0;
  padding: 0;
}

b {
  /* used for event dates/times */
  margin-right: 3px;
}

.demo-app {
  display: flex;
  min-height: 100%;
  font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
  font-size: 14px;
}

.demo-app-sidebar {
  width: 300px;
  line-height: 1.5;
  background: #eaf9ff;
  border-right: 1px solid #d3e2e8;
}

.demo-app-sidebar-section {
  padding: 2em;
}

.demo-app-main {
  flex-grow: 1;
  padding: 3em;
}

.fc {
  /* the calendar root */
  max-width: 1100px;
  margin: 0 auto;
}
</style>