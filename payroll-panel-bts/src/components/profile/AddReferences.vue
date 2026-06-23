<template>
  <div>
    <div class="row justify-center">
      <div class="col-12 q-mt-lg row justify-end" v-if="!editMode">
        <q-icon
          class="col-auto"
          style="cursor: pointer"
          size="20px "
          name="edit_square"
          color="primary"
          @click="enableModeEdit"
        />
      </div>
      <div class="col-12 q-mt-lg row justify-end" v-if="editMode">
        <q-icon
          class="col-auto"
          style="cursor: pointer"
          size="20px "
          name="cancel"
          color="negative"
          @click="editMode = false"
        >
        <q-tooltip class="bg-primary text-white"><b>Close</b></q-tooltip>
      </q-icon>
      </div>

      <div class="col-12 col-md-5 q-mr-md">
        <div class="row items-center">
          <div class="col-auto q-mr-sm">
            <q-icon size="2em" name="where_to_vote" color="primary" />
          </div>
          <div class="col-auto title-input">Referencia del consultorio</div>
        </div>
        <div class="details">
          Edificio, número de puerta y nivel subDepartments
        </div>
      </div>
      <div class="q-my-sm col-12 col-md-5" style="text-align: justify;" v-if="editMode == false">
        {{ auth.reference.reference }}
      </div>

      <div class="q-my-sm col-12 col-md-5" v-if="editMode == true">
        <q-input
          outlined
          color="primary"
          type="textarea" 
          v-model="auth.reference.reference"
          style="background-color: #f2f6f7"
        />
        <q-icon
          class="col-auto"
          style="cursor: pointer"
          size="20px "
          name="save_as"
          color="primary"
          @click="save"
        >
          <q-tooltip class="bg-primary text-white"><b>Save</b></q-tooltip>
        </q-icon>
      </div>
    </div>
    <NotificationsVue ref="notify" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import { authStore } from "src/stores/auth-store";

const auth = authStore();
const notify = ref();
const editMode = ref(false);

const reference = ref(auth.reference.reference);

const save = async () => {
  const data = {
    reference: auth.reference.reference,
    institutions: auth.institutionsSelected._id,
    medico: auth.information._id,
  };
  if (auth.reference?._id == undefined) {
    let resp = await methodsHttp.postApi(`reference/createReference`, data);
    if (resp.ok) {
      localStorage.setItem("reference", JSON.stringify(resp.reference));
      auth.addReference(resp.reference);
      editMode.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  } else {
    let resp = await methodsHttp.putApi(
      `reference/updateReference/${auth.reference?._id}`,
      data
    );
    if (resp.ok) {
      localStorage.setItem("reference", JSON.stringify(resp.reference));
      auth.addReference(resp.reference);
      editMode.value = false;
      notify.value?.showNotifyGood(resp.mensaje);
    } else {
      notify.value?.showNotifyBad(resp.mensaje);
    }
  }
};

const enableModeEdit = () => {
  editMode.value = true;
  reference.value = auth.reference.reference;
};

const openModal = ref(true);
</script>
