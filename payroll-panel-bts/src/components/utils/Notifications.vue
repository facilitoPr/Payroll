<template>
  <div>
    <!-- <q-btn color="purple" @click="showNotifyGood" label="Show Notification" /> -->
  </div>
</template>

<script>
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

export default {
  setup() {
    const $q = useQuasar();
    const router = useRouter();

    return {
      showNotifyGood(item) {
        $q.notify({
          message: item,
          color: "green-7",
          multiLine: true,
          avatar: "https://cdn.quasar.dev/img/boy-avatar.png",
          position: "top-left",
        });
      },
      showNotifyBad(item) {
        $q.notify({
          message: item,
          color: "negative",
          multiLine: true,
          avatar: "https://cdn.quasar.dev/img/boy-avatar.png",
          position: "top-left",
        });
      },
      showNotifyGoodGo(item) {
        $q.notify({
          message: item,
          color: "green-7",
          multiLine: true,
          avatar: "https://cdn.quasar.dev/img/boy-avatar.png",
          position: "top-left",
          actions: [
            {
              label: "Ver",
              color: "yellow",
              handler: () => {
                // goToPage()
                router.push(`/citasMedicas`);
              },
            },
          ],
        });
      },
    };
  },
};
</script>
