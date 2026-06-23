<template>
  <div class="bg-white q-pa-md">
    <!-- Selector de Día -->
    <div class="row items-center justify-center q-mb-md">
      <q-btn dense round flat icon="chevron_left" @click="changeDay(-1)" color="primary" />
      <q-btn flat dense no-caps class="q-mx-md" style="min-width: 220px" @click="calendarVisible = true">
        <div class="text-h6 text-primary">{{ moment(selectedDate).format("dddd, DD MMMM YYYY") }}</div>
      </q-btn>
      <q-btn dense round flat icon="chevron_right" @click="changeDay(1)" color="primary" />

      <q-dialog v-model="calendarVisible">
        <q-card>
          <q-date v-model="selectedDate" mask="YYYY-MM-DD" @update:model-value="onDateSelected" minimal color="primary" />
        </q-card>
      </q-dialog>
    </div>

    <!-- Maestro-Detalle -->
    <div class="row q-col-gutter-md punch-layout">
      <!-- Lista de usuarios -->
      <div class="col-12 col-md-4 order-2 order-md-1">
        <q-input v-model="search" dense outlined placeholder="Buscar usuario..." class="q-mb-sm" clearable>
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-list bordered class="rounded-borders" style="max-height: 70vh; overflow:auto;">
          <q-item
            v-for="u in filteredUsers"
            :key="u.user._id"
            clickable
            :active="u.user._id===selectedUserId"
            @click="selectUser(u.user._id)"
            v-ripple
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                <q-img :src="u.user?.img" v-if="u.user?.img"/>
                <div v-else>
                  {{ (u.user?.name || 'U')[0]?.toUpperCase() }}
                </div>
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ u.user?.name || 'Sin nombre' }}</q-item-label>
              <q-item-label caption>{{ u.user?.email || u.user?.code_punch || '' }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge color="grey-7" outline>{{ u.stats?.total || 0 }}</q-badge>
            </q-item-section>
          </q-item>

          <div v-if="!filteredUsers.length" class="q-pa-md text-grey-7">Sin resultados</div>
        </q-list>
      </div>

      <!-- Detalle de ponches -->
      <div class="col-12 col-md-8 order-1 order-md-2">
        <q-card flat bordered class="rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div class="text-subtitle1 text-primary">
              {{ activeUser?.user?.name || 'Selecciona un usuario' }}
            </div>
            <div v-if="activeUser" class="text-caption text-grey-7">
              {{ activeUser.stats?.lateCount || 0 }} tarde / {{ activeUser.stats?.total || 0 }} ponches
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-markup-table flat dense v-if="activePunches.length">
              <thead>
                <tr>
                  <th style="width:28px;"></th>
                  <th class="text-left">IMG</th>
                  <th class="text-left">HORA</th>
                  <th class="text-left">PASO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in activePunches" :key="p._id">
                  <td><div :style="dotStyle(p)" /></td>
                  <td><Imagen :img="p?.img" :w="'40px'" :h="'40px'" /></td>
                  <td>{{ moment(p?.timestamp).format("hh:mm:ss A") }}</td>
                  <td>{{ p?.punchStep.toUpperCase() }}</td>
                </tr>
              </tbody>
            </q-markup-table>

            <div v-else class="q-pa-md text-grey-7">No hay ponches para este usuario en la fecha.</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import moment from "moment";
import Imagen from "src/components/utils/Imagen.vue";

const selectedDate = ref(moment().format("YYYY-MM-DD"));
const calendarVisible = ref(false);
const users = ref([]); // <- viene agrupado desde el backend
const selectedUserId = ref(null);
const search = ref("");
const filter = ref("all"); // all | late | ontime

const getPunchHistory = async () => {
  const url = `punch/getPunchHistoryByDateGrouped?date=${selectedDate.value}`;
  const resp = await methodsHttp.getApi(url);
  if (resp?.ok) {
    users.value = resp.users || [];
    // autoseleccionar primero si no hay selección
    if (!selectedUserId.value && users.value.length) {
      selectedUserId.value = users.value[0].user?._id;
    }
  }
};

const changeDay = (days) => {
  selectedDate.value = moment(selectedDate.value).add(days, "days").format("YYYY-MM-DD");
  getPunchHistory();
};

onMounted(getPunchHistory);

const onDateSelected = () => {
  calendarVisible.value = false;
  getPunchHistory();
};

const filteredUsers = computed(() => {
  const term = (search.value || "").trim().toLowerCase();
  let list = users.value;
  if (term) {
    list = list.filter(u => (u.user?.name || "").toLowerCase().includes(term));
  }
  // orden por nombre
  return [...list].sort((a, b) => (a.user?.name || "").localeCompare(b.user?.name || ""));
});

const activeUser = computed(() => filteredUsers.value.find(u => u.user?._id === selectedUserId.value));

const activePunches = computed(() => {
  if (!activeUser.value) return [];
  // orden por timestamp asc
  let arr = [...(activeUser.value.punches || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  // filtros
  if (filter.value === "late") {
    arr = arr.filter(p => p.punchStep === "entrada" && p.isLate === true);
  } else if (filter.value === "ontime") {
    arr = arr.filter(p => p.punchStep === "entrada" && (p.isLate === false || !p.isLate));
  }
  return arr;
});

// punto indicador
const dotStyle = (p) => {
  const isEntrada = p?.punchStep === "entrada";
  const size = "10px";
  let bg = "#9ca3af"; // gris
  if (isEntrada) bg = p?.isLate ? "#ef4444" : "#22c55e"; // rojo / verde
  return { width: size, height: size, borderRadius: "50%", backgroundColor: bg, display: "inline-block" };
};

const selectUser = (id) => { selectedUserId.value = id; };
</script>

<style scoped>
.text-h6 { text-transform: capitalize; }
.rounded-borders { border-radius: 10px; }

.punch-layout {
  flex-direction: column-reverse;
}

/* Desktop (md+): lista izquierda, detalle derecha */
@media (min-width: 1024px) {
  .punch-layout {
    flex-direction: row;
  }
}
</style>
