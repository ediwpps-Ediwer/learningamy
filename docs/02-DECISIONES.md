# Decisiones tomadas

> Registro de decisiones y por qué. Si algo cambia, se anota acá con fecha nueva,
> no se borra lo viejo.

---

## 2026-09-05 — Decisiones de arranque (papá)

### D1 — Idioma: todo en inglés, con traducción a un toque

**Decisión del papá.** Máxima inmersión: la interfaz, las consignas y el contenido
en inglés. Botón de ayuda que traduce al español cuando se traba.

**Consecuencia técnica — importante.** Gaby lee a nivel Kindergarten. Si el juego
le *escribe* la instrucción en inglés, no la va a poder leer, y va a fallar
ejercicios que sí sabe resolver. Para que esta decisión funcione sin frustrarlo, el
juego se diseña así:

1. **Toda instrucción se dice en voz alta**, no solo se escribe. El texto en inglés
   está, pero el botón de audio lo lee. Oír + ver la palabra al mismo tiempo es,
   además, de las mejores formas de construir decodificación.
2. **Íconos antes que palabras** en botones y navegación. Un chico de 7 opera por
   ícono; el texto en inglés queda como refuerzo, no como requisito.
3. **Botón de traducción siempre visible** (una bandera / "ES"), nunca escondido en
   un menú. Un toque muestra el español, otro lo esconde.
4. **Se registra cada vez que usa la traducción.** Ese dato vale oro: dice qué
   vocabulario todavía no tiene. Alimenta los reportes.
5. **Vocabulario controlado en la interfaz.** El inglés de los botones se limita a
   ~40 palabras que va a ver todos los días (*Start, Next, Try again, Listen, Read,
   Play, Score, Level, Done*). Repetición diaria de un set chico = las aprende sin
   estudiarlas.

> **A revisar en la fase 1:** si en el diagnóstico se ve que abandona ejercicios sin
> intentarlos, la causa más probable es que no entendió la consigna, no que no sepa.
> En ese caso pasamos a modo híbrido (instrucción en español, contenido en inglés)
> y lo anotamos acá.

### D2 — Progreso sincronizado entre tablet, iPad y PC

**Decisión del papá.** Empieza en la tablet, sigue en la PC, las esmeraldas son las
mismas en todos lados.

**Consecuencia técnica.** Empuja fuerte hacia publicar el juego como **Artifact**,
que trae sincronización incluida sin montar servidor ni cuentas. Queda condicionado
a que el micrófono pase el chequeo (ver `00-ESTRATEGIA.md` §3). Si el micrófono
falla ahí, hay que elegir entre sincronización y micrófono — y **el micrófono gana**,
porque es el corazón del juego de lectura.

### D3 — Sesión de duración libre

**Decisión del papá.** Sin corte de tiempo; él decide cuándo parar.

**Consecuencia técnica.** Los niveles se diseñan **cortos y cerrados** (3–5 min cada
uno) y se encadenan. Así, pare donde pare, siempre termina algo y cobra esmeraldas
— nunca queda a mitad de camino sin recompensa.

Además el juego mide **fatiga**: si la precisión cae de forma sostenida contra su
propio promedio de esa misma sesión, sugiere parar ("ya jugaste mucho, mañana
seguimos") y me lo marca en el reporte. Importante para no confundir cansancio con
retroceso al leer los datos.

### D4 — Sin IA en vivo dentro del juego (por ahora)

**Decisión del papá.** Yo preparo el contenido desde el chat; el juego no consulta a
Claude en tiempo real.

**Consecuencia técnica.** Contenido predecible y revisado, sin costo por uso, sin
claves de API. El motor se construye igual leyendo paquetes de contenido, así que
prender el modo en vivo más adelante **no obliga a rehacer nada** — solo se agrega
como fuente extra de ejercicios.

### D5 — Las palomitas no marcan nada: se practica todo

**Decisión del papá (2026-09-05).** Pregunté si las palomitas a mano en la foto
del Módulo 1 marcaban palabras que ya sabe. Respuesta: **lo que hay que practicar
es el PDF completo más los documentos de la carpeta.**

**Consecuencia técnica.** El juego **no** precarga ninguna palabra como dominada.
Las 359 palabras arrancan sin estado, y el único que decide qué domina es su
propio desempeño en el juego: dos verdes seguidos y la palabra pasa a "dominada".

Es lo correcto de todos modos. Una palomita en una hoja dice que alguien la
evaluó un día; no dice si la sigue sabiendo hoy, ni si la lee con fluidez o
descifrándola letra por letra —  que es justamente donde está su problema
(44 % en automaticidad). Medirlo dentro del juego da un dato vivo en lugar de
una foto vieja.

### D6 — Regla de oro al convertir una tarea: el objetivo no se toca

**Decisión del papá (2026-09-05).** Cómo debo convertir cada tarea que me mande:

1. **Primero, digital y fiel.** La misma tarea, los mismos ejercicios, el mismo
   orden — solo que en pantalla en vez de en papel. Sin adornos.
2. **Si eso no lo engancha, recién ahí adaptar.** Cambiar el envoltorio: el
   contexto, los personajes, el formato del ejercicio, la mecánica del juego.
3. **El objetivo de aprendizaje NUNCA cambia.** Si la tarea entrena
   "restar con reagrupación", la versión adaptada entrena restar con
   reagrupación. Puede pasar en una cueva y con esmeraldas en vez de manzanas,
   pero mide lo mismo.

**Por qué esto está bien pensado.** El riesgo real de gamificar tarea escolar es
que el juego se vuelva más importante que el contenido y termine practicando algo
más fácil disfrazado de lo mismo. Empezar fiel y adaptar solo si hace falta
evita eso, y además deja ver **si el problema era la tarea o era la motivación** —
que es información útil por sí sola.

**Consecuencia técnica.** Cada paquete de contenido lleva dos campos nuevos:

```json
{
  "origen": "tarea de math del martes 8 sep",
  "objetivo": "restar hasta 20 con reagrupación",
  "fidelidad": "fiel" | "adaptado",
  "queCambio": "los objetos son bloques en vez de manzanas; los números son los mismos"
}
```

Así, en el panel de papá, siempre se puede ver qué versión jugó y qué se cambió.

---

## Decisiones que tomé yo (técnicas — decime si preferís otra cosa)

| # | Decisión | Por qué |
|---|---|---|
| T1 | Web app instalable (PWA), no app nativa | Un solo código para Android, iOS y PC. Nativo serían 3 desarrollos y 2 tiendas. |
| T2 | Estética de bloques/píxel, arte original | Le gusta Minecraft/Roblox. Uso ese lenguaje visual sin copiar personajes ni marcas ajenas. |
| T3 | Fallar nunca resta esmeraldas | Ya está 113 puntos abajo. Una app que castiga se abandona. Se gana o no se gana; nunca se pierde. |
| T4 | Dos intentos + botón "no me escuchó" antes de marcar rojo | El reconocimiento de voz falla con voz infantil y acento ESL. Sin esto, falsos rojos matan la motivación. |
| T5 | Los problemas de matemática registran por separado "falló la mate" y "falló el inglés" | Sin esa separación, un problema de lectura se lee como si fuera un problema de matemática. |
| T6 | El diagnóstico arranca por debajo de su nivel conocido | Empezar con éxitos fáciles y subir. Empezar difícil y bajar deja la sensación de fracaso desde el minuto uno. |

## 2026-09-21 — Replanificación solicitada por el papá

### D7 — Adaptar tareas y conectar aprendizajes
El papá autoriza hacer las tareas más jugables y conectarlas con tareas anteriores. Esto actualiza la secuencia de D6: puede diseñarse una adaptación desde el inicio sin esperar a que falle la versión literal. Conservar el objetivo, el original local y la explicación de cambios; no confundir práctica equivalente con entrega escolar.

### D8 — Diagnóstico inicial y periódico
Pedido explícito: al primer ingreso, diagnosticar con juegos, usar resultados para diseñar cómo seguir y repetir diagnósticos. Diseño propuesto: aventura inicial pausable, observación durante misiones, chequeo breve semanal y revisión más amplia cada cuatro semanas. La frecuencia exacta es una propuesta ajustable; no una evaluación escolar oficial.

### D9 — Separar práctica y evidencia
La revisión identifica que lectura, sopa y spelling se mezclan en palabras y que dos verdes acumulados se interpretan como dominio. Reemplazar esa regla en una futura implementación; conservar datos históricos sin inventar su modalidad. La propuesta completa y sus criterios están en 05 y 06.
