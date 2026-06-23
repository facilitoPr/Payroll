import { DEVICE_ID_KEY } from "src/constant/authStorage";

export function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    // Navegadores modernos
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getPlatformWeb() {
  return "web";
}
