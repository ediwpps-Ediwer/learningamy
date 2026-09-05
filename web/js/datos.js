/* ============================================================================
   DATOS — Banco de contenido del juego de Gabriel
   ----------------------------------------------------------------------------
   Todo lo de acá sale de SUS materiales reales:
     · Listas de sight words Módulos 1-10 (HMH Into Reading, Grado 2)
     · Hojas de Nonsense Word Fluency CVC / CVCe (MTT Education Station)
     · Family Letter Módulo 3 — patrón VCe, soft c/g, trigraphs, heart words
     · Newsletter 7-11 sep — spelling vCe de la semana
     · i-Ready Lesson 4 — gráficas de barras y pictogramas
     · Equation Cards y Model Cards de clase
   El motor no conoce ninguna de estas palabras: solo sabe jugar los TIPOS.
   Para agregar una tarea nueva, se agrega un paquete acá. No se toca el motor.
   ========================================================================== */

(function (global) {
  "use strict";

  /* --- helper: "word|traducción" -> {p, es} ------------------------------ */
  function lista(cadena) {
    return cadena.trim().split(/\s*,\s*/).map(function (par) {
      var t = par.split("|");
      return { p: t[0].trim(), es: (t[1] || "").trim() };
    });
  }

  /* ==========================================================================
     READING · SIGHT WORDS POR MÓDULO
     Fuente: hojas "Module N Reading Foundational Sight Word List"
     i-Ready dice que High-Frequency Words es su ÁREA MÁS FUERTE
     (Approaching Grade 2). Por acá se arranca: victorias rápidas.
     ======================================================================== */

  /* Foco fonético de cada módulo. Sale de leer las listas juntas: no es
     alfabético ni al azar, cada módulo agrupa un patrón. Sirve para armar
     niveles que ataquen el patrón, no solo palabras sueltas. */
  var MODULO_PATRON = {
    1:  "Base: pronombres y palabras de una sílaba",
    2:  "Floss rules (ll, ss, ff) · dígrafos sh/th/wh · -ing",
    3:  "VCe (made, time, gave, page) · heart words buy/guy",
    4:  "y como vocal (my, try, sky, why, baby, happy, city)",
    5:  "Vocales largas en equipo: ee, ea, ai · -ed (tried, cried)",
    6:  "igh (right, might, night, high) · ow largo (grow, slow, show)",
    7:  "Vocales con r: ar (car, far, dark, part, start)",
    8:  "Vocales con r: er, ir, ur, ear (bird, first, work, learn)",
    9:  "oo (book, good, look, push, full) · contracciones",
    10: "Dígrafos difíciles: augh/ough (laugh, thought) · wa (watch, wash)",
    11: "Diptongos: ou/ow (house, mouse, down, round) · oi/oy (boy, voice)",
    12: "Familia -ough (rough, tough, enough) · letras mudas (know, write, answer)"
  };

  var SIGHT = {
    1: lista(`into|adentro, two|dos, been|estado, very|muy, him|él,
      not|no, job|trabajo, most|la mayoría, cold|frío, find|encontrar,
      hold|sostener, no|no, be|ser, me|a mí, a|un, we|nosotros, I|yo, go|ir,
      he|él, pass|pasar, tell|decir, off|apagado, all|todos, child|niño,
      which|cuál, much|mucho, them|ellos, then|entonces, this|este, that|ese`),

    2: lista(`nothing|nada, about|acerca de, around|alrededor, away|lejos,
      women|mujeres, woman|mujer, back|atrás, thing|cosa, sing|cantar,
      long|largo, song|canción, I'll|yo voy a, children|niños, animal|animal,
      ball|pelota, pull|jalar, full|lleno, call|llamar, tall|alto, fall|caer,
      small|pequeño, wish|deseo, shop|tienda, shall|deberá, when|cuándo,
      with|con, does|hace, give|dar, line|línea, said|dijo`),

    3: lista(`buy|comprar, guy|tipo, anyone|cualquiera, anything|cualquier cosa,
      made|hizo, time|tiempo, gave|dio, these|estos, page|página,
      change|cambiar, walk|caminar, upon|sobre, sure|seguro, left|izquierda,
      close|cerrar, come|venir, done|hecho, front|frente, its|su,
      until|hasta, what|qué, bring|traer, place|lugar, are|son, hand|mano,
      kept|guardó, land|tierra, across|a través, mountain|montaña,
      held|sostuvo`),

    4: lista(`says|dice, busy|ocupado, business|negocio, above|arriba,
      among|entre, my|mi, by|por, try|intentar, sky|cielo, fly|volar,
      why|por qué, baby|bebé, city|ciudad, happy|feliz, study|estudiar,
      body|cuerpo, while|mientras, spell|deletrear, asked|preguntó,
      comb|peine, girl|niña, grand|grandioso, lady|señora, number|número,
      afraid|asustado, great|genial, passed|pasó, clean|limpio,
      feel|sentir, ground|suelo`),

    5: lista(`because|porque, other|otro, another|otro más, always|siempre,
      almost|casi, tried|intentó, cried|lloró, little|pequeño, table|mesa,
      example|ejemplo, three|tres, eat|comer, seem|parecer, need|necesitar,
      street|calle, white|blanco, really|realmente, leave|dejar,
      please|por favor, queen|reina, seen|visto, tree|árbol, stay|quedarse,
      below|debajo, follow|seguir, window|ventana, own|propio, road|camino,
      become|convertirse, kind|amable`),

    6: lista(`both|ambos, only|solo, people|gente, play|jugar, they|ellos,
      eight|ocho, grow|crecer, slow|lento, show|mostrar, yellow|amarillo,
      right|correcto, might|podría, night|noche, high|alto, begin|empezar,
      one|uno, open|abrir, began|empezó, of|de, ready|listo, their|su,
      whole|entero, years|años, didn't|no lo hizo, funny|gracioso,
      pretty|bonito, anything|cualquier cosa, gone|ido, notice|notar,
      now|ahora`),

    7: lista(`beauty|belleza, beautiful|hermoso, heart|corazón, toward|hacia,
      together|juntos, car|carro, far|lejos, dark|oscuro, part|parte,
      start|empezar, hair|cabello, bear|oso, sea|mar, see|ver, way|camino,
      since|desde, color|color, hard|difícil, hour|hora, large|grande,
      was|era, morning|mañana, order|orden, store|tienda, those|esos,
      after|después, better|mejor, letter|carta, over|sobre, under|debajo`),

    8: lista(`someone|alguien, everyone|todos, learn|aprender, earth|tierra,
      early|temprano, their|su (de ellos), form|forma, for|para, more|más,
      your|tu, her|su, bird|pájaro, first|primero, hear|oír, near|cerca,
      year|año, work|trabajo, world|mundo, word|palabra, father|papá,
      mother|mamá, water|agua, air|aire, remember|recordar, stood|se paró,
      everything|todo, himself|él mismo, maybe|quizás, some|algunos,
      without|sin`),

    9: lista(`friend|amigo, move|mover, prove|probar, even|incluso,
      music|música, paper|papel, before|antes, seven|siete, second|segundo,
      look|mirar, push|empujar, book|libro, good|bueno, put|poner,
      full|lleno, group|grupo, too|también, you|tú, couldn't|no pudo,
      don't|no, however|sin embargo, live|vivir, should|debería,
      you're|tú eres, again|otra vez, along|a lo largo, myself|yo mismo,
      once|una vez, piece|pedazo`),

    10: lista(`often|a menudo, listen|escuchar, laugh|reír, through|a través,
      blue|azul, new|nuevo, draw|dibujar, thought|pensó, head|cabeza,
      want|querer, watch|mirar, wash|lavar, table|mesa, something|algo,
      against|contra, here|aquí, hurry|apurarse, area|área, from|de,
      there|allí, who|quién, ago|hace, carry|cargar, many|muchos,
      money|dinero, sturdy|firme, wasn't|no era, stopped|se detuvo,
      toward|hacia, goes|va`),

    11: lista(`honor|honor, honest|honesto, between|entre, house|casa,
      mouse|ratón, down|abajo, round|redondo, brown|marrón,
      found|encontró, boy|niño, voice|voz, brother|hermano,
      happened|pasó, help|ayuda, home|casa, away|lejos, because|porque,
      country|país, else|más, rain|lluvia, family|familia, oh|ah,
      people|gente, sleep|dormir, today|hoy, tomorrow|mañana, list|lista,
      suddenly|de repente, surprise|sorpresa, plant|planta`),

    12: lista(`rough|áspero, tough|duro, enough|suficiente, know|saber,
      write|escribir, school|escuela, young|joven, answer|respuesta,
      inside|adentro, measure|medir, picture|foto, question|pregunta,
      turned|giró, where|dónde, can't|no puede, complete|completo,
      easy|fácil, eyes|ojos, love|amor, reached|alcanzó, sentence|oración,
      state|estado, different|diferente, doing|haciendo, I'm|yo soy,
      idea|idea, important|importante, next|siguiente, plan|plan,
      tried|intentó`)
  };

  /* ==========================================================================
     READING · NONSENSE WORDS (fluidez pura de decodificación)
     Fuente: 8 hojas "CVC and CVCE Nonsense Word Fluency"
     Al ser inventadas no se pueden memorizar: miden decodificación real.
     `s` = cómo suena, para que la voz del juego la pronuncie bien.
     `ok` = transcripciones que el reconocedor puede devolver y son correctas
            (el reconocedor solo devuelve palabras reales del diccionario).
     ======================================================================== */

  var NONSENSE = {
    cvc: [
      { p: "zax", s: "zaks" }, { p: "cav", s: "kav" }, { p: "bas", s: "bass", ok: ["bass", "bas"] },
      { p: "nam", s: "nam", ok: ["nam", "nom"] }, { p: "daf", s: "daf" },
      { p: "heg", s: "heg" }, { p: "jek", s: "jek" }, { p: "lep", s: "lep" },
      { p: "quet", s: "kwet" }, { p: "wez", s: "wez" },
      { p: "rix", s: "riks" }, { p: "tic", s: "tik", ok: ["tick", "tic"] },
      { p: "yiv", s: "yiv" }, { p: "pib", s: "pib" }, { p: "zin", s: "zin" },
      { p: "com", s: "kom" }, { p: "vos", s: "voss" }, { p: "bod", s: "bod" },
      { p: "nof", s: "nof" }, { p: "mog", s: "mog" },
      { p: "suj", s: "suj" }, { p: "duk", s: "duk", ok: ["duck", "duk"] },
      { p: "ful", s: "ful" }, { p: "gup", s: "gup" }, { p: "kut", s: "kut", ok: ["cut", "kut"] },
      { p: "haz", s: "haz", ok: ["has", "haz"] }, { p: "jax", s: "jaks", ok: ["jacks", "jax"] },
      { p: "kac", s: "kak" }, { p: "lav", s: "lav" }, { p: "wab", s: "wab" },
      { p: "ren", s: "ren", ok: ["wren", "ren"] }, { p: "tem", s: "tem" },
      { p: "yed", s: "yed" }, { p: "pes", s: "pess" }, { p: "zef", s: "zef" },
      { p: "cig", s: "sig" }, { p: "vik", s: "vik" }, { p: "bij", s: "bij" },
      { p: "nil", s: "nil" }, { p: "mit", s: "mit", ok: ["mitt", "mit"] },
      { p: "zab", s: "zab" }, { p: "bom", s: "bom" }, { p: "jez", s: "jez" },
      { p: "gud", s: "gud" }, { p: "nin", s: "nin" },
      { p: "quec", s: "kwek" }, { p: "tun", s: "tun", ok: ["ton", "tun"] },
      { p: "kix", s: "kiks" }, { p: "haf", s: "haf", ok: ["half", "haf"] },
      { p: "sop", s: "sop" }, { p: "wid", s: "wid" }, { p: "hap", s: "hap" },
      { p: "poc", s: "pok" }, { p: "jeg", s: "jeg" }, { p: "tus", s: "tuss" },
      { p: "sof", s: "sof" }, { p: "res", s: "ress" }, { p: "luv", s: "luv", ok: ["love", "luv"] },
      { p: "kij", s: "kij" }, { p: "wat", s: "wat" }, { p: "cug", s: "kug" },
      { p: "git", s: "git" }, { p: "bab", s: "bab" }, { p: "lok", s: "lok", ok: ["lock", "lok"] },
      { p: "yev", s: "yev" }, { p: "daj", s: "daj" }, { p: "nov", s: "nov" },
      { p: "cen", s: "sen" }, { p: "mul", s: "mul" }, { p: "gix", s: "giks" },
      { p: "vek", s: "vek" }, { p: "mux", s: "muks" }, { p: "fim", s: "fim" },
      { p: "pap", s: "pap" }, { p: "voz", s: "voz" }, { p: "fil", s: "fil" },
      { p: "yaz", s: "yaz" }, { p: "dos", s: "doss" }, { p: "ret", s: "ret" },
      { p: "zum", s: "zum" },
      { p: "baz", s: "baz" }, { p: "cev", s: "sev" }, { p: "dis", s: "diss" },
      { p: "fot", s: "fot" }, { p: "gux", s: "guks" }, { p: "jem", s: "jem" },
      { p: "kik", s: "kik", ok: ["kick", "kik"] }, { p: "lon", s: "lon" },
      { p: "naj", s: "naj" }, { p: "pef", s: "pef" }, { p: "quig", s: "kwig" },
      { p: "roc", s: "rok", ok: ["rock", "roc"] }, { p: "sud", s: "sud" },
      { p: "taz", s: "taz" }, { p: "veb", s: "veb" }, { p: "wic", s: "wik", ok: ["wick", "wic"] },
      { p: "yod", s: "yod" }, { p: "zuf", s: "zuf" }, { p: "gen", s: "jen" },
      { p: "lik", s: "lik", ok: ["lick", "lik"] }, { p: "quob", s: "kwob" },
      { p: "vut", s: "vut" }, { p: "het", s: "het" }, { p: "mij", s: "mij" },
      { p: "rog", s: "rog" }, { p: "wus", s: "wuss" }, { p: "daz", s: "daz" },
      { p: "jel", s: "jel" }, { p: "nif", s: "nif" }, { p: "soc", s: "sok", ok: ["sock", "soc"] },
      { p: "yup", s: "yup" }, { p: "fap", s: "fap" }, { p: "kem", s: "kem" },
      { p: "pid", s: "pid" }, { p: "toz", s: "toz" }, { p: "zun", s: "zun" },
      { p: "biz", s: "biz" }, { p: "gus", s: "guss" }, { p: "det", s: "det" },
      { p: "tod", s: "tod" }, { p: "yac", s: "yak", ok: ["yak", "yac"] },
      { p: "cix", s: "siks" }, { p: "hun", s: "hun" }, { p: "pev", s: "pev" },
      { p: "soz", s: "soz" }, { p: "vad", s: "vad" }, { p: "div", s: "div" },
      { p: "kug", s: "kug" }, { p: "bez", s: "bez" }, { p: "hom", s: "hom" },
      { p: "waf", s: "waf" }, { p: "fis", s: "fiss" }, { p: "mul2", s: "mul" },
      { p: "cev2", s: "sev" }, { p: "gov", s: "gov" }, { p: "kad", s: "kad" },
      { p: "sag", s: "sag" }, { p: "bux", s: "buks" }, { p: "wox", s: "woks" },
      { p: "dut", s: "dut" }, { p: "yot", s: "yot" }, { p: "tak", s: "tak", ok: ["tack", "tak"] },
      { p: "hin", s: "hin" }, { p: "cuz", s: "kuz" }, { p: "zos", s: "zoss" },
      { p: "nek", s: "nek", ok: ["neck", "nek"] }, { p: "ral", s: "ral" },
      { p: "fup", s: "fup" }, { p: "kop", s: "kop" }, { p: "kip", s: "kip" },
      { p: "wef", s: "wef" }, { p: "vob", s: "vob" }, { p: "rep", s: "rep" },
      { p: "sed", s: "sed" }, { p: "num", s: "num" }, { p: "pud", s: "pud" },
      { p: "ruf", s: "ruf", ok: ["rough", "ruff", "ruf"] }, { p: "wap", s: "wap" },
      { p: "wad", s: "wad" }, { p: "pif", s: "pif" }, { p: "ric", s: "rik", ok: ["rick", "ric"] },
      { p: "fot2", s: "fot" }, { p: "boz", s: "boz" }, { p: "cox", s: "koks" },
      { p: "mik", s: "mik" }, { p: "lim", s: "lim", ok: ["limb", "lim"] },
      { p: "bax", s: "baks" }, { p: "mas", s: "mass", ok: ["mass", "mas"] },
      { p: "sak", s: "sak", ok: ["sack", "sak"] }
    ],

    cvce: [
      { p: "pade", s: "payd", ok: ["paid", "payed", "pade"] },
      { p: "rabe", s: "raybe", ok: ["rabe", "ray b"] },
      { p: "sate", s: "sayt", ok: ["sate", "sat"] },
      { p: "tave", s: "tayv", ok: ["tave"] },
      { p: "gade", s: "gayd", ok: ["gade"] },
      { p: "mepe", s: "meep", ok: ["meep"] },
      { p: "tepe", s: "teep", ok: ["teepee", "tepe"] },
      { p: "vene", s: "veen", ok: ["vene", "vein"] },
      { p: "reze", s: "reez", ok: ["reze"] },
      { p: "zebe", s: "zeeb", ok: ["zebe"] },
      { p: "mife", s: "mife", ok: ["mife"] },
      { p: "nime", s: "nime", ok: ["nime"] },
      { p: "pite", s: "pite", ok: ["pite", "pight"] },
      { p: "rine", s: "rine", ok: ["rine", "rhine"] },
      { p: "bize", s: "bize", ok: ["bize", "buys"] },
      { p: "vofe", s: "vofe", ok: ["vofe"] },
      { p: "wole", s: "wole", ok: ["wole", "whole"] },
      { p: "yote", s: "yote", ok: ["yote"] },
      { p: "zobe", s: "zobe", ok: ["zobe"] },
      { p: "bobe", s: "bobe", ok: ["bobe"] },
      { p: "supe", s: "supe", ok: ["supe", "soup"] },
      { p: "tuge", s: "tuge", ok: ["tuge"] },
      { p: "vufe", s: "vufe", ok: ["vufe"] },
      { p: "wute", s: "wute", ok: ["wute"] },
      { p: "zuse", s: "zuse", ok: ["zuse"] },
      { p: "baze", s: "bayz", ok: ["baze", "bays", "bass"] },
      { p: "mave", s: "mayv", ok: ["mave"] },
      { p: "dase", s: "dayce", ok: ["dase", "days"] },
      { p: "fape", s: "fayp", ok: ["fape"] },
      { p: "gane", s: "gayn", ok: ["gane", "gain"] },
      { p: "mofe", s: "mofe", ok: ["mofe"] },
      { p: "noke", s: "noke", ok: ["noke", "no k"] },
      { p: "pote", s: "pote", ok: ["pote"] },
      { p: "roge", s: "roge", ok: ["roge", "rogue"] },
      { p: "lode", s: "lode", ok: ["lode", "load", "lowed"] },
      { p: "kibe", s: "kibe", ok: ["kibe"] },
      { p: "lide", s: "lide", ok: ["lide", "lied"] },
      { p: "mage", s: "mayj", ok: ["mage"] },
      { p: "gube", s: "gube", ok: ["gube"] },
      { p: "bege", s: "beej", ok: ["bege", "beige"] },
      { p: "mive", s: "mive", ok: ["mive"] },
      { p: "dise", s: "dice", ok: ["dise", "dice"] },
      { p: "tose", s: "toce", ok: ["tose", "toes"] },
      { p: "deke", s: "deke", ok: ["deke"] },
      { p: "dute", s: "dute", ok: ["dute"] },
      { p: "hupe", s: "hupe", ok: ["hupe", "hoop"] },
      { p: "gefe", s: "geef", ok: ["gefe"] },
      { p: "fipe", s: "fipe", ok: ["fipe"] },
      { p: "hime", s: "hime", ok: ["hime", "hime"] },
      { p: "sope", s: "sope", ok: ["sope", "soap"] },
      { p: "cede", s: "seed", ok: ["cede", "seed"] },
      { p: "puge", s: "puge", ok: ["puge"] },
      { p: "nafe", s: "nafe", ok: ["nafe"] },
      { p: "kuge", s: "kuge", ok: ["kuge"] },
      { p: "febe", s: "feeb", ok: ["febe", "feeb"] },
      { p: "gine", s: "jine", ok: ["gine"] },
      { p: "heme", s: "heem", ok: ["heme"] },
      { p: "mube", s: "mube", ok: ["mube"] },
      { p: "kene", s: "keen", ok: ["kene", "keen"] },
      { p: "lese", s: "leece", ok: ["lese", "lease"] },
      { p: "yeke", s: "yeek", ok: ["yeke"] },
      { p: "wege", s: "weej", ok: ["wege"] },
      { p: "vede", s: "veed", ok: ["vede"] },
      { p: "tefe", s: "teef", ok: ["tefe"] },
      { p: "sele", s: "seel", ok: ["sele", "seal"] },
      { p: "rebe", s: "reeb", ok: ["rebe"] },
      { p: "peme", s: "peem", ok: ["peme"] },
      { p: "hame", s: "haym", ok: ["hame", "hame"] },
      { p: "cufe", s: "kyoof", ok: ["cufe"] },
      { p: "zuse2", s: "zuse", ok: ["zuse"] }
    ]
  };

  /* ==========================================================================
     READING · MÓDULO 3 — lo que está viendo EN CLASE AHORA
     Fuente: Family Letter Módulo 3 + Newsletter 7-11 sep
     ======================================================================== */

  var MODULO3 = {
    spellingSemana: lista(`made|hizo, safe|seguro, time|tiempo, like|como,
      eve|víspera, dome|cúpula, whole|entero, athlete|atleta`),

    vcePatrones: [
      { patron: "a_e", sonido: "a larga", ejemplo: "cape", es: "capa" },
      { patron: "i_e", sonido: "i larga", ejemplo: "kite", es: "cometa" },
      { patron: "u_e", sonido: "u larga", ejemplo: "tube", es: "tubo" },
      { patron: "o_e", sonido: "o larga", ejemplo: "robe", es: "bata" },
      { patron: "e_e", sonido: "e larga", ejemplo: "athlete", es: "atleta" }
    ],

    vcePractica: lista(`invite|invitar, lifetime|toda la vida, excuse|excusa,
      grapevine|parra, flagpole|asta, pinecone|piña, placemat|individual,
      reptile|reptil, cupcake|panquecito, reduce|reducir`),

    softCG: [
      { p: "mice", es: "ratones", regla: "soft c", nota: "c + e/i/y suena /s/" },
      { p: "circle", es: "círculo", regla: "soft c", nota: "c + e/i/y suena /s/" },
      { p: "pencil", es: "lápiz", regla: "soft c", nota: "c + e/i/y suena /s/" },
      { p: "cage", es: "jaula", regla: "soft g", nota: "g + e/i/y suena /j/" },
      { p: "giraffe", es: "jirafa", regla: "soft g", nota: "g + e/i/y suena /j/" },
      { p: "ingest", es: "ingerir", regla: "soft g", nota: "g + e/i/y suena /j/" }
    ],

    trigraphs: [
      { p: "catch", es: "atrapar", regla: "tch", nota: "t-c-h juntas suenan /ch/" },
      { p: "badge", es: "insignia", regla: "dge", nota: "d-g-e juntas suenan /j/" }
    ],

    heartWords: lista(`buy|comprar, guy|tipo, anyone|cualquiera,
      anything|cualquier cosa`),

    repaso: {
      digraphs: ["ch", "ph", "th", "sh", "wh"],
      floss: ["ll", "ss", "ff", "zz"]
    }
  };

  /* ==========================================================================
     MATH · ECUACIONES — la incógnita NO siempre va al final
     Fuente: hojas "Equation Cards" de clase.
     Esto mide seguir la consigna, no calcular.
     ======================================================================== */

  var ECUACIONES_CLASE = [
    { txt: "6 + 6 = ?",  a: 6, b: 6,  r: 12, hueco: "resultado", op: "+" },
    { txt: "9 + ? = 18", a: 9, b: 9,  r: 18, hueco: "segundo",   op: "+" },
    { txt: "7 + ? = 10", a: 7, b: 3,  r: 10, hueco: "segundo",   op: "+" },
    { txt: "15 - 6 = ?", a: 15, b: 6, r: 9,  hueco: "resultado", op: "-" },
    { txt: "8 + ? = 17", a: 8, b: 9,  r: 17, hueco: "segundo",   op: "+" },
    { txt: "13 - ? = 8", a: 13, b: 5, r: 8,  hueco: "segundo",   op: "-" },
    { txt: "5 + ? = 14", a: 5, b: 9,  r: 14, hueco: "segundo",   op: "+" },
    { txt: "9 + 9 = ?",  a: 9, b: 9,  r: 18, hueco: "resultado", op: "+" }
  ];

  /* Las 4 estrategias que enseña la escuela (Model Cards).
     El papá pidió explícitamente que desarrolle varias rutas, no una. */
  var ESTRATEGIAS = [
    { id: "contar",   nombre: "Count On",      es: "Contar hacia adelante",
      pista: "Empezá en el número grande y contá para arriba." },
    { id: "diez",     nombre: "Make a Ten",    es: "Hacer diez",
      pista: "Llegá primero a 10, después sumá lo que sobra." },
    { id: "bond",     nombre: "Number Bond",   es: "Descomponer el número",
      pista: "Partí el número en dos pedazos que sean más fáciles." },
    { id: "recta",    nombre: "Number Line",   es: "Recta numérica",
      pista: "Saltá por la recta: primero hasta 10, después el resto." },
    { id: "dobles",   nombre: "Doubles",       es: "Dobles",
      pista: "¿Es un doble, o casi un doble que ya te sabés?" }
  ];

  /* ==========================================================================
     MATH · GRÁFICAS
     Fuente: i-Ready Lesson 4 "Draw and Use Bar Graphs and Picture Graphs"
     Los dos primeros son LOS EJEMPLOS EXACTOS de su hoja.
     ======================================================================== */

  var GRAFICAS = [
    {
      id: "clima",
      tipo: "pictograma",
      titulo: "Weather Last Week",
      titulo_es: "El clima la semana pasada",
      unidad: "1 symbol = 1 day",
      datos: [
        { et: "Sunny",  es: "Soleado", v: 3, icono: "sol" },
        { et: "Rainy",  es: "Lluvioso", v: 1, icono: "lluvia" },
        { et: "Cloudy", es: "Nublado", v: 2, icono: "nube" },
        { et: "Snowy",  es: "Nevado",  v: 1, icono: "nieve" }
      ]
    },
    {
      id: "frutas",
      tipo: "barras",
      titulo: "Favorite Fruits",
      titulo_es: "Frutas favoritas",
      ejeY: "Number of Friends",
      max: 6,
      datos: [
        { et: "Apples",  es: "Manzanas", v: 5, icono: "manzana" },
        { et: "Oranges", es: "Naranjas", v: 2, icono: "naranja" },
        { et: "Grapes",  es: "Uvas",     v: 3, icono: "uva" }
      ]
    },
    {
      id: "monedas",
      tipo: "barras",
      titulo: "Coins",
      titulo_es: "Monedas",
      ejeY: "Number of Coins",
      max: 10,
      datos: [
        { et: "Pennies",  es: "Pennies",  v: 6, icono: "penny" },
        { et: "Nickels",  es: "Nickels",  v: 2, icono: "nickel" },
        { et: "Dimes",    es: "Dimes",    v: 4, icono: "dime" },
        { et: "Quarters", es: "Quarters", v: 3, icono: "quarter" }
      ]
    },
    {
      id: "mascotas",
      tipo: "pictograma",
      titulo: "Pets in Our Class",
      titulo_es: "Mascotas de la clase",
      unidad: "1 symbol = 1 pet",
      datos: [
        { et: "Dogs",  es: "Perros",  v: 7, icono: "perro" },
        { et: "Cats",  es: "Gatos",   v: 4, icono: "gato" },
        { et: "Fish",  es: "Peces",   v: 5, icono: "pez" },
        { et: "Birds", es: "Pájaros", v: 2, icono: "pajaro" }
      ]
    },
    {
      id: "bloques",
      tipo: "barras",
      /* Ojo con los nombres: las preguntas se arman como "How many {et} are
         there?", así que cada etiqueta tiene que ser un sustantivo contable
         en plural. "How many Dirt are there?" no es inglés correcto, y en una
         app de lectura no se puede modelar mal la gramática. */
      titulo: "Tools in the Chest",
      titulo_es: "Herramientas en el cofre",
      ejeY: "Number of Tools",
      max: 10,
      datos: [
        { et: "Pickaxes", es: "picos",      v: 8, icono: "pico" },
        { et: "Torches",  es: "antorchas",  v: 5, icono: "antorcha" },
        { et: "Shields",  es: "escudos",    v: 2, icono: "escudo" },
        { et: "Boats",    es: "botes",      v: 4, icono: "bote" }
      ]
    }
  ];

  /* Tipos de pregunta que pide el estándar 2.MD (y la hoja de la Lesson 4) */
  var PREGUNTAS_GRAFICA = [
    { id: "cuantos",  en: "How many {a} are there?",              es: "¿Cuántos {a} hay?" },
    { id: "mas",      en: "Which has the most?",                  es: "¿Cuál tiene más?" },
    { id: "menos",    en: "Which has the fewest?",                es: "¿Cuál tiene menos?" },
    { id: "cuantosMas", en: "How many more {a} than {b}?",        es: "¿Cuántos {a} más que {b}?" },
    { id: "cuantosMenos", en: "How many fewer {b} than {a}?",     es: "¿Cuántos {b} menos que {a}?" },
    { id: "total",    en: "How many in all?",                     es: "¿Cuántos hay en total?" },
    { id: "juntos",   en: "How many {a} and {b} together?",       es: "¿Cuántos {a} y {b} juntos?" }
  ];

  /* ==========================================================================
     MATH · MONEDAS Y BILLETES DE USA
     ======================================================================== */

  var DINERO = [
    { id: "penny",   nombre: "Penny",   v: 1,   es: "1 centavo",     color: "#c47a3d", tipo: "moneda" },
    { id: "nickel",  nombre: "Nickel",  v: 5,   es: "5 centavos",    color: "#9aa3ad", tipo: "moneda" },
    { id: "dime",    nombre: "Dime",    v: 10,  es: "10 centavos",   color: "#aeb6bf", tipo: "moneda" },
    { id: "quarter", nombre: "Quarter", v: 25,  es: "25 centavos",   color: "#8f98a3", tipo: "moneda" },
    { id: "d1",      nombre: "$1 bill", v: 100, es: "1 dólar",       color: "#5c8a5c", tipo: "billete" },
    { id: "d5",      nombre: "$5 bill", v: 500, es: "5 dólares",     color: "#6b7fa3", tipo: "billete" },
    { id: "d10",     nombre: "$10 bill", v: 1000, es: "10 dólares",  color: "#b08a4f", tipo: "billete" },
    { id: "d20",     nombre: "$20 bill", v: 2000, es: "20 dólares",  color: "#6f9e7a", tipo: "billete" }
  ];

  /* Cosas que se pueden comprar en la tienda de bloques (precios en centavos) */
  var TIENDA = [
    { p: "apple",   es: "manzana", precio: 35,  icono: "manzana" },
    { p: "bread",   es: "pan",     precio: 60,  icono: "pan" },
    { p: "torch",   es: "antorcha", precio: 15, icono: "antorcha" },
    { p: "pickaxe", es: "pico",    precio: 145, icono: "pico" },
    { p: "shield",  es: "escudo",  precio: 220, icono: "escudo" },
    { p: "carrot",  es: "zanahoria", precio: 25, icono: "zanahoria" },
    { p: "boat",    es: "bote",    precio: 80,  icono: "bote" },
    { p: "lantern", es: "farol",   precio: 175, icono: "farol" }
  ];

  /* ==========================================================================
     MATH · PROBLEMAS
     La maestra avisó: un paso ahora, comparación, y pronto dos pasos.
     Cada problema guarda por separado si falló la MATE o el INGLÉS.
     ======================================================================== */

  var PROBLEMAS = [
    { id: "p1", tipo: "unPaso", op: "+",
      en: "Gabriel mined 8 stone blocks. Then he mined 6 more. How many blocks does he have now?",
      es: "Gabriel minó 8 bloques de piedra. Después minó 6 más. ¿Cuántos bloques tiene ahora?",
      datos: [8, 6], r: 14,
      pregunta_en: "How many blocks in all?", clave: "in all" },

    { id: "p2", tipo: "unPaso", op: "-",
      en: "There were 15 apples in the chest. Gabriel ate 7. How many apples are left?",
      es: "Había 15 manzanas en el cofre. Gabriel se comió 7. ¿Cuántas manzanas quedan?",
      datos: [15, 7], r: 8,
      pregunta_en: "How many are left?", clave: "are left" },

    { id: "p3", tipo: "comparacion", op: "-",
      en: "Gabriel has 12 emeralds. His friend has 5 emeralds. How many more emeralds does Gabriel have?",
      es: "Gabriel tiene 12 esmeraldas. Su amigo tiene 5. ¿Cuántas esmeraldas más tiene Gabriel?",
      datos: [12, 5], r: 7,
      pregunta_en: "How many more?", clave: "how many more" },

    { id: "p4", tipo: "comparacion", op: "-",
      en: "There are 9 cats and 14 dogs. How many fewer cats than dogs are there?",
      es: "Hay 9 gatos y 14 perros. ¿Cuántos gatos menos que perros hay?",
      datos: [14, 9], r: 5,
      pregunta_en: "How many fewer?", clave: "how many fewer" },

    { id: "p5", tipo: "faltante", op: "+",
      en: "Gabriel had some torches. He made 6 more. Now he has 13. How many did he have at first?",
      es: "Gabriel tenía algunas antorchas. Hizo 6 más. Ahora tiene 13. ¿Cuántas tenía al principio?",
      datos: [13, 6], r: 7,
      pregunta_en: "How many at first?", clave: "at first" },

    { id: "p6", tipo: "dosPasos", op: "+-",
      en: "Gabriel had 10 emeralds. He earned 8 more. Then he spent 5. How many emeralds does he have now?",
      es: "Gabriel tenía 10 esmeraldas. Ganó 8 más. Después gastó 5. ¿Cuántas tiene ahora?",
      datos: [10, 8, 5], r: 13,
      pregunta_en: "How many now?", clave: "then" }
  ];

  /* Las palabras clave que deciden si suma o resta.
     Registrar cuáles no entiende es la mitad del diagnóstico de matemática. */
  var PALABRAS_CLAVE = [
    { en: "in all",        es: "en total",        op: "+" },
    { en: "altogether",    es: "todo junto",      op: "+" },
    { en: "more",          es: "más",             op: "+" },
    { en: "how many more", es: "cuántos más",     op: "-" },
    { en: "how many fewer", es: "cuántos menos",  op: "-" },
    { en: "are left",      es: "quedan",          op: "-" },
    { en: "at first",      es: "al principio",    op: "-" },
    { en: "gave away",     es: "regaló",          op: "-" },
    { en: "spent",         es: "gastó",           op: "-" }
  ];

  /* ==========================================================================
     MATH · GEOMETRÍA
     i-Ready: Geometry = Needs Improvement. Es el único dominio de matemática
     en esa categoría y no estaba en el pedido original. Se agrega por dato.
     ======================================================================== */

  var FORMAS = [
    { id: "triangle",  en: "Triangle",     es: "Triángulo",    lados: 3, vertices: 3, d: 2 },
    { id: "square",    en: "Square",       es: "Cuadrado",     lados: 4, vertices: 4, d: 2 },
    { id: "rectangle", en: "Rectangle",    es: "Rectángulo",   lados: 4, vertices: 4, d: 2 },
    { id: "pentagon",  en: "Pentagon",     es: "Pentágono",    lados: 5, vertices: 5, d: 2 },
    { id: "hexagon",   en: "Hexagon",      es: "Hexágono",     lados: 6, vertices: 6, d: 2 },
    { id: "circle",    en: "Circle",       es: "Círculo",      lados: 0, vertices: 0, d: 2 },
    { id: "cube",      en: "Cube",         es: "Cubo",         caras: 6, vertices: 8, aristas: 12, d: 3 },
    { id: "sphere",    en: "Sphere",       es: "Esfera",       caras: 0, vertices: 0, aristas: 0, d: 3 },
    { id: "cone",      en: "Cone",         es: "Cono",         caras: 2, vertices: 1, aristas: 1, d: 3 },
    { id: "cylinder",  en: "Cylinder",     es: "Cilindro",     caras: 3, vertices: 0, aristas: 2, d: 3 },
    { id: "pyramid",   en: "Pyramid",      es: "Pirámide",     caras: 5, vertices: 5, aristas: 8, d: 3 }
  ];

  /* ==========================================================================
     CUENTOS — decodificables, con el vocabulario que ya maneja
     ======================================================================== */

  var CUENTOS = [
    {
      id: "c1",
      titulo: "The Cave of Nine Blocks",
      titulo_es: "La cueva de los nueve bloques",
      nivel: 1,
      escenas: [
        { arte: "cueva",
          en: "Max had a small pickaxe. He went into a dark cave to find gold.",
          es: "Max tenía un pico pequeño. Entró a una cueva oscura a buscar oro." },
        { arte: "antorcha",
          en: "\"It is too dark,\" said Max. He made a torch. Now he could see.",
          es: "«Está muy oscuro», dijo Max. Hizo una antorcha. Ahora podía ver." },
        { arte: "esmeralda",
          en: "Max did not find gold. He found nine green emeralds!",
          es: "Max no encontró oro. ¡Encontró nueve esmeraldas verdes!" },
        { arte: "amigo",
          en: "Max gave three emeralds to his friend Kip. \"Thank you!\" said Kip.",
          es: "Max le dio tres esmeraldas a su amigo Kip. «¡Gracias!», dijo Kip." }
      ],
      preguntas: [
        { q_en: "Who is the main character?", q_es: "¿Quién es el personaje principal?",
          ops: ["Max", "Kip", "The cave"], r: 0, tipo: "personaje" },
        { q_en: "Where does the story happen?", q_es: "¿Dónde pasa la historia?",
          ops: ["In a cave", "At school", "In a boat"], r: 0, tipo: "ambiente" },
        { q_en: "What was the problem?", q_es: "¿Cuál era el problema?",
          ops: ["It was too dark", "Max was hungry", "Kip was lost"], r: 0, tipo: "problema" },
        { q_en: "How did Max solve it?", q_es: "¿Cómo lo resolvió Max?",
          ops: ["He made a torch", "He went home", "He called for help"], r: 0, tipo: "solucion" },
        { q_en: "Who says \"Thank you!\"?", q_es: "¿Quién dice «¡Gracias!»?",
          ops: ["Kip", "Max", "Nobody"], r: 0, tipo: "dialogo" },
        { q_en: "How many emeralds did Max keep?", q_es: "¿Cuántas esmeraldas se quedó Max?",
          ops: ["6", "9", "3"], r: 0, tipo: "matematica" }
      ]
    },
    {
      id: "c2",
      titulo: "The Kite and the Lake",
      titulo_es: "La cometa y el lago",
      nivel: 2,
      nota: "Practica el patrón VCe del Módulo 3: kite, lake, made, take, time",
      escenas: [
        { arte: "cometa",
          en: "Jane made a big red kite. She could not wait to fly it.",
          es: "Jane hizo una cometa roja grande. No podía esperar para volarla." },
        { arte: "lago",
          en: "She ran to the lake. The wind was strong. The kite rose up high.",
          es: "Corrió al lago. El viento estaba fuerte. La cometa subió muy alto." },
        { arte: "arbol",
          en: "But the kite got stuck in a pine tree! Jane felt sad.",
          es: "¡Pero la cometa se atoró en un pino! Jane se puso triste." },
        { arte: "ayuda",
          en: "Her friend Dave came to help. He was tall. He took the kite down.",
          es: "Su amigo Dave vino a ayudar. Era alto. Bajó la cometa." },
        { arte: "felices",
          en: "\"You are a good friend,\" said Jane. They flew the kite until five.",
          es: "«Eres un buen amigo», dijo Jane. Volaron la cometa hasta las cinco." }
      ],
      preguntas: [
        { q_en: "Who made the kite?", q_es: "¿Quién hizo la cometa?",
          ops: ["Jane", "Dave", "The wind"], r: 0, tipo: "personaje" },
        { q_en: "Where did Jane run?", q_es: "¿Adónde corrió Jane?",
          ops: ["To the lake", "To school", "To the cave"], r: 0, tipo: "ambiente" },
        { q_en: "What was the problem?", q_es: "¿Cuál era el problema?",
          ops: ["The kite got stuck", "It started to rain", "The kite broke"], r: 0, tipo: "problema" },
        { q_en: "Why could Dave help?", q_es: "¿Por qué pudo ayudar Dave?",
          ops: ["He was tall", "He had a ladder", "He could fly"], r: 0, tipo: "causa" },
        { q_en: "How did Jane feel at the end?", q_es: "¿Cómo se sintió Jane al final?",
          ops: ["Happy", "Sad", "Angry"], r: 0, tipo: "sentimiento" },
        { q_en: "What is the lesson?", q_es: "¿Cuál es la lección?",
          ops: ["Friends help each other", "Kites are dangerous", "Never go outside"], r: 0, tipo: "moraleja" }
      ]
    }
  ];

  /* ==========================================================================
     ERRORES ESPERADOS DE UN HISPANOHABLANTE
     Si el reconocedor devuelve una de estas, es AMARILLO, no rojo:
     es transferencia del español, no desconocimiento.
     ======================================================================== */

  var CONFUSIONES = [
    { real: "th", sale: ["t", "d", "f"], nota: "La /th/ no existe en español" },
    { real: "v",  sale: ["b"],           nota: "v y b suenan igual en español" },
    { real: "z",  sale: ["s"],           nota: "La /z/ vibrada no existe en español" },
    { real: "j",  sale: ["y", "h"],      nota: "j / y se confunden" },
    { real: "sh", sale: ["ch", "s"],     nota: "La /sh/ no existe en español" },
    { real: "h",  sale: [""],            nota: "En español la h es muda" }
  ];

  /* Pares mínimos: vocal corta vs larga. La confusión clásica. */
  var PARES_MINIMOS = [
    ["ship", "sheep"], ["bit", "beat"], ["sit", "seat"], ["fill", "feel"],
    ["pin", "pen"],    ["bad", "bed"],  ["cat", "cut"],  ["hat", "hot"],
    ["van", "ban"],    ["berry", "very"], ["cap", "cape"], ["hat", "hate"],
    ["kit", "kite"],   ["tub", "tube"], ["rob", "robe"], ["mad", "made"]
  ];

  /* ==========================================================================
     PREMIOS — el papá los edita desde su panel
     ======================================================================== */

  var PREMIOS_INICIALES = [
    { id: "r1", nombre: "15 minutos extra de tablet", costo: 50,  emoji: "⏱️" },
    { id: "r2", nombre: "Escoger la cena",            costo: 120, emoji: "🍕" },
    { id: "r3", nombre: "Película en familia",        costo: 200, emoji: "🎬" },
    { id: "r4", nombre: "Un helado",                  costo: 80,  emoji: "🍦" },
    { id: "r5", nombre: "Una salida al parque",       costo: 400, emoji: "🏞️" }
  ];

  /* ==========================================================================
     EXPORT
     ======================================================================== */

  global.DATOS = {
    SIGHT: SIGHT,
    MODULO_PATRON: MODULO_PATRON,
    MODULO_ACTUAL: 3,          // "Meet in the Middle" — Family Letter de sept
    SIGHT_TOTAL: Object.keys(SIGHT).reduce(function (n, k) {
      return n + SIGHT[k].length;
    }, 0),
    NONSENSE: NONSENSE,
    MODULO3: MODULO3,
    ECUACIONES_CLASE: ECUACIONES_CLASE,
    ESTRATEGIAS: ESTRATEGIAS,
    GRAFICAS: GRAFICAS,
    PREGUNTAS_GRAFICA: PREGUNTAS_GRAFICA,
    DINERO: DINERO,
    TIENDA: TIENDA,
    PROBLEMAS: PROBLEMAS,
    PALABRAS_CLAVE: PALABRAS_CLAVE,
    FORMAS: FORMAS,
    CUENTOS: CUENTOS,
    CONFUSIONES: CONFUSIONES,
    PARES_MINIMOS: PARES_MINIMOS,
    PREMIOS_INICIALES: PREMIOS_INICIALES,

    /* paquetes extra que yo agrego desde las tareas diarias */
    paquetes: []
  };

})(window);
