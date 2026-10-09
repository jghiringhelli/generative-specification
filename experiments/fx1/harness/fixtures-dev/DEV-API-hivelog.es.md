# Hivelog (API web, Node.js, solo biblioteca estándar en ejecución)

Apicultores aficionados quieren un servicio web pequeño para llevar el control de sus colmenas y de lo que ven en cada inspección. Stack: Node.js 24, el módulo `http` integrado (sin framework web), datos guardados en un archivo JSON. Pruebas con el `node --test` integrado.

Cómo debe comportarse:

1. Un apicultor registra una colmena con `POST /hives` y un cuerpo JSON `{ "name", "location" }`. El nombre es obligatorio y de 40 caracteres como máximo. La respuesta es 201 con la colmena y su nuevo id. Una petición inválida recibe 400 y `{ "error": "..." }`.
2. `GET /hives` lista todas las colmenas, de la más antigua a la más nueva.
3. `GET /hives/:id` devuelve una colmena, más el estado de su última inspección (`"unknown"` si no hay ninguna). Id desconocido: 404.
4. `POST /hives/:id/inspections` registra una inspección: `{ "date": "YYYY-MM-DD", "queenSeen": true/false, "broodFrames": de 0 a 12, "mitesPer100": número >= 0 }`. La respuesta es 201 con la inspección y su estado calculado. Colmena desconocida: 404. Cuerpo inválido: 400. Una fecha futura: 400. Una segunda inspección de la misma colmena en la misma fecha: 409.
5. El estado de una inspección es `"treat"` cuando los ácaros por cada 100 abejas son 3 o más; si no, `"watch"` cuando los ácaros son 2 o más o no se vio a la reina; si no, `"healthy"`.
6. `GET /hives/:id/inspections` lista las inspecciones de esa colmena, la fecha más nueva primero.
7. `GET /alerts` lista las colmenas cuya última inspección tiene estado `"treat"`, primero la peor cuenta de ácaros, cada una con el nombre de la colmena, la fecha y los ácaros por 100.
8. Los datos sobreviven a un reinicio (archivo `data/hives.json`, creado en la primera escritura).
9. El puerto sale de la variable de entorno `PORT`, por defecto 3000.

Primera porción a construir: (a) registrar y listar colmenas, (b) registrar inspecciones con el estado calculado, (c) la lista de alertas.
