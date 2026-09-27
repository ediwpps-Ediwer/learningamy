# Implementación de la nueva ruta — Block Quest
Fecha: 21 de septiembre de 2026.
Plan pedagógico: [05-REPLANIFICACION.md](05-REPLANIFICACION.md).
Estado: Explorer 1 implementado localmente y probado en modo `?prueba`; queda pendiente validación familiar y publicación en Netlify.

## Explorer 1 ya implementado

La ruta nueva vive en `web/js/aprendizaje.js` y `web/js/aventura.js`, con estilos en `web/css/aventura.css`. Incluye diagnóstico inicial jugable y pausables, reanudación, diagnóstico semanal y revisión de cuatro semanas, misión de cuatro fases, adaptación por habilidad, evidencia separada por modalidad, respaldo de la partida anterior y panel familiar. Los juegos existentes se reutilizan como práctica; el motor conserva el progreso y los premios anteriores sin reinterpretarlos como evidencia nueva.

La implementación está aislada con `?prueba` y no se ha publicado todavía. La validación automática está en `tests/aprendizaje.test.cjs`.

## Prioridad 0 — que el progreso signifique lo que dice
### P0.1 Evidencia por habilidad y modalidad
Archivos principales: web/js/nucleo.js, web/js/juegos.js, web/js/app.js.
Registrar intento con id único, tarea/versión, ítem, habilidad, modalidad, fecha, primer intento, respuesta, ayuda, resultado y evaluador.
Resultados: correcto / incorrecto / sin evidencia. Evaluador: adulto / respuesta objetiva / reconocimiento automático.
Modalidades separadas: lectura oral, escritura con letras móviles, dictado, reconocimiento visual, comprensión escuchada, comprensión leída y habilidad matemática.
No dar por dominada una palabra con dos verdes agregados. Mostrar “practicada” hasta tener evidencia pertinente.
Migración: conservar progreso, premios y registros anteriores como evidencia histórica no clasificada; no atribuirles modalidad ni independencia inventadas. Exportación local de respaldo antes de migrar; prueba de restauración.
Aceptación: completar sopa dos veces no aumenta dominio de lectura; letras móviles no certifican dictado; error del micrófono no baja competencia; conservar esmeraldas existentes.

### P0.2 Retención y dominio
Implementar una sola función de estado de habilidad y una sola de selección de repaso; usarlas en misión y panel.
Guardar vencimiento y días distintos de evidencia. Conservar revisión de aciertos. Diferenciar recuperar un ítem y generalizar un patrón.
Criterios configurables definidos en 05; no hardcodearlos en cada juego.
Aceptación: múltiples repeticiones el mismo día no simulan retención; un ítem nuevo y un día nuevo cuentan correctamente; una revisión vencida no penaliza al niño.

### P0.3 Diagnóstico y validación
Reanudar primer bloque pendiente; ofrecer bloques cortos. Agregar muestras de comprensión oral/leída y dictado independiente.
Distinguir ejercicio de enseñanza y comprobación. No usar reconocimiento automático para certificar pseudopalabras.
Aceptación: salir y volver conserva bloques; escuchar el cuento no se etiqueta como lectura autónoma; evidencia incierta queda pendiente.
Corregir etiquetas “Récord lectura” para distinguir ritmo seleccionado, respuestas reconocidas y lectura oral comprobada.

### P0.4 Ciclos de diagnóstico y ruta inicial
Pedido del papá: primer ingreso con diagnóstico jugable, seguido de ruta personalizada y reevaluación.
Mantener ciclos separados: inicial / semanal / revisión de cuatro semanas / comprobación específica. Cada ciclo guarda id, versión del banco, fechas, bloques pendientes y resultados; no sobrescribir el inicial.
Estados: pendiente → en curso → parcial → completado. Un ciclo parcial permite plan provisional, explícitamente marcado.
Seleccionar ítems equivalentes no recién entrenados; guardar dificultad, modalidad y apoyo para comparación.
Programar al próximo ingreso con fecha local; no crear automaciones externas. No exigir completar semanal y revisión amplia el mismo día.
Aceptación: usuario nuevo ve aventura; al regresar sigue donde estaba; resultados cambian los focos; al séptimo día aparece un chequeo breve; tras ausencia se ofrece en el regreso; el inicial se conserva; no recalificar como retroceso una prueba de mayor dificultad; el modo prueba sigue aislado.

## Prioridad 1 — misión conectada con la escuela
### P1.1 Paquetes de tarea
Separar contenido de reglas del juego. Modelo propuesto:
id, version, fechaAsignada, fechaVigencia, origenLocal, objetivo, habilidades, prerrequisitos, fidelidad, queCambio, itemsOriginales, itemsAdaptados, itemsTransferencia, tareasRelacionadas.
No incluir nombres completos, identificadores escolares ni escaneos en recursos públicos.
Contenido inicial: material existente marcado como repaso; pendiente tarea vigente.
Aceptación: panel muestra origen y adaptación; una tarea vencida no dice “esta semana”; respuestas verificadas antes de mostrar al niño.

### P1.2 Planificador de misiones
Entrada: tarea vigente + habilidad prioritaria + repasos pendientes + preferencias.
Salida persistida por fecha local: recordar → aprender → resolver → demostrar.
La misión no cambia al recargar; se reanuda; registra por qué eligió cada actividad.
Si no hay datos, usar ruta de observación y no una dificultad inventada.
Dar elección entre dos contextos equivalentes sin dejar que solo una actividad fácil monopolice el progreso.
Aceptación: una necesidad de escritura asigna escritura; respeta tarea elegida por adulto; la misión conecta al menos un aprendizaje anterior cuando existe; zona horaria local coherente cerca de medianoche.

### P1.3 Panel familiar
Sección “Hoy”: tarea, objetivo, tiempo orientativo y ayuda adulta necesaria.
Sección “Aprendizaje”: evidencia reciente, independencia, transferencia, próxima revisión.
Sección “Escuela”: puntajes y metas copiadas del reporte con fechas y fuente.
No proyectar puntajes i-Ready a partir de rendimiento interno.
Aceptación: se puede explicar cada recomendación y distinguir completado de dominado.

## Prioridad 2 — convertir práctica en juego
### P2.1 Aldea y recompensas
Mapa pequeño, mejoras visibles y elección de construcción; reutilizar avatar y arte existente.
Premio de misión predecible. Reconocer uso de estrategias, esfuerzo y autocorrección. Evitar premiar clics repetidos.
No quitar moneda por errores; limitar premios repetidos de una misma misión sin impedir practicar.
Aceptación: volver después de días conserva logros; ayudas no bloquean terminar; no exige racha ni urgencia.

### P2.2 Minijuegos que enseñan
Lectura: construir y transformar palabras; texto con objetivo fonético revisado; vocabulario reutilizado; dictado con apoyos graduados.
Math: manipulativos interactivos, explicación de estrategia, geometría y valor posicional; situaciones de comparación sin atajos por palabra clave.
Agregar longitud/tiempo y otros contenidos solo desde la matriz curricular y tareas.
Aceptación: cada mecánica ejecuta la habilidad objetivo; el niño necesita aplicar lo aprendido y no solamente adivinar entre imágenes.

## Orden de entrega
1. Datos confiables y respaldo (P0).
2. Una misión completa con material existente, etiquetada como repaso (P1).
3. Prueba familiar corta con Gaby; registrar disfrute, apoyos y dificultades.
4. Ajustar y ampliar mapa/contenido (P2).
No rehacer la app completa ni cambiar de plataforma para cumplir este plan.

## Verificación antes de publicar una nueva versión
- Pruebas de regresión de evidencia, retención, migración y recompensas.
- Navegador con ?prueba: ruta completa, recarga, salida y reanudación.
- Tablet real: botones táctiles, teclado, audio y alternativa adulta al micrófono.
- Sincronización y sin conexión comprobadas por separado; una prueba local no acredita ambas.
- La prueba no escribe en la cuenta real.
- Revisar datos incluidos en web y paquete de despliegue.
- Mostrar versión y actualizar caché para que la tablet reciba el cambio.
No se ha desplegado nada desde esta revisión.



## Tarea del día y adaptación con IA

Explorer 1 ya muestra en el panel familiar el botón **Tomar foto o elegir imagen**. La imagen se reduce y se guarda en una llave local separada; no se sincroniza con Supabase. El adulto puede indicar materia, foco y consigna. Guardar la tarea hace que la próxima misión priorice esa habilidad.

El botón **Preparar tarea para IA** copia una ficha breve para el adulto. La conexión automática a un modelo requiere una función serverless de Netlify con una clave de servidor; no se coloca una clave en la tablet ni en web/js/config.js.
