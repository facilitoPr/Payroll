<template>
  <div class="q-pa-sm" v-if="auth.user.rol.code === 'SEGURIDAD'">
    <HomeSecurity />
  </div>
</template>

<script setup>
import HomeSecurity from "src/components/home/HomeSecurity.vue";
import { authStore } from "src/stores/auth-store";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = authStore();

const go = (name) => router.push(name); // si usas routes con name

onMounted(() => {
  const u = auth.user;
  const rol = u?.rol?.code;

  // ✅ 1) Manager manda primero
  if (u?.isManager) {
    return go("dashboard"); // o "managerDashboard"
  }

  // ✅ 2) Por puesto de trabajo
  const jobCode = u?.jobPosition?.code;  // si tienes code
  const jobName = u?.jobPosition?.name;  // si solo tienes name
  const deptCode = u?.department?.code;
  const deptName = u?.department?.name;

  console.log(deptCode)

  if(rol == "EMPLOYEE") {
    if (jobCode === "AGENTE_DE_CALL_CENTER" && deptCode === "TRIPLE_S") {
      return go("assignments");
    }
  
    if (jobCode === "AGENTE_DE_CALL_CENTER_2" && deptCode === "CONWASTE") {
      return go("conwaste");
    }
  
    if (deptCode === "RRHH" || deptName === "Recursos Humanos") {
      return go("dashboard");
    }
  }


  // ✅ 4) Fallback por rol (mientras migras)
  if (rol === "SUPERADMIN") return go("applications");
  if (rol === "MEDICO") return go("dasboard");
  if (rol === "ADMIN") return go("dashboard");
  if (rol === "STORE") return go("orders");
  if (rol === "CLIENT_TRIPLE_S") return go("assignments");

  // default
  return go("profile");
});
</script>


<style></style>
