import { authStore } from "src/stores/auth-store";  // Asegúrate de importar tu store

const token = localStorage.getItem("token");
export const AuthenticatedOnly = (to, from, next) => {

  if (token == null || token == "" || token == undefined) {
    next({ name: "Login" });
  } else {
    // if (authStore().isChecked == false && authStore().user.rol.code == "OPERADORA") {
    //   window.location.replace("/ponchar")
    // } else {
    //   next();
    // }
    next();
  }
};

export const RedirectIfAuthenticated = function (to, from, next) {
  if (token) {
    // window.location.reload();
    window.location.replace("/");
  } else {
    next();
  }
};


// export const verifyisChecked = function (to, from, next) {
//   console.log(authStore().isChecked)
//   if (token == null || token == "" || token == undefined ) {
//     next({ name: "Login" });
//   } else {
//     next();
//   }

// }


