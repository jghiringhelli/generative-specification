# Kilnlog (herramienta de línea de comandos, Python 3.11, solo biblioteca estándar en ejecución)

Una ceramista quiere un comando `kiln` para planificar y registrar quemas de horno. Stack: Python 3.11, `argparse`, pytest para las pruebas. El registro vive en un archivo JSON en la ruta de la variable de entorno `KILNLOG`, por defecto `~/.kilnlog.json`.

Cómo debe comportarse:

1. `kiln plan --cone <06|6|10>` imprime el programa de quema en tres líneas: `ramp 1: 20C -> 600C at 100C/h`, `ramp 2: 600C -> <objetivo>C at 150C/h`, `hold: 15 min at <objetivo>C`. Objetivos: cono 06 es 999C, cono 6 es 1222C, cono 10 es 1285C. También imprime una línea `total: <h>h <mm>m` con el tiempo total incluyendo la meseta, redondeado al minuto más cercano.
2. Un cono desconocido imprime `unknown cone: <valor>` por la salida de error y termina con código 2.
3. `kiln log --cone <c> --peak <grados> [--notes "texto"]` agrega una quema con la fecha de hoy e imprime `logged firing #<n>`, donde n cuenta desde 1. Un pico que no sea un número entero termina con código 2.
4. Una quema cuyo pico difiera del objetivo del cono en más de 15C se marca como fuera de objetivo.
5. `kiln history` imprime las quemas de la más nueva a la más antigua, una por línea: `#<n> <fecha> cone <c> peak <p>C` seguido de ` OFF-TARGET` cuando corresponda. Con el registro vacío imprime `no firings yet` y termina con 0.
6. `kiln history --cone <c>` muestra solo ese cono.
7. `kiln stats` imprime la cantidad de quemas y, por cono, el pico promedio redondeado al grado entero.
8. Todo comando termina con 0 si sale bien; un archivo de registro corrupto termina con código 4 y el mensaje `log file is corrupt: <ruta>`.

Primera porción a construir: (a) `plan`, (b) `log` con la marca de fuera de objetivo, (c) `history`.
