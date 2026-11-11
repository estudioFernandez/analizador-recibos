// Casos de prueba con recibos INVENTADOS (este archivo se publica: nunca poner datos de clientes aca).
// Los recibos reales van en casos-reales.js, que no se sube a GitHub (ver pruebas.html).
//
// Cada caso:
//   nombre       lo que se muestra en la lista
//   texto        el recibo, como queda al pegarlo en "Pegar texto"  (o archivos: [texto1, texto2] = varios PDF)
//   juzgado      opcional, por defecto "7"
//   totales      [["MM/AAAA", total esperado], ...] en orden, uno por recibo
//   totalCobrar  opcional: [["MM/AAAA", monto o null]] para controlar lo que se leyo como "Total a cobrar"
//   alertas      opcional: tipos de alerta que tienen que aparecer
//   sinAlertas   opcional: true si no tiene que aparecer ninguna
//   sinSumar     opcional: cuantos conceptos tienen que salir en el aviso "NO SE SUMARON" (sumando todos los meses)
//   cierra       opcional: true/false, si el Total a cobrar tiene que cerrar contra lo leido (en todos los meses)

const CASOS = [
  {
    nombre: "Formato con codigo: suma PBU y PC, no suma la obra social",
    texto: "Período 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n001 002 - PC-HABER MENSUAL 50.000,00\n518 008 - DESC OBRA SOCIAL 4.500,00\n",
    totales: [["01/2025", 150000]], totalCobrar: [["01/2025", null]], sinSumar: 1, sinAlertas: true,
  },
  {
    nombre: "Formato solo nombre, con Total a cobrar que cierra",
    texto: "Período 02/2025\nPBU-HABER MENSUAL $ 100.000,00\nPC-HABER MENSUAL $ 50.000,00\nDESC OBRA SOCIAL - $ 4.500,00\nTotal a cobrar $ 145.500,00\n",
    totales: [["02/2025", 150000]], totalCobrar: [["02/2025", 145500]], sinAlertas: true,
  },
  {
    nombre: "Total a cobrar que no cierra: avisa",
    texto: "Período 02/2025\nPBU-HABER MENSUAL $ 100.000,00\nPC-HABER MENSUAL $ 50.000,00\nDESC OBRA SOCIAL - $ 4.500,00\nTotal a cobrar $ 150.000,00\n",
    totales: [["02/2025", 150000]], alertas: ["total_no_cierra"],
  },
  {
    nombre: "Total a cobrar con el monto en la linea de abajo",
    texto: "Período 03/2025\nPBU-HABER MENSUAL $ 100.000,00\nTotal a cobrar\n$ 100.000,00\n",
    totales: [["03/2025", 100000]], totalCobrar: [["03/2025", 100000]], sinAlertas: true,
  },
  {
    nombre: "Guion en todas las lineas: es separador, no deduccion",
    texto: "Período 04/2025\nPBU-HABER MENSUAL - $ 100.000,00\nPC-HABER MENSUAL - $ 50.000,00\nTotal a cobrar $ 150.000,00\n",
    totales: [["04/2025", 150000]], sinAlertas: true,
  },
  {
    nombre: "Concepto que suma pero viene en negativo: avisa",
    texto: "Período 05/2025\nPBU-HABER MENSUAL $ 100.000,00\nPC-HABER MENSUAL - $ 5.000,00\n",
    totales: [["05/2025", 105000]], alertas: ["suma_en_negativo"],
  },
  {
    nombre: "204000 (Ley 24.463 art. 9) no suma y queda en el aviso",
    texto: "Período 01/2025\n001 001 - PBU-HABER MENSUAL 300.000,00\n204 000 - DESC LEY 24463 ART 9 30.000,00\n",
    totales: [["01/2025", 300000]], sinSumar: 1, sinAlertas: true,
  },
  {
    nombre: "DESC LEY 24463 ART 9 sin codigo tampoco suma, y el Total a cobrar cierra",
    texto: "Período 01/2025\nPBU-HABER MENSUAL $ 300.000,00\nDESC LEY 24463 ART 9 - $ 30.000,00\nTotal a cobrar $ 270.000,00\n",
    totales: [["01/2025", 300000]], sinSumar: 1, sinAlertas: true,
  },
  {
    nombre: "195000 se resta del mes",
    texto: "Período 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n195 000 - CONCEPTO 195000 10.000,00\n",
    totales: [["01/2025", 90000]], sinSumar: 1, sinAlertas: true,
  },
  {
    nombre: "15388 no suma ni avisa",
    texto: "Período 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n15388 - CONCEPTO 15388 5.000,00\n",
    totales: [["01/2025", 100000]], sinAlertas: true,
  },
  {
    nombre: "Juzgado escrito \"02\": 005934 no suma",
    texto: "Período 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n005 934 - CONCEPTO 5934 1.000,00\n",
    juzgado: "02",
    totales: [["01/2025", 100000]], alertas: ["excepcion_juzgado"],
  },
  {
    nombre: "PERÍODO en mayusculas: cada mes por separado",
    texto: "PERÍODO 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\nPERÍODO 02/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n",
    totales: [["01/2025", 100000], ["02/2025", 100000]], sinAlertas: true,
  },
  {
    nombre: "Varios PDF: mes repetido y mes faltante",
    archivos: [
      "Período 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n",
      "Período 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n",
      "Período 03/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n",
    ],
    totales: [["01/2025", 100000], ["01/2025", 100000], ["03/2025", 100000]],
    alertas: ["periodo_repetido", "periodos_faltantes"],
  },
  {
    nombre: "Linea con monto que no se puede leer: avisa",
    texto: "Período 01/2025\nPBU-HABER MENSUAL $ 100.000,00\nPC (SENT. JUDICIAL) 5.000,00\n",
    totales: [["01/2025", 100000]], alertas: ["linea_no_leida"],
  },
  {
    nombre: "Mismo concepto dos veces en el mes: avisa",
    texto: "Período 01/2025\n001 001 - PBU-HABER MENSUAL 100.000,00\n001 001 - PBU-HABER MENSUAL 100.000,00\n",
    totales: [["01/2025", 200000]], alertas: ["concepto_repetido"],
  },
  {
    nombre: "Nombre con acento y minusculas",
    texto: "Período 01/2025\nPensión por fallecimiento $ 50.000,00\n",
    totales: [["01/2025", 50000]], sinAlertas: true,
  },
  {
    nombre: "Formato de dos columnas (guion en la columna vacia): el Total a cobrar cierra",
    texto: "Período 03/2025\n001 002 - PC-HABER MENSUAL $ 100.000,00 -\n001 003 - PAP-HABER MENSUAL $ 50.000,00 -\n311 340 - CRÉDITO ANSES-SIPA - $ 1.000,00\n318 008 - O.S. PAMI MENSUAL - $ 4.500,00\nSubtotal $ 150.000,00 $ 5.500,00\nTotal a cobrar $ 144.500,00\n",
    totales: [["03/2025", 150000]], totalCobrar: [["03/2025", 144500]], sinSumar: 2, sinAlertas: true,
  },
  {
    nombre: "Formato de dos columnas sin codigo: el Total a cobrar cierra",
    texto: "Período 03/2025\nPC-HABER MENSUAL $ 100.000,00 -\nPAP-HABER MENSUAL $ 50.000,00 -\nO.S. PAMI MENSUAL - $ 4.500,00\nTotal a cobrar $ 145.500,00\n",
    totales: [["03/2025", 150000]], totalCobrar: [["03/2025", 145500]], cierra: true,
  },
];
