<template>
  <div>
    <q-dialog v-model="alert" persistent>
      <q-card class="delete-dialog column no-wrap">
        <!-- HEADER -->
        <q-card-section class="delete-header">
          <div class="delete-icon-wrap">
            <q-icon name="delete_forever" size="42px" color="negative" />
          </div>

          <div class="delete-title">Confirmar eliminación</div>

          <div class="delete-subtitle">
            Esta acción no se puede deshacer.
          </div>
        </q-card-section>

        <q-separator />

        <!-- BODY -->
        <q-card-section class="delete-body">
          <div class="delete-message">
            {{ text || "¿Estás seguro de que quieres eliminar este registro?" }}
          </div>

          <q-banner rounded class="delete-warning q-mt-md">
            <template #avatar>
              <q-icon name="warning" color="negative" />
            </template>

            <div class="text-weight-bold">Atención</div>
            <div class="text-caption">
              El registro será eliminado o marcado como eliminado según la lógica
              del módulo.
            </div>
          </q-banner>
        </q-card-section>

        <q-separator />

        <!-- ACTIONS -->
        <q-card-actions align="right" class="delete-actions">
          <q-btn
            flat
            no-caps
            color="grey-8"
            label="Cancelar"
            icon="close"
            class="delete-action-btn"
            :disable="loading"
            @click="closeDialog"
          />

          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Eliminar"
            icon="delete"
            class="delete-action-btn"
            :loading="loading"
            :disable="loading"
            @click="deleteItem"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
  </div>
</template>

<script>
import { ref } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "./Notifications.vue";

export default {
  name: "Delete",

  components: {
    NotificationsVue,
  },

  emits: ["deleteGood"],

  setup(props, { emit }) {
    const alert = ref(false);
    const text = ref("");
    const idDelete = ref(null);
    const ruta = ref(null);
    const notify = ref(null);
    const loading = ref(false);

    const openDelete = (data, texto = "") => {
      ruta.value = data?.ruta || null;
      idDelete.value = data?.id || null;
      text.value = texto || "";
      alert.value = true;
    };

    const closeDialog = () => {
      if (loading.value) return;

      alert.value = false;
    };

    const deleteItem = async () => {
      if (!ruta.value || !idDelete.value || loading.value) return;

      loading.value = true;

      try {
        const res = await methodsHttp.deleteApi(`${ruta.value}/${idDelete.value}`);

        if (res?.ok) {
          notify.value?.showNotifyGood(
            res.mensaje || "Registro eliminado correctamente",
          );

          alert.value = false;
          emit("deleteGood");
          return;
        }

        notify.value?.showNotifyBad(
          res?.mensaje || "No se pudo eliminar el registro",
        );
      } catch (error) {
        console.error("deleteItem error:", error);
        notify.value?.showNotifyBad("Error al eliminar el registro");
      } finally {
        loading.value = false;
      }
    };

    return {
      alert,
      text,
      idDelete,
      ruta,
      notify,
      loading,
      openDelete,
      closeDialog,
      deleteItem,
    };
  },
};
</script>

<style scoped>
.delete-dialog {
  width: 430px;
  max-width: 94vw;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
}

.delete-header {
  padding: 28px 24px 22px;
  text-align: center;
  background:
    radial-gradient(circle at top, rgba(193, 0, 21, 0.12), transparent 36%),
    linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
}

.delete-icon-wrap {
  width: 82px;
  height: 82px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: #fee2e2;
  border: 1px solid rgba(193, 0, 21, 0.16);
  box-shadow: 0 18px 38px rgba(193, 0, 21, 0.12);
}

.delete-title {
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 950;
  line-height: 1.1;
}

.delete-subtitle {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 600;
}

.delete-body {
  padding: 20px 24px;
  background: #ffffff;
}

.delete-message {
  color: #334155;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
}

.delete-warning {
  color: #991b1b;
  background: #fff1f2;
  border: 1px solid rgba(193, 0, 21, 0.12);
  border-radius: 18px;
}

.delete-actions {
  padding: 16px 18px;
  background: #ffffff;
  box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.04);
}

.delete-action-btn {
  border-radius: 999px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 800;
}

@media (max-width: 480px) {
  .delete-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .delete-action-btn {
    width: 100%;
  }
}
</style>