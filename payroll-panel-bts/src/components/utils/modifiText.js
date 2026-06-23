export default {
  ModifiText(text) {
    return text
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  },
  ModifiTextMultiple(obj, fieldName) {
    const fieldValue = fieldName; // obtiene el valor del campo específico del objeto
    return fieldValue
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  },

  truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  },
};


