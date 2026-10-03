# REPLICATOR-BRIEF (español neutro): qué hace, qué recibe, qué entrega y qué reconocimiento tiene un replicador independiente

Estado: **BORRADOR, NO CONGELADO, TÉRMINOS POR ACORDAR CON CADA REPLICADOR.** Escrito el 2026-10-02. Versión en inglés (de referencia si hay diferencias): `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.md`. Definición del rol (rol e): `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\ROLES.md`. Protocolo: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md`. Qué se replicaría: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HYPOTHESES-2026-10-02.md`, `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\BACKLOG.md` (B9 y la sección de la segunda pasada), `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1.md`, `...\prereg\SDX-1-ARMS.md`. Cuaderno: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\README.md`.

Pendiente antes de usar este documento como invitación, dicho con claridad: (1) todavía nada está congelado, por lo que aún no existe un preregistro congelado para entregar; el reclutamiento puede empezar, la entrega comienza después del congelamiento; (2) el arnés, el ejecutor y el oráculo están especificados en el preregistro, pero el manual de réplica que los acompaña no se escribe hasta que SDX-0 haya producido un arnés funcional; (3) todas las cifras de costo y tiempo son estimaciones del borrador y serán reemplazadas por las mediciones de SDX-0.

## 1. Por qué replicadores independientes

El autor del método diseñó, construyó y ejecutó los experimentos sobre su propio método, y todos los críticos anteriores fueron modelos Claude. El preregistro, un practicante externo y críticos de distintos proveedores reducen el sesgo; no lo eliminan. Un resultado se vuelve creíble cuando alguien sin interés en él lo repite a partir del paquete publicado y obtiene la misma respuesta, o una distinta que se informa con igual visibilidad. El replicador es el último rol de independencia y el único que gasta su propio tiempo y sus propias cuentas en la pregunta.

## 2. Dos tipos de réplica

| | Réplica solo con modelos (tipo M) | Réplica con participantes humanos (tipo H) |
|---|---|---|
| Qué se replica | Un experimento congelado solo con modelos: SDX-1 (primero el contraste primario), luego SDX-3, SDX-4 o SDX-5 | El estudio con personas SDX-6 (autores de prompts) o SDX-7 (participantes en vivo) |
| Qué ejecuta el replicador | El ejecutor publicado, el andamio, el oráculo sellado y los artefactos de cada brazo, con sus propias cuentas, máquinas y herramientas de agente | El protocolo de participantes publicado, con sus propios participantes, su propia institución y su propio proceso de ética, las tareas publicadas y la rúbrica de los evaluadores |
| Variante (declarada de antemano) | **Directa**: mismo proveedor y familia de modelo, con la versión fijada si aún existe. **Conceptual**: otro proveedor o nivel de modelo (réplica legítima y útil, se informa como condición de frontera y no se combina) | Misma tarea y brazos; la población distinta es el punto |
| Esfuerzo típico | 40 a 80 horas-persona más tiempo de máquina; de 4 a 8 semanas de calendario | De 3 a 6 meses; requiere financiamiento y revisión ética |
| Gasto en modelos (estimación del borrador, reemplazar tras SDX-0) | Solo el contraste primario de SDX-1 (A4 y A5 con n = 20, más A0, A0S y A5b con n = 10 como controles de referencia y de validez; 70 cadenas): unas 960 sesiones, unos USD 385 a 1.150. Núcleo completo: unas 1.100 sesiones, unos USD 440 a 1.320. SDX-5 Parte A: unos USD 250 a 600 | Pago a participantes y gasto en modelos como en BACKLOG B15 y B16 |

El primer entregable de un replicador de tipo M es un arnés validado en su entorno (los controles V1 a V13 de SDX-0), que además es útil para el campo.

## 3. Qué hace un replicador de tipo M, en orden

1. **Declarar** (antes de recibir el paquete): el formulario de conflicto de interés de la sección 12, la fuente de financiamiento, el proveedor y modelo que piensa usar, y si la variante es directa o conceptual.
2. **Recibir y verificar** el paquete congelado: archivo y SHA-256 (construido con `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js`), etiqueta, identificadores de OSF y Zenodo. Verificar los hashes antes de cualquier ejecución. Si un hash no coincide, la réplica se detiene hasta aclararlo.
3. **Construir y validar el arnés** en su máquina: sonda canario ejecutada en frío (un recuerdo mayor que cero es INVALID-DESIGN para ese modelo), validación del oráculo (implementación de referencia, resguardos, mutantes), detección de alteración del andamio, prueba plantada de memoria (V13), control de costo y de topes alcanzados. Informar qué controles V se cumplieron.
4. **Fase de generación**: ejecutar los brazos, la cantidad de cadenas y el orden aleatorio registrados, en una ventana corta, anotando la versión del modelo, de la CLI y de Node. Archivar cada instantánea del repositorio y cada transcripción de sesión. Calcular el SHA-256 del archivo.
5. **Registrar su propio plan de análisis** antes de puntuar (sección 8). El arnés separa a propósito la generación de la puntuación: las puntuaciones del oráculo se producen después de que el plan del replicador tenga sello de tiempo.
6. **Puntuación y análisis confirmatorio**, exactamente como en el preregistro congelado, más los análisis adicionales que haya declarado de antemano.
7. **Informe**: datos crudos, bitácora de desviaciones, análisis y una declaración llana de qué fila de la tabla de decisión congelada corresponde, sea cual sea.

Un replicador de tipo H sigue los pasos propios del protocolo humano (piloto de fidelidad de la intervención, brazos fijados antes de inscribir, registro de la asignación aleatoria, evaluadores ciegos fuera del entorno del autor, registro antes de la inscripción); esos pasos están escritos en `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\BACKLOG.md` (principios de B12, B15, B16) y tendrán un archivo de protocolo de participantes cuando se diseñe SDX-6 o SDX-7.

## 4. Requisitos previos

- Competencia en métodos empíricos de ingeniería de software: los análisis registrados son pruebas de permutación, intervalos bootstrap, pruebas de equivalencia y modelos mixtos; el replicador debe poder ejecutarlos y criticarlos.
- Programación y herramientas actuales: Node y TypeScript para el andamio, un lenguaje de scripts para el arnés y el análisis, una CLI de agente de programación sin interfaz para el proveedor elegido.
- Acceso propio a modelos: cuentas de API o suscripciones con capacidad suficiente para las cadenas previstas; máquina o servidor propios; una ventana ininterrumpida de uno a tres días de reloj para la fase de generación (3 o 4 cadenas en paralelo).
- Tiempo: ver sección 2. Autorización para publicar (permiso del empleador o de la institución si hace falta).
- Para el tipo H: acceso a un grupo de participantes, una vía de revisión ética o institucional, fondos.
- No se exige: conocimiento previo de GS. Se prefiere ninguno o poco (ver sección 6).

## 5. Costo y quién paga

Por defecto, el replicador paga su propio gasto en modelos, o usa sus propios créditos de investigación, para que nadie con interés en el resultado lo financie. Si JC ofrece fondos o créditos, se declara en el formulario de conflicto de interés y en el informe, y pasa por un canal neutral que el replicador controle (por ejemplo, créditos asociados a la cuenta del replicador o una subvención a su institución sin condiciones); nunca se acompaña de pedido alguno sobre los resultados. **Decisión de JC:** si ofrecer financiamiento; la independencia es mayor sin él y el reclutamiento es más fácil con él.

## 6. Qué NO se les debe entregar ni deben leer de antemano

Hasta que su propio plan de análisis tenga sello de tiempo y su fase de generación esté archivada, a un replicador **no se le entrega y no debe leer**:

- Ningún resultado del trabajo original: datos del piloto SDX-0, resultados principales de SDX-1, números por brazo, los campos de resultado de la entrada del cuaderno, figuras o tablas de resultados, ni conversaciones sobre hacia dónde "debería" ir el resultado.
- Material de promoción: el libro blanco, el compendio, los cursos, el sitio, charlas y publicaciones que argumentan a favor de GS. El paquete congelado indica qué contiene cada brazo; no necesita el argumento. Una vez que el plan tenga sello de tiempo, el replicador puede leer lo que quiera.
- Comentarios del lado proponente sobre el contenido oculto del oráculo más allá de lo que publica el paquete congelado. (El oráculo mismo se publica en el paquete porque el replicador debe poder ejecutarlo; lo que se reserva es la información sobre cómo se desempeñaron los brazos en él.)

Lo que **sí** reciben incluye los rangos esperados fijados de antemano en el preregistro (SDX-1 sección 2a), porque forman parte del registro y permiten juzgar un resultado frente a ellos.

No deben modificar ningún artefacto de brazo, manifiesto, texto de cambio, oráculo ni andamio. Todo cambio es una desviación, se registra, y convierte esa parte de la ejecución en una variante conceptual.

Regla de comunicación: solo preguntas técnicas, por escrito, por un único canal registrado (un hilo público de incidencias o un archivo de registro compartido incluido en el paquete); las respuestas se agregan a unas preguntas frecuentes públicas; nadie del equipo original conversa sobre expectativas o resultados con el replicador antes de que este entregue su informe; JC y el asistente no participan en las ejecuciones ni en el análisis.

## 7. Reglas de independencia

Un replicador debe cumplir todo lo siguiente, declarado en el formulario de conflicto de interés; un "no" en cualquier punto no descalifica automáticamente, pero se declara en el informe y puede convertir la réplica en una variante "informada" o "parcialmente independiente", rotulada como tal.

1. Ningún vínculo comercial con GS, PragmaWorks ni con sus clientes, socios o productos: sin empleo, contrato, consultoría, participación en ingresos, acciones, formación pagada, honorarios por charlas ni patrocinio, ahora ni en los últimos 24 meses.
2. Ninguna relación estrecha con el autor o el equipo original que pudiera verse razonablemente como conflicto: no ser estudiante, tesista, supervisor, coautor ni socio de JC, actual o de los últimos 3 años. (Ventana propuesta, por acordar.)
3. Ninguna postura pública previa a favor o en contra de GS que no pueda dejar de lado; cualquier postura se declara, así como la lectura previa de material de GS (ninguna, oyó hablar, leyó, formado).
4. Fuentes de financiamiento de la réplica declaradas (sección 5).
5. Poseen sus propias claves de API, registros crudos y archivos; no los entregan al equipo original antes de presentar su informe.
6. Pueden usar un proveedor distinto del original; no pueden usar un asistente o agente suministrado o configurado por el equipo original para ejecutar o analizar el experimento.
7. Conservan el derecho a detenerse, a publicar y a retirarse antes de recolectar datos sin penalización.

Un competidor o un escéptico es un replicador aceptable, y a menudo bueno, siempre que haga la misma declaración.

## 8. Qué reciben

1. El paquete de preregistro congelado (archivo, SHA-256, etiqueta, identificadores de OSF y Zenodo): SDX-1 y SDX-1-ARMS, textos de cambio y orden, hash del andamio, oráculo con manifiesto de sondas, manifiesto de contenido, artefactos de cada brazo (con hash), scripts de detección y de análisis con semillas, versiones de modelo, CLI y Node del original, tabla de decisión y plantilla de bitácora de desviaciones (vacía).
2. El protocolo y las definiciones de roles: `EXPERIMENT-PROTOCOL.md`, `ROLES.md` (rol e), `PREREG-HOWTO.md` sección 8.
3. Manuales para el arnés y para registrar su propio plan de análisis (el manual de réplica está pendiente, ver el comienzo).
4. El esquema de datos de la sección 9 y una plantilla de bitácora de desviaciones.
5. Un punto de contacto nombrado para preguntas técnicas y un compromiso de respuesta (propuesta: dentro de 5 días hábiles).
6. Este documento, el formulario de conflicto de interés, los términos de autoría propuestos (sección 10) y los de intercambio de datos (sección 11), todo por acordar por escrito antes de entregar el paquete.

## 9. Qué entregan

1. **Datos crudos** en un esquema fijo (el archivo de esquema viaja con el paquete; los campos de abajo son el mínimo):
   - `sessions`: id de cadena, brazo, paso, intento, inicio, fin, cadena de id del modelo, versión de la CLI, tokens por categoría (entrada, salida, creación de caché, lectura de caché), conteo de llamadas a herramientas por tipo, estado de salida, indicadores de tope alcanzado, costo.
   - `snapshots`: id de cadena, paso, ruta del archivo del repositorio y su SHA-256, resultado de la verificación del hash del andamio.
   - `probes`: id de cadena, paso, id de sonda, etiqueta (SD o SI, nueva o arrastrada), resultado, versión del oráculo.
   - `events`: borrado o debilitamiento de pruebas, bloqueos y elusiones de ganchos, preguntas formuladas, salida del detector de sustrato emergente.
   - `environment`: máquina, sistema operativo, versiones de Node, CLI y modelo, fechas.
2. **Bitácora de desviaciones**: cada apartamiento del paquete congelado, con fecha, motivo y si vuelve conceptuales las celdas afectadas.
3. **Su propio plan de análisis**, escrito y con sello de tiempo (OSF o equivalente) después de archivar la fase de generación y antes de producir cualquier puntuación del oráculo: debe repetir sin cambios el análisis confirmatorio congelado y puede agregar extras declarados de antemano; también fija su propio criterio de "replicado" (por defecto: la misma fila de la tabla de decisión que el original, o un intervalo que incluya la estimación puntual del original; puede justificar una regla más estricta).
4. **Informe**: métodos tal como se ejecutaron, resultado confirmatorio según la tabla de decisión congelada, los extras claramente rotulados, limitaciones y una declaración de independencia y financiamiento. Son libres de publicarlo, sea positivo, negativo o nulo, sin aprobación del equipo original.

## 10. Reconocimiento

- **Agradecimiento**: cada replicador figura con su nombre, rol y filiación en la entrada del cuaderno de su réplica y en todo artículo o documento público de GS que cite su réplica, con los ids exactos de modelo y las fechas.
- **Autoría de su propio informe**: el replicador y su equipo son los autores del informe de réplica; el equipo original no tiene por qué figurar.
- **Coautoría en un artículo conjunto (propuesta, no una promesa, por acordar por escrito antes del comienzo)**: si se escribe un artículo combinado (original más réplicas), la autoría sigue los criterios estándar (los criterios del ICMJE o el equivalente basado en CRediT en ingeniería de software): una contribución sustancial al diseño de la réplica o a la obtención, el análisis o la interpretación de los datos; redacción o revisión crítica; aprobación de la versión final; responsabilidad sobre las partes que realizó. Tener una cuenta, ejecutar un script o ser colega no basta por sí solo. El orden de autores y el autor de correspondencia se acuerdan al planificar el artículo. Un replicador puede rechazar la autoría y aceptar solo el agradecimiento. Nadie del equipo original puede condicionar la publicación de una réplica a la coautoría ni vetarla.

## 11. Intercambio de datos y licencias (propuesta, por acordar)

- Los datos crudos, la bitácora de desviaciones y el código de análisis de la réplica los deposita el replicador en un repositorio público (OSF, Zenodo o equivalente) en el plazo que elija, y a más tardar con la publicación del informe. Licencia propuesta para los datos: CC BY 4.0; para su código: cualquier licencia abierta que permita la reutilización; a los archivos originales se les aplica la licencia del paquete original (por verificar e indicar en el paquete antes de la entrega).
- Las transcripciones y los repositorios contienen solo salida de modelos; en el tipo M no se esperan datos personales. En el tipo H, los datos personales quedan en la institución del replicador bajo sus términos de consentimiento y ética; solo se comparten datos anonimizados, y el consentimiento debe cubrirlo.
- El replicador es dueño de su informe. El equipo original puede enlazarlo y citarlo con atribución, pero no editarlo.
- Si se necesita un embargo (por una revista), es decisión del replicador y se limita a 90 días desde la entrega del informe (propuesta).

## 12. Declaración de conflicto de interés (completar y firmar antes de recibir el paquete)

Nombre, filiación, rol; para cada punto de la sección 7, sí o no y detalles; exposición previa a GS (ninguna, oyó hablar, leyó, formado) y cuál; relación con JC o con el equipo original (ninguna, colega, exestudiante, otra); financiamiento de esta réplica; permiso del empleador; proveedor, modelo y variante previstos (directa o conceptual); cualquier declaración pública sobre GS. El formulario firmado se guarda en el paquete y se cita en la entrada del cuaderno.

## 13. Cómo entran los resultados de una réplica en el cuaderno

- Cada réplica es una **entrada separada e independiente** con su propio id (`<id original>-R<n>`, por ejemplo `SDX-1-R1`), escrita por el replicador o con él, con su propio preregistro (su plan de análisis y su registro), su propio nivel de evidencia según el protocolo (nivel A si se registró externamente antes de los datos), y su propia etiqueta de resultado y "qué habilita" en la plantilla común (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\ENTRY-TEMPLATE.md`).
- La entrada original recibe una nota fechada y un enlace; nunca se reescribe (regla del cuaderno). El índice recibe una fila por réplica.
- Los resultados se muestran lado a lado. Solo se combinan si una regla de combinación se registró antes de que existieran datos de réplica; de lo contrario no se afirma ninguna estimación combinada.
- Las réplicas directas y las conceptuales se rotulan como tales; una réplica conceptual cuya dirección difiere es una condición de frontera, no un fracaso de replicación, salvo que su criterio declarado de antemano diga otra cosa.

## 14. Si sus resultados contradicen los nuestros

Se decide ahora, para que nadie tenga que decidirlo después bajo presión:

1. El resultado contradictorio se registra con la misma visibilidad, tono y plantilla que uno favorable, en el cuaderno, en el índice y en todo artículo o página que cite el original. Prevalece la redacción del replicador.
2. La auditoría de validez es obligatoria para el original y para la réplica (la lógica de la fila "ix" de `SDX-1.md` sección 10): registros del arnés, controles, oráculo, artefactos de los brazos, desviaciones.
3. La afirmación original se acota al alcance que sobrevive (por ejemplo "en un modelo de nivel medio de un solo proveedor") o se retira; las declaraciones públicas siguen el resultado más débil hasta que otro experimento registrado diga lo contrario. Nadie rescata una afirmación con regímenes que no se registraron de antemano.
4. Si ambas auditorías salen limpias, se propone un seguimiento conjunto registrado (un tercero neutral ejecuta la condición que discrimina); si cualquiera encuentra un defecto, se repara y el resultado afectado se vuelve a ejecutar o se rotula INVALID-DESIGN.
5. El equipo original puede responder por escrito junto a la réplica; no puede editarla, demorarla ni suavizarla.

## 15. Perfil de candidatos y selección

Aquí no hay candidatos con nombre ni datos de contacto; JC aporta los nombres, y toda lista armada con fuentes públicas se revisa contra las reglas de independencia de la sección 7 antes del primer contacto.

**Perfiles que encajan**
1. Académicos e investigadores posdoctorales en ingeniería de software empírica o desarrollo asistido por IA, con trayectoria en réplicas, informes registrados, evaluación de artefactos o métodos de minería y experimentación (las comunidades en torno a ESEM, MSR y los congresos de la familia ICSE y sus tracks de artefactos e informes registrados).
2. Estudiantes de posgrado (preferentemente de doctorado) de esos grupos, con acuerdo de su director, para quienes una réplica registrada es un producto publicable.
3. Ingenieros senior independientes o profesionales de IA aplicada con hábitos de investigación, cuentas propias y sin vínculo comercial.
4. Ingenieros de evaluación o de pruebas comparativas en organizaciones sin relación comercial con GS, que actúen a título personal o institucional de investigación.
5. Solo para el tipo H: un grupo de investigación con acceso a participantes y un proceso de ética.

**Selección, en orden**
1. Independencia (sección 7): cualquier "sí" en los puntos 1 a 3 se escala y se declara, nunca se oculta.
2. Competencia metodológica: puede describir, sin ayuda, cómo ejecutaría una prueba de equivalencia y qué es un informe registrado; puede señalar una réplica o un plan de análisis previo escrito por esa persona.
3. Capacidad: puede ejecutar el arnés (programación, agente en CLI, acceso a API) y comprometer las semanas necesarias; dispone de una ventana ininterrumpida para la fase de generación.
4. Disposición: publica resultados nulos y negativos; acepta la regla de comunicación y la de no modificar; puede firmar el formulario de conflicto de interés.
5. Diversidad del conjunto: apuntar a al menos dos replicadores, idealmente tres, con al menos dos proveedores y distintas regiones o tipos de institución; como máximo uno por grupo de investigación.
6. Señales de alerta: quiere codiseñar la intervención o los brazos (eso es rol de crítico, no de replicador); espera un encargo pagado de PragmaWorks; declara la intención de confirmar o de desmentir; no puede comprometerse con el orden del preregistro (plan antes de puntuar).

**Dónde buscar, sin inventar a nadie**: comités de programa y autores de los tracks de réplica, artefactos e informes registrados de los congresos de ingeniería de software empírica; los grupos de ciencia abierta y metainvestigación de los departamentos de ingeniería de software; autores de trabajos recientes que evalúan agentes de programación; y los canales comunitarios sobre reproducibilidad. JC elige; la verificación de independencia va antes del primer mensaje.

## 16. Mensaje de reclutamiento (JC puede enviarlo; español neutro)

> Asunto: Réplica independiente de un estudio preregistrado sobre resultados de proyectos con agentes de programación
>
> Busco a un grupo o a una persona independiente que replique un experimento preregistrado, basado en modelos, sobre si un sustrato persistente en el repositorio (un mapa de navegación, un registro de especificaciones, registros de decisiones y controles obligatorios) cambia qué tan bien un agente de programación mantiene correcto un proyecto que crece, frente a un prompt experto sólido y a uno ingenuo. El diseño está preregistrado con una tabla de decisión que incluye los resultados que no espero, usa un banco de pruebas inventado con un oráculo conductual sellado, y está hecho para que un resultado nulo sea válido y publicable. Le pediría que ejecute el ejecutor publicado con sus propias cuentas, que escriba su propio plan de análisis antes de puntuar y que informe lo que encuentre, sin aprobación mía. Soy el autor del método que se prueba, de modo que no participaré en sus ejecuciones ni en su análisis, no pediré coautoría como condición, y le pediría que declare cualquier conflicto de interés. El esfuerzo previsto es de unas 40 a 80 horas a lo largo de 4 a 8 semanas y algunos cientos de dólares en uso de modelos, y el paquete estará congelado y con sello de tiempo antes de que usted lo reciba. Si le interesa, puedo enviarle primero el documento breve y los términos de independencia, sin compromiso.

## Apéndice A. Lista de verificación para JC antes de enviar el primer mensaje

1. ¿Hay algo congelado? Si no, decirlo en el mensaje (el documento ya lo hace) y prometer el paquete después del congelamiento.
2. Verificación de independencia del candidato contra la sección 7.
3. ¿JC decidió sobre el financiamiento (sección 5)?
4. ¿Está indicada la licencia del paquete (sección 11)?
5. ¿Hay un contacto nombrado para preguntas técnicas?
