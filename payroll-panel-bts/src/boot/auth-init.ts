import { boot } from "quasar/wrappers";
import { authStore } from "src/stores/auth-store";

export default boot(async () => {
  const auth = authStore();

  if (!auth.hydrated && !auth.token) {
    await auth.refreshMe();
  }
});