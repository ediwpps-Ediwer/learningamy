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
  el.innerHTML='<section class="pantalla aventura"><button class="volver" id="avback">← Home</button><div class="av-eyebrow">LEARNING GAME · EXPLORER 1</div><h2 class="tit">'+esc(title)+'</h2><p class="sub">'+esc(sub||"")+'</p><div id="avbody"></div></section>';
  el.querySelector("#avback").onclick=function(){route("casa");};return el.querySelector("#avbody");
}
function error(el,e){el.innerHTML='<section class="pantalla"><h2>We could not save your progress</h2><p>Your original progress is safe. Free up storage space, then reopen the game.</p></section>';console.error(e);}
function home(container){
  var E;try{E=engine();}catch(e){return;}
  E.data.cycles.filter(function(c){return c.completed&&!c.paid;}).forEach(E.rewardCycle);
  var m=E.mission(),due=E.due();
  var box=document.createElement("section");box.className="av-home";
  box.innerHTML='<div class="av-eyebrow">YOUR VILLAGE</div><h2 class="tit-chico">A little adventure, every day</h2>'+
    '<p>Explore, learn and build. You can pause any time.</p>'+
    '<div class="av-village" aria-label="Your village">'+(E.data.buildings.length?E.data.buildings.slice(-12).map(function(b){return '<span title="'+esc(b.day)+'">'+({garden:"🌳",library:"🏠",bridge:"🌉"}[b.type])+'</span>';}).join(""):'<span>🏕️</span><span class="av-ghost">🌳</span><span class="av-ghost">🏠</span>')+'</div><div class="acc" id="av-home-actions"></div>'+
    '<p class="nota">School-material review. Every completed mission adds a building.</p>';
  container.insertBefore(box,container.querySelector(".mundos"));
  var acc=box.querySelector("#av-home-actions");
  if(due)button(acc,E.data.active?"Continue exploring →":due==="inicial"?"Explore what you know →":"Explorer check-in →",function(){route("introDiag");},"btn-primario btn-grande");
  button(acc,m.paid?"Visit your village →":m.steps.some(function(s){return s.done;})?"Continue today's mission →":"Today's mission →",function(){route("aventura");},due?"btn-suave":"btn-primario btn-grande");
  button(acc,"🗺️ Explore Learning Game",function(){route("explorar");},"btn-suave");
  button(acc,"🎒 Activity backpack",function(){route("mochila");},"btn-suave");
  if(!due){var p=document.createElement("p");p.className="nota";p.textContent="Next check-in · "+E.nextDate();box.appendChild(p);}
}
function intro(el){
  var E;try{E=engine();}catch(e){return error(el,e);}
  var kind=E.due()||"revision";
  var body=shell(el,kind==="inicial"?"Explore your world":"Explorer check-in","Short games help us choose your next adventure.");
  var cycle=E.data.active?E.start():null;
  var skills=cycle?cycle.skills:kind==="semanal"?E.priorities("reading").slice(0,2).concat(E.priorities("math").slice(0,1)):Object.keys(L.skills);
  body.innerHTML='<p class="nota av-diagnostic-label">PLAY A SKILL · Choose a picture to start that game, or use Continue for the suggested order.</p><div class="av-stations">'+skills.map(function(k){var s=L.skills[k],r=E.summary(k);return '<button type="button" class="av-station" data-skill="'+k+'"><span>'+s.icon+'</span><strong>'+s.en+'</strong><small>'+(s.mundo==="math"?"MATH":"READING · LISTENING")+' · '+(r.pct===null?"Start game":("Level "+(r.level+1)+" · "+r.status))+ '</small><em>Play →</em></button>';}).join("")+'</div>'+
    '<p class="nota">Each game records observations and adjusts the next level. You can pause after any answer. The map and activity backpack keep the selected games available.</p>'+
    '<p class="nota">'+(kind==="semanal"?"Quick progress check: about 2–4 minutes. Then keep playing your learning activities.":"This adventure comes in short parts. You can finish it over a few visits.")+'</p><div class="acc" id="av-start"></div>';
  var acc=body.querySelector("#av-start");
  body.querySelectorAll("[data-skill]").forEach(function(b){b.addEventListener("click",function(){var c=E.data.active||E.start(kind),ix=c.questions.findIndex(function(q){return q.skill===b.dataset.skill;});if(ix>=0){c.cursor=ix;N.Almacen.guardar();route("diag",{cycle:c.id});}});});
  button(acc,cycle?"Continue →":"Let's explore →",function(){E.start(kind);route("diag");},"btn-primario btn-grande");
  button(acc,"Play and explore later",function(){route("casa");},"btn-fantasma");
  say("Explore your world. You can pause any time.");
}
function drawQuestion(el,q,done,teaching){
  var guard=generation, locked=false,help=!!teaching||!!(q.supports&&q.supports.length), heard=q.skill!=="escucha";
  var card=document.createElement("div");card.className="av-question";el.appendChild(card);
  var title=document.createElement("h3");title.className="av-prompt";title.textContent=q.prompt;card.appendChild(title);
  var artTitle={lectura:"Word Reading",dictado:"Spelling",escucha:"Story",comprension:"Story",operaciones:"Math Facts",numeros:"Number Blocks",formas:"Shapes",graficas:"Graphs"}[q.skill]||"Word Reading";
  var art=document.createElement("div");art.innerHTML=J.ui.ilustracion(artTitle);card.appendChild(art.firstChild);
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
      if(!N.Voz.hayVozInglesa()){note.textContent="No English voice is available. An adult can read the story using the button below.";return;}
      heard=true;audio(q.story,false);
    },"btn-primario");
    button(tools,"Adult: read the story",function(){
      var t=document.createElement("p");t.className="av-story";t.textContent=q.story;media.replaceChildren(t);markHelp("texto-visible");heard=true;
      note.textContent="Text is visible. This answer will be recorded as supported.";
    });
  } else button(tools,"🔊 Hear instructions",function(){audio(q.prompt,false);});
  if(q.skill==="comprension")button(tools,"🔊 Read the story to me",function(){audio(q.story,true);note.textContent="Audio support recorded."});
  if(q.kind==="oral")button(tools,"🔊 Hear this word",function(){audio(q.word,true);note.textContent="Audio model recorded as help."});
  button(tools,"ES · Spanish hint",function(){
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
    if(!heard&&result!==null){note.textContent="Listen to the story first.";return;}
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
    var hint=document.createElement("p");hint.className="nota";hint.textContent="An adult listens. These buttons record their observation, not the microphone result.";answers.appendChild(hint);
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
      if(q.kind==="number"&&!/^\d+$/.test(raw)){note.textContent="Write a number.";return;}
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
      body.innerHTML='<div class="av-celebrate">🗺️ ✨ 🏕️</div><p>+15 gems · Your answers help choose your next missions.</p><p class="nota">Some observations are still unverified. They are not errors. See details in the Parent Dashboard.</p>';
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
function missionReason(r){var t={"Repaso programado":"Scheduled review","Falta observar esta habilidad":"This skill needs more observations","Por observar":"More observations needed","Consolidando":"Building consistency","Transferencia observada":"Transfer observed","Práctica guiada recomendada":"Guided practice recommended"};if(t[r])return t[r];if(r.indexOf("Observación reciente: ")===0)return "Recent observation: "+(t[r.slice(22).trim()]||r.slice(22).trim());return r;}
function mission(el){
  var E=engine(),m=E.mission();
  var body=shell(el,"Build your village","Four small steps. One new building. +20 gems.");
  var activeTask=m.task&&typeof m.task==="object"?m.task:null;
  body.innerHTML=(activeTask&&activeTask.objective?'<article class="av-ai-card"><b>'+esc(activeTask.title)+'</b><p>'+esc(activeTask.objective)+'</p></article>':'')+'<p class="nota">'+(m.provisional?"Provisional plan: some diagnostic observations are still unverified.":"Plan based on saved observations.")+'</p>'+
    '<div class="av-village">'+(E.data.buildings.length?E.data.buildings.slice(-12).map(function(b){return '<span>'+({garden:"🌳",library:"🏠",bridge:"🌉"}[b.type])+'</span>';}).join(""):"🏕️")+'</div><div id="av-steps" class="av-steps"></div>';
  var names={recordar:"Remember",aprender:"Learn",resolver:"Solve",demostrar:"Show what you learned"},next=m.steps.findIndex(function(s){return !s.done;});
  m.steps.forEach(function(s,i){
    var row=document.createElement("div");row.className="av-step"+(s.done?" av-done":"");
    row.innerHTML='<span class="av-step-icon">'+(s.done?"✓":L.skills[s.skill].icon)+'</span><div><strong>'+names[s.phase]+' · '+L.skills[s.skill].en+'</strong><p class="nota">'+esc(missionReason(s.reason))+'</p></div>';
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
      var p=document.createElement("p");p.className="nota";p.textContent="Guided practice uses the existing games. Completing an activity does not prove mastery; check-in results are saved separately.";body.appendChild(p);return;
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
function reducirFotos(files,done){
  var list=Array.prototype.slice.call(files||[]).filter(function(f){return /^image\//i.test(f.type);}).slice(0,5);
  if(!list.length)return done("");
  var loaded=[],pending=list.length;
  list.forEach(function(file,i){var fr=new FileReader();fr.onload=function(){var img=new Image();img.onload=function(){loaded[i]=img;if(!--pending){var max=1400,gap=18,width=0,total=gap*(loaded.length-1);loaded.forEach(function(x){var w=Math.min(max,x.width),h=Math.round(x.height*w/x.width);width=Math.max(width,w);total+=h;});var c=document.createElement("canvas");c.width=width;c.height=total;var y=0,ctx=c.getContext("2d");ctx.fillStyle="#ffffff";ctx.fillRect(0,0,width,total);loaded.forEach(function(x){var w=Math.min(max,x.width),h=Math.round(x.height*w/x.width);ctx.drawImage(x,0,y,w,h);y+=h+gap;});done(c.toDataURL("image/jpeg",.72));}};img.src=fr.result;};fr.readAsDataURL(file);});
}
function panel(el){
  var E=engine(),a=E.data;
  el.innerHTML='<h3 class="panel-h3">Learning plan</h3><p class="nota">Explorer 1. New check-ins are kept separate from earlier history and rewards. They are not school scores.</p>'+
    '<p>Next check-in: <b>'+esc(E.due()?"Available when you return":E.nextDate()||"Initial check-in pending")+'</b></p>'+
    '<div class="av-report">'+Object.keys(L.skills).map(function(k){var s=E.summary(k);return '<article><strong>'+L.skills[k].nombre+'</strong><p>'+s.status+'</p><p class="nota">'+s.n+' independent responses at activity level '+s.referenceLevel+' · '+(s.pct===null?"no score":s.pct+"%")+" · "+s.help+" with support · "+s.pending+' unverified</p><p class="nota">Review: '+(a.reviews[k]?L.day(a.reviews[k].due):"not scheduled")+'</p></article>';}).join("")+'</div>'+
    '<h3 class="panel-h3">Saved check-ins</h3><ul>'+a.cycles.map(function(c){return '<li>'+esc((c.type==="inicial"?"Initial":c.type==="semanal"?"Weekly":"Four-week review"))+" · "+L.day(c.started)+" · "+c.cursor+"/"+c.questions.length+" · "+(c.completed?"complete":"paused")+'</li>';}).join("")+'</ul>'+
    '<h3 class="panel-h3">Schoolwork for today</h3><p class="nota">Take up to five photos of the assignment. They are combined for AI review. Save it first, then analyze it after the diagnostic.</p><div class="av-task-upload"><label class="av-camera-btn" for="av-photo">📷 Take or choose up to 5 photos</label><input id="av-photo" type="file" accept="image/*" capture="environment" multiple class="av-file-hidden"><img id="av-photo-preview" class="av-task-preview" alt="Homework preview" hidden><label>Short title <input id="av-task-title" maxlength="100" placeholder="Reading homework"></label><label>Subject <select id="av-task-subject"><option value="reading">Reading</option><option value="math">Math</option></select></label><label>Skill to focus on <select id="av-task-skill"><option value="">Choose after the diagnostic</option>'+Object.keys(L.skills).map(function(k){return '<option value="'+k+'">'+L.skills[k].nombre+'</option>';}).join("")+'</select></label><label>What does the worksheet ask? <textarea id="av-task-notes" maxlength="500" placeholder="Example: read these words and write 5 answers"></textarea></label><div id="av-task-status" class="nota" role="status"></div></div>'+ 
    '<h3 class="panel-h3">School materials</h3><p class="nota">These are review materials and may not be the current homework.</p><label>Prioritize a set <select id="av-task">'+L.tasks.map(function(t){return '<option value="'+t.id+'">'+t.nombre+'</option>';}).join("")+'</select></label><p id="av-task-info" class="nota"></p>'+
    '<label>Reading focus <select id="av-read"><option value="">Based on observations</option>'+Object.keys(L.skills).filter(function(k){return L.skills[k].mundo==="reading";}).map(function(k){return '<option value="'+k+'">'+L.skills[k].nombre+'</option>';}).join("")+'</select></label>'+
    '<label>Math focus <select id="av-math"><option value="">Based on observations</option>'+Object.keys(L.skills).filter(function(k){return L.skills[k].mundo==="math";}).map(function(k){return '<option value="'+k+'">'+L.skills[k].nombre+'</option>';}).join("")+'</select></label>'+
    '<p class="nota">New priorities apply to the next mission. The current mission stays the same if you reload.</p>'+
    '<h3 class="panel-h3">School goal (copy from the report)</h3><label>Test and subject <input id="av-test" maxlength="100"></label><label>Goal and unit (final score or growth points) <input id="av-target" maxlength="100"></label><label>Target date <input type="date" id="av-target-date"></label><div id="av-parent-actions" class="acc"></div><p id="av-saved" role="status"></p>';
  var savedTask=a.task||{}; el.querySelector("#av-task-title").value=savedTask.title||""; el.querySelector("#av-task-subject").value=savedTask.subject||"reading"; el.querySelector("#av-task-skill").value=savedTask.skill||"";
  el.querySelector("#av-task-notes").value=savedTask.notes||"";
  var photo=N.Almacen.leerImagenTarea(); if(photo){var pv=el.querySelector("#av-photo-preview");pv.src=photo;pv.hidden=false;}
  el.querySelector("#av-photo").onchange=function(ev){var files=ev.target.files;if(!files||!files.length)return;var count=Math.min(files.length,5);reducirFotos(files,function(data){var pv=el.querySelector("#av-photo-preview");pv.src=data;pv.hidden=false;pv.dataset.data=data;el.querySelector("#av-task-status").textContent=count+" photo"+(count===1?"":"s")+" ready. Press Save task before analyzing.";});};
  button(el.querySelector(".av-task-upload"),"Save task for later review",function(){var pv=el.querySelector("#av-photo-preview"),data=pv.dataset.data||photo;L.setTask({title:el.querySelector("#av-task-title").value,subject:el.querySelector("#av-task-subject").value,skill:el.querySelector("#av-task-skill").value,notes:el.querySelector("#av-task-notes").value,imageKey:data?"local":null});if(data)N.Almacen.guardarImagenTarea(data);el.querySelector("#av-task-status").textContent="Task saved on this device. You can now analyze it with AI.";}, "btn-suave");
  var aiBox=document.createElement("section");aiBox.id="av-ai-result";aiBox.setAttribute("aria-live","polite");
  function showPlan(plan,applied){
    if(!plan)return;
    aiBox.innerHTML='<article class="av-ai-card"><h4>'+(applied?"Adaptation ready for the next mission":"Adaptation proposal · waiting for your approval")+'</h4><p><b>Task:</b> '+esc(plan.title)+'</p><p><b>School objective:</b> '+esc(plan.objective)+'</p><p><b>Priority skill:</b> '+esc(L.skills[plan.skill]?L.skills[plan.skill].nombre:plan.skill)+'</p><p><b>Suggested practice:</b> '+esc(String(plan.difficulty))+' · practice guidance, not a school score</p><h5>How it becomes a game</h5><ol>'+plan.steps.map(function(x){return '<li><b>'+esc(x.phase)+'</b>: '+esc(x.instruction)+' <span class="nota">Game: '+esc(x.game)+'</span></li>';}).join("")+'</ol><p><b>Check against the original assignment:</b> '+plan.transfer.map(esc).join(" · ")+'</p><p class="nota"><b>Parent review:</b> '+esc(plan.adultCheck)+(plan.uncertain.length?" · Questions: "+plan.uncertain.map(esc).join(" · "):"")+'</p></article>';
    if(!applied)button(aiBox,"Approve for the next mission",function(){var current=E.data.task||{};L.setTask({title:plan.title,subject:plan.subject,skill:plan.skill,objective:plan.objective,notes:current.notes,imageKey:current.imageKey,analysis:null,adaptation:plan});showPlan(plan,true);el.querySelector("#av-task-status").textContent="Adaptation saved. The next mission will use this plan, and the details will stay in the dashboard.";},"btn-primario");
  }
  if(savedTask.analysis)showPlan(savedTask.analysis,false);else if(savedTask.adaptation)showPlan(savedTask.adaptation,true);
  button(el.querySelector(".av-task-upload"),"Analyze task with AI",async function(ev){
    var btn=ev.currentTarget,pv=el.querySelector("#av-photo-preview"),image=pv.dataset.data||photo;
    if(!image){el.querySelector("#av-task-status").textContent="Take a photo or choose an image first.";return;}
    L.setTask({title:el.querySelector("#av-task-title").value,subject:el.querySelector("#av-task-subject").value,skill:el.querySelector("#av-task-skill").value,notes:el.querySelector("#av-task-notes").value,imageKey:"local"});
    if(image)N.Almacen.guardarImagenTarea(image);a=E.data;
    btn.disabled=true;el.querySelector("#av-task-status").textContent="AI is reading the assignment and comparing it with diagnostic observations…";
    try{
      var diagnostic=Object.keys(L.skills).map(function(k){var x=E.summary(k);return {skill:k,level:x.referenceLevel,status:x.status};});
      var response=await fetch("/api/adaptar-tarea",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:image,task:{title:el.querySelector("#av-task-title").value,subject:el.querySelector("#av-task-subject").value,skill:el.querySelector("#av-task-skill").value,notes:el.querySelector("#av-task-notes").value},diagnostic:diagnostic})});
      var result=await response.json();if(!response.ok)throw new Error(result.message||result.error||"The assignment could not be analyzed.");
      var plan=result.adaptation,current=E.data.task||{};L.setTask({title:current.title,subject:current.subject,skill:current.skill,objective:current.objective,notes:current.notes,imageKey:current.imageKey,analysis:plan,adaptation:current.adaptation});showPlan(plan,false);
      el.querySelector("#av-task-status").textContent="Analysis complete and saved. Review the plan below. It will be used in the game only after you approve it.";
    }catch(err){el.querySelector("#av-task-status").textContent=err.message==="ai_not_configured"?"The analysis service is published, but its API key is not configured in Netlify.":err.message||"Could not connect to AI.";}
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
  button(acc,"Save priorities and school goal",function(){
    a.settings.task=el.querySelector("#av-task").value;
    a.settings.reading=[el.querySelector("#av-read").value].filter(Boolean);a.settings.math=[el.querySelector("#av-math").value].filter(Boolean);
    a.targets={test:el.querySelector("#av-test").value.trim(),target:el.querySelector("#av-target").value.trim(),date:el.querySelector("#av-target-date").value};
    N.Almacen.guardar();el.querySelector("#av-saved").textContent="Saved. The school goal is not calculated from game results.";
  },"btn-primario");
  button(acc,"Start a new check-in and keep previous results",function(){E.start("revision");route("introDiag");});
  button(acc,"Download previous backup",function(){
    var txt=N.Almacen.respaldoAprendizaje();if(!txt){el.querySelector("#av-saved").textContent="No previous backup is available on this device.";return;}
    var url=URL.createObjectURL(new Blob([txt],{type:"application/json"})),link=document.createElement("a");link.href=url;link.download="blockquest-antes-explorer.json";link.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  });
}
g.AVENTURA={
  install:function(screens,navigate){
    route=navigate;screens.introDiag=intro;
    screens.diag=function(el,opts){
      if(opts&&opts.cycle){var E=engine(),c=E.data.cycles.find(function(x){return x.id===opts.cycle;});if(c&&c.completed){
        E.rewardCycle(c);var b=shell(el,"Your adventure is ready!","Your answers help choose your next missions.");
        b.innerHTML='<div class="av-celebrate">🗺️ ✨ 🏕️</div><p>+15 gems. Your observations are saved.</p>';button(b,"Start my mission →",function(){route("aventura");},"btn-primario btn-grande");return;
      }}diagnostic(el);
    };
    screens.aventura=mission;screens.pasoAventura=step;
  },
  home:home,panel:panel,needsInitial:function(){try{return !N.Almacen.leer().diagnostico.hecho;}catch(e){return true;}},
  cancel:function(){generation++;if(g.speechSynthesis)g.speechSynthesis.cancel();}
};
})(window);
