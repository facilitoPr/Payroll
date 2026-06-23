<template>
  <div class="bg-white">
    <q-table
      :loading="props.tableLoading"
      flat
      bordered
      row-key="_id"
      :rows="props.rows"
      :columns="columns.columnsErrors()"
      hide-pagination
      :rows-per-page-options="[10]"
    >
      <template #body="slotProps">
        <q-tr
          :props="slotProps"
          class="cursor-pointer"
          @click="emit('open', slotProps.row)"
        >
          <q-td key="createdBy" :props="slotProps">
            {{ slotProps.row?.createdBy?.name }}
          </q-td>

          <q-td key="comercial" :props="slotProps">
            {{ slotProps.row?.comercial?.MemberFullname }}
          </q-td>

          <q-td key="reminder" :props="slotProps">
            {{ slotProps.row?.reminder?.date }}
          </q-td>

          <q-td key="date" :props="slotProps">
            {{ moment(slotProps.row?.date).format("lll") }}
          </q-td>

          <q-td key="status" :props="slotProps">
            <q-badge class="q-px-sm q-py-xs" :style="getBackgroundColor(badgeStatus(slotProps.row))">
              {{ badgeStatus(slotProps.row)?.name || "—" }}
            </q-badge>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import moment from "moment";
import PageHeaderCard from "../PageHeaderCard.vue";

const props = defineProps({
  rows: { type: Array, default: () => [] },
  tableLoading: { type: Boolean, default: false },
});

const emit = defineEmits(["open"]);


const badgeStatus = (row) => {
  if (!row) return null;
  if (row.status && typeof row.status === "object") return row.status;
  if (typeof row.status === "string") return statusByCode(row.status);
  return null;
};

const statusByCode = (code) =>
  (statusOptions.value || []).find((s) => s.code === code) || null;

const getBackgroundColor = (statusObj) => {
  const code = (statusObj?.code || statusObj || "").toString().toUpperCase();
  switch (code) {
    case "PENDING": return { backgroundColor: "#d3c769" };
    case "PROCESSING": return { backgroundColor: "#FFE08A" };
    case "DOCUMENTED": return { backgroundColor: "#A7C7E7" };
    case "TRAINING": return { backgroundColor: "#C7B8EA" };
    case "FINISHED": return { backgroundColor: "#A8E6A3" };
    default: return { backgroundColor: "#FFFFFF" };
  }
};
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
