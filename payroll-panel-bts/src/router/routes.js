import { portalRoutes } from "./routes/portal.routes";

const routes = [
  {
    path: "/",
    name: "PublicLanding",
    component: () => import("src/pages/public/PublicLandingPage.vue"),
  },

  {
    path: "/login",
    name: "Login",
    component: () => import("pages/Login.vue"),
    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/unauthorized",
    name: "Unauthorized",
    component: () => import("src/pages/app/Unauthorized.vue"),
  },

  {
    path: "/recruitment/:token",
    name: "RecruitmentForm",
    component: () => import("src/pages/LiveForm.vue"),
  },

  {
    path: "/punch",
    name: "Punch",
    component: () => import("pages/app/Punch.vue"),
  },

  ...portalRoutes,

  {
    path: "/:catchAll(.*)*",
    name: "ErrorNotFound",
    component: () => import("pages/app/ErrorNotFound.vue"),
  },
];

export default routes;
