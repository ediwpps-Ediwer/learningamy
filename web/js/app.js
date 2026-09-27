/* ============================================================================
   APP — pantallas, avatar, diagnóstico, mundos y panel del papá
   ========================================================================== */

(function (global) {
  "use strict";

  var D = global.DATOS, N = global.NUCLEO, J = global.JUEGOS;
  var U = N.Util, Voz = N.Voz, Eco = N.Economia, Pro = N.Progreso, Alm = N.Almacen;

  var app, hud;

  /* ==========================================================================
     HUD — avatar, gems, racha
     ======================================================================== */

  function pintarHud() {
    var e = Alm.leer();
    hud.innerHTML =
      '<button class="hud-avatar" id="hudAvatar" aria-label="My character">' +
        N.Avatar.svg(e.jugador.avatar, 26) + '</button>' +
      '<span class="hud-nombre">' + U.esc(e.jugador.nombre || "Player") + '</span>' +
      '<span class="hud-sep"></span>' +
      '<span class="hud-esm" id="hudEsm">' + esmeraldaSvg(16) +
        '<b>' + e.esmeraldas + '</b></span>' +
      (e.racha.dias > 1 ? '<span class="hud-racha">🔥 ' + e.racha.dias + '</span>' : '') +
      '<button class="hud-papa" id="hudPapa" aria-label="Parent dashboard">👤</button>';
    var a = document.getElementById("hudAvatar");
    if (a) a.addEventListener("click", function () { irA("casa"); });
    var p = document.getElementById("hudPapa");
    if (p) p.addEventListener("click", pedirPin);
  }

  function esmeraldaSvg(t) {
    return '<svg viewBox="0 0 12 12" width="' + t + '" height="' + t +
      '" shape-rendering="crispEdges" aria-hidden="true">' +
      '<path d="M6 1 L10 5 L6 11 L2 5 Z" fill="#2ee6a0"/>' +
      '<path d="M6 1 L8 5 L6 8 L4 5 Z" fill="#7df5c6"/></svg>';
  }

  N.Bus.en("esmeraldas", function (d) {
    var el = document.getElementById("hudEsm");
    if (!el) return;
    el.querySelector("b").textContent = d.total;
    if (d.ganadas > 0) {
      el.classList.remove("brilla");
      void el.offsetWidth;
      el.classList.add("brilla");
    }
  });

  /* ==========================================================================
     RUTAS
     ======================================================================== */

  var pantallas = {};
  var actual = null;

  function irA(nombre, datos) {
    if (global.AVENTURA) global.AVENTURA.cancel();
    actual = nombre;
    app.innerHTML = "";
    app.scrollTop = 0;
    pintarHud();
    (pantallas[nombre] || pantallas.casa)(app, datos || {});
  }

  /* ==========================================================================
     BIENVENIDA + AVATAR
     ======================================================================== */

  pantallas.bienvenida = function (el) {
    el.innerHTML =
      '<section class="portada">' +
        '<div class="portada-logo">' + logoSvg() + '</div>' +
        '<h1 class="portada-tit">BLOCK QUEST</h1>' +
        '<p class="portada-sub">Reading &amp; Math</p>' +
        '<div class="portada-acc"></div>' +
      '</section>';
    var acc = el.querySelector(".portada-acc");
    acc.appendChild(J.ui.boton("▶ PLAY", "btn-primario btn-grande", function () {
      Alm.ponerModo("local");
      rutear();
    }));
    acc.appendChild(J.ui.boton("Log in", "btn-fantasma", function () {
      Alm.ponerModo("cuenta");
      irA("entrar");
    }));
    var pie = document.createElement("p");
    pie.className = "nota portada-nota";
    pie.textContent = "For one player, PLAY is all you need. Create accounts only " +
      "if more than one child will use the same device.";
    el.querySelector(".portada").appendChild(pie);
  };

  /* --- entrar con usuario y contraseña ------------------------------------
     Con solo avatares, un chico se mete sin querer en la cuenta de otro y
     arruina los datos de los dos. Por eso: usuario y contraseña de verdad.
     Las cuentas las crea el adulto desde su panel — esa es la autorización. */

  var ERRORES = {
    "datos-incorrectos": "Incorrect username or password.",
    "usuario-invalido": "Use 3–20 letters, with no spaces or accents.",
    "usuario-ocupado": "That username is already taken. Choose another.",
    "clave-corta": "Password must be at least 6 characters.",
    "sin-conexion": "Could not connect to the server.",
    "falta-apagar-confirmacion":
      "Email confirmation must be turned off in Supabase: " +
      "Authentication → Sign In / Providers → Email → Confirm email → OFF."
  };

  pantallas.entrar = function (el) {
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<div class="portada-logo">' + logoSvg() + '</div>' +
        '<h2 class="tit">Log in</h2>' +
        '<p class="sub">Enter your username and password</p>' +
        '<form class="form-login" id="f">' +
          '<div class="campo">' +
            '<label for="u">Username</label>' +
            '<input id="u" class="entrada" autocomplete="username" ' +
              'autocapitalize="none" autocorrect="off" spellcheck="false" ' +
              'maxlength="20" placeholder="gabriel">' +
          '</div>' +
          '<div class="campo">' +
            '<label for="c">Password</label>' +
            '<div class="campo-clave">' +
              '<input id="c" class="entrada" type="password" ' +
                'autocomplete="current-password" maxlength="40">' +
              '<button type="button" class="ver-clave" id="ver">👁</button>' +
            '</div>' +
          '</div>' +
          '<p class="error" id="err" hidden></p>' +
          '<button class="btn btn-primario btn-grande" type="submit" id="go">Enter</button>' +
        '</form>' +
        '<p class="nota">Need a child account? A parent creates it from the dashboard.</p>' +
        '<button class="btn btn-fantasma" type="button" id="showParent">Create the first parent account</button>' +
        '<div id="parentCreate" hidden>' +
          '<h3 class="panel-h3">Parent account</h3>' +
          '<p class="nota">Use this once for the adult who will manage the family.</p>' +
          '<form class="form-login" id="parentForm">' +
            '<div class="campo"><label for="pu">Username</label><input id="pu" class="entrada" autocapitalize="none" autocorrect="off" maxlength="20" placeholder="arisjoel"></div>' +
            '<div class="campo"><label for="pn">Parent name</label><input id="pn" class="entrada" maxlength="40" placeholder="Aris Joel"></div>' +
            '<div class="campo"><label for="pc">Password</label><input id="pc" class="entrada" type="password" minlength="6" maxlength="40"></div>' +
            '<p class="error" id="perr" hidden></p>' +
            '<button class="btn btn-primario btn-grande" type="submit" id="pgo">Create parent account</button>' +
          '</form>' +
        '</div>' +
      '</section>';

    var err = el.querySelector("#err");
    el.querySelector("#ver").addEventListener("click", function () {
      var c = el.querySelector("#c");
      c.type = c.type === "password" ? "text" : "password";
    });

    el.querySelector("#showParent").addEventListener("click", function () {
      var box = el.querySelector("#parentCreate");
      box.hidden = !box.hidden;
      if (!box.hidden) el.querySelector("#pu").focus();
    });

    el.querySelector("#parentForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var b = el.querySelector("#pgo"), pe = el.querySelector("#perr");
      pe.hidden = true; b.disabled = true; b.textContent = "Creating…";
      N.Auth.crear(el.querySelector("#pu").value, el.querySelector("#pc").value, el.querySelector("#pn").value || el.querySelector("#pu").value, null)
        .then(function (r) {
          if (r.ok) {
            Alm.ponerModo("cuenta"); Alm.olvidar();
            alert("Parent account created. Open Players in the Parent dashboard to create Amy's child account.");
            return irA("panel");
          }
          pe.textContent = ERRORES[r.error] || r.error; pe.hidden = false;
          b.disabled = false; b.textContent = "Create parent account";
        });
    });

    el.querySelector("#f").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var b = el.querySelector("#go");
      err.hidden = true;
      b.disabled = true; b.textContent = "Signing in…";
      N.Auth.entrar(el.querySelector("#u").value, el.querySelector("#c").value)
        .then(function (r) {
          if (r.ok) {
            Alm.olvidar();
            Alm.adoptarRemoto();
            return rutear();
          }
          err.textContent = ERRORES[r.error] || r.error;
          err.hidden = false;
          b.disabled = false; b.textContent = "Enter";
        });
    });
  };

  pantallas.avatar = function (el, datos) {
    var e = Alm.leer();
    var a = e.jugador.avatar || N.Avatar.porDefecto();

    el.innerHTML =
      '<section class="pantalla">' +
        '<h2 class="tit">Make your character</h2>' +
        '<p class="sub">Create your character</p>' +
        '<div class="avatar-vista" id="vista"></div>' +
        '<div class="avatar-opts" id="opts"></div>' +
        '<div class="campo">' +
          '<label for="nom">Your name</label>' +
          '<input id="nom" class="entrada" maxlength="14" placeholder="Gabriel" value="' +
            U.esc(e.jugador.nombre || N.Auth.miNombre() || "") + '">' +
        '</div>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';

    var vista = el.querySelector("#vista");
    var opts = el.querySelector("#opts");

    function repintar() { vista.innerHTML = N.Avatar.svg(a, 120); }
    repintar();

    /* Piel y ojos siempre libres: eso es quién es él, no un premio.
       Pelo, ropa y sombreros se desbloquean con gems — le dan algo que
       comprar YA, sin tener que esperar a que papá apruebe un canje. */
    var LIBRES = { piel: 99, ojos: 99, pelo: 3, ropa: 3, sombrero: 2 };
    var PRECIO = { pelo: 30, ropa: 30, sombrero: 60 };

    function desbloqueados(cual) {
      var e2 = Alm.leer();
      e2.desbloqueado = e2.desbloqueado || {};
      return e2.desbloqueado[cual] || [];
    }
    function tiene(cual, i) {
      return i < LIBRES[cual] || desbloqueados(cual).indexOf(i) >= 0;
    }
    function comprar(cual, i, alHacer) {
      var precio = PRECIO[cual];
      if (!confirm("Unlock this for " + precio + " gems?\n\nYou have " +
                   Eco.total() + ".")) return;
      if (!Eco.gastar(precio)) {
        alert("You need " + (precio - Eco.total()) + " more gems. Keep playing!");
        return;
      }
      var e2 = Alm.leer();
      e2.desbloqueado = e2.desbloqueado || {};
      e2.desbloqueado[cual] = (e2.desbloqueado[cual] || []).concat([i]);
      Alm.guardar();
      global.EFECTOS.Sonido.nivel();
      alHacer();
    }

    [["piel", "Skin", N.Avatar.piel],
     ["pelo", "Hair", N.Avatar.pelo],
     ["ojos", "Eyes", N.Avatar.ojos],
     ["ropa", "Shirt", N.Avatar.ropa]].forEach(function (par) {
      var cual = par[0];
      var fila = document.createElement("div");
      fila.className = "opt-fila";
      fila.innerHTML = '<span class="opt-et">' + par[1] + '</span>';
      var caja = document.createElement("div");
      caja.className = "opt-colores";

      function pintarCaja() {
        caja.innerHTML = "";
        par[2].forEach(function (c, i) {
          var libre = tiene(cual, i);
          var b = document.createElement("button");
          b.className = "swatch" + (a[cual] === i ? " sel" : "") + (libre ? "" : " trabado");
          b.style.background = c;
          b.setAttribute("aria-label", par[1] + " " + (i + 1) + (libre ? "" : " · bloqueado"));
          if (!libre) b.innerHTML = '<span class="candado">' + PRECIO[cual] + '</span>';
          b.addEventListener("click", function () {
            if (!tiene(cual, i)) return comprar(cual, i, function () {
              a[cual] = i; pintarCaja(); repintar();
            });
            a[cual] = i;
            caja.querySelectorAll(".swatch").forEach(function (x) { x.classList.remove("sel"); });
            b.classList.add("sel");
            global.EFECTOS.Sonido.tic(true);
            repintar();
          });
          caja.appendChild(b);
        });
      }
      pintarCaja();
      fila.appendChild(caja);
      opts.appendChild(fila);
    });

    // sombrero
    var filaS = document.createElement("div");
    filaS.className = "opt-fila";
    filaS.innerHTML = '<span class="opt-et">Hat</span>';
    var cajaS = document.createElement("div");
    cajaS.className = "opt-colores";
    function pintarSombreros() {
      cajaS.innerHTML = "";
      N.Avatar.sombrero.forEach(function (s, i) {
        var libre = tiene("sombrero", i);
        var b = document.createElement("button");
        b.className = "pastilla" + (a.sombrero === i ? " sel" : "") + (libre ? "" : " trabado");
      b.textContent = s === "ninguno" ? "—" : s;
        if (!libre) b.innerHTML += ' <span class="candado">' + PRECIO.sombrero + '</span>';
        b.addEventListener("click", function () {
          if (!tiene("sombrero", i)) return comprar("sombrero", i, function () {
            a.sombrero = i; pintarSombreros(); repintar();
          });
          a.sombrero = i;
          cajaS.querySelectorAll(".pastilla").forEach(function (x) { x.classList.remove("sel"); });
          b.classList.add("sel");
          global.EFECTOS.Sonido.tic(true);
          repintar();
        });
        cajaS.appendChild(b);
      });
    }
    pintarSombreros();
    filaS.appendChild(cajaS);
    opts.appendChild(filaS);

    el.querySelector("#acc").appendChild(
      J.ui.boton("Ready →", "btn-primario btn-grande", function () {
        var e2 = Alm.leer();
        e2.jugador.avatar = a;
        e2.jugador.nombre = (el.querySelector("#nom").value || "Player").trim();
        if (!e2.jugador.creado) e2.jugador.creado = Date.now();
        Alm.guardar();
        irA(global.AVENTURA.needsInitial() ? "introDiag" : "casa");
      }));
  };

  function logoSvg() {
    return '<svg viewBox="0 0 48 32" width="150" height="100" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="2" y="14" width="44" height="16" fill="#3f8a3f"/>' +
      '<rect x="2" y="12" width="44" height="3" fill="#4fae4f"/>' +
      '<path d="M12 4 L16 8 L12 14 L8 8 Z" fill="#2ee6a0"/>' +
      '<path d="M24 2 L29 8 L24 15 L19 8 Z" fill="#2ee6a0"/>' +
      '<path d="M36 4 L40 8 L36 14 L32 8 Z" fill="#2ee6a0"/>' +
      '<path d="M24 2 L26.5 8 L24 11 L21.5 8 Z" fill="#7df5c6"/></svg>';
  }

  /* ==========================================================================
     DIAGNÓSTICO — 7 pruebas cortas que dicen desde dónde arrancar
     Diseñado sobre los datos reales: no empieza por lo que ya domina.
     ======================================================================== */

  var DIAG = [
    { id: "sight-1", tit: "Sight words 1", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.SIGHT[1].concat(D.SIGHT[2]), 8), modo: "practica" }; } },
    { id: "sight-2", tit: "Sight words 2", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.SIGHT[3].concat(D.SIGHT[4]), 8), modo: "practica" }; } },
    { id: "cvc", tit: "Read CVC words", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.NONSENSE.cvc, 8), modo: "practica" }; } },
    { id: "cvce", tit: "Read CVCe words", juego: "lecturaPalabras",
      cfg: function () { return { items: U.tomar(D.NONSENSE.cvce, 8), modo: "practica" }; } },
    { id: "spelling", tit: "Spell words", juego: "spelling",
      cfg: function () { return { items: U.tomar(D.MODULO3.spellingSemana, 5) }; } },
    { id: "operaciones", tit: "Addition and subtraction", juego: "operaciones",
      cfg: function () { return { items: U.tomar(D.ECUACIONES_CLASE, 6), estrategia: false }; } },
    { id: "graficas", tit: "Read graphs", juego: "graficas",
      cfg: function () { return { grafica: D.GRAFICAS[0], cuantas: 4 }; } },
    { id: "formas", tit: "Shapes", juego: "formas",
      cfg: function () { return { rondas: 5 }; } }
  ];

  pantallas.introDiag = function (el) {
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<h2 class="tit">Let\'s see what you know</h2>' +
        '<p class="sub">Let’s see what you know. This is not a test, and you can’t lose.</p>' +
        '<ul class="lista-diag">' +
          DIAG.map(function (d, i) {
            return '<li><span class="n">' + (i + 1) + '</span>' + U.esc(d.tit) + '</li>';
          }).join("") +
        '</ul>' +
        '<p class="nota">You can pause anytime and come back later.</p>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';
    el.querySelector("#acc").appendChild(
      J.ui.boton("▶ Start", "btn-primario btn-grande", function () {
        irA("diag", { paso: 0 });
      }));
    el.querySelector("#acc").appendChild(
      J.ui.boton("Skip for now", "btn-fantasma", function () { irA("casa"); }));
  };

  pantallas.diag = function (el, datos) {
    var paso = datos.paso || 0;
    if (paso >= DIAG.length) return cerrarDiag(el);
    var d = DIAG[paso];

    var barra = document.createElement("div");
    barra.className = "diag-barra";
    barra.innerHTML = '<div class="diag-relleno" style="width:' +
      Math.round(paso / DIAG.length * 100) + '%"></div>' +
      '<span class="diag-txt">' + (paso + 1) + " / " + DIAG.length + " · " + U.esc(d.tit) + '</span>';
    el.appendChild(barra);

    var zona = document.createElement("div");
    el.appendChild(zona);

    J[d.juego].iniciar(zona, d.cfg(), function (res) {
      var e = Alm.leer();
      e.diagnostico.resultados[d.id] = {
        aciertos: res.aciertos, total: res.total,
        pct: res.total ? Math.round(res.aciertos / res.total * 100) : 0,
        cuando: Date.now()
      };
      Alm.guardar();
      irA("diag", { paso: paso + 1 });
    });
  };

  function cerrarDiag(el) {
    var e = Alm.leer();
    e.diagnostico.hecho = true;
    e.diagnostico.fecha = Date.now();
    Alm.guardar();
    Eco.dar(Eco.PAGOS.diagnosticoCompleto, "diagnostico");

    var r = e.diagnostico.resultados;
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<h2 class="tit">All done!</h2>' +
        '<p class="sub">Here’s what we explored</p>' +
        '<div class="diag-tabla">' +
          DIAG.map(function (d) {
            var x = r[d.id];
            var pct = x ? x.pct : null;
            var col = pct === null ? "" : pct >= 80 ? "verde" : pct >= 50 ? "amarillo" : "rojo";
            return '<div class="diag-fila">' +
              '<span>' + U.esc(d.tit) + '</span>' +
              '<span class="diag-pct sem-' + col + '">' +
                (pct === null ? "—" : pct + "%") + '</span></div>';
          }).join("") +
        '</div>' +
        '<p class="nota">A parent can see the full details in the dashboard.</p>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';
    el.querySelector("#acc").appendChild(
      J.ui.boton("Go play →", "btn-primario btn-grande", function () { irA("casa"); }));
  }

  /* ==========================================================================
     RETOS DEL DÍA
     Tres misiones que cambian cada día. Existen por una razón concreta: una
     lista de niveles siempre available no da ningún motivo para abrir el
     juego HOY. Un reto que vence esta noche, yes.
     El progreso se calcula del historial que ya se guarda, no de contadores
     aparte — it never drifts out of sync with what the player actually did.
     ======================================================================== */

  var Retos = (function () {

    var CATALOGO = [
      { id: "verde10", icono: "🟢", meta: 10, pago: 20,
        tit: "Get 10 words right",
        sub: "Read or spell each one correctly on the first try",
        cuenta: function (e) { return semaforosHoy(e, "verde"); } },

      { id: "spell5", icono: "✏️", meta: 5, pago: 25,
        tit: "Spell 5 words",
        sub: "Play Spelling without using a hint",
        cuenta: function (e) { return semaforosHoy(e, "verde", "encoding"); } },

      { id: "math15", icono: "🔢", meta: 15, pago: 20,
        tit: "Get 15 correct answers in Math",
        sub: "Play any game in the Math world",
        cuenta: function (e) { return aciertosHoyMundo(e, "math"); } },

      { id: "niveles3", icono: "🏁", meta: 3, pago: 25,
        tit: "Finish 3 levels",
        sub: "Choose any games from either world",
        cuenta: function (e) { return sesionesHoy(e).length; } },

      { id: "cuento1", icono: "📖", meta: 1, pago: 20,
        tit: "Read a whole story",
        sub: "Then try the Challenger round",
        cuenta: function (e) {
          return sesionesHoy(e).filter(function (s) {
            return String(s.nivel).indexOf("cuento") === 0;
          }).length;
        } },

      { id: "carrera1", icono: "⚡", meta: 1, pago: 30,
        tit: "Try a Speed Run",
        sub: "Choose your own speed",
        cuenta: function (e) {
          return sesionesHoy(e).filter(function (s) { return s.nivel === "carrera"; }).length;
        } },

      { id: "sopa1", icono: "🔎", meta: 1, pago: 20,
        tit: "Win a Word Search",
        sub: "Find every word",
        cuenta: function (e) {
          return sesionesHoy(e).filter(function (s) {
            return s.nivel === "sopa" && s.aciertos === s.total;
          }).length;
        } },

      { id: "esm50", icono: "💚", meta: 50, pago: 20,
        tit: "Earn 50 gems",
        sub: "Add up gems from all of today’s games",
        cuenta: function (e) {
          return sesionesHoy(e).reduce(function (s, x) { return s + (x.esmeraldas || 0); }, 0);
        } }
    ];

    function hoy() { return U.hoy(); }

    function sesionesHoy(e) {
      var h = hoy();
      return (e.sesiones || []).filter(function (s) {
        return U.fecha(s.t) === h;
      });
    }

    function aciertosHoyMundo(e, mundo) {
      return sesionesHoy(e).filter(function (s) { return s.mundo === mundo; })
        .reduce(function (n, s) { return n + (s.aciertos || 0); }, 0);
    }

    function semaforosHoy(e, color, destrezaSolo) {
      var h = hoy(), n = 0;
      Object.keys(e.destrezas || {}).forEach(function (k) {
        if (destrezaSolo && k.indexOf(destrezaSolo) !== 0) return;
        (e.destrezas[k].historial || []).forEach(function (x) {
          if (x.semaforo === color &&
              U.fecha(x.t) === h) n++;
        });
      });
      return n;
    }

    /* The daily three are date-based, not random: they do not change when you
       recargar, y no se puede rerollear hasta que salga uno fácil. */
    function delDia() {
      var f = hoy();
      var semilla = 0;
      for (var i = 0; i < f.length; i++) semilla = (semilla * 31 + f.charCodeAt(i)) >>> 0;
      var bolsa = CATALOGO.slice(), elegidos = [];
      for (var k = 0; k < 3 && bolsa.length; k++) {
        semilla = (semilla * 1103515245 + 12345) >>> 0;
        elegidos.push(bolsa.splice(semilla % bolsa.length, 1)[0]);
      }
      return elegidos;
    }

    function estado() {
      var e = Alm.leer();
      if (!e.retos || e.retos.fecha !== hoy()) {
        e.retos = { fecha: hoy(), cobrados: [], cofre: false };
        Alm.guardar();
      }
      return delDia().map(function (r) {
        var hecho = Math.min(r.cuenta(e), r.meta);
        return {
          def: r,
          hecho: hecho,
          completo: hecho >= r.meta,
          cobrado: e.retos.cobrados.indexOf(r.id) >= 0
        };
      });
    }

    function cobrar(id) {
      var e = Alm.leer();
      if (e.retos.cobrados.indexOf(id) >= 0) return 0;
      var r = CATALOGO.filter(function (x) { return x.id === id; })[0];
      if (!r || r.cuenta(e) < r.meta) return 0;
      e.retos.cobrados.push(id);
      Alm.guardar();
      Eco.dar(r.pago, "reto");
      return r.pago;
    }

    function cofreListo() {
      var st = estado();
      var e = Alm.leer();
      return st.every(function (x) { return x.cobrado; }) && !e.retos.cofre;
    }

    function abrirCofre() {
      var e = Alm.leer();
      if (e.retos.cofre) return 0;
      e.retos.cofre = true;
      Alm.guardar();
      var premio = 40 + Math.floor(Math.random() * 40);
      Eco.dar(premio, "cofre");
      return premio;
    }

    return { estado: estado, cobrar: cobrar, cofreListo: cofreListo,
             abrirCofre: abrirCofre };
  })();

  /* dibuja la tarjeta de retos en la pantalla de inicio */
  function pintarRetos(cont) {
    var st = Retos.estado();
    var caja = document.createElement("section");
    caja.className = "retos";
    caja.innerHTML = '<h3 class="retos-tit">Today’s challenges</h3>';

    st.forEach(function (x) {
      var pct = Math.round(x.hecho / x.def.meta * 100);
      var d = document.createElement("div");
      d.className = "reto" + (x.cobrado ? " reto-cobrado" : x.completo ? " reto-listo" : "");
      d.innerHTML =
        '<span class="reto-icono">' + x.def.icono + '</span>' +
        '<span class="reto-txt">' +
          '<b>' + U.esc(x.def.tit) + '</b>' +
          '<em>' + U.esc(x.def.sub) + '</em>' +
          '<span class="reto-barra"><span class="reto-relleno" style="width:' + pct + '%"></span></span>' +
        '</span>' +
        '<span class="reto-der">' +
          (x.cobrado ? '<span class="reto-ok">✓</span>'
                     : '<span class="reto-n">' + x.hecho + '/' + x.def.meta + '</span>') +
        '</span>';

      if (x.completo && !x.cobrado) {
        var b = document.createElement("button");
        b.className = "btn btn-primario reto-btn";
        b.textContent = "+" + x.def.pago;
        b.addEventListener("click", function () {
          var g = Retos.cobrar(x.def.id);
          if (g) {
            global.EFECTOS.Sonido.nivel();
            global.EFECTOS.Particulas.estallar(b, 20);
            global.EFECTOS.Particulas.flotar(b, "+" + g, "#2ee6a0");
          }
          setTimeout(function () { irA("casa"); }, 700);
        });
        d.querySelector(".reto-der").appendChild(b);
      }
      caja.appendChild(d);
    });

    if (Retos.cofreListo()) {
      var cof = document.createElement("button");
      cof.className = "cofre";
      cof.innerHTML = '<span class="cofre-emoji">🎁</span>' +
        '<span>All three challenges complete!<em>Tap to open your chest</em></span>';
      cof.addEventListener("click", function () {
        var p = Retos.abrirCofre();
        global.EFECTOS.Sonido.nivel();
        global.EFECTOS.Particulas.estallar(cof, 30, "#ffcc4d");
        global.EFECTOS.Particulas.flotar(cof, "+" + p, "#ffcc4d");
        setTimeout(function () { irA("casa"); }, 900);
      });
      caja.appendChild(cof);
    }

    // van arriba de los mundos: lo primero que ve al abrir es qué hacer hoy
    var mundos = cont.querySelector(".mundos");
    if (mundos) cont.insertBefore(caja, mundos);
    else cont.appendChild(caja);
  }

  /* ==========================================================================
     CASA — elegir mundo
     ======================================================================== */

  pantallas.casa = function (el) {
    var e = Alm.leer();
    Eco.marcarDia();
    el.innerHTML =
      '<section class="pantalla">' +
        '<div class="saludo">' +
          '<div class="saludo-av">' + N.Avatar.svg(e.jugador.avatar, 72) + '</div>' +
          '<div><h2 class="tit-chico">Hi, ' + U.esc(e.jugador.nombre || "Player") + '</h2>' +
          '<p class="sub">Choose your world</p></div>' +
        '</div>' +
        '<div class="mundos">' +
          '<button class="mundo mundo-reading" data-m="reading">' +
            '<span class="mundo-icono">' + iconoLibro() + '</span>' +
            '<span class="mundo-nom">READING</span>' +
            '<span class="mundo-sub">Words · Stories · Spelling</span>' +
          '</button>' +
          '<button class="mundo mundo-math" data-m="math">' +
            '<span class="mundo-icono">' + iconoMate() + '</span>' +
            '<span class="mundo-nom">MATH</span>' +
            '<span class="mundo-sub">Facts · Money · Graphs</span>' +
          '</button>' +
        '</div>' +
        '<button class="tienda-btn" id="btienda">' + esmeraldaSvg(18) +
          ' Prize Shop · ' + e.esmeraldas + '</button>' +
      '</section>';
    global.AVENTURA.home(el.querySelector(".pantalla"));
    el.querySelectorAll(".mundo").forEach(function (b) {
      b.addEventListener("click", function () { irA("mundo", { mundo: b.dataset.m }); });
    });
    el.querySelector("#btienda").addEventListener("click", function () { irA("tienda"); });
  };

  function iconoLibro() {
    return '<svg viewBox="0 0 16 16" width="46" height="46" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="2" y="3" width="12" height="10" fill="#ffb03a"/>' +
      '<rect x="7" y="3" width="2" height="10" fill="#e0913a"/>' +
      '<rect x="3" y="5" width="3" height="1" fill="#5a3a22"/>' +
      '<rect x="3" y="7" width="3" height="1" fill="#5a3a22"/>' +
      '<rect x="10" y="5" width="3" height="1" fill="#5a3a22"/>' +
      '<rect x="10" y="7" width="3" height="1" fill="#5a3a22"/></svg>';
  }
  function iconoMate() {
    return '<svg viewBox="0 0 16 16" width="46" height="46" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="2" y="2" width="12" height="12" fill="#6ea8ff"/>' +
      '<rect x="4" y="7" width="4" height="1.5" fill="#12162a"/>' +
      '<rect x="5.25" y="5.75" width="1.5" height="4" fill="#12162a"/>' +
      '<rect x="9" y="7" width="4" height="1.5" fill="#12162a"/></svg>';
  }

  /* ==========================================================================
     MUNDO — lista de niveles
     ======================================================================== */

  /* --- las listas que puede correr en el Speed Run -------------------------
     Todas salen de los papeles que subió el papá. Cada una dice de cuál, para
     que se sepa qué se está practicando y no parezca contenido inventado. */

  function conjuntosDeLectura() {
    var cs = [];

    cs.push({
      id: "vce-semana",
      nombre: "Spelling: This Week",
      fuente: "Newsletter Sep 7–11 · VCe pattern",
      items: D.MODULO3.spellingSemana.concat(D.MODULO3.vcePractica)
    });

    cs.push({
      id: "sight-actual",
      nombre: "Sight Words · Unit " + D.MODULO_ACTUAL,
      fuente: D.MODULO_PATRON[D.MODULO_ACTUAL],
      items: D.SIGHT[D.MODULO_ACTUAL]
    });

    /* los módulos ya vistos, todos juntos: es su repaso acumulado */
    var vistos = [];
    for (var i = 1; i <= D.MODULO_ACTUAL; i++) vistos = vistos.concat(D.SIGHT[i]);
    cs.push({
      id: "sight-vistos",
      nombre: "Sight Words · Units 1–" + D.MODULO_ACTUAL,
      fuente: "Lista oficial 26-27 · " + vistos.length + " palabras",
      items: vistos
    });

    cs.push({
      id: "nonsense-cvc",
      nombre: "Nonsense Words · CVC",
      fuente: "Sus hojas de CVC Nonsense Word Fluency",
      items: D.NONSENSE.cvc
    });

    cs.push({
      id: "nonsense-cvce",
      nombre: "Nonsense Words · CVCe",
      fuente: "Sus hojas de CVC and CVCE Nonsense Word Fluency",
      items: D.NONSENSE.cvce
    });

    /* lo que le viene costando: el conjunto más útil de todos */
    var cuestan = Pro.paraRepasar(60);
    if (cuestan.length >= 8) {
      var mapa = {};
      Object.keys(D.SIGHT).forEach(function (k) {
        D.SIGHT[k].forEach(function (w) { mapa[w.p] = w; });
      });
      D.NONSENSE.cvc.concat(D.NONSENSE.cvce).forEach(function (w) { mapa[w.p] = w; });
      D.MODULO3.spellingSemana.concat(D.MODULO3.vcePractica)
        .forEach(function (w) { mapa[w.p] = w; });
      cs.unshift({
        id: "cuestan",
        nombre: "Lo que le cuesta",
        fuente: cuestan.length + " palabras que salieron amarillas o rojas",
        destacado: true,
        items: cuestan.map(function (p) { return mapa[p] || { p: p }; })
      });
    }
    return cs;
  }

  function nivelesDe(mundo) {
    var e = Alm.leer();
    var repasar = Pro.paraRepasar(8);
    var lista = [];

    if (mundo === "reading") {
      lista.push({
        id: "vce-semana", tit: "Spelling: VCe", sub: "made · safe · time · like",
        etiqueta: "School review", prioridad: true,
        juego: "spelling", cfg: { items: D.MODULO3.spellingSemana }
      });
      lista.push({
        id: "sight-modulo-" + D.MODULO_ACTUAL,
        tit: "Sight Words " + D.MODULO_ACTUAL,
        sub: D.MODULO_PATRON[D.MODULO_ACTUAL],
        etiqueta: "Available unit",
        juego: "lecturaPalabras",
        cfg: function () {
          return { items: U.tomar(D.SIGHT[D.MODULO_ACTUAL], 10), modo: "practica" };
        }
      });
      lista.push({
        id: "sight-todos", tit: "All Sight Words",
        sub: "12 units · " + D.SIGHT_TOTAL + " words",
        pantalla: "modulos"
      });
      lista.push({
        id: "carrera", tit: "Speed Run", sub: "Choose a word list and speed",
        etiqueta: (e.destrezas["record-ppm"] ? "Best: " + e.destrezas["record-ppm"].mejor + " wpm" : "New"),
        juego: "lecturaPalabras",
        cfg: function () { return { modo: "carrera", conjuntos: conjuntosDeLectura() }; }
      });
      lista.push({
        id: "sopa", tit: "Word Search", sub: "Find the words",
        juego: "sopaLetras",
        cfg: { items: U.tomar(D.MODULO3.vcePractica, 6), lado: 10, diagonales: true }
      });
      D.CUENTOS.forEach(function (c) {
        lista.push({
          id: "cuento-" + c.id, tit: c.titulo, sub: "Story + Challenger",
          juego: "cuento", cfg: { cuento: c }
        });
      });
      lista.push({
        id: "cvc-fluidez", tit: "Nonsense Words", sub: "Practice sounding out words",
        juego: "lecturaPalabras",
        cfg: { items: U.tomar(D.NONSENSE.cvc, 10), modo: "practica" }
      });
      if (repasar.length >= 4) {
        lista.unshift({
          id: "repaso", tit: "Review", sub: repasar.slice(0, 4).join(" · "),
          etiqueta: "Keep practicing", prioridad: true,
          juego: "lecturaPalabras",
          cfg: { items: repasar.map(function (p) { return { p: p }; }), modo: "practica" }
        });
      }
    } else {
      lista.push({
        id: "graficas-semana", tit: "Bar & Picture Graphs", sub: "Read the data",
        etiqueta: "School review", prioridad: true,
        juego: "graficas", cfg: { cuantas: 5 }
      });
      lista.push({
        id: "ecuaciones", tit: "Equation Cards", sub: "The missing number can go anywhere",
        juego: "operaciones", cfg: { items: D.ECUACIONES_CLASE.slice() }
      });
      lista.push({
        id: "facts", tit: "Math Facts", sub: "Add and subtract up to 20",
        juego: "operaciones", cfg: { cuantas: 10, max: 20 }
      });
      lista.push({
        id: "problemas", tit: "Word Problems", sub: "Step by step",
        juego: "problemas", cfg: { cuantas: 4 }
      });
      lista.push({
        id: "dinero-id", tit: "Coins & Bills", sub: "What is it worth?",
        juego: "monedas", cfg: { modo: "identificar", rondas: 6 }
      });
      lista.push({
        id: "dinero-contar", tit: "Count the Money", sub: "Add the coins",
        juego: "monedas", cfg: { modo: "contar", rondas: 6 }
      });
      lista.push({
        id: "tienda-mate", tit: "The Shop", sub: "Shop and make change",
        juego: "monedas", cfg: { modo: "tienda", rondas: 6 }
      });
      lista.push({
        id: "formas", tit: "Shapes", sub: "2D and 3D",
        etiqueta: "Practice shapes", juego: "formas", cfg: { rondas: 8 }
      });
    }
    return lista;
  }

  pantallas.mundo = function (el, datos) {
    var mundo = datos.mundo || "reading";
    var lista = nivelesDe(mundo);
    var e = Alm.leer();

    el.innerHTML =
      '<section class="pantalla mundo-' + mundo + '-tema">' +
        '<button class="volver" id="volver">← Back</button>' +
        '<h2 class="tit">' + (mundo === "reading" ? "READING" : "MATH") + '</h2>' +
        '<div class="niveles" id="niveles"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () { irA("casa"); });

    var cont = el.querySelector("#niveles");
    lista.forEach(function (n) {
      var hechas = (e.destrezas[n.id] || {}).intentos || 0;
      var b = document.createElement("button");
      b.className = "nivel" + (n.prioridad ? " nivel-prio" : "");
      b.innerHTML =
        J.ui.ilustracion(n.tit) +
        (n.etiqueta ? '<span class="nivel-tag">' + U.esc(n.etiqueta) + '</span>' : "") +
        '<span class="nivel-tit">' + U.esc(n.tit) + '</span>' +
        '<span class="nivel-sub">' + U.esc(n.sub) + '</span>';
      b.addEventListener("click", function () {
        if (n.pantalla) irA(n.pantalla, { mundo: mundo });
        else irA("jugar", { mundo: mundo, nivel: n });
      });
      cont.appendChild(b);
    });
  };

  /* ======================================================================
     EXPLORAR — aventura táctil en un mapa de bloques 3D
     Los edificios llevan al catálogo; cada actividad sigue usando el juego
     y el guardado que ya existen.
     ==================================================================== */

  pantallas.explorar = function (el) {
    var e = Alm.leer();
    var places = [
      { id: "reading", x: 24, y: 48, icon: "📚", title: "READING LIBRARY", detail: "Reading games" },
      { id: "math", x: 76, y: 48, icon: "🧮", title: "MATH WORKSHOP", detail: "Math games" },
      { id: "quest", x: 50, y: 18, icon: "🏁", title: "MISSION PORTAL", detail: "Guided mission" }
    ];
    el.innerHTML =
      '<section class="pantalla av-world-screen">' +
        '<div class="av-world-head"><button class="volver" id="av-world-back">← Home</button><span class="av-eyebrow">BLOCK QUEST · EXPLORER</span><button class="av-bag-shortcut" id="av-world-bag">🎒 Activities</button></div>' +
        '<h2 class="tit">Explore Block Quest</h2><p class="sub">Walk through a small block world of gardens, platforms and buildings. Choose an activity whenever you like.</p>' +
        '<div class="av-world-viewport" id="av-world" tabindex="0" role="application" aria-label="Block world. Use the arrow buttons to walk.">' +
          '<div class="av-world-ground" aria-hidden="true"></div><div class="av-world-keyboard" aria-hidden="true">' +
            [['ESC','1','2','3','4','5','6','7','8','9','0','⌫'],['TAB','Q','W','E','R','T','Y','U','I','O','P'],['CAPS','A','S','D','F','G','H','J','K','L'],['SHIFT','Z','X','C','V','B','N','M','↵'],['CTRL','☻','ALT','SPACE','ALT','←','↓','↑','→']].map(function(row){return '<div class="av-keyboard-row">'+row.map(function(key){return '<span class="av-world-key'+(key==='SPACE'?' av-key-space':'')+'">'+key+'</span>';}).join('')+'</div>';}).join('') +
          '</div><div class="av-world-town" aria-hidden="true"><span class="av-world-house av-house-one">🏠</span><span class="av-world-house av-house-two">🏡</span><span class="av-world-garden">🌻 🌿 🌻</span></div><span class="av-world-bumper av-bumper-one" aria-hidden="true">🧱</span><span class="av-world-bumper av-bumper-two" aria-hidden="true">🟪</span><span class="av-world-bumper av-bumper-three" aria-hidden="true">🧱</span>' +
          places.map(function (p) { return '<button class="av-world-place av-place-' + p.id + '" data-place="' + p.id + '" style="left:' + p.x + '%;top:' + p.y + '%" aria-label="' + p.title + '"><span class="av-place-icon">' + p.icon + '</span><strong>' + p.title + '</strong><small>' + p.detail + '</small><span class="av-place-action">Walk closer</span></button>'; }).join("") +
          '<div class="av-world-player" id="av-world-player" style="left:50%;top:79%" aria-label="Your character">' + N.Avatar.svg(e.jugador.avatar, 58) + '<span class="av-player-shadow"></span></div>' +
        '</div>' +
        '<div class="av-world-footer"><p id="av-world-status" class="av-world-status" aria-live="polite">Walk to the Reading Library, Math Workshop, or Mission Portal.</p>' +
          '<div class="av-world-controls" role="group" aria-label="Movement controls"><button data-move="up" aria-label="Walk up">▲</button><button data-move="left" aria-label="Walk left">◀</button><button data-move="down" aria-label="Walk down">▼</button><button data-move="right" aria-label="Walk right">▶</button></div>' +
        '</div><p class="nota">Tap the arrows or use the arrow keys to move. You can pause or return anytime.</p>' +
      '</section>';
    el.querySelector("#av-world-back").addEventListener("click", function () { irA("casa"); });
    el.querySelector("#av-world-bag").addEventListener("click", function () { irA("mochila"); });
    var scene = el.querySelector("#av-world"), player = el.querySelector("#av-world-player"), status = el.querySelector("#av-world-status");
    var position = { x: 50, y: 79 }, held = { up: false, down: false, left: false, right: false };
    var keyMap = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
    var speed = 18, frame = 0, lastFrame = 0, pressStart = {}, lastPointerTap = 0;
    var vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    function distance(p) { return Math.hypot(position.x - p.x, position.y - p.y); }
    function refresh() {
      player.style.left = position.x + "%"; player.style.top = position.y + "%";
      var nearest = null, nearestDistance = Infinity;
      places.forEach(function (p) {
        var d = distance(p), b = scene.querySelector('[data-place="' + p.id + '"]');
        b.classList.toggle("av-place-near", d < 19);
        b.querySelector(".av-place-action").textContent = d < 19 ? "Enter →" : "Walk closer";
        if (d < nearestDistance) { nearest = p; nearestDistance = d; }
      });
      status.textContent = nearestDistance < 19 ? "You are near " + nearest.title + ". Tap Enter to explore!" : "Walk to the Reading Library, Math Workshop, or Mission Portal.";
    }
    function frameMove(time) {
      if (!scene.isConnected) { frame = 0; return; }
      var elapsed = Math.min((time - lastFrame) / 1000, 0.05); lastFrame = time;
      var dx = (held.right ? 1 : 0) - (held.left ? 1 : 0), dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      var length = Math.hypot(dx, dy) || 1;
      position.x = Math.max(5, Math.min(95, position.x + dx / length * speed * elapsed));
      position.y = Math.max(8, Math.min(93, position.y + dy / length * speed * elapsed));
      refresh();
      if (held.up || held.down || held.left || held.right) frame = requestAnimationFrame(frameMove);
      else frame = 0;
    }
    function hold(dir, active) {
      if (!Object.prototype.hasOwnProperty.call(held, dir)) return;
      held[dir] = active;
      if (active && !frame) { lastFrame = performance.now(); frame = requestAnimationFrame(frameMove); }
      if (!active && !held.up && !held.down && !held.left && !held.right && frame) { cancelAnimationFrame(frame); frame = 0; }
    }
    function stepOnce(dir) {
      var v = vectors[dir]; if (!v) return;
      position.x = Math.max(5, Math.min(95, position.x + v[0] * 2.8));
      position.y = Math.max(8, Math.min(93, position.y + v[1] * 2.8)); refresh();
    }
    function releasePress(dir) {
      var start = pressStart[dir]; hold(dir, false);
      if (start && performance.now() - start.time < 140 && Math.hypot(position.x - start.x, position.y - start.y) < 0.4) stepOnce(dir);
      delete pressStart[dir];
    }
    function enter(id) {
      var p = places.find(function (x) { return x.id === id; });
      if (!p || distance(p) >= 19) { status.textContent = "Walk a little closer to " + (p ? p.title : "that place") + "."; return; }
      if (id === "quest") irA("aventura");
      else irA("mochila", { mundo: id });
    }
    scene.querySelectorAll("[data-place]").forEach(function (b) { b.addEventListener("click", function () { enter(b.dataset.place); }); });
    el.querySelectorAll("[data-move]").forEach(function (b) {
      var dir = b.dataset.move;
      b.addEventListener("pointerdown", function (ev) { ev.preventDefault(); scene.focus({ preventScroll: true }); pressStart[dir] = { x: position.x, y: position.y, time: performance.now() }; try { b.setPointerCapture(ev.pointerId); } catch (_) {} hold(dir, true); });
      b.addEventListener("pointerup", function () { releasePress(dir); lastPointerTap = performance.now(); });
      ["pointercancel", "lostpointercapture"].forEach(function (name) { b.addEventListener(name, function () { hold(dir, false); delete pressStart[dir]; }); });
      b.addEventListener("click", function () { if (performance.now() - lastPointerTap > 300) stepOnce(dir); });
      b.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") hold(dir, true); });
      b.addEventListener("keyup", function () { hold(dir, false); });
    });
    scene.addEventListener("keydown", function (ev) {
      var dir = keyMap[ev.key.toLowerCase()]; if (!dir) return;
      ev.preventDefault(); if (!pressStart[dir]) pressStart[dir] = { x: position.x, y: position.y, time: performance.now() }; hold(dir, true);
    });
    scene.addEventListener("keyup", function (ev) { var dir = keyMap[ev.key.toLowerCase()]; if (dir) releasePress(dir); });
    scene.addEventListener("blur", function () { Object.keys(held).forEach(function (dir) { held[dir] = false; }); if (frame) cancelAnimationFrame(frame); frame = 0; });
    refresh();
  };

  pantallas.mochila = function (el, datos) {
    var e = Alm.leer(), filter = datos.mundo || "all";
    el.innerHTML = '<section class="pantalla av-storage"><button class="volver" id="av-storage-back">← Explore</button><div class="av-eyebrow">YOUR ACTIVITY STORAGE</div><h2 class="tit">Activity backpack</h2><p class="sub">Pick any game. Your existing activities and progress stay together.</p><div class="av-storage-filters" role="group" aria-label="Choose a subject"><button data-filter="all">All</button><button data-filter="reading">📚 Reading</button><button data-filter="math">🧮 Math</button></div><div class="av-storage-count" id="av-storage-count"></div><div class="av-storage-grid" id="av-storage-grid"></div></section>';
    el.querySelector("#av-storage-back").addEventListener("click", function () { irA("explorar"); });
    function draw() {
      var grid = el.querySelector("#av-storage-grid"), items = [];
      if (filter === "all" || filter === "reading") items = items.concat(nivelesDe("reading").map(function (n) { return { mundo: "reading", nivel: n }; }));
      if (filter === "all" || filter === "math") items = items.concat(nivelesDe("math").map(function (n) { return { mundo: "math", nivel: n }; }));
      grid.innerHTML = "";
      el.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.toggle("av-filter-active", b.dataset.filter === filter); });
      el.querySelector("#av-storage-count").textContent = items.length + " activities ready to play";
      items.forEach(function (item) {
        var n = item.nivel, b = document.createElement("button"), runs = (e.destrezas[n.id] || {}).intentos || 0;
        b.type = "button"; b.className = "av-activity-card";
        b.innerHTML = J.ui.ilustracion(n.tit) + '<span class="av-activity-subject">' + (item.mundo === "reading" ? "READING" : "MATH") + '</span>' + (n.etiqueta ? '<span class="nivel-tag">' + U.esc(n.etiqueta) + '</span>' : '') + '<strong>' + U.esc(n.tit) + '</strong><span class="av-activity-description">' + U.esc(n.sub || "Choose and play") + '</span><span class="av-activity-progress">' + (runs ? runs + " practices" : "Ready to play") + '</span>';
        b.addEventListener("click", function () {
          if (n.pantalla) irA(n.pantalla, { mundo: item.mundo });
          else irA("jugar", { mundo: item.mundo, nivel: n, volverA: "mochila" });
        });
        grid.appendChild(b);
      });
    }
    el.querySelectorAll("[data-filter]").forEach(function (b) { b.addEventListener("click", function () { filter = b.dataset.filter; draw(); }); });
    draw();
  };
  /* --- los 12 módulos de sight words --------------------------------------
     360 words total. Each unit groups a phonics pattern, and picking one means
     elegir uno es elegir qué se practica, no solo qué palabras salen.        */

  pantallas.modulos = function (el, datos) {
    var e = Alm.leer();
    el.innerHTML =
      '<section class="pantalla">' +
        '<button class="volver" id="volver">← Back</button>' +
        '<h2 class="tit">Sight Words</h2>' +
        '<p class="sub">12 units · ' + D.SIGHT_TOTAL + ' words</p>' +
        '<div class="niveles" id="mods"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () {
      irA("mundo", { mundo: datos.mundo || "reading" });
    });

    var cont = el.querySelector("#mods");
    Object.keys(D.SIGHT).forEach(function (k) {
      var mod = parseInt(k, 10);
      var palabras = D.SIGHT[mod];
      // cuántas de este módulo ya domina
      var dom = palabras.filter(function (w) {
        var reg = e.palabras[w.p];
        return reg && reg.verde >= 2 && reg.ultima === "verde";
      }).length;
      var pct = Math.round(dom / palabras.length * 100);

      var b = document.createElement("button");
      b.className = "nivel" + (mod === D.MODULO_ACTUAL ? " nivel-prio" : "");
      b.innerHTML =
        (mod === D.MODULO_ACTUAL ? '<span class="nivel-tag">Available unit</span>' : "") +
        '<span class="nivel-tit">Module ' + mod + '</span>' +
        '<span class="nivel-sub">' + U.esc(D.MODULO_PATRON[mod] || "") + '</span>' +
        '<span class="mod-barra"><span class="mod-relleno" style="width:' + pct + '%"></span></span>' +
        '<span class="mod-n">' + dom + ' / ' + palabras.length + ' seen across multiple days</span>';
      b.addEventListener("click", function () {
        irA("jugar", { mundo: "reading", nivel: {
          id: "sight-modulo-" + mod,
          tit: "Module " + mod,
          juego: "lecturaPalabras",
          cfg: { items: U.tomar(palabras, 10), modo: "practica" }
        }, volverA: "modulos" });
      });
      cont.appendChild(b);
    });
  };

  pantallas.jugar = function (el, datos) {
    var n = datos.nivel;
    if (!n) return irA("casa");

    // volver a donde se entró: al mundo, o a la lista de módulos
    function volver() {
      if (datos.volverA) irA(datos.volverA, { mundo: datos.mundo });
      else irA("mundo", { mundo: datos.mundo });
    }

    var barra = document.createElement("div");
    barra.className = "juego-barra";
    barra.innerHTML = '<button class="volver" id="salir">← Exit</button>';
    el.appendChild(barra);
    barra.querySelector("#salir").addEventListener("click", function () {
      volver();
    });

    var zona = document.createElement("div");
    el.appendChild(zona);

    var cfg = typeof n.cfg === "function" ? n.cfg() : n.cfg;
    J[n.juego].iniciar(zona, cfg, function (res) {
      Pro.registrar(n.id, res.total ? res.aciertos / res.total >= 0.7 : false,
        { item: n.tit });
      var e = Alm.leer();
      e.sesiones.push({ t: Date.now(), nivel: n.id, mundo: datos.mundo,
        aciertos: res.aciertos, total: res.total, esmeraldas: res.esmeraldas });
      if (e.sesiones.length > 200) e.sesiones.shift();
      Alm.guardar();
      if (Pro.hayFatiga(n.id)) {
        mostrarDescanso(el, function () { irA("mundo", { mundo: datos.mundo }); });
      } else {
        volver();
      }
    });
  };

  function mostrarDescanso(el, listo) {
    el.innerHTML =
      '<section class="pantalla centro">' +
        '<h2 class="tit">Buen trabajo</h2>' +
        '<p class="sub">You’ve played a lot today. Come back tomorrow for more.</p>' +
        '<div class="acc" id="acc"></div>' +
      '</section>';
    el.querySelector("#acc").appendChild(J.ui.boton("OK", "btn-primario", listo));
  }

  /* ==========================================================================
     TIENDA DE PREMIOS
     ======================================================================== */

  pantallas.tienda = function (el) {
    var e = Alm.leer();
    el.innerHTML =
      '<section class="pantalla">' +
        '<button class="volver" id="volver">← Back</button>' +
        '<h2 class="tit">Prize Shop</h2>' +
        '<p class="sub">You have ' + e.esmeraldas + ' gems</p>' +
        '<div class="premios" id="premios"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () { irA("casa"); });
    var cont = el.querySelector("#premios");

    e.premios.forEach(function (p) {
      var puede = e.esmeraldas >= p.costo;
      var d = document.createElement("div");
      d.className = "premio" + (puede ? " puede" : "");
      d.innerHTML =
        '<span class="premio-emoji">' + (p.emoji || "🎁") + '</span>' +
        '<span class="premio-nom">' + U.esc(p.nombre) + '</span>' +
        '<span class="premio-costo">' + esmeraldaSvg(14) + ' ' + p.costo + '</span>';
      var b = document.createElement("button");
      b.className = "btn " + (puede ? "btn-primario" : "btn-fantasma");
      b.textContent = puede ? "Redeem" : "Need " + (p.costo - e.esmeraldas) + " more gems";
      b.disabled = !puede;
      b.addEventListener("click", function () {
        if (!confirm("Redeem “" + p.nombre + "” for " + p.costo + " gems?\n\nA parent must approve it.")) return;
        if (Eco.gastar(p.costo)) {
          var e2 = Alm.leer();
          e2.canjes.push({ t: Date.now(), premio: p.nombre, costo: p.costo, entregado: false });
          Alm.guardar();
          alert("Done! Show this to a parent.");
          irA("tienda");
        }
      });
      d.appendChild(b);
      cont.appendChild(d);
    });
  };

  /* ==========================================================================
     PANEL DEL PAPÁ
     ======================================================================== */

  function pedirPin() {
    // barrera simple: una cuenta que un chico de 7 no resuelve de memoria
    var a = U.entero(11, 19), b = U.entero(11, 19);
    var r = prompt("Parent dashboard\n\nWhat is " + a + " × " + b + "?");
    if (r === null) return;
    if (parseInt(r, 10) === a * b) irA("panel");
    else alert("That is not correct.");
  }

  pantallas.panel = function (el) {
    var e = Alm.leer();
    el.innerHTML =
      '<section class="pantalla panel">' +
        '<button class="volver" id="volver">← Exit dashboard</button>' +
        '<h2 class="tit">Parent dashboard</h2>' +
        '<nav class="panel-tabs">' +
          '<button data-t="resumen" class="tab activo">Overview</button>' +
          '<button data-t="aprendizaje" class="tab">Learning plan</button>' +
          '<button data-t="destrezas" class="tab">History</button>' +
          '<button data-t="palabras" class="tab">Words</button>' +
          '<button data-t="premios" class="tab">Rewards</button>' +
          '<button data-t="jugadores" class="tab">Players</button>' +
          '<button data-t="ajustes" class="tab">Settings</button>' +
        '</nav>' +
        '<p class="panel-quien">' + (Alm.esPrueba() ? 'Mode: <b>test</b>'
          : Alm.modo() === "cuenta" ? 'Signed in as <b>' + U.esc(N.Auth.miNombre() || "—") + '</b>'
          : 'Player <b>' + U.esc(Alm.leer().jugador.nombre || "—") + '</b> · local') + '</p>' +
        '<div id="panelCuerpo"></div>' +
      '</section>';
    el.querySelector("#volver").addEventListener("click", function () { irA("casa"); });
    var cuerpo = el.querySelector("#panelCuerpo");
    var tabs = el.querySelectorAll(".tab");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("activo"); });
        t.classList.add("activo");
        pintarTab(t.dataset.t);
      });
    });
    pintarTab("resumen");

    function pintarTab(cual) {
      var e = Alm.leer();
      if (cual === "aprendizaje") return global.AVENTURA.panel(cuerpo);
      if (cual === "resumen") return resumen(e);
      if (cual === "destrezas") return destrezas(e);
      if (cual === "palabras") return palabras(e);
      if (cual === "premios") return premios(e);
      if (cual === "jugadores") return jugadores();
      return ajustes(e);
    }

    /* --- cuentas y chicos a cargo ----------------------------------------- */
    function jugadores() {
      if (Alm.esPrueba()) {
        cuerpo.innerHTML = '<p class="nota">You are in test mode without an account. ' +
          'Exit test mode to manage players.</p>';
        return;
      }

      /* Sin cuenta: un solo jugador, todo en este aparato. */
      if (Alm.modo() !== "cuenta") {
        cuerpo.innerHTML =
          '<div class="tarjeta"><span class="tarjeta-et">Current mode</span>' +
          '<span class="tarjeta-v">One player</span>' +
          '<span class="tarjeta-s">local · saved on this device</span></div>' +
          '<p class="nota">This works well while Gaby is the only player: no ' +
          'password is needed, and the game works offline.</p>' +
          '<h3 class="panel-h3">When should I switch to accounts?</h3>' +
          '<ul class="lista-simple">' +
            '<li>When more than one child uses this device — without accounts ' +
            'their progress gets mixed.</li>' +
            '<li>When you want to follow progress from another device.</li>' +
          '</ul>' +
          '<p class="nota">Account setup requires two Supabase steps (create the table and turn off ' +
          'email confirmation). Existing progress will be kept and uploaded to the new account.</p>' +
          '<div class="acc" id="accModo"></div>';
        cuerpo.querySelector("#accModo").appendChild(
          J.ui.boton("Set up accounts", "btn-suave", function () {
            if (!confirm(
              "Para usar cuentas hacen falta dos pasos en Supabase.\n\n" +
              "If you already completed them, continue. Otherwise, the game cannot create " +
              "accounts yet.\n\nContinue?")) return;
            Alm.ponerModo("cuenta");
            irA("entrar");
          }));
        return;
      }

      var codigo = N.Auth.miCodigo();
      cuerpo.innerHTML =
        '<h3 class="panel-h3">Your family code</h3>' +
        '<p class="codigo-familia">' + U.esc(codigo || "—") + '</p>' +
        '<p class="nota">When you create a child account with this code, their ' +
        'progress will appear below. They cannot see yours, and you cannot ' +
        'change theirs — only view it. This is intentional: if adults could ' +
        'edit results, the data would no longer help decide what to ' +
        'practice.</p>' +
        '<h3 class="panel-h3">Create an account</h3>' +
        '<div class="crear-cuenta">' +
          '<input class="entrada" id="nu" placeholder="username (no spaces)" ' +
            'autocapitalize="none" autocorrect="off" maxlength="20">' +
          '<input class="entrada" id="nn" placeholder="display name" maxlength="14">' +
          '<input class="entrada" id="nc" placeholder="password (6+)" maxlength="40">' +
          '<label class="ajuste"><input type="checkbox" id="nv" checked> ' +
            'Link to my code so I can see their progress</label>' +
          '<p class="error" id="nerr" hidden></p>' +
        '</div>' +
        '<div class="acc" id="accCrear"></div>' +
        '<h3 class="panel-h3">Children in your care</h3>' +
        '<div id="chicos"><p class="nota">Loading…</p></div>';

      var nerr = cuerpo.querySelector("#nerr");
      cuerpo.querySelector("#accCrear").appendChild(
        J.ui.boton("Create account", "btn-primario", function () {
          var b = this;
          var u = cuerpo.querySelector("#nu").value.trim();
          var n = cuerpo.querySelector("#nn").value.trim();
          var c = cuerpo.querySelector("#nc").value;
          var v = cuerpo.querySelector("#nv").checked;
          nerr.hidden = true;

          if (!confirm(
            "You are about to create the account \"" + u + "\".\n\n" +
            "IMPORTANT: after creating it, this session will belong to the child. " +
            "You will need to sign in again with your own username.\n\n" +
            "If the child is not in your family, get permission from their parent first.\n\n" +
            "Continue?")) return;

          b.disabled = true; b.textContent = "Creating…";
          N.Auth.crear(u, c, n || u, v ? codigo : null).then(function (r) {
            if (r.ok) {
              Alm.olvidar();
              alert("Account created.\n\nUsername: " + u + "\nPassword: " + c +
                    "\n\nWrite it down. You are now signed into that account: set up the avatar " +
                    "and then log out to return to your own account.");
              return irA("avatar");
            }
            nerr.textContent = ERRORES[r.error] || r.error;
            nerr.hidden = false;
            b.disabled = false; b.textContent = "Create account";
          });
        }));

      N.Auth.misChicos().then(function (lista) {
        var cont = cuerpo.querySelector("#chicos");
        if (!cont) return;
        if (!lista.length) {
          cont.innerHTML = '<p class="nota">No children are linked yet.</p>';
          return;
        }
        cont.innerHTML = '<div class="jug-lista">' + lista.map(function (x) {
          var d = x.datos || {};
          var pal = d.palabras ? Object.keys(d.palabras).length : 0;
          var dom = d.palabras ? Object.keys(d.palabras).filter(function (p) {
            return d.palabras[p].verde >= 2 && d.palabras[p].ultima === "verde";
          }).length : 0;
          return '<div class="jug">' +
            '<span class="jug-av">' + N.Avatar.svg(d.jugador && d.jugador.avatar, 42) + '</span>' +
            '<span class="jug-info"><b>' + U.esc(x.nombre || x.usuario) + '</b>' +
            '<em>' + (d.esmeraldas || 0) + ' gems · ' + dom + ' of ' + pal +
            ' mastered words' +
            (x.actualizado ? ' · ' + new Date(x.actualizado).toLocaleDateString("en-US") : "") +
            '</em></span></div>';
        }).join("") + '</div>';
      });
    }

    function resumen(e) {
      var hoy = U.hoy();
      var sesHoy = e.sesiones.filter(function (s) {
        return U.fecha(s.t) === hoy;
      });
      var diag = e.diagnostico.resultados;
      var trad = e.traduccionesUsadas.slice(-40);

      cuerpo.innerHTML =
        '<div class="tarjetas">' +
          tarjeta("Gems", e.esmeraldas, "earned in total: " + e.esmeraldasGanadasTotal) +
          tarjeta("Streak", e.racha.dias + " days", "last played: " + (e.racha.ultimoDia || "—")) +
          tarjeta("Today", sesHoy.length + " levels",
                  sesHoy.reduce(function (s, x) { return s + (x.esmeraldas || 0); }, 0) + " gems") +
          tarjeta("Practice pace",
                  (e.destrezas["record-ppm"] ? e.destrezas["record-ppm"].mejor : "—") + " ppm",
                  "display rate; not a fluency score") +
        '</div>' +
        (e.diagnostico.hecho ?
          '<h3 class="panel-h3">Previous diagnostic</h3>' +
          '<div class="diag-tabla">' +
            DIAG.map(function (d) {
              var x = diag[d.id];
              var pct = x ? x.pct : null;
              var col = pct === null ? "" : pct >= 80 ? "verde" : pct >= 50 ? "amarillo" : "rojo";
              return '<div class="diag-fila"><span>' + U.esc(d.tit) + '</span>' +
                '<span class="diag-pct sem-' + col + '">' + (pct === null ? "—" : pct + "%") + '</span></div>';
            }).join("") + '</div>'
          : '<p class="nota">The previous diagnostic is not recorded. See new check-ins in Learning plan.</p>') +
        '<h3 class="panel-h3">Words translated</h3>' +
        (trad.length ?
          '<p class="nota">Directions translated. Using a translation by itself does not show a vocabulary difficulty.</p>' +
          '<ul class="lista-simple">' + trad.slice(-12).reverse().map(function (t) {
            return '<li>' + U.esc(t.texto.slice(0, 90)) + '</li>';
          }).join("") + '</ul>'
          : '<p class="nota">No translations used yet.</p>');
    }

    function tarjeta(t, v, s) {
      return '<div class="tarjeta"><span class="tarjeta-et">' + t + '</span>' +
        '<span class="tarjeta-v">' + v + '</span>' +
        '<span class="tarjeta-s">' + U.esc(s) + '</span></div>';
    }

    function destrezas(e) {
      var ids = Object.keys(e.destrezas).filter(function (k) { return k !== "record-ppm"; });
      if (!ids.length) return cuerpo.innerHTML = '<p class="nota">No data yet.</p>';
      ids.sort(function (a, b) {
        var A = Pro.resumenDestreza(a), B = Pro.resumenDestreza(b);
        return (A.pct === null ? 999 : A.pct) - (B.pct === null ? 999 : B.pct);
      });
      cuerpo.innerHTML =
        '<p class="nota">Ordenado de peor a mejor: lo de arriba es donde hay que practice.</p>' +
        '<div class="destrezas">' + ids.map(function (id) {
          var r = Pro.resumenDestreza(id);
          var col = r.pct === null ? "" : r.pct >= 80 ? "verde" : r.pct >= 50 ? "amarillo" : "rojo";
          return '<div class="destreza">' +
            '<span class="destreza-id">' + U.esc(id) + '</span>' +
            '<div class="destreza-barra"><div class="destreza-relleno sem-fondo-' + col +
              '" style="width:' + (r.pct || 0) + '%"></div></div>' +
            '<span class="destreza-n">' + (r.pct === null ? "—" : r.pct + "%") +
              ' <em>(' + r.intentos + ')</em></span></div>';
        }).join("") + '</div>';
    }

    function palabras(e) {
      var todas = Object.keys(e.palabras);
      if (!todas.length) return cuerpo.innerHTML = '<p class="nota">No words yet.</p>';
      var dominadas = Pro.dominadas();
      var cuesta = Pro.paraRepasar(30);
      cuerpo.innerHTML =
        '<h3 class="panel-h3">Needs more practice (' + cuesta.length + ')</h3>' +
        '<div class="chips">' + cuesta.map(function (p) {
          var w = e.palabras[p];
          return '<span class="chip chip-' + (w.ultima || "rojo") + '" data-p="' + U.esc(p) + '">' +
            U.esc(p) + '</span>';
        }).join("") + '</div>' +
        '<h3 class="panel-h3">Lectura observada en varios days (' + dominadas.length + ')</h3>' +
        '<div class="chips">' + dominadas.map(function (p) {
          return '<span class="chip chip-verde">' + U.esc(p) + '</span>';
        }).join("") + '</div>' +
        '<p class="nota">Tap a word he struggled with to correct the result if you heard him say it correctly.</p>';
      cuerpo.querySelectorAll(".chips .chip[data-p]").forEach(function (c) {
        c.addEventListener("click", function () {
          if (!confirm('Mark "' + c.dataset.p + '" as correct?')) return;
          Pro.registrarPalabra(c.dataset.p, "verde", null, "correccion-historica");
          pintarTab("palabras");
        });
      });
    }

    function premios(e) {
      cuerpo.innerHTML =
        '<h3 class="panel-h3">Available rewards</h3>' +
        '<div class="premios-edit" id="pe"></div>' +
        '<div class="acc" id="accPremio"></div>' +
        '<h3 class="panel-h3">Reward requests</h3>' +
        (e.canjes.length ?
          '<ul class="lista-simple">' + e.canjes.slice().reverse().map(function (c, i) {
            return '<li>' + new Date(c.t).toLocaleDateString("en-US") + ' — ' + U.esc(c.premio) +
              ' (' + c.costo + ') ' + (c.entregado ? "✓ delivered" : "· pending") + '</li>';
          }).join("") + '</ul>'
          : '<p class="nota">None yet.</p>');

      var pe = cuerpo.querySelector("#pe");
      e.premios.forEach(function (p, i) {
        var d = document.createElement("div");
        d.className = "premio-edit";
        d.innerHTML =
          '<input class="entrada" value="' + U.esc(p.nombre) + '" data-c="nombre">' +
          '<input class="entrada entrada-num" type="number" value="' + p.costo + '" data-c="costo">';
        var bq = document.createElement("button");
        bq.className = "btn btn-fantasma";
        bq.textContent = "Remove";
        bq.addEventListener("click", function () {
          var e2 = Alm.leer(); e2.premios.splice(i, 1); Alm.guardar(); pintarTab("premios");
        });
        d.appendChild(bq);
        d.querySelectorAll("input").forEach(function (inp) {
          inp.addEventListener("change", function () {
            var e2 = Alm.leer();
            if (inp.dataset.c === "costo") e2.premios[i].costo = parseInt(inp.value, 10) || 0;
            else e2.premios[i].nombre = inp.value;
            Alm.guardar();
          });
        });
        pe.appendChild(d);
      });

      cuerpo.querySelector("#accPremio").appendChild(
        J.ui.boton("+ Add reward", "btn-suave", function () {
          var nom = prompt("Reward name:");
          if (!nom) return;
          var c = parseInt(prompt("How many gems does it cost?", "100"), 10);
          if (!c) return;
          var e2 = Alm.leer();
          e2.premios.push({ id: "r" + Date.now(), nombre: nom, costo: c, emoji: "🎁" });
          Alm.guardar(); pintarTab("premios");
        }));
    }

    function ajustes(e) {
      var voces = Voz.listaVoces(), vozActual = Voz.vozPreferida();
      cuerpo.innerHTML =
        '<div class="ajustes">' +
          '<label class="ajuste"><input type="checkbox" id="aVoz"' +
            (e.ajustes.voz ? " checked" : "") + '> Speech enabled</label>' +
          '<label class="ajuste"><input type="checkbox" id="aAdulto"' +
            (e.ajustes.modoAdulto ? " checked" : "") +
            '> Adult scoring: I check pronunciation (more reliable than the microphone)</label>' +
        '</div>' +
        '<h3 class="panel-h3">Speech voice</h3>' +
        '<p class="nota">Natural English voices sound best. Available voices depend on this device.</p>' +
        '<label>Choose an English voice <select id="aSpeechVoice">' +
          (voces.length ? voces.map(function (v) { return '<option value="' + U.esc(v.name) + '"' + (v.name === vozActual ? ' selected' : '') + '>' + U.esc(v.name) + ' (' + U.esc(v.lang) + ')</option>'; }).join("") : '<option value="">No English voice found</option>') +
        '</select></label><div id="aVoicePreview" class="acc"></div>' +
        '<h3 class="panel-h3">Device status</h3>' +
        '<ul class="lista-simple">' +
          '<li>Microphone: ' + (Voz.hayMicrofono ? "available" : "not available") + '</li>' +
          '<li>English voice: ' + (Voz.hayVozInglesa() ? "available" : "not available") +
            (Voz.hayVozInglesa() && !Voz.esUS() ? " — <b>not US English; install English (United States)</b>" : "") + '</li>' +
          '<li>Cloud sync: ' + (Alm.esPrueba()
            ? "<b>off — TEST MODE</b>"
            : Alm.hayNube() ? "on" : "not configured") + '</li>' +
        '</ul>' +
        '<h3 class="panel-h3">Data</h3>' +
        '<div class="acc" id="accData"></div>';

      cuerpo.querySelector("#aVoz").addEventListener("change", function () {
        var e2 = Alm.leer(); e2.ajustes.voz = this.checked; Alm.guardar();
      });
      cuerpo.querySelector("#aSpeechVoice").addEventListener("change", function () { Voz.seleccionarVoz(this.value); });
      cuerpo.querySelector("#aVoicePreview").appendChild(J.ui.boton("▶ Preview voice", "btn-suave", function () {
        var e2 = Alm.leer(); e2.ajustes.voz = true; Alm.guardar(); cuerpo.querySelector("#aVoz").checked = true;
        Voz.decir("Hi, Gaby! Let's read, solve, and explore together.", { rate: 0.93, pitch: 1.02 });
      }));
      cuerpo.querySelector("#aAdulto").addEventListener("change", function () {
        var e2 = Alm.leer(); e2.ajustes.modoAdulto = this.checked; Alm.guardar();
      });

      var accD = cuerpo.querySelector("#accData");
      accD.appendChild(J.ui.boton("Download progress backup", "btn-suave", function () {
        var blob = new Blob([Alm.exportar()], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "progreso-gabriel-" + U.hoy() + ".json";
        a.click();
      }));
      accD.appendChild(J.ui.boton("Take the diagnostic again", "btn-suave", function () {
        if (!confirm("Take the diagnostic again? Previous results will be kept.")) return;
        global.APRENDIZAJE.create(Alm.leer(), Alm.guardar).start("revision");
        irA("introDiag");
      }));
      accD.appendChild(J.ui.boton("Delete all progress", "btn-fantasma", function () {
        if (!confirm("Delete ALL progress? This cannot be undone.")) return;
        Alm.reiniciar(); irA("casa");
      }));
      if (Alm.modo() === "cuenta") {
        accD.appendChild(J.ui.boton("Log out", "btn-fantasma", function () {
          if (!confirm("Log out and return to the sign-in screen?")) return;
          N.Auth.salir().then(function () {
            Alm.olvidar();
            irA("entrar");
          });
        }));
      }
    }
  };

  /* ==========================================================================
     ARRANQUE
     ======================================================================== */

  /* Aviso permanente de modo prueba. Tiene que ser imposible de confundir:
     si el papá cree que está jugando en serio y no lo está, el diagnóstico
     que yo lea después va a estar vacío y no vamos a entender por qué. */
  function bannerPrueba() {
    var b = document.createElement("div");
    b.className = "banner-prueba";
    b.innerHTML =
      '<span class="bp-tag">TEST MODE</span>' +
      '<span class="bp-txt">Progress will not be saved</span>';
    var x = document.createElement("button");
    x.className = "bp-btn";
    x.textContent = "Delete and exit";
    x.addEventListener("click", function () {
      if (!confirm("Delete the test game and return to the live game?")) return;
      Alm.borrarPrueba();
      location.href = location.pathname;
    });
    b.appendChild(x);
    document.body.insertBefore(b, document.body.firstChild);
  }

  function arrancar() {
    app = document.getElementById("app");
    hud = document.getElementById("hud");
    if (Alm.esPrueba()) { bannerPrueba(); return rutear(); }

    var m = Alm.modo();
    if (m === "local") return rutear();          // un jugador, sin cuenta
    if (m !== "cuenta") return irA("bienvenida"); // primera vez: que elija

    app.innerHTML = '<p class="cargando">Loading…</p>';
    N.Auth.restaurar().then(function () {
      if (!N.Auth.haySesion()) return irA("entrar");
      Alm.adoptarRemoto();   // si otro aparato tiene más avance, se toma ese
      rutear();
    });
  }

  /* a dónde va alguien que ya entró */
  function rutear() {
    var e = Alm.leer();
    if (!e.jugador.avatar) irA("avatar");
    else if (global.AVENTURA.needsInitial()) irA("introDiag");
    else irA("casa");
  }

  global.AVENTURA.install(pantallas, irA);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else { arrancar(); }

  global.APP = { irA: function (n, d) { irA(n, d); } };

})(window);
