
import moment from 'moment';
export default {
  formatter(money) {
    const moneyNumber = Number(money); // convert money to a number
    if (isNaN(moneyNumber)) { // check if moneyNumber is NaN
      return 0.00;
    }
    return moneyNumber.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  },

  formatPhoneNumber(phone) {
    const cleaned = ('' + phone).replace(/\D/g, ''); // Eliminar todo excepto los dígitos
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match) {
      return `(${match[1]}) - ${match[2]}-${match[3]}`;
    }

    return phone; // Retorna el valor original si no coincide con el patrón
  },


  calcularEdad(fechaNacimiento){
    const hoy = moment();
    const nacimiento = moment(fechaNacimiento, "DD/MM/YYYY");
    return hoy.diff(nacimiento, 'years');
  }
}

