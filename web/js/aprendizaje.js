/* Block Quest: evidencia, ciclos y misiones. Sin red ni acceso directo a almacenamiento. */
(function (root) {
  "use strict";
  var SKILLS = {
    lectura: {nombre:"Lectura oral", en:"Word bridge", icon:"🌉", mundo:"reading", modo:"oral", ayuda:"Read each sound, then blend the sounds into a word.", es:"Decí cada sonido y luego unilos para leer la palabra."},
    dictado: {nombre:"Escritura al dictado", en:"Word workshop", icon:"🛠️", mundo:"reading", modo:"dictado", ayuda:"Say the word slowly. Listen for each sound, then write it.", es:"Decí la palabra despacio, escuchá los sonidos y escribila."},
    escucha: {nombre:"Comprensión escuchada", en:"Listening grove", icon:"🎧", mundo:"reading", modo:"escuchada", ayuda:"Listen for who is in the story and what happens.", es:"Escuchá quién aparece y qué sucede."},
    comprension: {nombre:"Comprensión leída", en:"Story library", icon:"📚", mundo:"reading", modo:"leida", ayuda:"Read again. Find the sentence that helps you answer.", es:"Volvé al texto y buscá la frase que ayuda a responder."},
    operaciones: {nombre:"Sumas y restas", en:"Build a bridge", icon:"🧱", mundo:"math", modo:"calculo", ayuda:"Use blocks or a number line. Make ten when it helps.", es:"Usá bloques o una recta numérica. Podés completar diez."},
    numeros: {nombre:"Valor posicional", en:"Block towers", icon:"🏗️", mundo:"math", modo:"valor-posicional", ayuda:"Ten ones make one ten. Count tens, then ones.", es:"Diez unidades forman una decena. Contá decenas y unidades."},
    formas: {nombre:"Atributos de figuras", en:"Shape garden", icon:"🔷", mundo:"math", modo:"geometria", ayuda:"Count straight sides and corners. Turn the shape: its name stays the same.", es:"Contá lados rectos y vértices. Girar una figura no cambia su nombre."},
    graficas: {nombre:"Interpretación de gráficas", en:"Weather station", icon:"📊", mundo:"math", modo:"datos", ayuda:"Check the labels. Count each bar. Compare the amounts.", es:"Mirá las etiquetas y contá cada barra antes de comparar."}
  };
  var STORIES = [
    ["Sam has a red bag. He puts a map in the bag. Then he walks to the park.","What does Sam put in the bag?","a map",["a hat","a map","a cup"]],
    ["Kim sees a wet cat. She gets a towel. She helps the cat get dry.","Why does Kim get a towel?","to dry the cat",["to dry the cat","to feed a bird","to fly a kite"]],
    ["Ben has a kite. The wind lifts it high. Ben holds the string.","What makes the kite go up?","the wind",["the rain","the wind","a fish"]],
    ["Meg plants a seed. She gives it water. A small plant starts to grow.","What happens after Meg waters the seed?","a plant grows",["a plant grows","a bag opens","a dog runs"]],
    ["A dog runs to the gate. The gate is shut. The dog sits and waits.","Why does the dog wait?","the gate is shut",["the gate is shut","it has a kite","it is in a boat"]],
    ["Lee puts a cup on a table. His cat bumps the cup. Water spills on the floor.","Why does the water spill?","the cat bumps the cup",["Lee reads a book","the cat bumps the cup","a seed grows"]],
    ["Jill wants to read. The room is dark. She turns on a lamp and opens her book.","What helps Jill read?","the lamp",["the lamp","a shell","a cake"]],
    ["Tom packs a lunch. He takes an apple and a sandwich. He eats under a tree.","Where does Tom eat?","under a tree",["in a boat","under a tree","on a bus"]],
    ["A bird finds a twig. It takes the twig to its nest. The nest is in a tall tree.","Where does the bird take the twig?","to its nest",["to its nest","to a shop","to a pond"]],
    ["Rose makes a cake. She waits for it to cool. Then she shares it with Dad.","What does Rose do before sharing the cake?","waits for it to cool",["waits for it to cool","plants a seed","flies a kite"]],
    ["Max loses his cap. He looks under the bed and finds it. He puts it on.","Where was the cap?","under the bed",["in a tree","under the bed","in a lake"]],
    ["Sue sees trash by the lake. She puts it in a bin. The shore looks clean.","How does Sue help the lake?","she picks up trash",["she picks up trash","she drops a cup","she hides a book"]]
  ];
  var WORDS = [
    "cat sun map fish shop thin chin stop flag drum nest ship".split(" "),
    "made safe time like cape kite tube robe hope pine lake name".split(" "),
    "cupcake pinecone reptile invite lifetime flagpole inside sunshine bedtime pancake mistake escape".split(" ")
  ];
  var TASKS = [
    {id:"vce-repaso",nombre:"Repaso de VCe",fecha:"2026-09-05",skill:"dictado",origen:"Módulo 3: lista escolar ya incorporada",objetivo:"Relacionar sonidos y escritura en palabras VCe",cambios:"Taller de palabras y comprobación al dictado; no representa entrega escolar."},
    {id:"graficas-repaso",nombre:"Repaso de gráficas",fecha:"2026-09-05",skill:"graficas",origen:"Lesson 4: material escolar ya incorporado",objetivo:"Leer y comparar cantidades en gráficas",cambios:"Gráficas de recursos con números nuevos; mismo objetivo de interpretación."}
  ];
  function day(t) { var d=new Date(t===undefined?Date.now():t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function addDays(t,n) { var d=new Date(t); d.setDate(d.getDate()+n); return d.getTime(); }
  function seed(s) { var n=2166136261; String(s).split("").forEach(function(c){n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;}); return n; }
  function blank() { return {version:1,cycles:[],active:null,events:[],reviews:{},missions:{},buildings:[],settings:{task:"vce-repaso",reading:[],math:[]},targets:{},task:null}; }
  function create(state,save,clock) {
    save=save||function(){}; clock=clock||Date.now;
    if(!state.aprendizaje) { state.aprendizaje=blank(); save(); }
    var a=state.aprendizaje;
    if(!a.exposures)a.exposures=[];
    function summary(skill) {
      var all=a.events.filter(function(e){return e.skill===skill;}).slice(-60);
      var valid=all.filter(function(e){return e.result!==null&&!e.help&&e.evaluator!=="automatico";});
      var referenceLevel=valid.length?valid[valid.length-1].level:1;
      var scored=valid.filter(function(e){return e.level===referenceLevel;});
      var days=new Set(scored.map(function(e){return e.day;}));
      var items=new Set(scored.map(function(e){return e.item;}));
      var correct=scored.filter(function(e){return e.result;}).length;
      var fresh=scored.filter(function(e){return e.phase==="transferencia"&&e.fresh;});
      var pct=scored.length?Math.round(100*correct/scored.length):null;
      var retained=scored.length>=10&&days.size>=2&&items.size>=5&&pct>=80;
      var transferred=retained&&fresh.length>=5&&fresh.filter(function(e){return e.result;}).length/fresh.length>=.8&&new Set(fresh.map(function(e){return e.day;})).size>=2;
      return {skill:skill,total:all.length,n:scored.length,pct:pct,help:all.filter(function(e){return e.help;}).length,
        pending:all.filter(function(e){return e.result===null;}).length,days:days.size,
        status:transferred?"Transferencia observada":retained?"Consolidando":scored.length<3?"Por observar":pct<60?"Necesita práctica guiada":"En práctica",
        referenceLevel:referenceLevel,level:scored.length>=5&&pct>=80?Math.min(2,referenceLevel+1):scored.length>=3&&pct<50?Math.max(0,referenceLevel-1):referenceLevel};
    }
    function priorities(mundo) {
      var forced=(mundo==="reading"?a.settings.reading:a.settings.math)||[];
      var ids=Object.keys(SKILLS).filter(function(k){return SKILLS[k].mundo===mundo;});
      var task=a.task||TASKS.find(function(t){return t.id===a.settings.task;});
      return ids.sort(function(x,y){
        function score(k){var s=summary(k); return forced.indexOf(k)>=0?-100:task&&task.skill===k?-90:s.pct===null?-20:s.pct;}
        return score(x)-score(y);
      });
    }
    function due() {
      if(a.active) return a.cycles.find(function(c){return c.id===a.active;}).type;
      var completed=a.cycles.filter(function(c){return c.completed;});
      if(!completed.length) return "inicial";
      var last=completed[completed.length-1];
      var broad=completed.filter(function(c){return c.type!=="semanal";}).slice(-1)[0];
      if(day(clock())>=day(addDays(broad.completed,28))) return "revision";
      if(day(clock())>=day(addDays(last.completed,7))) return "semanal";
      return null;
    }
    function nextDate() {
      var complete=a.cycles.filter(function(c){return c.completed;});
      if(!complete.length) return null;
      var last=complete[complete.length-1], broad=complete.filter(function(c){return c.type!=="semanal";}).slice(-1)[0];
      return day(Math.min(addDays(last.completed,7),addDays(broad.completed,28)));
    }
    function generate(skill,level,token,index) {
      var n=seed(token+":"+skill+":"+index), q={skill:skill,level:level,mode:SKILLS[skill].modo,kind:"choice"};
      if(skill==="lectura"||skill==="dictado") {
        var list=WORDS[level], word=list[n%list.length];
        q.kind=skill==="lectura"?"oral":"spell"; q.word=word; q.answer=word;
        q.prompt=skill==="lectura"?"Read this word aloud.":"Listen, then write the word.";
        q.key=skill+":"+word;
      } else if(skill==="escucha"||skill==="comprension") {
        var ix=(n%6)*2+(skill==="escucha"?0:1), s=STORIES[ix];
        q.story=s[0]; q.prompt=s[1]; q.answer=s[2]; q.options=s[3].slice(); q.key=skill+":story-"+ix; q.level=1;
      } else if(skill==="operaciones") {
        var max=level===0?5:level===1?10:30, x=1+n%max, y=1+Math.floor(n/37)%max, minus=n%2===0;
        q.answer=minus?Math.max(x,y)-Math.min(x,y):x+y;
        q.prompt=(minus?Math.max(x,y)+" − "+Math.min(x,y):x+" + "+y)+" = ?";
        q.kind="number"; q.key=skill+":"+q.prompt;
      } else if(skill==="numeros") {
        var tens=1+n%(level===0?3:9), ones=Math.floor(n/31)%10, hundreds=level===2?1+Math.floor(n/71)%4:0;
        q.answer=hundreds*100+tens*10+ones; q.kind="number";
        q.prompt=(hundreds?hundreds+" hundreds, ":"")+tens+" tens and "+ones+" ones. How many?";
        q.blocks={hundreds:hundreds,tens:tens,ones:ones}; q.key=skill+":"+q.answer;
      } else if(skill==="formas") {
        var forms=[["triangle",3,3],["square",4,4],["pentagon",5,5],["hexagon",6,6]], f=forms[n%(level===0?2:4)];
        q.shape=f[0]; q.prompt=level===2?"How many corners does this shape have?":"How many straight sides does this shape have?";
        q.answer=level===2?f[2]:f[1]; q.kind="number"; q.key=skill+":"+f[0]+":"+level;
      } else {
        var xg=1+n%7, yg=1+Math.floor(n/19)%7;
        q.graph=[{label:"Torches",value:xg},{label:"Boats",value:yg}];
        q.prompt=level===0?"How many torches are there?":level===1?"How many items are there in all?":"How many more "+(xg>=yg?"torches than boats":"boats than torches")+" are there?";
        q.answer=level===0?xg:level===1?xg+yg:Math.abs(xg-yg); q.kind="number"; q.key=skill+":"+xg+":"+yg+":"+level;
      }
      if(q.options) { var offset=n%q.options.length; q.options=q.options.slice(offset).concat(q.options.slice(0,offset)); }
      return q;
    }
    function pick(skill,level,token,index,avoid) {
      var seen=new Set(a.events.map(function(e){return e.item;}).concat(a.exposures.map(function(e){return e.item;})).concat(avoid||[])), best;
      for(var i=0;i<80;i++) { best=generate(skill,level,token,index+i); if(!seen.has(best.key)) {best.fresh=true;return best;} }
      best.fresh=false; return best;
    }
    function start(type) {
      if(a.active) return a.cycles.find(function(c){return c.id===a.active;});
      type=type||due()||"revision";
      var skills=type==="semanal"?priorities("reading").slice(0,2).concat(priorities("math").slice(0,1)):Object.keys(SKILLS);
      var c={id:"cycle-"+clock()+"-"+a.cycles.length,type:type,started:clock(),bank:"2026-09-v1",skills:skills,questions:[],cursor:0,results:[],completed:null,paid:false};
      skills.forEach(function(k){ for(var j=0;j<(type==="semanal"?2:3);j++) c.questions.push(pick(k,summary(k).level,c.id,j,c.questions.map(function(q){return q.key;}))); });
      a.cycles.push(c);a.active=c.id;save();return c;
    }
    function record(q,result,help,evaluator,phase,id,response) {
      if(a.events.some(function(e){return e.id===id;})) return;
      var fresh=!!q.fresh&&!a.events.some(function(e){return e.item===q.key;})&&!a.exposures.some(function(e){return e.item===q.key;});
      var ev={id:id,t:clock(),day:day(clock()),skill:q.skill,item:q.key,level:q.level,mode:q.mode,result:result,
        help:!!help,supports:(q.supports||[]).slice(),response:response===undefined?null:response,evaluator:evaluator||"objetiva",phase:phase,first:true,fresh:fresh};
      a.events.push(ev);
      var r=a.reviews[q.skill]||{step:0,due:clock()};
      if(result!==null) {
        r.step=result&&!help?Math.min(r.step+1,4):0;
        r.due=addDays(clock(),[1,1,3,7,14][r.step]);
        a.reviews[q.skill]=r;
      }
      save();
    }
    function answer(result,help,evaluator,response) {
      var c=a.cycles.find(function(x){return x.id===a.active;}); if(!c||c.completed) return false;
      var q=c.questions[c.cursor], id=c.id+":"+c.cursor;
      record(q,result,help,evaluator,"chequeo",id,response);
      c.results.push({item:q.key,skill:q.skill,result:result,help:!!help,level:q.level});
      c.cursor++;
      // Tras dos dificultades, la próxima pregunta del mismo objetivo se simplifica.
      var last=c.results.filter(function(r){return r.skill===q.skill;}).slice(-2);
      if(last.length===2&&last.every(function(r){return r.result===false||r.help;})) {
        for(var i=c.cursor;i<c.questions.length;i++) if(c.questions[i].skill===q.skill) {c.questions[i]=pick(q.skill,Math.max(0,q.level-1),c.id+"-apoyo",i,c.questions.map(function(x){return x.key;}));break;}
      }
      if(c.cursor>=c.questions.length) {
        c.completed=clock();a.active=null;
        var today=a.missions[day(clock())];
        if(today&&!today.steps.some(function(s){return s.done||s.cursor>0;}))delete a.missions[day(clock())];
      }
      save();return true;
    }
    function rewardCycle(c) { if(!c||!c.completed||c.paid)return 0;c.paid=true;state.esmeraldas+=15;state.esmeraldasGanadasTotal+=15;save();return 15; }
    function mission() {
      var d=day(clock()); if(a.missions[d])return a.missions[d];
      var read=priorities("reading"), math=priorities("math");
      var reviews=Object.keys(a.reviews).filter(function(k){return day(a.reviews[k].due)<=d;}).sort(function(x,y){return a.reviews[x].due-a.reviews[y].due;});
      var keys=[reviews[0]||read[1],read[0],math[0],read[0]];
      var phases=["recordar","aprender","resolver","demostrar"];
      var token="mission-"+d;
      var steps=keys.map(function(k,i){var s=summary(k);return {skill:k,phase:phases[i],done:false,cursor:0,
        reason:(i===0&&reviews.length?"Repaso programado":s.n?"Observación reciente: "+s.status:"Falta observar esta habilidad"),
        level:s.level,questions:[pick(k,s.level,token,i*100),pick(k,s.level,token,i*100+40)],help:false};});
      // Reserve transfer examples separately from earlier mission items.
      var reserved=steps.slice(0,3).reduce(function(xs,s){return xs.concat(s.questions.map(function(q){return q.key;}));},[]);
      steps[3].questions=steps[3].questions.map(function(q,i){var chosen=pick(q.skill,q.level,token+"-nuevo",i,reserved);reserved.push(chosen.key);return chosen;});
      var m={id:token,day:d,steps:steps,paid:false,building:null,task:a.task||a.settings.task,provisional:!a.cycles.some(function(c){return c.completed;})||Object.keys(SKILLS).some(function(k){return summary(k).n<3;})};
      a.missions[d]=m;save();return m;
    }
    function answerMission(index,result,help,evaluator,response) {
      var m=mission(),s=m.steps[index]; if(!s||s.done)return false;
      var q=s.questions[s.cursor]; if(!q)return false;
      record(q,result,help||s.help,evaluator,s.phase==="demostrar"?"transferencia":"practica",m.id+":"+index+":"+s.cursor,response);
      s.cursor++;if(s.cursor>=s.questions.length)s.done=true;save();return true;
    }
    function expose(index) {
      var s=mission().steps[index];if(!s)return;
      s.questions.forEach(function(q){
        a.exposures.push({item:q.key,t:clock()});
        if(q.word){a.exposures.push({item:"lectura:"+q.word,t:clock()});a.exposures.push({item:"dictado:"+q.word,t:clock()});}
      });save();
    }
    function finishPractice(index) {var m=mission(),s=m.steps[index]; if(!s||s.done)return;s.done=true;save();}
    function setTask(task) {
      task=task||{};
      var today=day(clock()),current=a.missions[today];
      if(current&&!current.paid&&!current.steps.some(function(s){return s.done||s.cursor>0;}))delete a.missions[today];
      a.task={id:"tarea-"+clock(),title:String(task.title||"Tarea del día").slice(0,100),subject:String(task.subject||"").slice(0,40),skill:SKILLS[task.skill]?task.skill:"",objective:String(task.objective||"").slice(0,180),notes:String(task.notes||"").slice(0,300),date:task.date||day(clock()),imageKey:task.imageKey||null,adaptation:task.adaptation||null,analysis:task.analysis||null};
      save(); return a.task;
    }
    function clearTask() { a.task=null; save(); }
    function build(choice) {
      var m=mission();if(m.paid||!m.steps.every(function(s){return s.done;}))return false;
      if(["garden","library","bridge"].indexOf(choice)<0)return false;
      m.paid=true;m.building=choice;a.buildings.push({day:m.day,type:choice});
      state.esmeraldas+=20;state.esmeraldasGanadasTotal+=20;save();return true;
    }
    return {data:a,summary:summary,priorities:priorities,due:due,nextDate:nextDate,start:start,answer:answer,rewardCycle:rewardCycle,
      mission:mission,answerMission:answerMission,finishPractice:finishPractice,expose:expose,build:build,setTask:setTask,clearTask:clearTask,generate:generate,pick:pick,record:record};
  }
  var api={create:create,skills:SKILLS,tasks:TASKS,day:day,addDays:addDays};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.APRENDIZAJE=api;
})(typeof window!=="undefined"?window:this);
