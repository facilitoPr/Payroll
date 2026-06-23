<template>
  <div class="bg-white" style="border-radius: 15px; padding: 10px">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-6" v-if="auth.user.rol.code == 'STORE'">
        <q-select
          v-model="productCategorySelected"
          label="CATEGORIES"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="productCategories"
          clearable
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="col-12 col-sm-6">
        <q-select
          v-model="statusSelected"
          label="STATUS"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="statusArr"
          clearable
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="row full-width">
        <div class="col-12 col-sm-6 col-md-6">
          <q-input
            outlined
            dense
            label="SEARCH PRODUCT"
            color="primary"
            v-model="text"
            @keyup="search"
            clearable
          >
            <template v-slot:append>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-auto col-md-auto row items-center q-ml-md">
          <q-btn
            color="primary"
            label="CREATE PRODUCT"
            style="width: 100%; height: 40px"
            icon="people"
            @click="createDepartments"
          />
        </div>
      </div>

      <div
        class="col-12 col-sm-6"
        v-if="
          auth.user.rol.code == 'ADMIN' || auth.user.rol.code == 'SUPERADMIN'
        "
      >
        <q-select
          v-model="storeSelected"
          label="STORES"
          option-label="name"
          outlined
          dense
          color="primary"
          :options="stores"
          clearable
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>

    <div class="q-my-md">
      <q-separator />
    </div>

    <!-- table -->
    <div class="col q-mt-md">
      <q-table
        :loading="tableLoading"
        :rows="rows"
        :columns="
          auth.user.rol.code == 'STORE'
            ? columns.columnsProducts()
            : columns.columnsProductsAdmin()
        "
        title="PRODUCTS"
        row-key="_id"
        :bordered="false"
        flat
        :rows-per-page-options="[limit]"
        hide-pagination
        dense
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              <ImagenVue
                :img="
                  props.row.img
                    ? props.row.img
                    : 'https://plus-nautic.nyc3.digitaloceanspaces.com/caja.png'
                "
                w="40"
                h="40"
                style="
                  cursor: pointer;
                  width: 50px;
                  height: 50px;
                  overflow: hidden;
                "
              />
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>

            <q-td
              v-if="
                auth.user.rol.code == 'ADMIN' ||
                auth.user.rol.code == 'SUPERADMIN'
              "
              key="store"
              :props="props"
            >
              {{ props.row.store?.name }}
            </q-td>

            <q-td key="description" :props="props" class="description-cell">
              {{ props.row.description }}
            </q-td>

            <q-td key="name" :props="props">
              {{ props.row.storeCategory?.name }}
            </q-td>

            <q-td key="amount" :props="props">
              {{ props.row.amount }}
            </q-td>

            <q-td key="price" :props="props">
              {{ formatCurrency(props.row.price) }}
            </q-td>

            <q-td key="name" :props="props" @click="updateState(props.row)">
              <div v-if="props.row.isActived">
                <q-badge
                  color="secondary"
                  label="ACTIVE"
                  style="cursor: pointer"
                />
              </div>
              <div v-else>
                <q-badge
                  color="negative"
                  label="INACTIVE"
                  style="cursor: pointer"
                />
              </div>
            </q-td>

            <q-td key="name" :props="props">
              <q-icon
                name="menu"
                color="primary"
                size="25px"
                style="cursor: pointer"
              >
                <q-menu
                  transition-show="flip-right"
                  transition-hide="flip-left"
                >
                  <!-- edit -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalEdit(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="edit" color="primary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">EDIT</div>
                    </q-item>
                  </q-list>

                  <!-- add amount  -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalAddFunction(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="add" color="primary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">ADD AMOUNT</div>
                    </q-item>
                  </q-list>

                  <!-- upload image -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalImageFunct(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="image" color="primary" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">UPLOAD IMAGE</div>
                    </q-item>
                  </q-list>

                  <!-- delete -->
                  <q-list
                    style="min-width: 100px"
                    @click="openModalDelete(props.row)"
                  >
                    <q-item clickable class="row items-center">
                      <div class="col-auto">
                        <q-icon name="delete" color="negative" size="25px" />
                      </div>
                      <div class="q-px-sm col-auto">DELETE</div>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-icon>
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <!-- pagination -->
      <div class="row justify-center q-mt-md" v-if="productQuantity > 1">
        <q-pagination
          v-model="initialPagination"
          :max="productQuantity || 1"
          max-pages="10"
          direction-links
          push
          color="primary"
          active-color="accent"
        />
      </div>

      <!-- modal -->
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 600px; max-width: 80vw">
          <div class="bg-primary row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="people" color="white" />
                </div>
                <div class="col-auto text-white">
                  <b>{{ mode ? "EDIT PRODUCT" : "CREATE PRODUCT" }}</b>
                </div>
              </div>
            </div>

            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div>

          <q-card-section class="q-pt-sm">
            <div class="q-pt-sm row q-col-gutter-sm">
              <div class="col-12 col-md-12">
                <label>
                  <b> <b class="text-negative">* </b> NAME </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name" />
              </div>

              <div class="col-12 col-md-12">
                <label>
                  <b> <b class="text-negative">* </b> DESCRIPTION </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  type="textarea"
                  v-model="form.description"
                />
              </div>

              <div
                v-if="
                  auth.user.rol.code == 'ADMIN' ||
                  auth.user.rol.code == 'SUPERADMIN'
                "
                class="col-12 col-md-12"
              >
                <label>
                  <b> <b class="text-negative">* </b> STORE </b>
                </label>
                <q-select
                  v-model="form.store"
                  use-input
                  label="STORE"
                  option-value="_id"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="stores"
                  emit-value
                  map-options
                  @filter="filterStores"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No results
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> CATEGORY </b>
                </label>
                <q-select
                  v-model="form.storeCategory"
                  use-input
                  label="Category"
                  option-value="_id"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="productCategories"
                  emit-value
                  map-options
                  @filter="filterCategories"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No results
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> AMOUNT </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  type="number"
                  v-model="form.amount"
                />
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> AMOUNT TO NOTIFY </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  type="number"
                  v-model="form.amountToNotify"
                />
              </div>

              <div class="col-12 col-md-6">
                <label>
                  <b> <b class="text-negative">* </b> PRICE </b>
                </label>
                <q-input
                  outlined
                  dense
                  color="primary"
                  type="number"
                  v-model="form.price"
                />
              </div>

              <q-file
                @update:model-value="updateFile"
                class="col-12 q-mt-sm"
                outlined
                label="Image"
                v-model="image"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
                <template v-slot:after>
                  <q-btn
                    style="height: 100%"
                    @click="
                      () => {
                        form.img = null;
                        image = null;
                      }
                    "
                  >
                    <q-icon name="delete" color="red" />
                  </q-btn>
                </template>
              </q-file>

              <div
                class="col-12 q-mt-sm"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <q-img
                  v-if="form.img"
                  :src="Array.isArray(form.img) ? form.img[0] : form.img"
                  spinner-color="white"
                  style="
                    height: 140px;
                    max-width: 150px;
                    border: 1px solid black;
                    border-radius: 20px;
                  "
                />
              </div>

              <div class="col-12">
                <label>
                  <b> <b class="text-negative">* </b> ACTIVE </b>
                </label>
                <q-checkbox v-model="form.isActived" />
              </div>

              <div class="col-12">
                <label>
                  <b> <b class="text-negative">* </b> PRIORITY IN HOME </b>
                </label>
                <q-checkbox v-model="form.priority" />
              </div>

              <div class="col-12 q-my-sm text-center">
                <q-btn
                  type="submit"
                  color="negative"
                  label="cancelar"
                  icon="cancel"
                  class="q-mx-sm"
                  @click="openModal = false"
                />

                <q-btn
                  type="submit"
                  color="primary"
                  label="guardar"
                  icon="save"
                  @click="save"
                  :disable="
                    form.name == '' ||
                    form.description == '' ||
                    Number(form.amount) <= 0 ||
                    form.price === '' ||
                    form.storeCategory == '' ||
                    form.storeCategory == null ||
                    ((auth.user.rol.code == 'ADMIN' ||
                      auth.user.rol.code == 'SUPERADMIN') &&
                      !form.store)
                  "
                />
              </div>
            </div>
          </q-card-section>

          <q-inner-loading
            :showing="modalLoading"
            label="Please wait..."
            label-class="text-blue-11"
            label-style="font-size: 1.5em"
          />
        </q-card>
      </q-dialog>

      <!-- modal image -->
      <q-dialog v-model="openModalImage" persistent>
        <q-card style="width: 500px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="image" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>UPLOAD IMAGE</b>
                </div>
              </div>
            </div>

            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="openModalImage = false"
            >
              cancel
            </span>
          </div>

          <div class="col-12 q-pa-md">
            <q-file
              @update:model-value="updateFile"
              class="col-12 q-mt-sm"
              outlined
              label="Image"
              v-model="image"
              use-chips
              multiple
              counter
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <div class="col-12 q-mt-sm" v-if="imagesURL.length > 0">
              <q-carousel
                class="col-12"
                swipeable
                animated
                v-model="slide"
                thumbnails
              >
                <q-carousel-slide
                  v-for="(item, index) in imagesURL"
                  :name="index"
                  :img-src="item"
                  :key="index"
                />
              </q-carousel>
            </div>

            <div class="col-12 q-my-sm text-center">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                class="q-mx-sm"
                @click="openModalImage = false"
              />

              <q-btn
                type="submit"
                color="primary"
                label="guardar"
                icon="save"
                @click="saveImages"
                :disable="imagesURL.length <= 0"
              />
            </div>
          </div>

          <q-inner-loading
            :showing="modalLoading"
            label="Please wait..."
            label-class="text-blue-11"
            label-style="font-size: 1.1em"
          />
        </q-card>
      </q-dialog>

      <!-- modal add amount -->
      <q-dialog v-model="openModalAdd" persistent>
        <q-card style="width: 600px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="image" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>ADD AMOUNT</b>
                </div>
              </div>
            </div>

            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="
                openModalAdd = false;
                amountToAdd = 0;
              "
            >
              cancel
            </span>
          </div>

          <div class="row q-col-gutter-sm q-px-lg">
            <div class="col-12 col-md-6">
              <label>
                <b> AMOUNT </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                type="number"
                v-model="form.amount"
                disable
              />
            </div>

            <div class="col-12 col-md-6">
              <label>
                <b> <b class="text-negative">* </b> AMOUNT TO ADD </b>
              </label>
              <q-input
                outlined
                dense
                color="primary"
                type="number"
                v-model="amountToAdd"
              />
            </div>

            <div class="col-12 q-my-sm text-center q-mb-md">
              <q-btn
                type="submit"
                color="negative"
                label="cancelar"
                icon="cancel"
                class="q-mx-sm"
                @click="
                  openModalAdd = false;
                  amountToAdd = 0;
                "
              />

              <q-btn
                type="submit"
                color="primary"
                label="guardar"
                icon="save"
                @click="addProducts"
                :disable="Number(amountToAdd) <= 0"
              />
            </div>
          </div>

          <q-inner-loading
            :showing="modalLoading"
            label="Please wait..."
            label-class="text-blue-11"
            label-style="font-size: 1.1em"
          />
        </q-card>
      </q-dialog>

      <NotificationsVue ref="notify" />
      <Delete ref="deleteInfo" @deleteGood="refreshCurrentList" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import columns from "src/components/utils/columns";
import NotificationsVue from "src/components/utils/Notifications.vue";
import Delete from "src/components/utils/Delete.vue";
import ImagenVue from "src/components/utils/Imagen.vue";
import { authStore } from "src/stores/auth-store";
import { formatCurrency } from "../../utils";

const limit = ref(10);
const initial = ref(0);
const initialPagination = ref(1);

const auth = authStore();
const notify = ref();
const deleteInfo = ref();

const productCategorySelected = ref(null);
const statusSelected = ref(null);
const storeSelected = ref(null);

const statusArr = ref([
  { name: "ACTIVE", value: 1 },
  { name: "INACTIVE", value: 0 },
]);

const stores = ref([]);
const storesFilter = ref([]);
const productCategories = ref([]);
const productCategoriesFilter = ref([]);
const productQuantity = ref(1); // total pages

const id = ref(null);
const rows = ref([]);
const TableFilter = ref([]);
const image = ref(null);
const imagesURL = ref([]);
const slide = ref(0);
const modalLoading = ref(false);

const openModal = ref(false);
const openModalImage = ref(false);
const openModalAdd = ref(false);

const mode = ref(false);
const text = ref("");
const searchApplied = ref(""); // <-- texto aplicado al endpoint (debounced)

const form = ref({
  name: "",
  description: "",
  amount: 0,
  price: "",
  storeCategory: "",
  isActived: true,
  store: auth.user.rol.code == "STORE" ? auth.user._id : "",
  img: null,
  priority: false,
  amountToNotify: 0,
});

const amountToAdd = ref(0);
const tableLoading = ref(false);

let searchTimeout = null;
let requestSeq = 0; // evita race conditions (respuesta vieja pisa nueva)

onMounted(async () => {
  if (auth.user.rol.code == "ADMIN" || auth.user.rol.code == "SUPERADMIN") {
    await getAllStore();
  }

  if (auth.user.rol.code == "STORE") {
    await getProductCategories();
  }

  await getProducts();
});

/* =========================
   HELPERS
========================= */

const normalizeFiles = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value instanceof File) return [value];
  if (value?.target?.files) return Array.from(value.target.files);
  if (typeof value?.length === "number" && typeof value !== "string") {
    return Array.from(value);
  }
  return [];
};

const getSingleFile = (value) => {
  const files = normalizeFiles(value);
  return files.length > 0 ? files[0] : null;
};

const getOffsetFromPage = (page) =>
  Math.max(0, (Number(page) - 1) * Number(limit.value));

const goFirstPageAndFetch = async () => {
  if (initialPagination.value !== 1) {
    initialPagination.value = 1; // watcher de página hará fetch
    return;
  }
  initial.value = 0;
  await getProducts();
};

const activeFiltersSignature = computed(() =>
  JSON.stringify({
    status: statusSelected.value?.value ?? null,
    categoryId: productCategorySelected.value?._id ?? null,
    storeId: storeSelected.value?._id ?? null,
    search: (searchApplied.value || "").trim(),
  }),
);

/* =========================
   WATCHERS
========================= */

// Paginación -> fetch
watch(initialPagination, async (page) => {
  initial.value = getOffsetFromPage(page);
  await getProducts();
});

// Filtros (status/category/store) -> page 1 + fetch
watch([productCategorySelected, statusSelected, storeSelected], async () => {
  await goFirstPageAndFetch();
});

// Búsqueda debounced -> aplica texto + page 1 + fetch
const search = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const next = String(text.value || "").trim();

    // evita fetch duplicado si el texto aplicado no cambió
    if (next === searchApplied.value) return;

    searchApplied.value = next;
    await goFirstPageAndFetch();
  }, 350);
};

// si cambia la tienda del formulario (modal), recargar categorías (solo admin/superadmin)
watch(
  () => form.value.store,
  async (value) => {
    if (
      value &&
      (auth.user.rol.code == "ADMIN" || auth.user.rol.code == "SUPERADMIN")
    ) {
      await getProductCategories(value);
    }
  },
);

/* =========================
   URL / FETCH
========================= */

const buildProductsUrl = () => {
  const base = `stores/getProductStore/null/${limit.value}/${initial.value}`;
  const params = new URLSearchParams();

  if (statusSelected.value) {
    params.append("status", String(statusSelected.value.value));
  }

  if (productCategorySelected.value?._id) {
    params.append("categoryId", String(productCategorySelected.value._id));
  }

  if (storeSelected.value?._id) {
    params.append("storeId", String(storeSelected.value._id));
  }

  if (searchApplied.value) {
    params.append("search", searchApplied.value);
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};

const getProducts = async () => {
  const currentRequest = ++requestSeq;

  try {
    tableLoading.value = true;

    const url = buildProductsUrl();
    const resp = await methodsHttp.getApi(url);

    // Si llegó una respuesta vieja, la ignoramos
    if (currentRequest !== requestSeq) return;

    if (!resp?.ok) {
      rows.value = [];
      TableFilter.value = [];
      productQuantity.value = 1;
      return;
    }

    const totalPages =
      Number(resp?.pagination?.totalPages) ||
      Math.max(1, Math.ceil((resp?.count || 0) / Number(limit.value)));

    // Si quedé en una página inválida (ej. borré y bajó el total), corrige y refetch
    if (initialPagination.value > totalPages) {
      initialPagination.value = totalPages; // watcher hará fetch
      return;
    }

    rows.value = resp.products || [];
    TableFilter.value = resp.products || [];
    productQuantity.value = totalPages;
  } catch (error) {
    console.log(error);
    rows.value = [];
    TableFilter.value = [];
    productQuantity.value = 1;
    notify.value?.showNotifyBad("An error has ocurred");
  } finally {
    // solo baja loading si esta es la última request
    if (currentRequest === requestSeq) {
      tableLoading.value = false;
    }
  }
};

const refreshCurrentList = async () => {
  await getProducts();
};

/* =========================
   CATALOGS
========================= */

const getProductCategories = async (storeId = null) => {
  const storeParam =
    auth.user.rol.code == "STORE"
      ? "null"
      : storeId || form.value.store || storeSelected.value?._id || "null";

  const resp = await methodsHttp.getApi(
    `stores/getCategoryByStoreId/${storeParam}`,
  );

  if (resp?.ok) {
    productCategories.value = resp.storeCategory || [];
    productCategoriesFilter.value = resp.storeCategory || [];
  } else {
    productCategories.value = [];
    productCategoriesFilter.value = [];
  }
};

const getAllStore = async () => {
  const resp = await methodsHttp.getApi(`stores/getAllStore`);
  if (resp?.ok) {
    stores.value = resp.stores || [];
    storesFilter.value = resp.stores || [];
  } else {
    stores.value = [];
    storesFilter.value = [];
  }
};

/* =========================
   FILES / IMAGES
========================= */

const updateFile = (value) => {
  const files = normalizeFiles(value);

  if (openModalImage.value) {
    imagesURL.value = files.map((file) => URL.createObjectURL(file));
    slide.value = 0;
  } else {
    const first = files[0];
    form.value.img = first ? URL.createObjectURL(first) : null;
  }
};

/* =========================
   UI ACTIONS
========================= */

const clear = () => {
  form.value.name = "";
  form.value.description = "";
  form.value.isActived = true;
  form.value.amount = 0;
  form.value.amountToNotify = 0;
  form.value.price = "";
  form.value.storeCategory = "";
  form.value.img = null;
  form.value.priority = false;
  form.value.store =
    auth.user.rol.code == "STORE"
      ? auth.user._id
      : storeSelected.value?._id || "";

  image.value = null;
  imagesURL.value = [];
  slide.value = 0;
};

const updateState = async (item) => {
  try {
    tableLoading.value = true;

    const resp = await methodsHttp.putApi(
      `stores/updateStoreProduct/${item._id}`,
      {
        isActived: !item.isActived,
      },
    );

    if (resp.ok) {
      notify.value?.showNotifyGood(resp.mensaje);
      await refreshCurrentList(); // mantiene página y filtros
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } catch (error) {
    console.log(error);
    notify.value?.showNotifyBad("An error has ocurred");
  } finally {
    tableLoading.value = false;
  }
};

const openModalEdit = async (item) => {
  form.value.name = item.name || "";
  form.value.description = item.description || "";
  form.value.amount = item.amount ?? 0;
  form.value.amountToNotify = item.amountToNotify ?? 0;
  form.value.price = item.price ?? "";
  form.value.storeCategory =
    item.storeCategory?._id || item.storeCategory || "";
  form.value.isActived = !!item.isActived;
  form.value.img = item.img || null;
  form.value.priority = !!item.priority;
  form.value.store = item.store?._id || item.store || "";
  mode.value = true;
  openModal.value = true;
  id.value = item._id;

  if (auth.user.rol.code == "ADMIN" || auth.user.rol.code == "SUPERADMIN") {
    await getProductCategories(form.value.store);
  }
};

const openModalImageFunct = (item) => {
  openModalImage.value = true;
  id.value = item._id;
  image.value = null;
  imagesURL.value = Array.isArray(item.imgs) ? item.imgs : [];
  slide.value = 0;
};

const openModalAddFunction = (item) => {
  openModalAdd.value = true;
  form.value.amount = item.amount ?? 0;
  id.value = item._id;
};

const filterCategories = (val, update) => {
  update(
    () => {
      if (val == "") {
        productCategories.value = productCategoriesFilter.value;
      } else {
        const needle = val.toLowerCase();
        productCategories.value = productCategoriesFilter.value.filter((v) =>
          String(v.name || "")
            .toLowerCase()
            .includes(needle),
        );
      }
    },
    (ref) => {
      if (val !== "") {
        ref.setOptionIndex(-1);
        ref.moveOptionSelection(1, true);
      }
    },
  );
};

const filterStores = (val, update) => {
  update(
    () => {
      if (val == "") {
        stores.value = storesFilter.value;
      } else {
        const needle = val.toLowerCase();
        stores.value = storesFilter.value.filter((v) =>
          String(v.name || "")
            .toLowerCase()
            .includes(needle),
        );
      }
    },
    (ref) => {
      if (val !== "") {
        ref.setOptionIndex(-1);
        ref.moveOptionSelection(1, true);
      }
    },
  );
};

const createDepartments = async () => {
  clear();
  mode.value = false;
  openModal.value = true;

  if (
    (auth.user.rol.code == "ADMIN" || auth.user.rol.code == "SUPERADMIN") &&
    form.value.store
  ) {
    await getProductCategories(form.value.store);
  }
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: `stores/deleteProductStore`,
  };
  deleteInfo.value?.openDelete(data);
};

/* =========================
   SAVE / UPDATES
========================= */

const save = async () => {
  try {
    modalLoading.value = true;

    if (!mode.value) {
      const payload = { ...form.value, img: "" };
      const resp = await methodsHttp.postApi("stores/createProducts", payload);

      if (resp.ok) {
        const file = getSingleFile(image.value);

        if (file) {
          const formData = new FormData();
          formData.append("image", file);

          await methodsHttp.putApi(
            `stores/updateProductsImage/${resp?.storeProduct?._id}`,
            formData,
          );
        }

        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);

        // normalmente conviene ir a página 1 si creaste algo y ordenas desc por createdAt
        await goFirstPageAndFetch();
        clear();
      } else {
        notify.value?.showNotifyBad(resp.mensaje);
      }
    } else {
      const payload = { ...form.value };
      delete payload.img;

      const resp = await methodsHttp.putApi(
        `stores/updateStoreProduct/${id.value}`,
        payload,
      );

      if (resp.ok) {
        const file = getSingleFile(image.value);

        if (file) {
          const formData = new FormData();
          formData.append("image", file);

          await methodsHttp.putApi(
            `stores/updateProductsImage/${resp?.storeProduct?._id || id.value}`,
            formData,
          );
        }

        openModal.value = false;
        notify.value?.showNotifyGood(resp.mensaje);
        await refreshCurrentList(); // mantiene filtros + página
        clear();
      } else {
        notify.value?.showNotifyBad(resp.mensaje);
      }
    }
  } catch (error) {
    console.log(error);
    notify.value?.showNotifyBad("An error has ocurred");
  } finally {
    modalLoading.value = false;
  }
};

const saveImages = async () => {
  try {
    modalLoading.value = true;
    const formData = new FormData();

    const files = normalizeFiles(image.value);
    if (files.length > 0) {
      for (let file of files) {
        formData.append("images", file);
      }
    }

    const response = await methodsHttp.postApi(
      `stores/saveMultiImagesProduct/${id.value}`,
      formData,
    );

    if (response.ok) {
      openModalImage.value = false;
      notify.value?.showNotifyGood(response.mensaje);
      await refreshCurrentList();
      clear();
    } else {
      notify.value?.showNotifyBad(response.mensaje || "An error has ocurred");
    }
  } catch (error) {
    console.log(error);
    notify.value?.showNotifyBad("An error has ocurred");
  } finally {
    modalLoading.value = false;
  }
};

const addProducts = async () => {
  try {
    modalLoading.value = true;

    const response = await methodsHttp.postApi(
      `stores/addProductAmount/${id.value}`,
      { amount: Number(amountToAdd.value) },
    );

    if (response.ok) {
      amountToAdd.value = 0;
      openModalAdd.value = false;
      notify.value?.showNotifyGood(response.mensaje);
      form.value = { ...form.value, ...response.product };
      await refreshCurrentList(); // mantiene página y filtros
    } else {
      notify.value?.showNotifyBad(response.mensaje || "An error has ocurred");
    }
  } catch (error) {
    console.log(error);
    notify.value?.showNotifyBad("An error has ocurred");
  } finally {
    modalLoading.value = false;
  }
};
</script>

<style>
.description-cell {
  white-space: normal;
  word-break: break-word;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
