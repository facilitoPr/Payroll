<template>
  <div class="col-row">
    <div class="row col-12">
      <div class="col-12 col-md-6 q-px-sm">
        <div style="font-size: 25px"><b>Información Personal</b></div>
        <div class="q-my-md">
          <q-separator />
        </div>
        <div class="row">
          <div class="col-12 col-md-5">
            <div class="title-input"><b>Avatar</b></div>
            <div>
              Mínimo 200x200 px, en formato cuadrado (por ejemplo, el avatar que
              usas para Twitter o Facebook).
            </div>
          </div>
          <div class="col-12 col-md-7 row items-center justify-between">
            <div class="col-auto">
              <div
                class="q-my-sm"
                style="width: 100px; height: 100px; border: solid 1px"
              >
                <ImagenVue
                  :img="
                    form.img
                      ? form.img
                      : 'https://adoscrila.nyc3.cdn.digitaloceanspaces.com/blankProfile.jpg'
                  "
                  :w="100"
                  :h="100"
                  style="cursor: pointer"
                />
              </div>
              <div style="width: 100px; height: 100px">
                <ImagenVue
                  img="https://adoscrila.nyc3.cdn.digitaloceanspaces.com/blankProfile.jpg"
                  :w="100"
                  :h="100"
                  style="cursor: pointer"
                />
              </div>
            </div>
            <div class="col-8">
              <q-btn
                color="primary"
                label=" Selecciona un nuevo Avatar"
                style="width: 100%; height: 40px"
              />
            </div>
          </div>
        </div>

        <div class="q-my-md">
          <q-separator />
        </div>

        <div class="row">
          <div class="col-12 col-md-5">
            <div class="title-input">Tu Nombre</div>
            <div>Usa tu nombre y apellidos reales.</div>
          </div>
          <div class="q-my-sm col-12 col-md-4">
            <q-input
              outlined
              dense
              color="primary"
              type="text"
              v-model="form.name"
            />
          </div>
        </div>

        <div class="q-my-md">
          <q-separator />
        </div>

        <div class="row">
          <div class="col-12 col-md-5">
            <div class="title-input"><b>Tu email</b></div>
            <div>
              Te enviaremos semanalmente nuevos empleos que coincidan con tus
              preferencias, y podrás recibir invitaciones a empleos por parte de
              empresas.
            </div>
          </div>
          <div class="q-my-sm col-12 col-md-4">
            <q-input
              outlined
              dense
              color="primary"
              type="mail"
              v-model="form.email"
            />
          </div>
        </div>

        <div class="q-my-md">
          <q-separator />
        </div>

        <div class="row">
          <div class="col-12 col-md-5">
            <div class="title-input">Número de teléfono móvil</div>
            <div>
              Te enviaremos semanalmente nuevos empleos que coincidan con tus
              preferencias, y podrás recibir invitaciones a empleos por parte de
              empresas.
            </div>
          </div>
          <div class="q-my-sm col-12 col-md-4">
            <q-input
              outlined
              dense
              color="primary"
              mask="(###) ### - ####"
              fill-mask
              type="tel"
              v-model="form.cell"
            />
          </div>
        </div>

        <div class="q-my-md">
          <q-separator />
        </div>
      </div>

      <div class="col-12 col-md-6 q-px-sm">
        <div style="font-size: 25px"><b>Información Laboral</b></div>
        <div class="q-my-md">
          <q-separator />
        </div>

        {{ specialist }}
      </div>
    </div>

  </div>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";
import methodsHttp from "src/api/methodsHttp";
import NotificationsVue from "src/components/utils/Notifications.vue";
import ImagenVue from "src/components/utils/Imagen.vue";
import { useRouter } from "vue-router";

const notify = ref();
const specialist = ref();
const router = useRouter();

const form = ref({
  name: "osiris soler",
  cell: "829492576",
  email: "",
  img: "",
});

onMounted(() => {
  getSpecialistById();
});

const getSpecialistById = async () => {
  let resp = await methodsHttp.getApi(
    `user/getMedicoById/${router.currentRoute._value.params.id}`
  );
  if (resp.ok) {
    specialist.value = resp.medico.img;

    form.value.email = resp.medico.user.email;
    form.value.cell = resp.medico.cell;
    form.value.img = resp.medico.img;
  }
};
</script>

<style scoped>
.bordere {
  border: red solid 1px;
}
.title-input {
  font-size: 20px;
  font-weight: bold;
}
</style>

