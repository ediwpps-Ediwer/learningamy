/* Aventura personalizada: reutiliza los juegos y la economía de Block Quest. */
(function(g){
"use strict";
var N=g.NUCLEO,J=g.JUEGOS,D=g.DATOS,L=g.APRENDIZAJE,U=N.Util;
var route, generation=0;
function esc(v){return U.esc(String(v));}
function button(el,text,fn,cls){var b=J.ui.boton(text,cls||"btn-suave",fn);el.appendChild(b);return b;}
function engine(){
  var state=N.Almacen.leer();
  if(!state.aprendizaje)N.Almacen.respaldarAprendizaje();
  return L.create(state,function(){N.Almacen.guardar();N.Bus.emitir("esmeraldas",{total:state.esmeraldas,ganadas:0});});
}
function say(text){if(N.Almacen.leer().ajustes.voz)N.Voz.decir(text,{rate:.75});}
function shell(el,title,sub){
  el.innerHTML='<section class="pantalla aventura"><button class="volver" id="avback">← Home</button><div class="av-eyebrow">BLOCK QUEST · EXPLORER 1</div><h2 class="tit">'+esc(title)+'</h2><p class="sub">'+esc(sub||"")+'</p><div id="avbody"></div></section>';
  el.querySelector("#avback").onclick=function(){route("casa");};return el.querySelector("#avbody");
}
function error(el,e){el.innerHTML='<section class="pantalla"><h2>Necesitamos guardar un respaldo</h2><p>El progreso original sigue intacto. Liberá espacio de almacenamiento y volvé a abrir el juego.</p></section>';console.error(e);}
function home(container){
  var E;try{E=engine();}catch(e){return;}
  E.data.cycles.filter(function(c){return c.completed&&!c.paid;}).forEach(E.rewardCycle);
  var m=E.mission(),due=E.due();
  var box=document.createElement("section");box.className="av-home";
  box.innerHTML='<div class="av-eyebrow">YOUR VILLAGE</div><h2 class="tit-chico">A little adventure, every day</h2>'+
    '<p>Explore, learn and build. You can pause any time.</p>'+
    '<div class="av-village" aria-label="Your village">'+(E.data.buildings.length?E.data.buildings.slice(-12).map(function(b){return '<span title="'+esc(b.day)+'">'+({garden:"🌳",library:"🏠",bridge:"🌉"}[b.type])+'</span>';}).join(""):'<span>🏕️</span><span class="av-ghost">🌳</span><span class="av-ghost">🏠</span>')+'</div><div class="acc" id="av-home-actions"></div>'+
    '<p class="nota">School material review · Repaso del material disponible. Cada misión completada suma una construcción.</p>';
  container.insertBefore(box,container.querySelector(".mundos"));
  var acc=box.querySelector("#av-home-actions");
  if(due)button(acc,E.data.active?"Continue exploring →":due==="inicial"?"Explore what you know →":"Explorer check-in →",function(){route("introDiag");},"btn-primario btn-grande");
  button(acc,m.paid?"Visit your village →":m.steps.some(function(s){return s.done;})?"Continue today's mission →":"Today's mission →",function(){route("aventura");},due?"btn-suave":"btn-primario btn-grande");
  button(acc,"🗺️ Explore Block Quest",function(){route("explorar");},"btn-suave");
  button(acc,"🎒 Activity backpack",function(){route("mochila");},"btn-suave");
  if(!due){var p=document.createElement("p");p.className="nota";p.textContent="Next check-in · "+E.nextDate();box.appendChild(p);}
}
function intro(el){
  var E;try{E=engine();}catch(e){return error(el,e);}
  var kind=E.due()||"revision";
  var body=shell(el,kind==="inicial"?"Explore your world":"Explorer check-in","Short games help us choose your next adventure.");
  var cycle=E.data.active?E.start():null;
  var skills=cycle?cycle.skills:kind==="semanal"?E.priorities("reading").slice(0,2).concat(E.priorities("math").slice(0,1)):Object.keys(L.skills);
  body.innerHTML='<div class="av-stations">'+skills.map(function(k){var s=L.skills[k];return '<div class="av-station"><span>'+s.icon+'</span><strong>'+s.en+'</strong></div>';}).join("")+'</div>'+
    '<p class="nota">Podés pausar después de cada respuesta. La lectura en voz alta se comprueba con un adulto; si no está, queda pendiente y podés seguir.</p>'+
    '<p class="nota">'+(kind==="semanal"?"Chequeo breve: aproximadamente 5–8 minutos.":"Aventura en bloques: repartila en varias entradas si hace falta.")+'</p><div class="acc" id="av-start"></div>';
  var acc=body.querySelector("#av-start");
  button(acc,cycle?"Continue →":"Let's explore →",function(){E.start(kind);route("diag");},"btn-primario btn-grande");
  button(acc,"Play and explore later",function(){route("casa");},"btn-fantasma");
  say("Explore your world. You can pause any time.");
}
function drawQuestion(el,q,done,teaching){
  var guard=generation, locked=false,help=!!teaching||!!(q.supports&&q.supports.length), heard=q.skill!=="escucha";
  var card=document.createElement("div");card.className="av-question";el.appendChild(card);
  var title=document.createElement("h3");title.className="av-prompt";title.textContent=q.prompt;card.appendChild(title);
  var media=document.createElement("div");media.className="av-media";card.appendChild(media);
  if(q.kind==="oral"){media.innerHTML='<div class="palabra-grande">'+esc(q.word)+'</div>';}
  if(q.story&&q.skill==="comprension"){var p=document.createElement("p");p.className="av-story";p.textContent=q.story;media.appendChild(p);}
  if(q.blocks){
    media.innerHTML='<div class="av-blocks" aria-label="'+esc(q.prompt)+'">'+
      '<span>'+('▦ '.repeat(q.blocks.hundreds))+'</span><span>'+('▥ '.repeat(q.blocks.tens))+'</span><span>'+('■ '.repeat(q.blocks.ones))+'</span></div>';
  }
  if(q.shape){
    var points={triangle:"100,15 185,175 15,175",square:"30,30 170,30 170,170 30,170",pentagon:"100,12 185,78 155,178 45,178 15,78",hexagon:"55,20 145,20 190,100 145,180 55,180 10,100"};
    media.innerHTML='<svg viewBox="0 0 200 200" class="av-shape" role="img" aria-label="Shape to explore"><polygon points="'+points[q.shape]+'" fill="#6ea8ff" stroke="#eef1ff" stroke-width="5"/></svg>';
  }
  if(q.graph){media.innerHTML='<div class="av-graph"><p>One block = one item</p>'+q.graph.map(function(b){return '<div class="av-bar-row"><strong>'+esc(b.label)+'</strong><div class="av-bar" style="--blocks:'+b.value+'">'+Array(b.value).fill('<span></span>').join("")+'</div></div>';}).join("")+'</div>';}
  var tools=document.createElement("div");tools.className="acc";card.appendChild(tools);
  function markHelp(kind){help=true;q.supports=q.supports||[];if(q.supports.indexOf(kind)<0)q.supports.push(kind);N.Almacen.guardar();}
  function audio(text,marksHelp){if(marksHelp)markHelp("modelo-audio");say(text);}
  if(q.kind==="spell")button(tools,"🔊 Listen to the word",function(){audio(q.word,false);},"btn-primario");
  else if(q.skill==="escucha") {
    button(tools,"🔊 Listen to the story",function(){
      if(!N.Voz.hayVozInglesa()){note.textContent="No hay voz inglesa disponible. Un adulto puede leer el cuento con el botón de abajo.";return;}
      heard=true;audio(q.story,false);
    },"btn-primario");
    button(tools,"Adult: read the story",function(){
      var t=document.createElement("p");t.className="av-story";t.textContent=q.story;media.replaceChildren(t);markHelp("texto-visible");heard=true;
      note.textContent="Texto visible: esta respuesta quedará registrada con apoyo.";
    });
  } else button(tools,"🔊 Hear instructions",function(){audio(q.prompt,false);});
  if(q.skill==="comprension")button(tools,"🔊 Read the story to me",function(){audio(q.story,true);note.textContent="Listening support recorded · Se registra apoyo de audio."});
  if(q.kind==="oral")button(tools,"🔊 Hear this word",function(){audio(q.word,true);note.textContent="Model heard · Se registra el modelo como ayuda."});
  button(tools,"ES · Ayuda",function(){
    markHelp("idioma");note.textContent=L.skills[q.skill].es;
  });
  button(tools,"💡 Show a strategy",function(){
    markHelp("estrategia");note.textContent=L.skills[q.skill].ayuda;say(note.textContent);
    if(q.skill==="operaciones"){var p=document.createElement("p");p.className="av-numberline";p.textContent=Array.from({length:21},function(_,i){return i;}).join(" · ");media.appendChild(p);}
  });
  var note=document.createElement("p");note.className="nota";note.setAttribute("aria-live","polite");card.appendChild(note);
  var answers=document.createElement("div");answers.className="av-answers";card.appendChild(answers);
  function submit(result,evaluator,response){
    if(locked||guard!==generation)return;
    if(!heard&&result!==null){note.textContent="Listen to the story first. · Escuchá el cuento primero.";return;}
    locked=true;
    card.querySelectorAll("button,input").forEach(function(b){b.disabled=true;});
    var out=document.createElement("div");out.className="av-feedback";out.setAttribute("role","status");
    out.textContent=result===null?"Saved for another time. Keep exploring!":result?"Good work! Let's keep building.":"Let's learn together. "+(q.kind==="oral"?"Listen to a model, then try it another day.":"The answer is: "+q.answer);
    card.appendChild(out);
    if(result===false)button(out,"🔊 Listen",function(){say(q.kind==="oral"?q.word:String(q.answer));});
    // Guardar antes de Next: recargar o pausar nunca pierde una respuesta.
    done(result,help,evaluator,false,response);
    button(out,"Next →",function(){if(guard===generation)done(result,help,evaluator,true);},"btn-primario btn-grande");
  }
  if(q.kind==="oral"){
    var hint=document.createElement("p");hint.className="nota";hint.textContent="Un adulto escucha. Estos botones registran su observación, no una nota del micrófono.";answers.appendChild(hint);
    button(answers,"Adult: I am listening",function(){
      answers.innerHTML="";
      button(answers,"Read independently",function(){submit(true,"adulto");},"btn-primario");
      button(answers,"Read with help",function(){markHelp("adulto");submit(true,"adulto");});
      button(answers,"Not yet",function(){submit(false,"adulto");});
    });
  } else if(q.kind==="choice")q.options.forEach(function(option){button(answers,option,function(){submit(option===q.answer,"objetiva",option);},"opcion");});
  else {
    var form=document.createElement("form");form.className="av-input-form";
    var label=document.createElement("label");label.textContent=q.kind==="spell"?"Write the word":"Your answer";label.htmlFor="av-answer";form.appendChild(label);
    var input=document.createElement("input");input.id="av-answer";input.autocomplete="off";input.spellcheck=false;input.setAttribute("autocapitalize","off");input.setAttribute("autocorrect","off");input.inputMode=q.kind==="number"?"numeric":"text";form.appendChild(input);
    var check=document.createElement("button");check.type="submit";check.className="btn-primario";check.textContent="Check →";form.appendChild(check);
    form.onsubmit=function(ev){ev.preventDefault();var raw=input.value.trim().toLowerCase();if(!raw)return;
      if(q.kind==="number"&&!/^\d+$/.test(raw)){note.textContent="Write a number. · Escribí un número.";return;}
      submit(q.kind==="number"?Number(raw)===q.answer:raw===q.answer,"objetiva",raw);
    };answers.appendChild(form);
  }
  button(card,"Save for later",function(){submit(null,"sin-verificar");},"btn-fantasma");
  if(q.kind==="spell")say(q.word);else say(q.kind==="oral"?"Read this word aloud. Ask an adult to listen.":q.prompt);
}
function diagnostic(el){
  var E=engine(),c=E.data.cycles.find(function(x){return x.completed&&!x.paid;})||E.start();
  function paint(){
    if(c.completed){
      E.rewardCycle(c);
      var body=shell(el,"Your adventure is ready!","You explored new places. Now let's build.");
      body.innerHTML='<div class="av-celebrate">🗺️ ✨ 🏕️</div><p>+15 emeralds · Your answers help choose your next missions.</p><p class="nota">Las observaciones pendientes siguen pendientes. No son errores. El detalle queda en el panel de papá.</p>';
      button(body,"Start my mission →",function(){route("aventura");},"btn-primario btn-grande");return;
    }
    var q=c.questions[c.cursor],s=L.skills[q.skill];
    var body=shell(el,s.icon+" "+s.en,"Explore what you know. No timer.");
    var progress=document.createElement("p");progress.className="nota";progress.textContent=(c.cursor+1)+" / "+c.questions.length+" · You can pause and come back.";body.appendChild(progress);
    drawQuestion(body,q,function(result,help,by,next,response){
      if(next){route("diag", {cycle:c.id});return;}E.answer(result,help,by,response);
    },false);
  }
  // Al terminar, la navegación conserva el ciclo completado para mostrar el premio una vez.
  paint();
}
function mission(el){
  var E=engine(),m=E.mission();
  var body=shell(el,"Build your village","Four small steps. One new building. +20 emeralds.");
  var activeTask=m.task&&typeof m.task==="object"?m.task:null;
  body.innerHTML=(activeTask&&activeTask.objective?'<article class="av-ai-card"><b>'+esc(activeTask.title)+'</b><p>'+esc(activeTask.objective)+'</p></article>':'')+'<p class="nota">'+(m.provisional?"Ruta provisional: el diagnóstico todavía tiene observaciones pendientes.":"Ruta basada en las observaciones guardadas.")+'</p>'+
    '<div class="av-village">'+(E.data.buildings.length?E.data.buildings.slice(-12).map(function(b){return '<span>'+({garden:"🌳",library:"🏠",bridge:"🌉"}[b.type])+'</span>';}).join(""):"🏕️")+'</div><div id="av-steps" class="av-steps"></div>';
  var names={recordar:"Remember",aprender:"Learn",resolver:"Solve",demostrar:"Show what you learned"},next=m.steps.findIndex(function(s){return !s.done;});
  m.steps.forEach(function(s,i){
    var row=document.createElement("div");row.className="av-step"+(s.done?" av-done":"");
    row.innerHTML='<span class="av-step-icon">'+(s.done?"✓":L.skills[s.skill].icon)+'</span><div><strong>'+names[s.phase]+' · '+L.skills[s.skill].en+'</strong><p class="nota">'+esc(s.reason)+'</p></div>';
    var b=button(row,s.done?"Done":i===next?"Play →":"Later",function(){route("pasoAventura",{index:i});},i===next?"btn-primario":"btn-suave");b.disabled=s.done||i!==next;body.querySelector("#av-steps").appendChild(row);
  });
  if(next<0&&!m.paid){
    var rewards=document.createElement("div");rewards.className="av-build";rewards.innerHTML="<h3>Choose your new building</h3>";body.appendChild(rewards);
    [["garden","🌳 Garden"],["library","🏠 Library"],["bridge","🌉 Bridge"]].forEach(function(x){button(rewards,x[1],function(){E.build(x[0]);route("aventura");},"btn-primario");});
  }
  if(m.paid){var p=document.createElement("p");p.className="av-feedback";p.textContent="Your village grew! You can enjoy free play or come back tomorrow.";body.appendChild(p);}
  button(body,"Free play →",function(){route("casa");},"btn-fantasma");
}
function step(el,opts){
  var E=engine(),m=E.mission(),ix=opts.index,s=m.steps[ix];
  if(!s||s.done||ix!==m.steps.findIndex(function(x){return !x.done;}))return route("aventura");
  var spec=L.skills[s.skill],body=shell(el,spec.icon+" "+spec.en,s.phase==="aprender"?"Watch, practise, then try.":"Use what you know. You can ask for help.");
  var adapt=m.task&&typeof m.task==="object"&&m.task.adaptation, adaptedStep=adapt&&adapt.steps.find(function(x){return x.phase===s.phase;}),guide=null;
  if(adaptedStep){guide=document.createElement("p");guide.className="av-ai-card";guide.textContent=adaptedStep.instruction+" · "+adaptedStep.game;}
  if(s.phase==="aprender"||s.phase==="resolver"){
    body.innerHTML='<div class="av-lesson"><h3>Try a strategy</h3><p>'+esc(spec.ayuda)+'</p><p class="nota">'+esc(spec.es)+'</p></div><div id="av-practice"></div>';
    if(guide)body.insertBefore(guide,body.firstChild);
    button(body,"🔊 Hear the strategy",function(){say(spec.ayuda);});
    var host=body.querySelector("#av-practice"),cfg,game;
    if(s.skill==="dictado"){game="spelling";cfg={items:s.questions.map(function(q){return {p:q.word};})};}
    else if(s.skill==="lectura"){game="lecturaPalabras";cfg={items:s.questions.map(function(q){return {p:q.word};}),adulto:true};}
    else if(s.skill==="escucha"||s.skill==="comprension"){game="cuento";cfg={cuento:D.CUENTOS[0]};}
    else if(s.skill==="operaciones"){game="operaciones";cfg={cuantas:4,max:s.level===0?10:20};}
    else if(s.skill==="formas"){game="formas";cfg={rondas:4};}
    else if(s.skill==="graficas"){game="graficas";cfg={cuantas:3};}
    if(game){
      button(host,"Start practice →",function(){
        var guard=generation;
        E.expose(ix);host.innerHTML="";J[game].iniciar(host,cfg,function(){if(guard!==generation)return;E.finishPractice(ix);route("aventura");});
      },"btn-primario btn-grande");
      var p=document.createElement("p");p.className="nota";p.textContent="Práctica guiada con los juegos existentes. Completarla no certifica dominio; las comprobaciones se guardan por separado.";body.appendChild(p);return;
    }
  }
  if(guide)body.appendChild(guide);
  var q=s.questions[s.cursor];
  drawQuestion(body,q,function(result,help,by,next,response){
    if(next)return route(s.done?"aventura":"pasoAventura",{index:ix});
    E.answerMission(ix,result,help,by,response);
  },s.phase==="aprender"||s.phase==="resolver");
}
function reducirFoto(file,done){
  var fr=new FileReader(); fr.onload=function(){var img=new Image();img.onload=function(){var max=1400,w=img.width,h=img.height;if(w>max){h=Math.round(h*max/w);w=max;}var c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);done(c.toDataURL("image/jpeg",.72));};img.src=fr.result;};fr.readAsDataURL(file);
}
function panel(el){
  var E=engine(),a=E.data;
  el.innerHTML='<h3 class="panel-h3">Ruta y aprendizaje</h3><p class="nota">Versión Explorer 1. Las comprobaciones nuevas se separan del historial anterior y de los premios. No equivalen a un puntaje escolar.</p>'+
    '<p>Próximo chequeo: <b>'+esc(E.due()?"Disponible al entrar":E.nextDate()||"Inicial pendiente")+'</b></p>'+
    '<div class="av-report">'+Object.keys(L.skills).map(function(k){var s=E.summary(k);return '<article><strong>'+L.skills[k].nombre+'</strong><p>'+s.status+'</p><p class="nota">'+s.n+' respuestas sin ayuda al nivel de actividad '+s.referenceLevel+' · '+(s.pct===null?"sin porcentaje":s.pct+"%")+" · "+s.help+" con apoyo · "+s.pending+' sin verificar</p><p class="nota">Repaso: '+(a.reviews[k]?L.day(a.reviews[k].due):"por programar")+'</p></article>';}).join("")+'</div>'+
    '<h3 class="panel-h3">Chequeos conservados</h3><ul>'+a.cycles.map(function(c){return '<li>'+esc(c.type)+" · "+L.day(c.started)+" · "+c.cursor+"/"+c.questions.length+" · "+(c.completed?"terminado":"pausado")+'</li>';}).join("")+'</ul>'+
    '<h3 class="panel-h3">Tarea del día</h3><p class="nota">Sacá una foto o elegí una imagen. Podés guardarla para revisarla después del diagnóstico, o pedir una propuesta de adaptación. La foto y el resultado quedan en este dispositivo.</p><div class="av-task-upload"><label class="av-camera-btn" for="av-photo">📷 Tomar foto o elegir imagen</label><input id="av-photo" type="file" accept="image/*" capture="environment" class="av-file-hidden"><img id="av-photo-preview" class="av-task-preview" alt="Vista previa de la tarea" hidden><label>Nombre breve <input id="av-task-title" maxlength="100" placeholder="Tarea de lectura"></label><label>Materia <select id="av-task-subject"><option value="reading">Reading</option><option value="math">Math</option></select></label><label>Foco para adaptar <select id="av-task-skill"><option value="">Elegir después del diagnóstico</option>'+Object.keys(L.skills).map(function(k){return '<option value="'+k+'">'+L.skills[k].nombre+'</option>';}).join("")+'</select></label><label>¿Qué pide la hoja? <textarea id="av-task-notes" maxlength="500" placeholder="Ej.: leer estas palabras y escribir 5 respuestas"></textarea></label><div id="av-task-status" class="nota" role="status"></div></div>'+
    '<h3 class="panel-h3">Material escolar</h3><p class="nota">Por ahora hay repaso del material recibido; no se supone que sea la tarea de esta semana.</p><label>Priorizar paquete <select id="av-task">'+L.tasks.map(function(t){return '<option value="'+t.id+'">'+t.nombre+'</option>';}).join("")+'</select></label><p id="av-task-info" class="nota"></p>'+
    '<label>Foco Reading <select id="av-read"><option value="">Según observaciones</option>'+Object.keys(L.skills).filter(function(k){return L.skills[k].mundo==="reading";}).map(function(k){return '<option value="'+k+'">'+L.skills[k].nombre+'</option>';}).join("")+'</select></label>'+
    '<label>Foco Math <select id="av-math"><option value="">Según observaciones</option>'+Object.keys(L.skills).filter(function(k){return L.skills[k].mundo==="math";}).map(function(k){return '<option value="'+k+'">'+L.skills[k].nombre+'</option>';}).join("")+'</select></label>'+
    '<p class="nota">Las prioridades nuevas se aplican a la próxima misión; la de hoy se conserva al recargar.</p>'+
    '<h3 class="panel-h3">Meta escolar (copiar del reporte)</h3><label>Prueba y materia <input id="av-test" maxlength="100"></label><label>Meta y unidad (puntaje final o puntos de crecimiento) <input id="av-target" maxlength="100"></label><label>Fecha objetivo <input type="date" id="av-target-date"></label><div id="av-parent-actions" class="acc"></div><p id="av-saved" role="status"></p>';
  var savedTask=a.task||{}; el.querySelector("#av-task-title").value=savedTask.title||""; el.querySelector("#av-task-subject").value=savedTask.subject||"reading"; el.querySelector("#av-task-skill").value=savedTask.skill||"";
  el.querySelector("#av-task-notes").value=savedTask.notes||"";
  var photo=N.Almacen.leerImagenTarea(); if(photo){var pv=el.querySelector("#av-photo-preview");pv.src=photo;pv.hidden=false;}
  el.querySelector("#av-photo").onchange=function(ev){var f=ev.target.files&&ev.target.files[0];if(!f)return;reducirFoto(f,function(data){var pv=el.querySelector("#av-photo-preview");pv.src=data;pv.hidden=false;pv.dataset.data=data;el.querySelector("#av-task-status").textContent="Foto lista. Guardá la tarea para conectarla con la próxima misión.";});};
  button(el.querySelector(".av-task-upload"),"Guardar tarea para revisar después",function(){var pv=el.querySelector("#av-photo-preview"),data=pv.dataset.data||photo;if(data)N.Almacen.guardarImagenTarea(data);L.setTask({title:el.querySelector("#av-task-title").value,subject:el.querySelector("#av-task-subject").value,skill:el.querySelector("#av-task-skill").value,notes:el.querySelector("#av-task-notes").value,imageKey:data?"local":null});el.querySelector("#av-task-status").textContent="Tarea guardada en este dispositivo. Podés volver después del diagnóstico para analizarla.";}, "btn-suave");
  var aiBox=document.createElement("section");aiBox.id="av-ai-result";aiBox.setAttribute("aria-live","polite");
  function showPlan(plan,applied){
    if(!plan)return;
    aiBox.innerHTML='<article class="av-ai-card"><h4>'+(applied?"Adaptación lista para la próxima misión":"Propuesta de adaptación · pendiente de tu aprobación")+'</h4><p><b>Tarea:</b> '+esc(plan.title)+'</p><p><b>Objetivo escolar:</b> '+esc(plan.objective)+'</p><p><b>Habilidad priorizada:</b> '+esc(L.skills[plan.skill]?L.skills[plan.skill].nombre:plan.skill)+'</p><p><b>Práctica sugerida:</b> '+esc(String(plan.difficulty))+' · orientación de práctica, no es un puntaje escolar</p><h5>Así se convertirá en juego</h5><ol>'+plan.steps.map(function(x){return '<li><b>'+esc(x.phase)+'</b>: '+esc(x.instruction)+' <span class="nota">Juego: '+esc(x.game)+'</span></li>';}).join("")+'</ol><p><b>Comprobación con la tarea original:</b> '+plan.transfer.map(esc).join(" · ")+'</p><p class="nota"><b>Para revisar como adulto:</b> '+esc(plan.adultCheck)+(plan.uncertain.length?" · Dudas: "+plan.uncertain.map(esc).join(" · "):"")+'</p></article>';
    if(!applied)button(aiBox,"Aprobar y usar en la próxima misión",function(){var current=E.data.task||{};L.setTask({title:plan.title,subject:plan.subject,skill:plan.skill,objective:plan.objective,notes:current.notes,imageKey:current.imageKey,analysis:null,adaptation:plan});showPlan(plan,true);el.querySelector("#av-task-status").textContent="Adaptación guardada. La próxima misión usará este plan y el panel conservará el detalle para vos.";},"btn-primario");
  }
  if(savedTask.analysis)showPlan(savedTask.analysis,false);else if(savedTask.adaptation)showPlan(savedTask.adaptation,true);
  button(el.querySelector(".av-task-upload"),"Analizar tarea con IA",async function(ev){
    var btn=ev.currentTarget,pv=el.querySelector("#av-photo-preview"),image=pv.dataset.data||photo;
    if(!image){el.querySelector("#av-task-status").textContent="Primero sacá una foto o elegí una imagen.";return;}
    L.setTask({title:el.querySelector("#av-task-title").value,subject:el.querySelector("#av-task-subject").value,skill:el.querySelector("#av-task-skill").value,notes:el.querySelector("#av-task-notes").value,imageKey:"local"});
    if(image)N.Almacen.guardarImagenTarea(image);a=E.data;
    btn.disabled=true;el.querySelector("#av-task-status").textContent="La IA está leyendo la tarea y comparándola con las observaciones del diagnóstico…";
    try{
      var diagnostic=Object.keys(L.skills).map(function(k){var x=E.summary(k);return {skill:k,level:x.referenceLevel,status:x.status};});
      var response=await fetch("/api/adaptar-tarea",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:image,task:{title:el.querySelector("#av-task-title").value,subject:el.querySelector("#av-task-subject").value,skill:el.querySelector("#av-task-skill").value,notes:el.querySelector("#av-task-notes").value},diagnostic:diagnostic})});
      var result=await response.json();if(!response.ok)throw new Error(result.message||result.error||"No se pudo analizar la tarea.");
      var plan=result.adaptation,current=E.data.task||{};L.setTask({title:current.title,subject:current.subject,skill:current.skill,objective:current.objective,notes:current.notes,imageKey:current.imageKey,analysis:plan,adaptation:current.adaptation});showPlan(plan,false);
      el.querySelector("#av-task-status").textContent="Análisis listo y guardado. Revisá el plan abajo; solo se usará en el juego cuando lo apruebes.";
    }catch(err){el.querySelector("#av-task-status").textContent=err.message==="ai_not_configured"?"La función está publicada, pero falta guardar OPENAI_API_KEY como secreto en Netlify.":err.message||"No se pudo conectar con la IA.";}
    finally{btn.disabled=false;}
  }, "btn-suave");
  el.querySelector(".av-task-upload").appendChild(aiBox);
  el.querySelector("#av-task").value=a.settings.task;
  el.querySelector("#av-read").value=a.settings.reading[0]||"";
  el.querySelector("#av-math").value=a.settings.math[0]||"";
  function info(){var t=L.tasks.find(function(x){return x.id===el.querySelector("#av-task").value;});el.querySelector("#av-task-info").textContent=t.fecha+" · "+t.origen+". "+t.objetivo+". "+t.cambios;}
  info();el.querySelector("#av-task").onchange=info;
  el.querySelector("#av-test").value=a.targets.test||"";el.querySelector("#av-target").value=a.targets.target||"";el.querySelector("#av-target-date").value=a.targets.date||"";
  var acc=el.querySelector("#av-parent-actions");
  button(acc,"Guardar prioridades y meta",function(){
    a.settings.task=el.querySelector("#av-task").value;
    a.settings.reading=[el.querySelector("#av-read").value].filter(Boolean);a.settings.math=[el.querySelector("#av-math").value].filter(Boolean);
    a.targets={test:el.querySelector("#av-test").value.trim(),target:el.querySelector("#av-target").value.trim(),date:el.querySelector("#av-target-date").value};
    N.Almacen.guardar();el.querySelector("#av-saved").textContent="Guardado. La meta escolar no se calcula a partir del juego.";
  },"btn-primario");
  button(acc,"Nueva revisión (conserva anteriores)",function(){E.start("revision");route("introDiag");});
  button(acc,"Descargar respaldo anterior",function(){
    var txt=N.Almacen.respaldoAprendizaje();if(!txt){el.querySelector("#av-saved").textContent="No hay respaldo anterior en este dispositivo.";return;}
    var url=URL.createObjectURL(new Blob([txt],{type:"application/json"})),link=document.createElement("a");link.href=url;link.download="blockquest-antes-explorer.json";link.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  });
}
g.AVENTURA={
  install:function(screens,navigate){
    route=navigate;screens.introDiag=intro;
    screens.diag=function(el,opts){
      if(opts&&opts.cycle){var E=engine(),c=E.data.cycles.find(function(x){return x.id===opts.cycle;});if(c&&c.completed){
        E.rewardCycle(c);var b=shell(el,"Your adventure is ready!","Your answers help choose your next missions.");
        b.innerHTML='<div class="av-celebrate">🗺️ ✨ 🏕️</div><p>+15 emeralds. Your observations are saved.</p>';button(b,"Start my mission →",function(){route("aventura");},"btn-primario btn-grande");return;
      }}diagnostic(el);
    };
    screens.aventura=mission;screens.pasoAventura=step;
  },
  home:home,panel:panel,needsInitial:function(){try{return !engine().data.cycles.some(function(c){return c.completed;});}catch(e){return true;}},
  cancel:function(){generation++;if(g.speechSynthesis)g.speechSynthesis.cancel();}
};
})(window);
