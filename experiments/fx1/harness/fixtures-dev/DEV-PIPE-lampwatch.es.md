# Lampwatch (pipeline de datos, Node.js, solo biblioteca estándar en ejecución)

Un ayuntamiento recibe reportes de fallas de alumbrado público como archivos CSV y quiere un trabajo nocturno que los limpie y produzca un resumen por distrito. Stack: Node.js 24, sin dependencias en ejecución, pruebas con `node --test`. Se ejecuta como `node run.js <entrada.csv> [carpeta_salida]`; la carpeta de salida es `output/` por defecto.

Columnas de entrada: `report_id,lamp_id,district,reported_at,severity,description` (encabezado en la primera línea, `reported_at` en ISO 8601, severity de 1 a 3).

Cómo debe comportarse:

1. Las filas con `lamp_id` vacío, `district` vacío, una severity que no sea 1, 2 o 3, o una fecha que no se pueda interpretar no se procesan: se escriben en `rejected.csv` en la carpeta de salida con las columnas originales más una columna `reason` (`missing lamp_id`, `missing district`, `bad severity`, `bad date`).
2. Un reporte de una lámpara que ya fue reportada hace menos de 24 horas (comparado con el primer reporte aceptado de esa lámpara en esa ventana) es un duplicado: queda fuera del resumen y se cuenta.
3. `summary.json` en la carpeta de salida contiene: `processed` (filas aceptadas), `rejected`, `duplicates`, y `districts`, una lista de `{ "district", "count", "avgSeverity" }` con el promedio a un decimal, ordenada por count (mayor primero) y luego por nombre.
4. Una lámpara con reportes aceptados en 3 o más días calendario distintos figura en `chronic` dentro de `summary.json`, con su cantidad de reportes, ordenada por cantidad.
5. Ejecutarlo dos veces con la misma entrada da archivos de salida idénticos byte a byte.
6. Un archivo de entrada con solo el encabezado (o vacío) no escribe resumen, imprime `no data` y termina con código 3. Un archivo de entrada inexistente termina con código 2. En los demás casos el código de salida es 0.
7. La ejecución imprime una línea: `processed=<n> rejected=<n> duplicates=<n>`.

Primera porción a construir: (a) leer, validar y rechazar filas, (b) eliminar duplicados, (c) el resumen por distrito.
