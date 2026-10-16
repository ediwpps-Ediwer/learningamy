/* ============================================================================
   ICONOS — set de píxeles propio, en el mismo idioma visual que el avatar
   ----------------------------------------------------------------------------
   Reemplaza a los emoji. El motivo no es estético: un emoji es arte de otro y
   **se dibuja distinto en cada aparato** — el de Google en la tablet Android,
   el de Apple en el iPad. Mezclado con pixel art hecho a mano, eso es lo que
   más hacía que el juego se leyera como armado rápido en vez de diseñado.

   Cada ícono es una grilla de 8×8 donde cada letra es un color de la paleta.
   Un solo dibujante los pinta a todos, así que agregar uno es una línea.
   ========================================================================== */

(function (global) {
  "use strict";

  var P = {
    ".": null,
    K: "#141829",  // sombra
    S: "#9aa3ad",  // piedra
    s: "#5f6b7c",  // piedra oscura
    B: "#8a5a2a",  // madera
    b: "#5f3f1e",  // madera oscura
    G: "#3f8a3f",  // hoja
    g: "#4fae4f",  // hoja clara
    E: "#2ee6a0",  // esmeralda
    e: "#7df5c6",  // esmeralda clara
    A: "#ffb03a",  // antorcha
    a: "#ffd66b",  // antorcha clara
    D: "#6ea8ff",  // diamante
    d: "#9cc4ff",  // diamante claro
    R: "#ff6b5e",  // rojo
    W: "#eef1ff",  // papel
    w: "#aab3cc",  // papel gris
    Y: "#ffcc4d",  // amarillo
    P: "#b98cff"   // violeta
  };

  var G8 = {
    /* --- destrezas de lectura --- */
    puente: [            // Word bridge · lectura oral
      "........",
      "S......S",
      "S......S",
      "SAAAAAAS",
      "AAAAAAAA",
      "bb....bb",
      ".b....b.",
      ".b....b."],
    martillo: [          // Word workshop · dictado
      "........",
      "..SSSS..",
      ".SSSSSS.",
      "...BB...",
      "...BB...",
      "...BB...",
      "...bb...",
      "........"],
    auricular: [         // Listening grove · escucha
      "........",
      "..dddd..",
      ".d....d.",
      "d......d",
      "D......D",
      "DD....DD",
      "DD....DD",
      "........"],
    libro: [             // Story library · comprensión
      "........",
      ".BBBBBB.",
      ".BWWWWB.",
      ".BWwwWB.",
      ".BWWWWB.",
      ".BWwwWB.",
      ".BBBBBB.",
      "........"],
    letras: [            // Word families
      "........",
      ".AAAAAA.",
      ".AKKKKA.",
      ".AK..KA.",
      ".AKKKKA.",
      ".AK..KA.",
      ".AAAAAA.",
      "........"],

    /* --- destrezas de matemática --- */
    ladrillos: [         // Build a bridge · operaciones
      "........",
      ".ssssss.",
      ".s.ss.s.",
      ".ssssss.",
      ".s.ss.s.",
      ".ssssss.",
      "........",
      "........"],
    torre: [             // Block towers · valor posicional
      "...DD...",
      "...DD...",
      "..DDDD..",
      "..DDDD..",
      ".DDDDDD.",
      ".DDDDDD.",
      "DDDDDDDD",
      "........"],
    formas: [            // Shape garden · geometría
      "...E....",
      "..EEE...",
      ".EEEEE..",
      "........",
      ".YYYY...",
      ".YYYY...",
      ".YYYY...",
      "........"],
    grafica: [           // Weather station · gráficas
      "........",
      ".....DD.",
      "...DDDD.",
      "...DDDD.",
      ".DDDDDD.",
      ".DDDDDD.",
      "WWWWWWWW",
      "........"],
    calendario: [
      ".s....s.",
      "RRRRRRRR",
      "WWWWWWWW",
      "W.WW.WW.",
      "WWWWWWWW",
      "W.WW.WW.",
      "WWWWWWWW",
      "........"],
    reloj: [
      "..WWWW..",
      ".W....W.",
      "W..K...W",
      "W..KK..W",
      "W..K...W",
      "W......W",
      ".W....W.",
      "..WWWW.."],

    /* --- la aldea --- */
    arbol: [
      "..GGGG..",
      ".GGgGGG.",
      "GGGGGGGG",
      ".GGGGGG.",
      "..GGGG..",
      "...BB...",
      "...BB...",
      "..bbbb.."],
    casa: [
      "...RR...",
      "..RRRR..",
      ".RRRRRR.",
      "RRRRRRRR",
      ".WWWWWW.",
      ".W.DD.W.",
      ".W.DD.W.",
      ".WWWWWW."],
    carpa: [
      "...A....",
      "...AA...",
      "..AAAA..",
      "..AaAA..",
      ".AAaAAA.",
      ".AA..AA.",
      "AAA..AAA",
      "........"],
    faro: [
      "...A....",
      "..aAa...",
      "...A....",
      "..WWW...",
      "..WRW...",
      "..WWW...",
      ".WWWWW..",
      ".sssss.."],

    /* --- retos y recompensas --- */
    tilde: [
      "........",
      "......EE",
      ".....EE.",
      "E...EE..",
      "EE.EE...",
      ".EEE....",
      "..E.....",
      "........"],
    lapiz: [
      "......AA",
      ".....AaA",
      "....AAA.",
      "...AAA..",
      "..AAA...",
      ".WWA....",
      "KWW.....",
      "........"],
    mas: [
      "........",
      "...EE...",
      "...EE...",
      ".EEEEEE.",
      ".EEEEEE.",
      "...EE...",
      "...EE...",
      "........"],
    bandera: [
      "..A.....",
      "..ARRRR.",
      "..ARRRR.",
      "..ARRR..",
      "..A.....",
      "..A.....",
      "..A.....",
      ".sss...."],
    rayo: [
      "....YY..",
      "...YY...",
      "..YYYY..",
      ".YYYY...",
      "...YY...",
      "..YY....",
      ".YY.....",
      "........"],
    lupa: [
      "..WWW...",
      ".W...W..",
      "W.....W.",
      "W.....W.",
      ".W...W..",
      "..WWWS..",
      ".....SS.",
      "......SS"],
    esmeralda: [
      "...EE...",
      "..EeeE..",
      ".EeEEeE.",
      "EEEEEEEE",
      ".EEEEEE.",
      "..EEEE..",
      "...EE...",
      "........"],
    cofre: [
      "........",
      ".BBBBBB.",
      ".BaaaaB.",
      ".BBYBBB.",
      ".BaaaaB.",
      ".BaYaaB.",
      ".BBBBBB.",
      "........"],
    racha: [
      "...A....",
      "..AaA...",
      ".AaaaA..",
      ".AaaaA..",
      "AaaRaaA.",
      "AaRRRaA.",
      ".AaaaA..",
      "..AAA..."],
    adulto: [
      "..WWW...",
      ".W...W..",
      ".W...W..",
      "..WWW...",
      ".wwwww..",
      "wwwwwww.",
      "w.www.w.",
      "..www..."],
    mochila: [
      "..BBB...",
      ".BBBBB..",
      "BBBBBBB.",
      "BAAAAAB.",
      "BBBBBBB.",
      "BBAAABB.",
      "BBBBBBB.",
      ".bbbbb.."],
    mapa: [
      "WWW..WWW",
      "W.WWWW.W",
      "W.W..W.W",
      "W.W.RW.W",
      "W.WRRW.W",
      "W.W..W.W",
      "W.WWWW.W",
      "WWW..WWW"],
    camara: [
      "...SS...",
      ".SSSSSS.",
      "SSSSSSSS",
      "SS.DD.SS",
      "SS.DD.SS",
      "SSSSSSSS",
      ".SSSSSS.",
      "........"]
  };

  /* un alias por si el nombre que pide el código es el viejo */
  var ALIAS = {
    lectura: "puente", dictado: "martillo", escucha: "auricular",
    comprension: "libro", familias: "letras",
    operaciones: "ladrillos", numeros: "torre",
    graficas: "grafica", reading: "libro", math: "ladrillos",
    quest: "bandera", garden: "arbol", library: "casa",
    bridge: "puente", camp: "carpa"
  };

  function svg(nombre, tam) {
    var g = G8[nombre] || G8[ALIAS[nombre]] || G8.esmeralda;
    tam = tam || 32;
    var out = '<svg viewBox="0 0 8 8" width="' + tam + '" height="' + tam +
      '" shape-rendering="crispEdges" class="ico" aria-hidden="true" focusable="false">';
    for (var y = 0; y < g.length; y++) {
      var fila = g[y], x = 0;
      while (x < fila.length) {
        var c = fila[x];
        if (!P[c]) { x++; continue; }
        var ancho = 1;                       // junta píxeles iguales en un rect
        while (x + ancho < fila.length && fila[x + ancho] === c) ancho++;
        out += '<rect x="' + x + '" y="' + y + '" width="' + ancho +
               '" height="1" fill="' + P[c] + '"/>';
        x += ancho;
      }
    }
    return out + "</svg>";
  }

  /* ==========================================================================
     ESCENARIO — el horizonte del fondo
     El fondo era un plano con una grilla tenue: la superficie más grande de la
     pantalla, sin hacer nada, en un juego sobre construir una aldea.
     ======================================================================== */

  function horizonte() {
    return '<svg class="horizonte" viewBox="0 0 160 60" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect x="0" y="0" width="160" height="60" fill="#161b2e"/>' +
      // estrellas
      '<g fill="#2c3455">' +
      [[12,8],[31,5],[48,12],[67,6],[84,10],[103,4],[122,11],[141,7],[152,14],[22,16],[95,17]]
        .map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="1" height="1"/>'; }).join("") +
      '</g>' +
      // lomas lejanas
      '<path d="M0 42 L22 30 L44 42 L70 26 L96 42 L124 32 L160 44 L160 60 L0 60 Z" fill="#1d2440"/>' +
      // lomas cercanas
      '<path d="M0 50 L30 40 L58 50 L88 38 L118 50 L160 42 L160 60 L0 60 Z" fill="#243052"/>' +
      // pasto
      '<rect x="0" y="52" width="160" height="8" fill="#2f5a3a"/>' +
      '<rect x="0" y="52" width="160" height="2" fill="#3f7a4a"/>' +
      '</svg>';
  }

  global.ICONOS = { svg: svg, horizonte: horizonte, nombres: Object.keys(G8) };

})(window);
