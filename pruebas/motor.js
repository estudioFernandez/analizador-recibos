// Corre los casos de prueba contra la logica del analizador. Lo usa pruebas.html.

// Saca del index.html el bloque entre las marcas LOGICA (inicio) y LOGICA (fin) y lo ejecuta.
function cargarLogica(htmlIndex) {
  const ini = htmlIndex.indexOf("// ==== LOGICA (inicio) ====");
  const fin = htmlIndex.indexOf("// ==== LOGICA (fin) ====");
  if (ini < 0 || fin < 0) throw new Error("No encontre las marcas LOGICA (inicio) / LOGICA (fin) en el archivo elegido.");
  return new Function(htmlIndex.slice(ini, fin) + "\nreturn {analizarArchivos: analizarArchivos};")();
}

function plata(n) {
  return n === null || n === undefined ? "(no trae)" : "$" + n.toLocaleString("es-AR", {minimumFractionDigits:2, maximumFractionDigits:2});
}

// Devuelve {ok, errores, resumen}. Que se controla depende de lo que traiga el caso (ver casos.js).
function correrCaso(logica, caso) {
  const textos = caso.archivos || [caso.texto];
  const archivos = textos.map((t, i) => ({nombre: caso.archivos ? "archivo " + (i+1) : null, texto: t}));
  const {resultados, alertasGenerales} = logica.analizarArchivos(archivos, caso.juzgado || "7");
  const tipos = alertasGenerales.map(a => a.tipo).concat(...resultados.map(r => r.alertas.map(a => a.tipo)));
  const errores = [];

  if (caso.totales) {
    if (resultados.length !== caso.totales.length)
      errores.push("Se esperaban " + caso.totales.length + " meses y salieron " + resultados.length);
    caso.totales.forEach(([periodo, total], k) => {
      const r = resultados[k];
      if (!r) return;
      if (r.periodo !== periodo) errores.push("Mes " + (k+1) + ": se esperaba " + periodo + " y salio " + r.periodo);
      else if (Math.abs(r.sumaTotal - total) > 0.005) errores.push(periodo + ": se esperaba " + plata(total) + " y dio " + plata(r.sumaTotal));
    });
  }
  if (caso.totalCobrar) {
    caso.totalCobrar.forEach(([periodo, total]) => {
      const r = resultados.find(x => x.periodo === periodo);
      if (r && r.totalCobrar !== total) errores.push(periodo + ": Total a cobrar esperado " + plata(total) + ", leido " + plata(r.totalCobrar));
    });
  }
  if (caso.sinSumar !== undefined) {
    const n = resultados.reduce((a, r) => a + r.sinSumar.length, 0);
    if (n !== caso.sinSumar) errores.push("En el aviso de no sumados se esperaban " + caso.sinSumar + " conceptos y salieron " + n);
  }
  (caso.alertas || []).forEach(t => { if (!tipos.includes(t)) errores.push("Faltó la alerta \"" + t + "\""); });
  if (caso.sinAlertas && tipos.length) errores.push("No tenia que haber alertas y hubo: " + tipos.join(", "));

  const resumen = resultados.map(r => (r.periodo || "-") + " " + plata(r.sumaTotal)).join(" · ") +
    (tipos.length ? "  |  alertas: " + tipos.join(", ") : "");
  return {ok: errores.length === 0, errores, resumen};
}
