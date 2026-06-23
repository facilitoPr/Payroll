<template>
  <!-- ✅ ITEM (sin hijos) -->
  <router-link v-if="isLeaf" :to="to" class="routes_link">
    <q-item clickable dense class="menu-item" :style="indentStyle">
      <q-item-section avatar class="menu-item-icon">
        <q-icon :name="item.img" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="menu-item-label">
          {{ item.name }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </router-link>

  <!-- ✅ DROPDOWN (con hijos) -->
  <q-expansion-item
    v-else
    v-model="opened"
    dense
    expand-separator
    switch-toggle-side
    :icon="item.img || 'summarize'"
    :label="item.name"
    header-class="menu-expansion-header"
    :style="indentStyle"
  >
    <!-- 🔁 Recursivo: hijos pueden tener hijos infinitamente -->
    <SidebarMenuNode
      v-for="(child, i) in item.children"
      :key="makeKey(child, i)"
      :item="child"
      :depth="depth + 1"
    />
  </q-expansion-item>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

/**
 * 👇 Importante para recursión:
 * con defineOptions(name) puedes usar <SidebarMenuNode /> dentro del mismo archivo
 * sin import circular.
 */
defineOptions({ name: "SidebarMenuNode" });

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 0 },
});

const route = useRoute();

const hasChildren = computed(
  () => Array.isArray(props.item?.children) && props.item.children.length > 0
);

const isLeaf = computed(() => !hasChildren.value);

const to = computed(() => `/${props.item?.url || ""}`);

// ✅ Detecta si este nodo (o cualquier descendiente) es el route actual
const isNodeActive = (node, path) => {
  if (node?.url && `/${node.url}` === path) return true;
  if (!node?.children?.length) return false;
  return node.children.some((c) => isNodeActive(c, path));
};

const isActiveBranch = computed(() => isNodeActive(props.item, route.path));

// ✅ Se abre solo si tiene dentro la ruta activa
const opened = ref(isActiveBranch.value);

// ✅ Cuando cambie la ruta, abre automáticamente el árbol correcto
watch(
  () => route.path,
  () => {
    if (isActiveBranch.value) opened.value = true;
  }
);

// ✅ Indentación por nivel
const indentStyle = computed(() => ({
  marginLeft: props.depth ? `${props.depth * 12}px` : "0px",
}));

/**
 * ⚠️ Tienes muchos IDs repetidos en tus menús.
 * Para evitar bugs de render, el key debe ser estable y único.
 */
const makeKey = (node, i) =>
  `${props.depth + 1}-${node?.url || node?.name || "node"}-${i}`;
</script>

<style scoped lang="scss">
.sidebar-menu {
  padding-left: 6px;
  padding-right: 6px;
  font-family: inherit;
}

/* HEADER */
.sidebar-header {
  margin: 4px 8px 16px;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  box-shadow: 0 2px 6px rgba(2, 48, 69, 0.08);
}

.sidebar-header__logo img {
  display: block;
}

.sidebar-header__text {
  padding-left: 8px;
}

.sidebar-header__title {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #fff;
  text-transform: uppercase;
}

.sidebar-header__role {
  margin-top: 2px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #fff;
}

/* SECCIONES */
.menu-section {
  margin: 4px 6px 14px;
}

/* LINKS */
.routes_link {
  text-decoration: none;
  color: inherit;
  display: block;
}

/* ITEM BASE */
.menu-item {
  border-radius: 10px;
  padding: 6px 10px;
  margin-bottom: 4px;
  transition:
    background 0.18s ease,
    transform 0.1s ease,
    box-shadow 0.18s ease;
}

.menu-item--child {
  margin-left: 18px;
}

/* ICONOS */
.menu-item-icon .q-icon {
  font-size: 1.5rem;
  color: #5f6063;
}

/* LABEL */
.menu-item-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
}

/* HOVER */
.menu-item:hover {
  background: $selectMenuHover;
  color: #023045;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.menu-item:hover .menu-item-label {
  color: #023045;
}

.menu-item:hover .q-icon {
  color: #023045;
}

/* ACTIVE (router-link exact) */
.router-link-exact-active .menu-item {
  background: $selectMenu;
  color: #023045;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  position: relative;
}

.router-link-exact-active .menu-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 999px;
  background: #023045;
}

.router-link-exact-active .menu-item-label {
  color: #023045;
}

.router-link-exact-active .q-icon {
  color: #023045 !important;
}

/* HEADER del expansion item */
:deep(.menu-expansion-header) {
  border-radius: 10px;
  margin-bottom: 4px;
  padding: 6px 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  transition:
    background 0.18s ease,
    transform 0.1s ease,
    box-shadow 0.18s ease;
}

/* Hover del header */
:deep(.menu-expansion-header:hover) {
  background: $selectMenuHover;
  color: #023045;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Estado expandido (abierto) */
:deep(
  .q-expansion-item--expanded
    > .q-expansion-item__container
    > .menu-expansion-header
) {
  background: $selectMenu;
  color: #023045;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  position: relative;
}

:deep(
  .q-expansion-item--expanded
    > .q-expansion-item__container
    > .menu-expansion-header::before
) {
  content: "";
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 999px;
  background: #023045;
}
</style>