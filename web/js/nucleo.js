/* ============================================================================
   NÚCLEO — estado, guardado, voz, semáforo y economía
   ========================================================================== */

(function (global) {
  "use strict";

  var D = global.DATOS;
  var CFG = global.CONFIG || {};

  /* ==========================================================================
     ALMACÉN — guarda el progreso
     Hoy: localStorage. Mañana: Supabase (mismo interfaz, no cambia nada arriba).
     ======================================================================== */

  var Almacen = (function () {
    /* MODO PRUEBA — para que el papá pueda jugar sin ensuciar los datos de
       Gabriel. Se activa agregando ?prueba a la dirección.
       Hace dos cosas, y las dos importan:
         1. guarda en OTRA llave del navegador, así no pisa la partida real
         2. NO crea el cliente de Supabase, así no hay forma de que toque la nube
       Una ventana de incógnito no alcanzaría: aislaría el navegador pero
       igual escribiría en la fila 'gabriel' de la base. */
    var MODO_PRUEBA = /[?&]prueba\b/i.test(location.search) ||
                      /\bprueba\b/i.test(location.hash);

    var LLAVE = MODO_PRUEBA ? "gaby.prueba" : "gaby.v1";
    var enMemoria = null;
    var supa = null;          // cliente Supabase cuando haya claves
    var pendiente = null;     // debounce de escritura remota

    function vacio() {
      return {
        version: 1,
        jugador: { nombre: "", avatar: null, creado: null },
        esmeraldas: 0,
        esmeraldasGanadasTotal: 0,
        racha: { dias: 0, ultimoDia: null },
        diagnostico: { hecho: false, fecha: null, resultados: {} },
        // destreza -> { intentos, aciertos, ultimoNivel, ms, historial:[] }
        destrezas: {},
        // palabra -> { verde, amarillo, rojo, ultima, msPromedio }
        palabras: {},
        sesiones: [],
        premios: D.PREMIOS_INICIALES.slice(),
        canjes: [],
        ajustes: { voz: true, traduccionAuto: false, modoAdulto: false },
        traduccionesUsadas: []
      };
    }

    function leer() {
      if (enMemoria) return enMemoria;
      try {
        var crudo = localStorage.getItem(LLAVE);
        enMemoria = crudo ? JSON.parse(crudo) : vacio();
      } catch (e) {
        enMemoria = vacio();
      }
      // migración suave: campos nuevos que falten
      var base = vacio();
      Object.keys(base).forEach(function (k) {
        if (enMemoria[k] === undefined) enMemoria[k] = base[k];
      });
      return enMemoria;
    }

    function guardar() {
      try {
        localStorage.setItem(LLAVE, JSON.stringify(enMemoria));
      } catch (e) { /* modo privado: se sigue jugando en memoria */ }
      sincronizar();
    }

    /* --- Supabase (se activa cuando CONFIG tenga url + anonKey) ----------- */
    function iniciarSupabase() {
      if (MODO_PRUEBA) return;   // en prueba no se crea el cliente: nada toca la nube
      if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !global.supabase) return;
      try {
        supa = global.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      } catch (e) { supa = null; }
    }

    function sincronizar() {
      if (!supa) return;
      clearTimeout(pendiente);
      pendiente = setTimeout(function () {
        supa.from("progreso").upsert({
          id: CFG.jugadorId || "gabriel",
          datos: enMemoria,
          actualizado: new Date().toISOString()
        }).then(function () {}, function () {});
      }, 1500);
    }

    function traerRemoto() {
      if (!supa) return Promise.resolve(null);
      return supa.from("progreso").select("datos,actualizado")
        .eq("id", CFG.jugadorId || "gabriel").maybeSingle()
        .then(function (r) { return r && r.data ? r.data.datos : null; })
        .catch(function () { return null; });
    }

    return {
      leer: leer,
      guardar: guardar,
      reiniciar: function () { enMemoria = vacio(); guardar(); },
      exportar: function () { return JSON.stringify(leer(), null, 2); },
      importar: function (txt) {
        try { enMemoria = JSON.parse(txt); guardar(); return true; }
        catch (e) { return false; }
      },
      iniciarSupabase: iniciarSupabase,
      traerRemoto: traerRemoto,
      hayNube: function () { return !!supa; },
      esPrueba: function () { return MODO_PRUEBA; },
      borrarPrueba: function () {
        try { localStorage.removeItem("gaby.prueba"); } catch (e) {}
        enMemoria = null;
      }
    };
  })();

  /* ==========================================================================
     ECONOMÍA — esmeraldas
     Regla dura: fallar NUNCA resta. Se gana o no se gana.
     ======================================================================== */

  var Economia = {
    PAGOS: {
      acierto: 2,
      aciertoPrimerIntento: 3,
      nivelCompleto: 10,
      verde: 3,
      amarillo: 1,
      rojo: 0,
      recordPersonal: 15,
      rachaDia: 5,
      diagnosticoCompleto: 25
    },

    dar: function (cantidad, motivo) {
      if (!(cantidad > 0)) return 0;
      var e = Almacen.leer();
      e.esmeraldas += cantidad;
      e.esmeraldasGanadasTotal += cantidad;
      Almacen.guardar();
      Bus.emitir("esmeraldas", { total: e.esmeraldas, ganadas: cantidad, motivo: motivo });
      return cantidad;
    },

    gastar: function (cantidad) {
      var e = Almacen.leer();
      if (e.esmeraldas < cantidad) return false;
      e.esmeraldas -= cantidad;
      Almacen.guardar();
      Bus.emitir("esmeraldas", { total: e.esmeraldas, ganadas: -cantidad });
      return true;
    },

    total: function () { return Almacen.leer().esmeraldas; },

    /* racha diaria: premia volver, no jugar mucho de una */
    marcarDia: function () {
      var e = Almacen.leer();
      var hoy = new Date().toISOString().slice(0, 10);
      if (e.racha.ultimoDia === hoy) return false;
      var ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      e.racha.dias = (e.racha.ultimoDia === ayer) ? e.racha.dias + 1 : 1;
      e.racha.ultimoDia = hoy;
      Almacen.guardar();
      Economia.dar(Economia.PAGOS.rachaDia, "racha");
      return true;
    }
  };

  /* ==========================================================================
     BUS — eventos internos simples
     ======================================================================== */

  var Bus = (function () {
    var oyentes = {};
    return {
      en: function (ev, fn) { (oyentes[ev] = oyentes[ev] || []).push(fn); },
      emitir: function (ev, datos) {
        (oyentes[ev] || []).forEach(function (fn) {
          try { fn(datos); } catch (e) { console.error(e); }
        });
      }
    };
  })();

  /* ==========================================================================
     PROGRESO — registra cada intento por destreza y por palabra
     Esto es lo que después leo yo para decirle al papá qué trabajar.
     ======================================================================== */

  var Progreso = {
    registrar: function (destreza, ok, extra) {
      var e = Almacen.leer();
      var d = e.destrezas[destreza] || { intentos: 0, aciertos: 0, ms: 0, historial: [] };
      d.intentos++;
      if (ok) d.aciertos++;
      if (extra && extra.ms) d.ms += extra.ms;
      d.historial.push({
        t: Date.now(), ok: !!ok,
        ms: extra && extra.ms || null,
        item: extra && extra.item || null,
        semaforo: extra && extra.semaforo || null
      });
      if (d.historial.length > 400) d.historial = d.historial.slice(-400);
      e.destrezas[destreza] = d;
      Almacen.guardar();
    },

    registrarPalabra: function (palabra, semaforo, ms) {
      var e = Almacen.leer();
      var w = e.palabras[palabra] || { verde: 0, amarillo: 0, rojo: 0, ms: [], ultima: null };
      w[semaforo] = (w[semaforo] || 0) + 1;
      w.ultima = semaforo;
      if (ms) { w.ms.push(ms); if (w.ms.length > 10) w.ms.shift(); }
      e.palabras[palabra] = w;
      Almacen.guardar();
    },

    /* palabras que hay que repasar: las que salieron rojo o amarillo últimas */
    paraRepasar: function (limite) {
      var e = Almacen.leer();
      return Object.keys(e.palabras)
        .filter(function (p) { return e.palabras[p].ultima !== "verde"; })
        .sort(function (a, b) {
          return (e.palabras[b].rojo * 2 + e.palabras[b].amarillo) -
                 (e.palabras[a].rojo * 2 + e.palabras[a].amarillo);
        })
        .slice(0, limite || 10);
    },

    dominadas: function () {
      var e = Almacen.leer();
      return Object.keys(e.palabras).filter(function (p) {
        var w = e.palabras[p];
        return w.verde >= 2 && w.ultima === "verde";
      });
    },

    resumenDestreza: function (id) {
      var d = Almacen.leer().destrezas[id];
      if (!d || !d.intentos) return { intentos: 0, pct: null };
      return {
        intentos: d.intentos,
        aciertos: d.aciertos,
        pct: Math.round(d.aciertos / d.intentos * 100),
        msPromedio: d.ms ? Math.round(d.ms / d.intentos) : null
      };
    },

    /* detecta fatiga: precisión de los últimos 8 contra los 8 previos */
    hayFatiga: function (destreza) {
      var d = Almacen.leer().destrezas[destreza];
      if (!d || d.historial.length < 16) return false;
      var h = d.historial.slice(-16);
      var prim = h.slice(0, 8).filter(function (x) { return x.ok; }).length;
      var ult = h.slice(8).filter(function (x) { return x.ok; }).length;
      return (prim - ult) >= 3;
    }
  };

  /* ==========================================================================
     VOZ — hablar (TTS) y escuchar (reconocimiento)
     ======================================================================== */

  var Voz = (function () {
    var vocesEn = [];
    var preferida = null;
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;

    function cargarVoces() {
      if (!global.speechSynthesis) return;
      var todas = speechSynthesis.getVoices() || [];
      vocesEn = todas.filter(function (v) { return /^en/i.test(v.lang); });
      // preferir en-US (está en Georgia); si no hay, la que sea en inglés
      preferida = vocesEn.filter(function (v) { return /^en[-_]US/i.test(v.lang); })[0] ||
                  vocesEn[0] || null;
    }
    if (global.speechSynthesis) {
      cargarVoces();
      speechSynthesis.onvoiceschanged = cargarVoces;
    }

    function decir(texto, opciones) {
      opciones = opciones || {};
      if (!global.speechSynthesis || !Almacen.leer().ajustes.voz) return Promise.resolve();
      return new Promise(function (listo) {
        try {
          speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(String(texto));
          u.lang = opciones.lang || "en-US";
          u.rate = opciones.rate != null ? opciones.rate : 0.85;
          u.pitch = opciones.pitch != null ? opciones.pitch : 1;
          if (preferida && !opciones.lang) u.voice = preferida;
          u.onend = function () { listo(); };
          u.onerror = function () { listo(); };
          speechSynthesis.speak(u);
        } catch (e) { listo(); }
      });
    }

    function decirEs(texto) {
      return decir(texto, { lang: "es-US", rate: 0.95 });
    }

    /* deletrea una palabra letra por letra, después la dice entera */
    function deletrear(palabra) {
      var letras = String(palabra).split("");
      var i = 0;
      function siguiente() {
        if (i >= letras.length) return decir(palabra, { rate: 0.7 });
        var l = letras[i++];
        return decir(l, { rate: 0.6 }).then(function () {
          return new Promise(function (r) { setTimeout(r, 180); });
        }).then(siguiente);
      }
      return siguiente();
    }

    var hayMicrofono = !!SR && global.isSecureContext;

    /* escucha UNA palabra. Devuelve {texto, alternativas, confianza, error} */
    function escuchar(opciones) {
      opciones = opciones || {};
      return new Promise(function (listo) {
        if (!SR) return listo({ error: "sin-api" });
        var rec = new SR();
        rec.lang = "en-US";
        rec.continuous = false;
        rec.interimResults = false;
        rec.maxAlternatives = 6;

        var t0 = Date.now(), termino = false;
        var corte = setTimeout(function () {
          if (!termino) { try { rec.stop(); } catch (e) {} }
        }, opciones.tiempoMax || 7000);

        rec.onresult = function (ev) {
          termino = true; clearTimeout(corte);
          var res = ev.results[0], alts = [];
          for (var i = 0; i < res.length; i++) {
            alts.push({
              t: String(res[i].transcript || "").trim().toLowerCase(),
              c: typeof res[i].confidence === "number" ? res[i].confidence : null
            });
          }
          listo({ texto: alts[0] ? alts[0].t : "", alternativas: alts,
                  confianza: alts[0] ? alts[0].c : null, ms: Date.now() - t0 });
        };
        rec.onerror = function (ev) {
          termino = true; clearTimeout(corte); listo({ error: ev.error });
        };
        rec.onend = function () {
          clearTimeout(corte);
          if (!termino) listo({ error: "sin-resultado" });
        };
        try { rec.start(); }
        catch (e) { clearTimeout(corte); listo({ error: "no-arranco" }); }
      });
    }

    /* escucha CONTINUO durante N segundos (modo carrera).
       onParcial(texto) se llama con lo que va oyendo. */
    function escucharCarrera(segundos, onParcial) {
      return new Promise(function (listo) {
        if (!SR) return listo({ error: "sin-api", dichas: [] });
        var rec = new SR();
        rec.lang = "en-US";
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 3;

        var dichas = [], vivo = true;
        var fin = setTimeout(function () { vivo = false; try { rec.stop(); } catch (e) {} },
                             segundos * 1000);

        rec.onresult = function (ev) {
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            var r = ev.results[i];
            var t = String(r[0].transcript || "").trim().toLowerCase();
            if (r.isFinal) {
              t.split(/\s+/).filter(Boolean).forEach(function (w) {
                dichas.push({ t: w, c: r[0].confidence || null, cuando: Date.now() });
              });
            }
            if (onParcial) onParcial(t, r.isFinal);
          }
        };
        rec.onerror = function (ev) {
          if (ev.error === "no-speech" && vivo) return;   // sigue esperando
          clearTimeout(fin); listo({ error: ev.error, dichas: dichas });
        };
        rec.onend = function () {
          if (vivo) { try { rec.start(); return; } catch (e) {} }  // reintenta
          clearTimeout(fin); listo({ dichas: dichas });
        };
        try { rec.start(); }
        catch (e) { clearTimeout(fin); listo({ error: "no-arranco", dichas: dichas }); }
      });
    }

    return {
      decir: decir, decirEs: decirEs, deletrear: deletrear,
      escuchar: escuchar, escucharCarrera: escucharCarrera,
      hayMicrofono: hayMicrofono,
      hayVozInglesa: function () { return vocesEn.length > 0; },
      esUS: function () { return !!preferida && /US/i.test(preferida.lang); },
      vocesDisponibles: function () { return vocesEn.map(function (v) { return v.name + " (" + v.lang + ")"; }); }
    };
  })();

  /* ==========================================================================
     SEMÁFORO — decide verde / amarillo / rojo
     El navegador da texto, no fonemas. Ver docs/00-ESTRATEGIA.md §4.
     ======================================================================== */

  var Semaforo = (function () {

    function limpiar(s) {
      return String(s || "").toLowerCase().replace(/[^a-z]/g, "");
    }

    function distancia(a, b) {
      var m = a.length, n = b.length;
      if (!m) return n; if (!n) return m;
      var fila = new Array(n + 1), i, j, prev, tmp;
      for (j = 0; j <= n; j++) fila[j] = j;
      for (i = 1; i <= m; i++) {
        prev = fila[0]; fila[0] = i;
        for (j = 1; j <= n; j++) {
          tmp = fila[j];
          fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1,
                             prev + (a[i - 1] === b[j - 1] ? 0 : 1));
          prev = tmp;
        }
      }
      return fila[n];
    }

    /* normaliza los sonidos que un hispanohablante colapsa.
       Si dos palabras son iguales DESPUÉS de esto, el error es de acento,
       no de lectura -> amarillo, no rojo. */
    function normalizarEs(s) {
      return limpiar(s)
        .replace(/th/g, "t")
        .replace(/sh/g, "ch")
        .replace(/ph/g, "f")
        .replace(/v/g, "b")
        .replace(/z/g, "s")
        .replace(/ck|qu|k/g, "c")
        .replace(/^h/, "")
        .replace(/([aeiou])\1+/g, "$1")
        .replace(/(.)\1+/g, "$1");
    }

    function esParMinimo(a, b) {
      return D.PARES_MINIMOS.some(function (par) {
        return (par[0] === a && par[1] === b) || (par[1] === a && par[0] === b);
      });
    }

    /*  objetivo: { p, ok? }  ·  oido: resultado de Voz.escuchar()
        devuelve { color, oido, razon }  */
    function evaluar(objetivo, oido) {
      var meta = limpiar(objetivo.p);
      var aceptadas = [meta].concat((objetivo.ok || []).map(limpiar));

      if (!oido || oido.error) {
        return { color: "rojo", oido: "", razon: oido && oido.error === "no-speech"
          ? "No se escuchó nada" : "No se pudo escuchar", reintentable: true };
      }

      var alts = (oido.alternativas || []).map(function (a) {
        return { t: limpiar(a.t), c: a.c };
      }).filter(function (a) { return a.t; });

      if (!alts.length) {
        return { color: "rojo", oido: "", razon: "No se escuchó nada", reintentable: true };
      }

      // 1) coincidencia exacta con la palabra o con una transcripción aceptada
      var exacta = alts.filter(function (a) { return aceptadas.indexOf(a.t) >= 0; })[0];
      if (exacta) {
        var conf = exacta.c;
        if (conf !== null && conf < 0.55) {
          return { color: "amarillo", oido: exacta.t,
                   razon: "Se entendió, pero bajito o poco claro" };
        }
        return { color: "verde", oido: exacta.t, razon: "Correcta" };
      }

      // 2) igual después de normalizar el acento español -> amarillo
      var metaEs = normalizarEs(meta);
      var cercaEs = alts.filter(function (a) { return normalizarEs(a.t) === metaEs; })[0];
      if (cercaEs) {
        return { color: "amarillo", oido: cercaEs.t,
                 razon: "Casi: es un sonido que el español no tiene" };
      }

      // 3) par mínimo conocido (vocal corta vs larga) -> amarillo
      var par = alts.filter(function (a) { return esParMinimo(meta, a.t); })[0];
      if (par) {
        return { color: "amarillo", oido: par.t,
                 razon: "Confundió la vocal: " + meta + " / " + par.t };
      }

      // 4) muy parecida en letras -> amarillo
      var mejor = null, mejorD = 99;
      alts.forEach(function (a) {
        var d = distancia(meta, a.t);
        if (d < mejorD) { mejorD = d; mejor = a.t; }
      });
      var tolerancia = meta.length <= 4 ? 1 : 2;
      if (mejorD <= tolerancia) {
        return { color: "amarillo", oido: mejor, razon: "Muy cerca" };
      }

      return { color: "rojo", oido: alts[0].t, razon: "Se oyó otra palabra" };
    }

    return { evaluar: evaluar, limpiar: limpiar, distancia: distancia };
  })();

  /* ==========================================================================
     AVATAR — constructor de personaje de bloques (arte original)
     ======================================================================== */

  var Avatar = {
    piel:   ["#f2c49b", "#d9a173", "#a9754d", "#7a4f31", "#5a3823", "#f7dfc4"],
    pelo:   ["#2b2118", "#5a3a22", "#c08a3e", "#e8d18a", "#8b2f2f", "#3f6fb5", "#3ddc84"],
    ropa:   ["#2ee6a0", "#6ea8ff", "#ffb03a", "#ff6b5e", "#b98cff", "#f5f5f5", "#3a446b"],
    ojos:   ["#2b2118", "#3f6fb5", "#4a7a3a", "#6b4a2a"],
    sombrero: ["ninguno", "casco", "corona", "gorra", "capucha"],

    porDefecto: function () {
      return { piel: 0, pelo: 1, ropa: 0, ojos: 0, sombrero: 0, nombre: "" };
    },

    /* dibuja el personaje como SVG de bloques, tamaño configurable */
    svg: function (a, tam) {
      a = a || Avatar.porDefecto();
      tam = tam || 96;
      var piel = Avatar.piel[a.piel] || Avatar.piel[0];
      var pelo = Avatar.pelo[a.pelo] || Avatar.pelo[0];
      var ropa = Avatar.ropa[a.ropa] || Avatar.ropa[0];
      var ojos = Avatar.ojos[a.ojos] || Avatar.ojos[0];
      var som = Avatar.sombrero[a.sombrero] || "ninguno";

      var extras = "";
      if (som === "casco") {
        extras = '<rect x="3" y="2" width="14" height="5" fill="#9aa3ad"/>' +
                 '<rect x="2" y="4" width="16" height="3" fill="#7d858f"/>';
      } else if (som === "corona") {
        extras = '<path d="M4 4 L6 1 L8 4 L10 1 L12 4 L14 1 L16 4 L16 6 L4 6 Z" fill="#ffcc4d"/>';
      } else if (som === "gorra") {
        extras = '<rect x="3" y="3" width="14" height="4" fill="#ff6b5e"/>' +
                 '<rect x="3" y="7" width="17" height="2" fill="#e0574c"/>';
      } else if (som === "capucha") {
        extras = '<rect x="2" y="3" width="16" height="9" fill="' + pelo + '"/>' +
                 '<rect x="5" y="7" width="10" height="6" fill="' + piel + '"/>';
      }

      return '<svg viewBox="0 0 20 28" width="' + tam + '" height="' + (tam * 1.4) +
        '" shape-rendering="crispEdges" role="img" aria-label="Personaje">' +
        // pelo
        '<rect x="4" y="3" width="12" height="4" fill="' + pelo + '"/>' +
        '<rect x="3" y="5" width="2" height="6" fill="' + pelo + '"/>' +
        '<rect x="15" y="5" width="2" height="6" fill="' + pelo + '"/>' +
        // cara
        '<rect x="5" y="6" width="10" height="8" fill="' + piel + '"/>' +
        // ojos
        '<rect x="7" y="9" width="2" height="2" fill="' + ojos + '"/>' +
        '<rect x="11" y="9" width="2" height="2" fill="' + ojos + '"/>' +
        // boca
        '<rect x="8" y="12" width="4" height="1" fill="#8a5a44"/>' +
        // cuerpo
        '<rect x="5" y="14" width="10" height="8" fill="' + ropa + '"/>' +
        // brazos
        '<rect x="2" y="14" width="3" height="7" fill="' + ropa + '"/>' +
        '<rect x="15" y="14" width="3" height="7" fill="' + ropa + '"/>' +
        '<rect x="2" y="21" width="3" height="2" fill="' + piel + '"/>' +
        '<rect x="15" y="21" width="3" height="2" fill="' + piel + '"/>' +
        // piernas
        '<rect x="5" y="22" width="4" height="5" fill="#3a446b"/>' +
        '<rect x="11" y="22" width="4" height="5" fill="#3a446b"/>' +
        extras +
        '</svg>';
    }
  };

  /* ==========================================================================
     UTILIDADES
     ======================================================================== */

  var Util = {
    mezclar: function (arr) {
      var a = arr.slice(), i, j, t;
      for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    tomar: function (arr, n) { return Util.mezclar(arr).slice(0, n); },
    azar: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    entero: function (min, max) { return min + Math.floor(Math.random() * (max - min + 1)); },
    hoy: function () { return new Date().toISOString().slice(0, 10); },
    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
  };

  /* ==========================================================================
     EXPORT
     ======================================================================== */

  global.NUCLEO = {
    Almacen: Almacen,
    Economia: Economia,
    Progreso: Progreso,
    Voz: Voz,
    Semaforo: Semaforo,
    Avatar: Avatar,
    Util: Util,
    Bus: Bus
  };

})(window);
