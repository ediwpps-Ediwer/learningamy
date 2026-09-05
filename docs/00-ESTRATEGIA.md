# Estrategia y arquitectura — Juego de Gaby

> Documento vivo. Última revisión: 2026-09-05
> Estado: **esperando decisiones del papá + prueba de micrófono**

---

## 1. Qué estamos construyendo

Una app de práctica gamificada, personal, para un niño de 7 años en 2º grado en
Georgia, hispanohablante, en programa ESOL. Dos mundos: **Reading** y **Math**.
El contenido no es genérico: sale de **sus** tareas, **su** programa del mes y
**sus** pruebas. El papá sube el material, yo lo convierto en niveles, el niño
juega, gana moneda del juego y la cambia por premios reales con el papá.

No es una app comercial. Es una herramienta de una sola familia, y eso da una
ventaja enorme: podemos ser quirúrgicos con el nivel y con el contenido.

---

## 2. Perfil del jugador (resumen — detalle en `01-PERFIL-GABY.md`)

| Dato | Valor |
|---|---|
| Edad | 7 años |
| Grado | 2º, Georgia |
| Idioma casa | Español |
| Programa | ESOL (English to Speakers of Other Languages) |
| Nivel lectura real | Kindergarten |
| Nivel matemática real | 1er grado |
| i-Ready Reading | **376** |
| i-Ready on-grade-level 2º | **489 – 560** |
| Brecha | ~113 puntos por debajo del piso de grado |

**Lectura de esa brecha:** no es un problema de inteligencia, es un problema de
**decodificación en inglés**. Sabe leer en su cabeza en español; en inglés todavía
no tiene automatizado el mapa letra→sonido. Por eso el plan de lectura arranca en
fonética y palabras de alta frecuencia (sight words), no en comprensión de textos
largos.

**En matemática la brecha es mucho más chica** (1 grado) y probablemente parte de
ella es **lenguaje, no matemática**: los problemas de palabras en 2º grado de
Georgia están escritos en inglés. Un niño que resuelve 8+5 pero no entiende
"how many more" falla el ejercicio por lectura, no por aritmética. El juego debe
separar esas dos cosas para saber cuál estamos midiendo.

---

## 3. Plataforma: decisión

**Requisito del papá:** correr en tablet Android (principal), iPhone/iPad, y PC.

Eso descarta hacer una app nativa (serían 3 desarrollos + cuentas de desarrollador
+ tiendas). **La respuesta correcta es una web app instalable (PWA)**: un solo
código, se abre con un link, se puede "agregar a pantalla de inicio" y se ve y se
siente como app (pantalla completa, ícono propio, sin barra de navegador).

### El requisito que manda sobre todo lo demás: el micrófono

El juego de lectura de palabras necesita micrófono. Y los navegadores **solo dan
micrófono en HTTPS** (o en `localhost`). Un servidor casero en la PC
(`http://192.168...`) **no** califica: el navegador de la tablet bloquea el
micrófono sin decir por qué.

Esto elimina la opción "servidor local en la PC" para la tablet. Necesitamos HTTPS
real. Dos caminos:

| | **A) Artifact de Claude** | **B) Hosting propio gratis** |
|---|---|---|
| HTTPS | ✅ automático | ✅ automático |
| Qué instalás | **nada** | nada en la tablet; cuenta gratis (3 min, sin tarjeta) |
| Cómo llega a la tablet | un link | un link |
| Instalable en pantalla de inicio | limitado | ✅ completo, ícono y todo |
| Funciona sin internet | ❌ | ✅ (menos el micrófono) |
| Progreso sincronizado tablet↔iPad↔PC | ✅ incluido | requiere backend aparte |
| El juego le puede preguntar a Claude en vivo | ✅ incluido | requiere clave de API |
| **Micrófono** | ⚠️ **a verificar** (corre dentro de un iframe) | ✅ garantizado |
| Yo lo actualizo | ✅ directo | ✅ directo |

### RESUELTO — 2026-09-05: va la opción B

Se midió en la tablet real. **El Artifact no entrega micrófono**
(`marcoDaMic=false`, `NotAllowedError`, `not-allowed`). No es un permiso negado por
el usuario: es el marco que bloquea la función antes de que la pregunta llegue a
nadie, y no hay forma de habilitarlo desde adentro de la página.
Detalle completo en `03-BITACORA.md`.

**Decisión: hosting propio con HTTPS.** El micrófono es el corazón del juego de
lectura; ninguna comodidad de la opción A compensa perderlo.

Lo que hay que reponer, que la opción A traía gratis:

| Lo que perdemos | Cómo se repone |
|---|---|
| Sincronización tablet↔iPad↔PC | Supabase (capa gratis). Ediwer ya lo usa en el proyecto Fit. |
| Cero instalación | Se reemplaza por 2 cuentas gratis, una sola vez, sin tarjeta. |

Y lo que ganamos a cambio: instalación real en la pantalla de inicio con ícono
propio, funcionamiento sin internet, y control total del código.

### Compatibilidad por dispositivo

| | Android (Chrome) | iPad/iPhone (Safari) | PC (Chrome/Edge) |
|---|---|---|---|
| Reconocimiento de voz | ✅ bueno | ⚠️ existe pero frágil | ✅ bueno |
| Modo carrera (1 min continuo) | ✅ | ❌ no aguanta continuo | ✅ |
| Modo práctica (palabra por palabra) | ✅ | ✅ | ✅ |
| Voz que pronuncia (TTS) | ✅ | ✅ | ✅ |
| Todo lo demás (mate, sopa, spelling) | ✅ | ✅ | ✅ |

**Consecuencia de diseño:** la tablet Android es el dispositivo principal y ahí va
el modo carrera. En iPad el juego ofrece automáticamente modo práctica. Nada se
rompe, solo cambia el modo.

---

## 4. La verdad sobre el semáforo de pronunciación

Tengo que ser honesto acá porque afecta la expectativa.

El navegador hace **speech-to-text**: escucha y devuelve *qué palabra creyó oír*,
con un número de confianza. **No devuelve una nota de pronunciación fonema por
fonema.** Con solo el navegador, nadie le puede decir "dijiste la /th/ como /d/".

Cómo construyo el semáforo con lo que sí hay:

- 🟢 **Verde** — reconoció la palabra exacta, confianza alta.
- 🟡 **Amarillo** — reconoció algo muy cercano (`ship`→`sheep`, `cat`→`cap`,
  `three`→`tree`), o la acertó con confianza baja. Estos son justamente los errores
  típicos de un hispanohablante, así que el amarillo es información valiosa.
- 🔴 **Rojo** — no coincide con nada parecido, o no se escuchó respuesta.

**Limitación real que vas a ver:** habrá **falsos rojos**. Voz infantil + acento
ESL + ruido de fondo hacen que a veces marque mal una palabra bien dicha. Si no lo
manejamos, el niño se frustra y abandona. Mitigaciones que van en el diseño desde
el día uno:

1. Botón **"no me escuchó"** → repite sin penalizar.
2. **Dos intentos** antes de marcar rojo.
3. El rojo **nunca quita** esmeraldas, solo no las da. Perder nunca cuesta.
4. En el panel del papá podés **corregir** un semáforo: "esta la dijo bien".
   Esas correcciones ajustan el modelo de dificultad.
5. El **modo práctica** (una palabra a la vez) es bastante más preciso que el modo
   carrera. Para evaluar de verdad usamos práctica; carrera es para fluidez y para
   competir contra su propio récord.

**Si esto no alcanza:** existe evaluación real de pronunciación fonema por fonema
(Azure Speech Pronunciation Assessment, SpeechAce). Da nota por sonido y dice
exactamente qué fonema falló. Cuesta ~1 USD por hora de audio y requiere cuenta y
clave. **No lo recomiendo para empezar** — primero veamos si el semáforo simple
alcanza. Queda como mejora de fase 6.

---

## 5. Arquitectura en capas

La clave del proyecto: **el motor del juego y el contenido son cosas separadas.**
Si van juntos, cada tarea nueva obliga a reprogramar. Separados, una tarea nueva
es solo un archivo de datos.

```
+--------------------------------------------------+
|  CAPA 4 — Panel del papá                         |
|  reportes · qué domina · qué falla · premios     |
+--------------------------------------------------+
|  CAPA 3 — Progreso                               |
|  cada intento, tiempo, semáforo, esmeraldas      |
+--------------------------------------------------+
|  CAPA 2 — Motor de juego   (NO cambia)           |
|  8 minijuegos · avatar · economía · dificultad   |
+--------------------------------------------------+
|  CAPA 1 — Contenido   (cambia todos los días)    |
|  paquetes JSON generados de sus tareas reales    |
+--------------------------------------------------+
```

### Forma de un paquete de contenido

Cada tarea que subas se vuelve un archivo así:

```json
{
  "id": "lect-2026-09-08-sight-words",
  "tipo": "lectura-palabras",
  "titulo": "Palabras de la semana",
  "origen": "tarea del lunes 8 sep",
  "destreza": "sight-words-primer",
  "nivelSugerido": 3,
  "items": [
    { "palabra": "went", "pista_es": "fue / se fue" },
    { "palabra": "have", "pista_es": "tener" }
  ]
}
```

El motor sabe jugar `tipo: "lectura-palabras"`. No le importa cuáles palabras sean.
Por eso agregar la tarea del martes es escribir un archivo, no tocar código.

---

## 6. Los juegos

### READING

| Juego | Qué mide | Cómo funciona |
|---|---|---|
| **Lectura de palabras** | Fluidez (palabras/min) + precisión | Modo carrera: 60s, lee todas las que pueda, semáforo en vivo. Al final: repaso de amarillas (oye la correcta y repite) y rojas (oye la correcta + separada en sonidos). Modo práctica: una a la vez, más preciso. |
| **Sopa de letras** | Reconocimiento visual + tiempo | Cuadrícula táctil, arrastra para marcar. Cronómetro. Al encontrarla, se pronuncia. Empieza 6×6 horizontal/vertical, sube a 10×10 con diagonales. |
| **Cuento corto** | Comprensión, personajes, diálogo, secuencia | Historia ilustrada por escenas, estética de bloques/píxel. Al final ronda "Challenger": quién / qué pasó / qué sigue / por qué. Cada acierto paga esmeraldas. |
| **Spelling** | Escritura de la palabra | Oye la palabra → la arma con letras. Verde a la primera, amarillo con ayuda, rojo falló → le muestro letra por letra con su sonido. |

### MATH

| Juego | Qué mide | Cómo funciona |
|---|---|---|
| **Operaciones** | Suma y resta, automaticidad | No solo el resultado: le pido **la estrategia** (contar hacia adelante, hacer diez, dobles, recta numérica). El objetivo es que tenga varias rutas, no una. |
| **Problemas** | Seguir la consigna | Problema en inglés con soporte en español a un toque. Pasos guiados: ¿qué te preguntan? → ¿qué datos hay? → ¿suma o resta? → resolvé. Registro separado de "falló la mate" vs "falló el inglés". |
| **Monedas y billetes** | Valor del dinero de USA | Identificar penny/nickel/dime/quarter y $1/$5/$10/$20. Después tienda: comprar, vender, dar vuelto, intercambiar. |
| **Gráficas** | Leer pictogramas y gráficas de barras | El juego dibuja la gráfica y pregunta: cuántos de X, cuál tiene más/menos, cuántos más que, cuántos en total. También: subís la foto de una gráfica de su tarea, yo extraigo los datos y el juego la redibuja limpia con sus preguntas. |

**Estética:** mundo propio de bloques/píxel, inspirado en lo que le gusta, con arte
original. No uso personajes ni marcas de Minecraft ni de Roblox.

---

## 7. Economía del juego

- Moneda: **esmeraldas**
- Se ganan por: acertar, terminar nivel, racha de días, superar su propio récord.
- **Nunca se pierden.** Fallar no cuesta. Es deliberado: el niño ya está 113 puntos
  abajo; lo último que necesita es una app que lo castigue.
- Se gastan en **premios reales que definís vos** en el panel del papá
  (ej: 50 = 15 min extra de tablet, 200 = escoger la cena, 500 = una salida).
- El juego lleva la cuenta; el canje lo autorizás vos con un botón.

---

## 8. El ciclo diario

```
1. Llega la tarea a casa
2. Le sacás foto y me la mandás por este chat
3. Yo la leo, la convierto en nivel(es) y actualizo el juego
4. Gaby abre el juego -> nivel nuevo esperándolo
5. Juega, gana esmeraldas
6. Yo leo el progreso y te digo: esto ya lo domina, esto hay que reforzar
```

**Sobre el "botón para subir":** lo pensé y la mejor forma **es este chat**. Ya
funciona, no hay que construir nada, y yo veo la foto directamente. Un botón dentro
del juego solo movería el archivo a una carpeta que yo igual tendría que abrir. Se
justifica solo si querés que Gaby suba cosas sin vos. La carpeta
`contenido/entrada/` queda creada por si preferís esa ruta.

---

## 9. ¿Necesitamos vincularlo a la IA?

Tres niveles. **No son excluyentes, son escalones.**

**Nivel 1 — Yo, en este chat. (Necesario. Ya lo tenés. Sin costo extra.)**
Soy la fábrica de contenido: leo la tarea, entiendo el objetivo, genero el nivel,
adapto la dificultad según su progreso. No hay que instalar nada ni sacar claves.
**Empezamos acá.**

**Nivel 2 — El juego le pregunta a Claude en vivo. (Opcional.)**
Solo si vamos por Artifact. Sirve para problemas infinitos generados al momento,
pistas adaptadas cuando se traba, y corregir respuestas escritas abiertas. Consume
del plan de quien tenga la página abierta. **Sugerencia: no en la fase 1.** Primero
veamos si con contenido preparado alcanza — casi siempre alcanza y es más
predecible.

**Nivel 3 — Evaluación de pronunciación de verdad. (Opcional, de pago.)**
Ver sección 4. Solo si el semáforo del navegador se queda corto en la práctica.

---

## 10. Qué tenés que instalar

**Tablet Android:** nada. Solo **Chrome** (verificar que sea Chrome y no Samsung
Internet — el reconocimiento de voz anda mucho mejor en Chrome).

**iPad/iPhone:** nada. Safari.

**PC:** ya está todo. Verificado: **Python 3.12.10** y **Node 24.19.0**. No hace
falta instalar nada más.

**Cuentas:** ninguna si vamos por Artifact. Si vamos por hosting propio, una cuenta
gratis (Netlify o GitHub) — 3 minutos, sin tarjeta.

---

## 11. Fases

| Fase | Qué | Estado |
|---|---|---|
| **0** | Prueba de micrófono en la tablet + decisiones del papá | **acá estamos** |
| **1** | Setup: avatar, mundo, economía + **diagnóstico** (~20 min de juego que me dice desde dónde arrancar en cada destreza) | pendiente |
| **2** | Reading: los 4 juegos | pendiente |
| **3** | Math: los 4 juegos | pendiente |
| **4** | Panel del papá: reportes, tienda de premios | pendiente |
| **5** | Ciclo diario con tareas reales | pendiente |
| **6** | (opcional) pronunciación fonema por fonema | evaluar después |

---

## 12. Riesgos conocidos

| Riesgo | Impacto | Qué hacemos |
|---|---|---|
| Micrófono bloqueado en Artifact | alto | Se mide en fase 0, antes de escribir el juego |
| Falsos rojos en pronunciación | alto (frustración) | 2 intentos, "no me escuchó", nunca resta, papá corrige |
| Safari iOS no aguanta modo continuo | medio | Detecta el dispositivo y ofrece modo práctica |
| El niño se aburre a las 2 semanas | alto | Contenido siempre nuevo (sus tareas reales) + premios reales negociados con el papá |
| Confundir "no sabe mate" con "no entendió el inglés" | medio | Los problemas registran ambas causas por separado |
| Sin internet no hay reconocimiento de voz | bajo | Los otros 7 juegos funcionan offline (si vamos por PWA propia) |
