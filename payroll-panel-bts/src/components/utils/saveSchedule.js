import { authStore } from "src/stores/auth-store";
const auth = authStore();



export default {
  saveSchedule(data) {



    localStorage.setItem("lunes", JSON.stringify(data.lunes));
    localStorage.setItem("martes", JSON.stringify(data.martes));
    localStorage.setItem("miercoles", JSON.stringify(data.miercoles));
    localStorage.setItem("jueves", JSON.stringify(data.jueves));
    localStorage.setItem("viernes", JSON.stringify(data.viernes));
    localStorage.setItem("sabado", JSON.stringify(data.sabado));
    localStorage.setItem("domingo", JSON.stringify(data.domingo));
    auth.Addlunes(data.lunes)
    auth.AddMartes(data.martes)
    auth.AddMiercoles(data.miercoles)
    auth.AddJueves(data.jueves)
    auth.AddViernes(data.viernes)
    auth.AddSabado(data.sabado)
    auth.AddDomingo(data.domingo)


  }
}
