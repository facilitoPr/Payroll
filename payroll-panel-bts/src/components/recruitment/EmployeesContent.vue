<template>
  <div class="">


    <!-- modal -->
    <div>
      <q-dialog v-model="openModal" persistent>
        <q-card style="width: 750px; max-width: 80vw">
          <q-inner-loading
            :showing="isLoading"
            label="Enviando..."
            label-class="text-blue-11"
            label-style="font-size: 1.1em"
          />
          <div class="bg-primary row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="people" color="white" />
                </div>
                <div class="col-auto text-white">
                  <b>{{ isEditMode ? "EDITAR EMPLEADO" : "CREAR EMPLEADO" }}</b>
                </div>
              </div>

              <!-- groups -->
            </div>
            <span
              class="material-icons text-white"
              style="font-size: 23px; cursor: pointer"
              @click="openModal = false"
            >
              cancel
            </span>
          </div>
          <q-card-section class="q-pt-sm">
            <div class="q-pt-sm row q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> NOMBRE COMPLETO </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.name">
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> EMAIL </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.email">
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> FECHA DE CONTRATACION </b>
                </label>
                <q-input
                  v-model="form.hiringDate"
                  label="Fecha de Ccontratacion"
                  type="date"
                  dense
                  outlined
                />
              </div>

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> TELEFONO </b>
                </label>
                <q-input outlined dense color="primary" v-model="form.phone">
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> DEPARTAMENTO </b>
                </label>
                <q-select
                  v-model="departmentSeleted"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="department"
                  option-value="_id"
                  emit-value
                  map-options
                  @update:model-value="onDepartmentChange"
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

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> PUESTO DE TRABAJO </b>
                </label>
                <q-select
                  v-model="jobPositionSelected"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="jobPositions"
                  option-value="_id"
                  emit-value
                  map-options
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

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> PROYECTO </b>
                </label>
                <q-select
                  v-model="projectSeleted"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="project"
                  option-value="_id"
                  emit-value
                  map-options
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

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> TIPO DE SALARIO </b>
                </label>
                <q-select
                  v-model="salaryTypeSelected"
                  option-label="name"
                  outlined
                  dense
                  color="primary"
                  :options="salaryType"
                  option-value="_id"
                  emit-value
                  map-options
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

              <div
                class="col-12 col-md-4"
                v-if="
                  (salaryTypeSelected != null) &
                  (salaryTypeSelected?.code == 'FIJO')
                "
              >
                <label>
                  <b> <b class="text-negative">* </b> SUELDO BASE </b>
                </label>
                <q-input
                  v-model.number="form.baseSalary"
                  label="Sueldo base"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div
                class="col-12 col-md-4"
                v-if="
                  (salaryTypeSelected != null) &
                  (salaryTypeSelected?.code == 'HORAS')
                "
              >
                <label>
                  <b> <b class="text-negative">* </b> TARIFA POR HORA </b>
                </label>
                <q-input
                  v-model.number="form.hourlyRate"
                  label="Sueldo base"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> DIAS DE PAGOS </b>
                </label>
                <q-select
                  v-model="paymentSchedulesSelected"
                  :options="paymentSchedules"
                  option-label="name"
                  option-value="_id"
                  emit-value
                  map-options
                  outlined
                  dense
                  color="primary"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <div class="text-bold">{{ scope.opt.name }}</div>
                        <div class="text-caption text-grey">
                          {{ scope.opt.paymentFrequency?.name }}
                        </div>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <!-- <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> CONTRASEÑA </b>
                </label>

                <q-input v-model="form.password" outlined dense :type="isPassword ? 'password' : 'text'">
                  <template v-slot:append>
                    <q-icon :name="isPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                      @click="isPassword = !isPassword" />
                  </template>
                </q-input>
              </div> -->

              <div class="col-12 col-md-4">
                <label>
                  <b> <b class="text-negative">* </b> FECHA DE SALIDA </b>
                </label>
                <q-input
                  v-model="form.exitDate"
                  label="Fecha de salida"
                  type="date"
                  dense
                  outlined
                />
              </div>

              <div class="col-12 col-md-4">
                <label>
                  <b> RECONTRATACIÓN? </b>
                </label>
                <q-select
                  outlined
                  v-model="form.rehiring"
                  option-value="value"
                  option-label="label"
                  dense
                  color="primary"
                  :options="[
                    { value: 'SI', label: 'SI' },
                    { value: 'NO', label: 'NO' },
                  ]"
                />
              </div>

              <!-- ACTIVATE -->
              <div class="col-12 col-md-4">
                <div>
                  <label class="text-white">.</label>
                </div>
                <div
                  class="row items-center justify-between q-pa-sm"
                  style="
                    border-radius: 4px;

                    border: 1px solid #adadad;
                  "
                >
                  <div class="row items-center q-gutter-sm">
                    <q-icon name="toggle_on" color="primary" />
                    <div>
                      <div class="text-subtitle2"><b>Activate</b></div>
                    </div>
                  </div>
                  <div class="row items-center q-gutter-sm">
                    <!-- <q-chip
                      dense
                      square
                      :color="form.isActived ? 'secondary' : 'negative'"
                      text-color="white"
                    >
                      {{ form.isActived ? "ACTIVE" : "INACTIVE" }}
                    </q-chip> -->
                    <q-toggle
                      v-model="form.isActived"
                      color="primary"
                      checked-icon="check"
                      unchecked-icon="close"
                      :label="form.isActived ? 'Active' : 'Inactive'"
                      left-label
                      dense
                    />
                  </div>
                </div>
              </div>

              <transition name="fade">
                <div
                  class="col-12 col-md-4"
                  v-if="currentDepartmentCode?.code === requiredDepartmentCode"
                >
                  <label>
                    <b> <b class="text-negative">* </b> EXT </b>
                  </label>

                  <q-input
                    outlined
                    dense
                    color="primary"
                    v-model="form.ext"
                    :rules="specialFieldRules"
                  />
                </div>
              </transition>

              <div class="col-12" v-if="form.exitDate">
                <label>
                  <b> NOTA DE SALIDA </b>
                </label>
                <q-input
                  type="textarea"
                  outlined
                  dense
                  color="primary"
                  v-model="form.exitNote"
                >
                </q-input>
              </div>

              <q-file
                @input="updateFile"
                class="col-12 q-mt-sm"
                outlined
                dense
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
                  :src="form.img"
                  spinner-color="white"
                  style="
                    height: 140px;
                    max-width: 150px;
                    border: 1px solid black;
                    border-radius: 20px;
                  "
                />
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
                    form.email == '' ||
                    form.hiringDate == '' ||
                    departmentSeleted == null ||
                    projectSeleted == null ||
                    jobPositionSelected == null ||
                    salaryTypeSelected == null ||
                    paymentSchedulesSelected == null
                  "
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <!-- modal Horario -->
    <div>
      <q-dialog v-model="openModalMySchedule" persistent>
        <q-card style="width: 750px; max-width: 80vw">
          <div class="bg-white row justify-between q-pa-md">
            <div class="text-white" style="font-size: 19px; font-weight: 500">
              <div class="row items-center">
                <div class="col-auto q-mx-sm">
                  <q-icon size="2em" name="calendar_month" color="primary" />
                </div>
                <div class="col-auto text-primary">
                  <b>HORARIO</b>
                </div>
              </div>
            </div>
            <span
              class="material-icons text-negative"
              style="font-size: 23px; cursor: pointer"
              @click="openModalMySchedule = false"
            >
              cancel
            </span>
          </div>

          <q-card-section class="q-pt-sm">
            <div class="q-pt-sm row q-col-gutter-sm">
              <div
                v-for="[dia, data] in Object.entries(mySchedule)"
                :key="dia"
                class="col-3 row items-start"
              >
                <div
                  class="col-12 bg-primary text-center text-white text-bold q-pa-sm"
                >
                  {{ dia }}
                </div>
                <div class="col-12 row">
                  <div class="col-12" v-if="data.isActive">
                    <div class="col-12">Entrada:{{ data.entryTime }}</div>
                    <div class="col-12">
                      Almuerzo:{{ data.lunchStartTime }},
                      {{ data.lunchEndTime }}
                    </div>
                    <div class="col-12">Salida:{{ data.exitTime }}</div>
                  </div>
                  <div class="col-12" v-else>
                    <em>No trabaja este día</em>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <!-- table -->
    <div>
      <q-table
        :loading="tableLoading"
        flat
        bordered
        dense
        row-key="_id"
        :rows="rows"
        :columns="columns.columnsOperators()"
        :rows-per-page-options="[limit]"
        hide-pagination
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="actions" :props="props">
              <ActionsButtons :menuItems="menuItems" :data="props.row" />
            </q-td>
            <q-td key="image" :props="props">
              <ImagenVue
                :img="
                  props.row.img
                    ? props.row.img
                    : 'https://plus-nautic.nyc3.cdn.digitaloceanspaces.com/default.webp'
                "
                style="
                  cursor: pointer;
                  width: 50px;
                  height: 50px;
                  overflow: hidden;
                "
              />
            </q-td>

            <q-td key="cv" :props="props">
              <div
                v-if="props.row.document"
                style="cursor: pointer"
                @click="abrirDocumento(props.row.document)"
              >
                <q-icon name="description" color="primary" size="2rem" />
              </div>
              <div class="text-center text-negative" v-else>No hay cv</div>
            </q-td>

            <q-td key="contract" :props="props">
              <div
                v-if="props.row.contract"
                style="cursor: pointer"
                @click="abrirDocumento(props.row.contract)"
              >
                <q-icon name="description" color="primary" size="2rem" />
              </div>
              <div class="text-center text-negative" v-else>
                No hay contrato
              </div>
            </q-td>

            <q-td key="name" :props="props">
              <div>
                {{ props.row.name }}
              </div>
              <div>
                {{ props.row.email }}
              </div>
            </q-td>
            <q-td key="phone" :props="props">
              {{ formatearTelefono(props.row.phone) }}
            </q-td>
            <q-td key="project" :props="props">
              <div v-if="props.row?.project">
                {{ props.row?.project?.name }}
              </div>
              <div v-else class="text-negative">Proyecto no definido</div>
            </q-td>
            <q-td key="department" :props="props">
              <div v-if="props.row?.department">
                {{ props.row?.department?.name }}
              </div>
              <div v-else class="text-negative">Departamento no definido</div>
            </q-td>
            <q-td key="codeEmployee" :props="props">
              <div class="text-center" v-if="props.row.code_punch">
                {{ props.row.code_punch }}
              </div>
              <div v-else class="text-center text-negative">
                Codigo de empleado no definido
              </div>
            </q-td>
            <q-td key="ext" :props="props">
              <div class="text-center" v-if="props.row.ext">
                {{ props.row.ext }}
              </div>
              <div v-else class="text-center text-negative">
                EXT. No definido.
              </div>
            </q-td>
            <q-td key="salaryType" :props="props">
              <div v-if="props.row.salaryType">
                <div class="">
                  {{ props.row.salaryType?.name }}
                </div>
                <div>
                  {{ props.row.salaryType?.description }}
                </div>
              </div>
              <div v-else class="text-negative">
                Tipo de salario no definido
              </div>
            </q-td>
            <q-td key="salary" :props="props">
              <div class="text-center" v-if="props.row.baseSalary">
                <b class="text-secondary">$</b>
                {{ formatter2(props.row.baseSalary) }} (neto)
              </div>
              <div class="text-center" v-if="props.row.hourlyRate">
                <b class="text-secondary">$</b>
                {{ formatter2(props.row.hourlyRate) }} (hora)
              </div>
              <div
                class="text-center"
                v-if="!props.row.hourlyRate && !props.row.baseSalary"
              >
                <div class="text-negative">
                  <b class="text-secondary">$ </b>{{ formatter2(0) }}
                </div>
              </div>
            </q-td>

            <q-td key="schedulePayment" :props="props">
              <div v-if="props.row.paymentSchedule">
                <div class="">
                  {{ props.row.paymentSchedule?.paymentFrequency?.name }}
                </div>
                <div class="">
                  {{ props.row.paymentSchedule?.name }}
                </div>
              </div>
              <div v-else class="text-negative">Forma de pago no definido</div>
            </q-td>
            <q-td key="contractDate" :props="props">
              <div class="text-bold">
                {{ moment(props.row.hiringDate).format("YYYY/MM/DD") }}
              </div>
              {{
                (() => {
                  const now = moment();
                  const hiring = moment(props.row.hiringDate);
                  const diff = moment.duration(now.diff(hiring));
                  return `${diff.years()} años, ${diff.months()} meses, ${diff.days()} días`;
                })()
              }}
            </q-td>

            <q-td key="hourWork" :props="props">
              <div class="text-left" v-if="props.row.weeklyWorkHours">
                <!-- <li> -->
                <b> {{ props.row.weeklyWorkHours }}</b> Horas Semanales
                <!-- </li> -->
                <!-- <li>
                  Quincenal: <b> {{ props.row.weeklyWorkHours * 2 }}</b> horas
                </li>
                <li>
                  Mensual: <b> {{ props.row.weeklyWorkHours * 4 }}</b> horas
                </li> -->
              </div>
              <div v-else class="text-negative">No definido</div>
            </q-td>

            <q-td key="status" :props="props" @click="updateState(props.row)">
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
            <q-td key="punchType" :props="props">
              <div v-if="props.row.punchTypeId">
                {{ props.row.punchTypeId?.name }}
              </div>
              <div v-else class="text-negative">Tipo de ponche no definido</div>
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <div
        class="col-12 q-mt-sm"
        style="display: flex; align-items: center; justify-content: center"
      >
        <TablePagination
          v-model="initialPagination"
          :orderQuantity="orderQuantity"
          color="light-blue-10"
          active-color="light-blue-5"
          :initialPagination="initialPagination"
        />
      </div>
    </div>

    <NotificationsVue ref="notify" />
    <Delete ref="deleteInfo" @deleteGood="getOperators" />

    <ScheduleScreen
      ref="schedule"
      @update:modelValue="getOperators"
      :mySchedule="mySchedule"
      @saved="getOperators"
    />

    <Document
      ref="documento"
      @update:modelValue="
        () => {
          getOperators();
        }
      "
    />
    <Contract
      ref="contrato"
      @update:modelValue="
        () => {
          getOperators();
        }
      "
    />
    <UserDeduction ref="deduction" />
    <PaymentDetails ref="paymentDetails" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import columns from "src/components/utils/columns";
import Delete from "src/components/utils/Delete.vue";
import ImagenVue from "src/components/utils/Imagen.vue";
import ActionsButtons from "src/components/table/ActionsButtons.vue";
import TablePagination from "src/components/table/TablePagination.vue";
// import Schedule from "../components/horarios/Schedule.vue";
import ScheduleScreen from "src/components/horarios/ScheduleScreen.vue";
import Document from "src/components/utils/Document.vue";
import { formatearTelefono, formatter2 } from "app/utils";
import Contract from "src/components/utils/Contract.vue";
import moment from "moment";
import UserDeduction from "src/components/utils/UserDeduction.vue";
import PaymentDetails from "src/pages/PaymentDetails.vue";

const limit = ref(10);
const initial = ref(0);

const orderQuantity = ref(1);
const initialPagination = ref(1);

const text = ref("");
const notify = ref(null);
const deleteInfo = ref(null);
const schedule = ref(null);
const documento = ref(null);
const contrato = ref(null);
const deduction = ref(null);
const paymentDetails = ref(null);

const openModalMySchedule = ref(false);
const mySchedule = ref(null);

const rows = ref([]);
const TableFilter = ref([]);
const tableLoading = ref(false);
const openModal = ref(false);
const isEditMode = ref(false);
const id = ref(null);
const image = ref(null);
const form = ref({
  hiringDate: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  img: "",
  code: "",
  baseSalary: null,
  hourlyRate: null,
  ext: "",
  rehiring: "SI",
  isActived: true,
});
const isPassword = ref(true);
const isLoading = ref(false);

const punchType = ref([]);
const punchTypeSeleted = ref(null);

const salaryType = ref([]);
const salaryTypeSelected = ref(null);
const paymentSchedules = ref([]);
const paymentSchedulesSelected = ref(null);

const department = ref([]);
const requiredDepartmentCode = "TRIPLE_S";
const departmentSeleted = ref(null);
const codeField = ref("");
const oldCodeField = ref("");

const project = ref([]);
const projectSeleted = ref(null);

const rol = ref([]);
const rolSeleted = ref(null);

const jobPositions = ref([]);
const jobPositionSelected = ref(null);

//

onMounted(() => {
  getOperators();
  // getPunchType();
  // getSAllalaryType();
  // getAllPaymentSchedules();
  // getDepartment();
  // getProject();

  // getRoles();
});

watch(salaryTypeSelected, async (value) => {
  if (value.code == "FIJO") {
    form.value.hourlyRate = null;
  }
  if (value.code == "HORAS") {
    form.value.baseSalary = null;
  }
});

const getDepartment = async () => {
  let resp = await methodsHttp.getApi(`department/getDepartment`);
  if (resp.ok) {
    department.value = resp.department;
  }
};

const getJobPositions = async (department) => {
  let resp = await methodsHttp.getApi(
    `job-position/getJobPositions?department=${department}`
  );
  if (resp.ok) {
    jobPositions.value = resp.jobPositions;
  }
};

const getRoles = async () => {
  let resp = await methodsHttp.getApi(`rol/getRolesNomina`);
  if (resp.ok) {
    rol.value = resp.roles;
  }
};

const getProject = async () => {
  let resp = await methodsHttp.getApi(`project/getProject`);
  if (resp.ok) {
    project.value = resp.project;
  }
};

watch(initialPagination, async (value) => {
  initial.value = (await value) * 10;
  if (value == 1) {
    initial.value = 0;

    if (text.value) {
      return search();
    }

    getOperators();
  } else {
    initial.value = value * 10 - 10;

    if (text.value) {
      return search();
    }

    getOperators();
  }
});

const getPunchType = async () => {
  const resp = await methodsHttp.getApi(`punch/getPunchType`);

  if (resp.ok) {
    punchType.value = resp.punchType;
  } else {
    punchType.value = [];
  }
};

const getSAllalaryType = async () => {
  const resp = await methodsHttp.getApi(
    `employee-payment-management/getSalalaryType`
  );
  if (resp.ok) {
    salaryType.value = resp.salaryType;
  } else {
    salaryType.value = [];
  }
};

const getAllPaymentSchedules = async () => {
  const resp = await methodsHttp.getApi(
    `employee-payment-management/getAllPaymentSchedules`
  );
  if (resp.ok) {
    paymentSchedules.value = resp.schedules;
  } else {
    paymentSchedules.value = [];
  }
};

const getOperators = async () => {
  tableLoading.value = true;
  text.value = "";
  const resp = await methodsHttp.getApi(
    `user/getEmployees?limit=${limit.value}&initial=${initial.value}&isActived=true`
  );
  if (resp.ok) {
    rows.value = resp.employees;
    TableFilter.value = resp.employees;
    orderQuantity.value = Math.ceil(resp.count / 10);
  }
  tableLoading.value = false;
};

const specialFieldRules = computed(() => [
  (val) => {
    if (
      currentDepartment.value?.code === requiredDepartmentCode &&
      (!val || val === "")
    ) {
      return "EXT is required for this department";
    }
    return true;
  },
]);

const currentDepartmentCode = computed(() => {
  return (
    department.value.find((d) => d._id === departmentSeleted.value) || null
  );
});

const onDepartmentChange = async (id) => {
  await getJobPositions(id);
  const dep = department.value.find((d) => d._id === id);
  currentDepartmentCode.value = dep || null;

  // SOLO limpiar ext si NO es el depto que requiere extensión
  if (dep?.code !== requiredDepartmentCode) {
    form.value.ext = null;
  }
};

const create = () => {
  isEditMode.value = false;
  // clear();
  openModal.value = true;
  getAllData();
};

const openModalEdit = (item) => {
  getAllData();
  form.value.name = item.name;
  form.value.email = item.email;
  form.value.phone = item.phone;
  // form.value.rol = item.rol;
  form.value.img = item.img;
  form.value.ext = item.ext;
  form.value.hiringDate = item.hiringDate;
  salaryTypeSelected.value = item.salaryType;
  form.value.baseSalary = item.baseSalary;
  form.value.hourlyRate = item.hourlyRate;
  form.value.isActived = item.isActived;
  // form.value.password = item.password;
  paymentSchedulesSelected.value = item.paymentSchedule._id;
  departmentSeleted.value = item.department?._id;
  currentDepartmentCode.value =
    department.value.find((d) => d._id === item.department?._id) || null;

  projectSeleted.value = item?.project?._id;
  jobPositionSelected.value = item.jobPosition._id;
  // rolSeleted.value = item.rol;
  // form.value.password = item.phone.password;
  isEditMode.value = true;
  openModal.value = true;
  id.value = item._id;
};

const updateState = async (item) => {
  tableLoading.value = true;
  let resp = await methodsHttp.putApi(`user/updateUser/${item._id}`, {
    isActived: !item.isActived,
  });
  if (resp.ok) {
    openModal.value = false;
    notify.value?.showNotifyGood(resp.mensaje);
    getOperators();
    clear();
  } else {
    notify.value?.showNotifyBad(resp.mensaje);
  }
  tableLoading.value = false;
};

const clear = () => {
  form.value.name = "";
  form.value.email = "";
  form.value.phone = "";
  form.value.password = "";
  form.value.rol = "";
  form.value.img = null;
  form.value.isActived = true;
  image.value = null;
  form.value.baseSalary = null;
  form.value.hourlyRate = null;
  salaryTypeSelected.value = [];
  paymentSchedulesSelected.value = null;
  departmentSeleted.value = null;
  projectSeleted.value = null;
  jobPositionSelected.value = null;
  form.value.hiringDate = "";
  rolSeleted.value = null;
};

const openModalDelete = (item) => {
  const data = {
    id: item._id,
    ruta: "user/deleteUser",
  };

  deleteInfo.value?.openDelete(data);
};

const openModalSchedule = (item) => {
  schedule.value?.openModal(item);
  mySchedule.value = item.schedule;
};

const openModalDocument = (item) => {
  documento.value?.openModalDocument(item._id);
};

const openModalContract = (item) => {
  contrato.value?.openModalContract(item._id);
};

const openModalDeduction = (item) => {
  deduction.value?.openModalDeduction(item);
};

const openModalPaymentDetail = (item) => {
  paymentDetails.value?.verDetalle(item);
};

const save = async () => {
  try {
    isLoading.value = true;
    let resp;

    // Validaciones existentes
    if (salaryTypeSelected.value !== null) {
      if (salaryTypeSelected.value.code == "HORAS") {
        if (form.value.hourlyRate == null || form.value.hourlyRate == 0) {
          notify.value?.showNotifyBad("Sueldo por hora es obligatorio");
          return;
        }
      }
      if (salaryTypeSelected.value.code == "FIJO") {
        if (form.value.baseSalary == null || form.value.baseSalary == 0) {
          notify.value?.showNotifyBad("Sueldo base es obligatorio");
          return;
        }
      }
    }

    // Armar payload final
    const payload = {
      ...form.value,
      salaryType: salaryTypeSelected.value?._id || null,
      paymentSchedule: paymentSchedulesSelected.value || null,
      department: departmentSeleted.value || null,
      project: projectSeleted.value || null,
      jobPosition: jobPositionSelected.value || null,
      departmentCode: currentDepartmentCode.value?.code || null,
    };

    const formData = new FormData();

    if (image.value) {
      formData.append("images", image.value);
    }

    // ✅ Todos los campos a formData
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // numbers/booleans => string
      if (typeof value === "number" || typeof value === "boolean") {
        formData.append(key, String(value));
        return;
      }

      // arrays/objects => JSON string (por si mandas schedule u otros)
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
        return;
      }

      // strings
      formData.append(key, value);
    });

    // ✅ Enviar como multipart/form-data
    if (!isEditMode.value) {
      resp = await methodsHttp.postApi("user/createEmployee", formData);
    } else {
      resp = await methodsHttp.putApi(
        `user/updateEmployee/${id.value}`,
        formData
      );
    }

    if (resp?.ok) {
      openModal.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
      getOperators();
      clear();
    } else {
      notify.value?.showNotifyBad(resp?.mensaje || "Error desconocido");
    }
  } catch (error) {
    notify.value?.showNotifyBad("Error al guardar el empleado");
    console.error("Error en save:", error);
  } finally {
    isLoading.value = false;
  }
};

const search = async () => {
  if (text.value == "") {
    getOperators();
  } else {
    let resp = await methodsHttp.postApi(
      `user/searchOperadoras/${limit.value}/${initial.value}`,
      { text: text.value }
    );
    if (resp.ok) {
      rows.value = resp.users;
      orderQuantity.value = Math.ceil(resp.count / 10);
      // TableFilter.value = resp.products;
    }
  }
};

const updateFile = ({ target }) => {
  if (target.files[0]) {
    form.value.img = URL.createObjectURL(target.files[0]);
  }
};

const abrirDocumento = (url) => {
  window.open(url, "_blank");
};

const getAllData = () => {
  getPunchType();
  getSAllalaryType();
  getAllPaymentSchedules();
  getDepartment();
  getProject();
};

const menuItems = ref([
  {
    icon: "edit",
    text: "EDITAR",
    color: "primary",
    action: openModalEdit,
  },
  {
    icon: "calendar_month",
    text: "HORARIO",
    color: "primary",
    action: openModalSchedule,
  },
  {
    icon: "description",
    text: " CV",
    color: "primary",
    action: openModalDocument,
  },
  {
    icon: "description",
    text: "CONTRATO",
    color: "secondary",
    action: openModalContract,
  },

  {
    icon: "price_check",
    text: "DEDUCCIONES",
    color: "secondary",
    action: openModalDeduction,
  },
  {
    icon: "money",
    text: "DETALLE DE PAGO",
    color: "secondary",
    action: openModalPaymentDetail,
  },

  {
    icon: "delete",
    text: "ELIMINAR",
    color: "negative",
    action: openModalDelete,
  },
]);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/*  */

.header-card {
  border-radius: 16px;
  overflow: hidden;
}

.header-bg {
  /* suave, moderno, sin chocar con tu primary */
  /* background: linear-gradient(135deg, rgba(34, 44, 91, 0.08), rgba(0, 166, 231, 0.08)); */
}

.header-avatar {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.header-btn {
  height: 40px;
  border-radius: 12px;
}

.header-search {
  width: 340px;
  max-width: 100%;
}

@media (max-width: 599px) {
  .header-search {
    width: 100%;
  }
}
</style>

