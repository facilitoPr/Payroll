import { boot } from "quasar/wrappers";
import { setCssVar } from "quasar";
import { appConfig } from "src/config/app.config";

const hexToRgb = (hex) => {
  const cleanHex = String(hex || "")
    .replace("#", "")
    .trim();

  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return "23, 141, 210";
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
};

export default boot(() => {
  const primary = appConfig.colors.primary;
  const secondary = appConfig.colors.secondary;

  setCssVar("primary", primary);
  setCssVar("secondary", secondary);

  document.documentElement.style.setProperty("--app-primary", primary);
  document.documentElement.style.setProperty("--app-secondary", secondary);
  document.documentElement.style.setProperty(
    "--app-primary-rgb",
    hexToRgb(primary),
  );
});
