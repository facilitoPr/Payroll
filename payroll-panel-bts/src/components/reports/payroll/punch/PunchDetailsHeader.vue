<template>
  <div class="punch-details-header bg-primary text-white">
    <div class="header-bg-decoration" />

    <div class="row items-center justify-between q-col-gutter-md header-content">
      <div class="col-12 col-md">
        <div class="row items-center no-wrap">
          <div class="avatar-wrap">
            <q-avatar size="58px" class="employee-avatar">
              <img :src="employeeAvatar || fallbackAvatar" alt="avatar" />
            </q-avatar>

            <div
              class="avatar-status-dot"
              :class="anyLate ? 'avatar-status-dot--late' : 'avatar-status-dot--ok'"
            />
          </div>

          <div class="employee-info">
            <div class="row items-center q-gutter-xs no-wrap">
              <div class="employee-name ellipsis">
                {{ employeeName || "Empleado" }}
              </div>

              <q-badge
                v-if="employeeExt"
                color="primary"
                text-color="white"
                class="ext-badge"
              >
                EXT {{ employeeExt }}
              </q-badge>
            </div>

            <div class="date-line">
              <q-icon name="event" size="16px" />
              <span>{{ formattedDateLong || "Fecha no disponible" }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-auto">
        <div class="header-actions">
          <div class="status-pill" :class="anyLate ? 'status-pill--late' : 'status-pill--ok'">
            <q-icon :name="anyLate ? 'warning' : 'check_circle'" size="18px" />
            <span>{{ anyLate ? "Con tardanza" : "A tiempo" }}</span>
          </div>

          <div class="status-pill status-pill--punches">
            <q-icon name="fingerprint" size="18px" />
            <span>{{ punchCount }} ponche{{ punchCount === 1 ? "" : "s" }}</span>
          </div>

          <q-btn
           round
          dense
          flat
            icon="close"
          color="white"
            @click="$emit('close')"
          >
            <q-tooltip>Cerrar</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  employeeName: { type: String, default: "" },
  employeeExt: { type: String, default: "" },
  employeeAvatar: { type: String, default: "" },
  formattedDateLong: { type: String, default: "" },
  anyLate: { type: Boolean, default: false },
  punchCount: { type: Number, default: 0 },
});

defineEmits(["close"]);

const fallbackAvatar =
  "https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp";
</script>

<style scoped>
.punch-details-header {
  position: relative;
  overflow: hidden;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.header-bg-decoration {
  position: absolute;
  top: -60px;
  right: -70px;
  width: 210px;
  height: 210px;
  border-radius: 999px;
  background: rgba(23, 141, 210, 0.08);
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 1;
}

.avatar-wrap {
  position: relative;
  margin-right: 14px;
}

.employee-avatar {
  background: #ffffff;
  box-shadow:
    0 0 0 3px #ffffff,
    0 0 0 6px rgba(23, 141, 210, 0.12),
    0 12px 26px rgba(15, 23, 42, 0.12);
}

.avatar-status-dot {
  position: absolute;
  right: -2px;
  bottom: 2px;
  width: 15px;
  height: 15px;
  border-radius: 999px;
  border: 3px solid #ffffff;
}

.avatar-status-dot--ok {
  background: #21ba45;
}

.avatar-status-dot--late {
  background: #c10015;
}

.employee-info {
  min-width: 0;
}

.employee-name {
  max-width: 420px;
  color: #fff;
  font-size: 1.12rem;
  font-weight: 900;
  line-height: 1.15;
}

.ext-badge {
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.03em;
}

.date-line {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #d3d3d3;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: capitalize;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill {
  min-height: 34px;
  padding: 7px 11px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 900;
  border: 1px solid transparent;
}

.status-pill--ok {
  color: #b8ffd0;
  background: rgba(33, 186, 69, 0.1);
  border-color: rgba(33, 186, 69, 0.18);
}

.status-pill--late {
  color: #ff938b;
  background: rgba(234, 68, 88, 0.08);
  border-color: rgba(254, 91, 110, 0.16);
}

.status-pill--punches {
  color: #b3c7ff;
  background: rgba(23, 141, 210, 0.1);
  border-color: rgba(23, 141, 210, 0.16);
}

.close-btn {
  width: 34px;
  height: 34px;
  min-height: 34px;
  
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.14);
}

@media (max-width: 768px) {
  .punch-details-header {
    padding: 16px;
  }

  .header-actions {
    justify-content: flex-start;
    margin-top: 8px;
  }

  .employee-name {
    max-width: 230px;
    font-size: 1rem;
  }
}
</style>