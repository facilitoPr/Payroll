<template>
  <q-page class="q-pa-md">
    <!-- HEADER -->
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="row items-center q-gutter-sm">
          <q-btn flat round icon="arrow_back" @click="goBack()" />
          <div>
            <div class="text-h5 text-weight-bold">Mapa de entrega</div>
            <div class="text-grey-7">
              Dirección, referencia y cómo llegar . Abre el mapa externo si deseas navegación real.
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="row items-center q-gutter-sm">
          <q-btn outline icon="content_copy" label="Copiar dirección" :disable="!selected" @click="copyAddress()" />
          <q-btn unelevated color="primary" icon="map" label="Abrir en Google Maps" :disable="!selected" @click="openGoogleMaps()" />
          <q-btn flat icon="open_in_new" label="Abrir OSM" :disable="!selected" @click="openOSM()" />
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- SELECT ORDER -->
    <q-card bordered class="bg-white rounded-borders q-mb-md">
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select
            outlined
            dense
            v-model="selectedCode"
            :options="orderOptions"
            emit-value
            map-options
            label="Selecciona una orden"
            hint="Si vienes desde la lista, intentamos seleccionar automáticamente."
          />
        </div>

        <div class="col-12 col-md-6">
          <q-banner v-if="!selected" class="bg-orange-1 text-orange-10 rounded-borders">
            No se encontró la orden por parámetro. Selecciona una de la lista para ver el mapa.
          </q-banner>

          <q-banner v-else class="bg-grey-2 rounded-borders">
            <div class="text-caption text-grey-7">
              Orden <b>{{ selected.orderCode }}</b> · Estatus <b>{{ statusLabel(selected.status) }}</b> · Chofer <b>{{ selected.driver }}</b>
            </div>
          </q-banner>
        </div>
      </q-card-section>
    </q-card>

    <!-- CONTENT -->
    <div class="row q-col-gutter-md">
      <!-- LEFT: INFO -->
      <div class="col-12 col-lg-4">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Datos de entrega</div>
              <div class="text-caption text-grey-7">Información de la orden .</div>
            </div>
            <q-badge v-if="selected" :color="statusColor(selected.status)">{{ statusLabel(selected.status) }}</q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section v-if="selected">
            <div class="q-gutter-sm">
              <div class="row items-center justify-between">
                <div class="text-grey-7">Cliente</div>
                <div class="text-weight-medium">{{ selected.customer }}</div>
              </div>

              <div class="row items-center justify-between">
                <div class="text-grey-7">Teléfono</div>
                <div class="text-weight-medium">{{ selected.phone }}</div>
              </div>

              <div class="row items-start justify-between">
                <div class="text-grey-7">Dirección</div>
                <div class="text-weight-medium" style="max-width: 60%; text-align: right">
                  {{ selected.address }}
                </div>
              </div>

              <div class="row items-center justify-between">
                <div class="text-grey-7">Referencia</div>
                <div class="text-weight-medium">{{ selected.reference || "—" }}</div>
              </div>

              <div class="row items-center justify-between">
                <div class="text-grey-7">Programada</div>
                <div class="text-weight-medium">{{ selected.scheduledAt }}</div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="text-caption text-grey-7 q-mb-xs">Items</div>
              <q-list bordered class="rounded-borders">
                <q-item v-for="it in selected.items" :key="it.name">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ it.name }}</q-item-label>
                    <q-item-label caption>{{ it.qty }} unidad</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline color="primary">{{ it.qty }} u</q-badge>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator class="q-my-md" />

              <div class="row items-center q-gutter-sm">
                <q-btn
                  outline
                  icon="local_shipping"
                  label="Marcar En ruta "
                  :disable="selected.status === 'DELIVERED'"
                  @click="setStatus('ON_ROUTE')"
                />
                <q-btn
                  unelevated
                  color="green"
                  icon="check_circle"
                  label="Marcar Entregada "
                  :disable="selected.status === 'DELIVERED'"
                  @click="setStatus('DELIVERED')"
                />
              </div>

              <div class="text-caption text-grey-7 q-mt-sm">
                * En un sistema real, “Entregada” debería exigir recibo/firma.
              </div>
            </div>
          </q-card-section>

          <q-card-section v-else class="text-grey-7">
            Selecciona una orden para ver la información.
          </q-card-section>
        </q-card>

        <!-- HOW TO GET THERE -->
        <q-card bordered class="bg-white rounded-borders q-mt-md">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Cómo llegar</div>
              <div class="text-caption text-grey-7">Ruta sugerida .</div>
            </div>
            <q-icon name="route" class="text-primary" />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="selected">
            <q-timeline color="primary" layout="dense">
              <q-timeline-entry
                title="Salida"
                :subtitle="originLabel"
                icon="my_location"
              />
              <q-timeline-entry
                title="Toma la vía principal"
                subtitle="Mantente por la ruta más directa según tráfico"
                icon="turn_right"
              />
              <q-timeline-entry
                title="Punto de referencia"
                :subtitle="selected.reference || 'Usa la referencia del cliente si aplica'"
                icon="place"
              />
              <q-timeline-entry
                title="Llegada"
                :subtitle="selected.address"
                icon="flag"
              />
            </q-timeline>

            <q-banner class="bg-grey-2 rounded-borders q-mt-md">
              <div class="text-caption text-grey-7">
                Para navegación real, usa <b>“Abrir en Google Maps”</b> (arriba).
              </div>
            </q-banner>
          </q-card-section>

          <q-card-section v-else class="text-grey-7">
            Selecciona una orden para ver pasos sugeridos.
          </q-card-section>
        </q-card>
      </div>

      <!-- RIGHT: MAP -->
      <div class="col-12 col-lg-8">
        <q-card bordered class="bg-white rounded-borders">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Mapa</div>
              <div class="text-caption text-grey-7">
                Vista de mapa con OpenStreetMap embebido (sin API key).
              </div>
            </div>

            <div class="row items-center q-gutter-sm">
              <q-badge v-if="selected" outline color="primary">
                {{ selected.lat.toFixed(5) }}, {{ selected.lng.toFixed(5) }}
              </q-badge>
              <q-btn outline icon="refresh" label="Recentrar" :disable="!selected" @click="recenter()" />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <div v-if="selected" style="height: 520px; width: 100%">
              <iframe
                :src="osmEmbedUrl"
                style="border: 0; width: 100%; height: 100%"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              />
            </div>

            <div v-else class="q-pa-md text-grey-7">
              Selecciona una orden para cargar el mapa.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="row items-center justify-between">
            <div class="text-caption text-grey-7">
              Si quieres, luego puedes integrar Leaflet/Mapbox y rutas reales.
            </div>
            <q-btn flat icon="open_in_new" label="Ver mapa grande" :disable="!selected" @click="openOSM()" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

type DeliveryStatus = "READY" | "FOR_DELIVERY" | "ON_ROUTE" | "DELIVERED";

type Delivery = {
  orderCode: string;
  customer: string;
  phone: string;
  address: string;
  reference?: string;
  driver: string;
  scheduledAt: string;
  status: DeliveryStatus;
  lat: number;
  lng: number;
  items: { name: string; qty: number }[];
};

const deliveries = ref<Delivery[]>([
  {
    orderCode: "OT-00022",
    customer: "Ana López",
    phone: "809-555-1200",
    address: "Av. Principal #22, Los Prados",
    reference: "Frente al colmado azul",
    driver: "Luis",
    scheduledAt: "Hoy 03:00 PM",
    status: "FOR_DELIVERY",
    lat: 18.4834,
    lng: -69.9401,
    items: [
      { name: "Mesa M1", qty: 1 },
      { name: "Silla S1", qty: 4 },
    ],
  },
  {
    orderCode: "OT-00023",
    customer: "Carlos Pérez",
    phone: "829-555-8891",
    address: "Calle 3, Residencial Palma",
    reference: "Casa esquina, portón negro",
    driver: "Luis",
    scheduledAt: "Hoy 05:30 PM",
    status: "READY",
    lat: 18.5002,
    lng: -69.9607,
    items: [{ name: "Mesa Pro", qty: 1 }],
  },
  {
    orderCode: "OT-00020",
    customer: "Laura Jiménez",
    phone: "849-555-7788",
    address: "Zona Industrial, Nave 12",
    reference: "Entrada por la garita",
    driver: "Marcos",
    scheduledAt: "Ayer 04:10 PM",
    status: "DELIVERED",
    lat: 18.4582,
    lng: -69.9109,
    items: [{ name: "Silla S1", qty: 6 }],
  },
]);

/**
 * Selección (intentamos desde query):
 * - orderCode (recomendado y estable)
 * - code (alias)
 */
const selectedCode = ref<string>("");

watchEffect(() => {
  const qCode = String(route.query.orderCode || route.query.code || "").trim();
  if (qCode && qCode !== selectedCode.value) {
    selectedCode.value = qCode;
  }
});

const orderOptions = computed(() =>
  deliveries.value.map((d) => ({
    label: `${d.orderCode} — ${d.customer} (${statusLabel(d.status)})`,
    value: d.orderCode,
  }))
);

const selected = computed(() => deliveries.value.find((d) => d.orderCode === selectedCode.value) || null);

/** Helpers UI */
function statusLabel(s: DeliveryStatus) {
  switch (s) {
    case "READY": return "Lista";
    case "FOR_DELIVERY": return "Para entrega";
    case "ON_ROUTE": return "En ruta";
    case "DELIVERED": return "Entregada";
  }
}
function statusColor(s: DeliveryStatus) {
  switch (s) {
    case "READY": return "grey";
    case "FOR_DELIVERY": return "orange";
    case "ON_ROUTE": return "primary";
    case "DELIVERED": return "green";
  }
}

const originLabel = "Base / almacén ";

/** Map URLs (OSM embed) */
const osmEmbedUrl = computed(() => {
  if (!selected.value) return "";
  const { lat, lng } = selected.value;

  // bbox pequeño alrededor del punto
  const delta = 0.02;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;

  // OpenStreetMap embed
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    `${left},${bottom},${right},${top}`
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
});

function openOSM() {
  if (!selected.value) return;
  const { lat, lng } = selected.value;
  const url = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=16/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
  window.open(url, "_blank");
}

function openGoogleMaps() {
  if (!selected.value) return;
  const q = selected.value.address || `${selected.value.lat},${selected.value.lng}`;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  window.open(url, "_blank");
}

async function copyAddress() {
  if (!selected.value) return;
  const text = selected.value.address;

  try {
    await navigator.clipboard.writeText(text);
    $q.notify({ message: "Dirección copiada.", color: "positive", position: "top" });
  } catch (e) {
    $q.notify({ message: "No se pudo copiar automáticamente. Copia manual.", color: "orange", position: "top" });
  }
}

function recenter() {
  // Para iframe, “recentrar” es recargar el src
  if (!selected.value) return;
  $q.notify({ message: "Mapa recentrado (simulado).", color: "primary", position: "top" });
}

function setStatus(next: DeliveryStatus) {
  if (!selected.value) return;

  if (selected.value.status === "DELIVERED") {
    $q.notify({ message: "Esta orden ya está entregada.", color: "grey", position: "top" });
    return;
  }

  selected.value.status = next;

  $q.notify({
    message: `Estatus actualizado a: ${statusLabel(next)} .`,
    color: next === "DELIVERED" ? "positive" : "primary",
    position: "top",
  });
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 14px;
}
</style>
