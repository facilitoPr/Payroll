// Helper para normalizar endpoints (con o sin "/")
const ep = (endPoint) =>
  endPoint?.startsWith("/") ? endPoint : `/${endPoint}`;

// Helper para mantener tu estilo de retorno (res.data o err.response.data)
const unwrap = async (promise) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    // interceptor ya hace logout en 401, aquí devolvemos el payload de error si existe
    return err?.response?.data ?? { ok: false, mensaje: "Error de red" };
  }
};

export { ep, unwrap };
