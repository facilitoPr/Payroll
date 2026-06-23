<template>
  <div class="optionChat" @click="toggleMenu">
    <q-icon name="more_horiz" color="white" size="1rem" />
    <div
      v-if="menuVisible"
      :class="[item.position == 1 ? 'custom-menu-left' : 'custom-menu-right']"
    >
      <!-- Pico del menú -->
      <div class="menu-item row justify-between" @click="handleOpenDeleteModal">
        <div class="col-auto">Responder</div>
        <div class="col-auto">
          <q-icon name="undo" color="primary" size="1.2rem" />
        </div>
      </div>
      <q-separator />
      <div
        class="menu-item row justify-between"
        v-if="item.position == 2"
        @click="handleEdit"
      >
        <div class="col-auto">Editar</div>
        <div class="col-auto">
          <q-icon name="edit" color="primary" size="1.2rem" />
        </div>
      </div>
      <q-separator />
      <div class="menu-item row justify-between" @click="handleOpenDeleteModal">
        <div class="col-auto">Eliminar</div>
        <div class="col-auto">
          <q-icon name="delete" color="negative" size="1.2rem" />
        </div>
      </div>
    </div>

    <q-dialog v-model="openDeleteModal">
      <q-card style="width: 300px">
        <div class="text-center q-mt-sm">
          <q-icon name="delete" color="negative" size="5.4rem" />
          <div class="text-h6">Borrar Mensaje</div>
        </div>

        <div class="q-my-sm text-center">
          Esta seguro de borrar este mensaje ?
        </div>

        <q-card-actions align="center" class="bg-white text-teal q-mb-sm">
          <q-btn outline label="Cancelar" v-close-popup color="negative" />
          <q-btn
            label="Confirmar"
            v-close-popup
            color="negative"
            @click="handleDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
  
  <script setup>
import { defineProps, ref, defineEmits } from "vue";

const emit = defineEmits(["deleteMessage", "editMessage"]);

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  item: {
    type: Object,
    required: true,
  },
});

const menuVisible = ref(false);
const openDeleteModal = ref(false);

const toggleMenu = () => {
  menuVisible.value = !menuVisible.value;
};

const handleEdit = () => {
  emit("editMessage", { item: props.item, index: props.index });
  menuVisible.value = false;
};

const handleDelete = () => {
  emit("deleteMessage", props.index);
  menuVisible.value = false;
};

const handleOpenDeleteModal = () => {
  // emit("deleteMessage", props.index);
  // menuVisible.value = false;
  openDeleteModal.value = true;
};
</script>
  
  <style scoped>
.optionChat {
  position: relative;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #85a7d2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.optionChat:hover {
  background: #809bb0;
}

/* Estilos para el menú alineado a la derecha */
.custom-menu-right {
  position: absolute;
  top: 30px;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 10;
}

/* Triángulo o "pico" para el menú a la derecha */
.custom-menu-right::before {
  content: "";
  position: absolute;
  top: -8px; /* Ajusta según la posición deseada */
  right: 15px; /* Ajusta según el ancho del menú */
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #ccc;
}

.custom-menu-right::after {
  content: "";
  position: absolute;
  top: -7px;
  right: 15px;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid white;
}

/* Estilos para el menú alineado a la izquierda */
.custom-menu-left {
  position: absolute;
  top: 30px;
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 10;
}

/* Triángulo o "pico" para el menú a la izquierda */
.custom-menu-left::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 15px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #ccc;
}

.custom-menu-left::after {
  content: "";
  position: absolute;
  top: -7px;
  left: 15px;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid white;
}

.menu-item {
  padding: 10px;
  cursor: pointer;
}

.menu-item:hover {
  background: #f0f0f0;
}
</style>
  