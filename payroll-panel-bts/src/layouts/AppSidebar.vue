<template>
  <div class="sidebar-shell">
    <q-scroll-area class="sidebar-scroll">
      <!-- HEADER -->
      <div class="sidebar-header row items-center no-wrap">
        <div class="sidebar-header__logo col-auto">
          <img
            src="~assets/logo.png"
            height="50"
            width="50"
            alt="Creditos Guimanfer"
          />
        </div>

        <div class="sidebar-header__text col">
          <div class="sidebar-header__title">{{ appConfig.companyName }}</div>
          <div class="sidebar-header__role ellipsis">
            {{ roleLabel }}
          </div>
        </div>
      </div>

      <!-- MENU -->
      <div class="menu-section">
        <template v-for="item in sidebarMenus" :key="item._id || item.code">
          <!-- ITEM INTERNO -->
          <router-link
            v-if="isInternalItem(item)"
            :to="item.path!"
            class="routes_link"
          >
            <div class="menu-item row items-start no-wrap">
              <div class="menu-item-icon col-auto">
                <q-icon :name="item.icon || 'menu'" />
              </div>

              <div class="menu-item-label col">
                {{ item.name }}
              </div>
            </div>
          </router-link>

          <!-- ITEM EXTERNO -->
          <a
            v-else-if="isExternalItem(item)"
            :href="item.externalPath!"
            class="routes_link"
            :target="item.openInNewTab ? '_blank' : '_self'"
            :rel="item.openInNewTab ? 'noopener noreferrer' : undefined"
          >
            <div class="menu-item row items-start no-wrap">
              <div class="menu-item-icon col-auto">
                <q-icon :name="item.icon || 'open_in_new'" />
              </div>

              <div class="menu-item-label col">
                {{ item.name }}
              </div>
            </div>
          </a>

          <!-- COLLAPSIBLE -->
          <q-expansion-item
            v-else-if="isCollapsible(item)"
            dense
            dense-toggle
            expand-separator
            class="menu-expansion"
            header-class="menu-expansion-header"
            :default-opened="treeHasActive(item)"
          >
            <template #header>
              <div class="q-mr-md">
                <q-icon :name="item.icon || 'folder'" />
              </div>

              <q-item-section>
                <q-item-label class="menu-item-label">
                  {{ item.name }}
                </q-item-label>
              </q-item-section>
            </template>

            <div class="submenu-wrapper">
              <template
                v-for="child in item.children"
                :key="child._id || child.code"
              >
                <router-link
                  v-if="isInternalItem(child)"
                  :to="child.path!"
                  class="routes_link"
                >
                  <div
                    class="menu-item menu-item--child row items-center no-wrap"
                    :class="{
                      'menu-item--active-child': isRouteActive(child.path),
                    }"
                  >
                    <div class="menu-item-icon col-auto">
                      <q-icon :name="child.icon || 'chevron_right'" />
                    </div>

                    <div class="menu-item-label col ellipsis">
                      {{ child.name }}
                    </div>
                  </div>
                </router-link>

                <a
                  v-else-if="isExternalItem(child)"
                  :href="child.externalPath!"
                  class="routes_link"
                  :target="child.openInNewTab ? '_blank' : '_self'"
                  :rel="child.openInNewTab ? 'noopener noreferrer' : undefined"
                >
                  <div
                    class="menu-item menu-item--child row items-center no-wrap"
                  >
                    <div class="menu-item-icon col-auto">
                      <q-icon :name="child.icon || 'open_in_new'" />
                    </div>

                    <div class="menu-item-label col ellipsis">
                      {{ child.name }}
                    </div>
                  </div>
                </a>

                <div
                  v-else-if="child.type === 'GROUP'"
                  class="submenu-group-label"
                >
                  {{ child.name }}
                </div>

                <q-separator
                  v-else-if="child.type === 'DIVIDER'"
                  class="submenu-divider"
                />
              </template>
            </div>
          </q-expansion-item>

          <!-- GROUP -->
          <div v-else-if="item.type === 'GROUP'" class="menu-group-label">
            {{ item.name }}
          </div>

          <!-- DIVIDER -->
          <q-separator v-else-if="item.type === 'DIVIDER'" class="q-my-sm" />
        </template>

        <div v-if="!sidebarMenus.length" class="empty-menu">
          <q-icon name="lock" size="24px" />
          <div>No tienes menús asignados.</div>
        </div>
      </div>
    </q-scroll-area>

    <!-- FOOTER -->
    <div class="sidebar-footer">
      <div class="footer-card row items-center no-wrap">
        <q-avatar size="42px" class="footer-avatar">
          {{ userInitial }}
        </q-avatar>

        <div class="footer-user col">
          <div class="footer-user__name ellipsis">
            {{ userName }}
          </div>

          <div class="footer-user__email ellipsis">
            {{ userEmail }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { authStore } from "src/stores/auth-store";
import { useAppMenus } from "src/composable/useAppMenus";
import { appConfig } from "src/config/app.config";

const auth = authStore();

const {
  sidebarMenus,
  isInternalItem,
  isExternalItem,
  isCollapsible,
  isRouteActive,
  treeHasActive,
} = useAppMenus();

const userName = computed(() => auth.user?.name || "Usuario");
const userEmail = computed(() => auth.user?.email || "Sin correo");

const userInitial = computed(() => {
  const name = auth.user?.name?.trim() || "U";
  return name.charAt(0).toUpperCase();
});

const roleLabel = computed(() => {
  const rol = auth.user?.rol || auth.user?.role;

  if (!rol) return "Sin rol";
  if (typeof rol === "string") return rol;

  return rol.name || rol.code || "Sin rol";
});
</script>

<style scoped lang="scss">
.sidebar-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f4f5f7;
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
}

.sidebar-header {
  margin: 14px 14px 18px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  box-shadow: 0 8px 20px rgba(2, 48, 69, 0.1);
}

.sidebar-header__logo {
  width: 54px;
  height: 54px;
  min-width: 54px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
}

.sidebar-header__logo img {
  display: block;
  object-fit: contain;
}

.sidebar-header__text {
  min-width: 0;
  padding-left: 10px;
}

.sidebar-header__title {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #fff;
  text-transform: uppercase;
  line-height: 1.1;
}

.sidebar-header__role {
  margin-top: 4px;
  font-size: 0.76rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.86);
}

.menu-section {
  margin: 4px 20px 14px;
}

.routes_link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.menu-item {
  min-height: 40px;
  height: auto;
  border-radius: 10px;
  padding: 8px 10px;
  margin-bottom: 5px;
  color: #4b5563;
  transition:
    background 0.18s ease,
    transform 0.1s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.menu-item--child {
  margin-left: 15px;
  min-height: 40px;
}

.menu-item-icon {
  width: 34px;
  min-width: 34px;
  display: flex;
  align-items: flex-start;
  padding-top: 1px;
}

.menu-item-icon .q-icon {
  font-size: 1.45rem;
  color: #5f6063;
  transition: color 0.18s ease;
}

.menu-item-label {
  min-width: 0;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.25;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  transition: color 0.18s ease;
  padding-top: 3px;
}

.menu-item:hover {
  background: $selectMenuHover;
  color: #023045;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.menu-item:hover .menu-item-label,
.menu-item:hover .q-icon {
  color: #023045;
}

.router-link-exact-active .menu-item,
.menu-item--active-child {
  background: $selectMenu;
  color: #023045;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  position: relative;
}

.router-link-exact-active .menu-item::before,
.menu-item--active-child::before {
  content: "";
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 3px;
  border-radius: 999px;
  background: #023045;
}

.router-link-exact-active .menu-item-label,
.router-link-exact-active .q-icon,
.menu-item--active-child .menu-item-label,
.menu-item--active-child .q-icon {
  color: #023045 !important;
}

.menu-expansion {
  border-radius: 10px;
  overflow: hidden;
}

:deep(.menu-expansion-header) {
  min-height: 40px;
  border-radius: 10px;
  padding: 7px 10px;

  color: #4b5563;
  transition:
    background 0.18s ease,
    transform 0.1s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

:deep(.menu-expansion-header .q-icon) {
  font-size: 1.45rem;
  color: #5f6063;
}

:deep(.menu-expansion-header:hover) {
  background: $selectMenuHover;
  color: #023045;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.menu-expansion-header:hover .q-icon),
:deep(.menu-expansion-header:hover .menu-item-label) {
  color: #023045;
}

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
  top: 7px;
  bottom: 7px;
  width: 3px;
  border-radius: 999px;
  background: #023045;
}

:deep(
  .q-expansion-item--expanded
    > .q-expansion-item__container
    > .menu-expansion-header
    .q-icon
),
:deep(
  .q-expansion-item--expanded
    > .q-expansion-item__container
    > .menu-expansion-header
    .menu-item-label
) {
  color: #023045;
}

.submenu-wrapper {
  padding: 2px 0 4px;
}

.menu-group-label,
.submenu-group-label {
  margin: 8px 0 5px 10px;
  padding: 4px 10px 2px;
  font-size: 0.68rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.42);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.submenu-divider {
  margin: 6px 10px 6px 20px;
}

.empty-menu {
  margin: 16px 8px;
  padding: 18px;
  border-radius: 14px;
  text-align: center;
  color: #64748b;
  background: rgba(255, 255, 255, 0.78);
  border: 1px dashed rgba(148, 163, 184, 0.35);
  font-weight: 700;
}

.empty-menu .q-icon {
  display: block;
  margin: 0 auto 8px;
  color: #023045;
}

.sidebar-footer {
  padding: 12px 14px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.footer-card {
  padding: 10px 12px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.footer-avatar {
  color: #ffffff;
  background: linear-gradient(135deg, #1a2436, #1964a2);
  font-weight: 800;
}

.footer-user {
  min-width: 0;
  padding-left: 10px;
}

.footer-user__name {
  font-size: 0.86rem;
  font-weight: 700;
  color: #0f172a;
}

.footer-user__email {
  margin-top: 2px;
  font-size: 0.74rem;
  color: rgba(15, 23, 42, 0.52);
}

@media (max-width: 1023px) {
  .sidebar-header {
    margin-top: 12px;
  }

  .menu-item--child {
    margin-left: 12px;
  }
}

:deep(.menu-expansion-header) {
  min-height: 40px;
  height: auto;
  align-items: flex-start;
  border-radius: 10px;
  padding: 8px 10px;
  color: #4b5563;
  transition:
    background 0.18s ease,
    transform 0.1s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

:deep(.menu-expansion-header .q-item__section--avatar) {
  align-items: flex-start;
  padding-top: 1px;
}

:deep(.menu-expansion-header .q-item__label) {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.25;
}

.menu-loading {
  margin: 6px 0 14px;
}

.menu-skeleton {
  border-radius: 10px;
}
</style>
