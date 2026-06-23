export const appConfig = {
  companyName: process.env.COMPANY_NAME || "Blue Technology Solution",
  companySubtitle:
    process.env.COMPANY_SUBTITLE || "Soluciones tecnológicas empresariales",

  colors: {
    primary: process.env.APP_PRIMARY_COLOR || "#178DD2",
    secondary: process.env.APP_SECONDARY_COLOR || "#51B0A7",
    selectMenu: process.env.APP_SELECT_MENU || "#E8E8F0",
    selectMenuHover: process.env.APP_SELECT_MENU_HOVER || "#E8E8F0",
  },
};