const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const plan={title:'Practice sums',subject:'math',skill:'operaciones',difficulty:0,objective:'Add within five',steps:['recordar','aprender','resolver','demostrar'].map(phase=>({phase,instruction:'Count the blocks.',game:'blocks'})),transfer:['Try a new sum','Explain the count'],adultCheck:'Listen to the explanation.',uncertain:[]};
function service(response,status=200){
  const ctx={exports:{},process:{env:{OPENAI_API_KEY:'test-only'}},AbortSignal,console,fetch:async(url,options)=>{ctx.sent=JSON.parse(options.body);return {ok:status===200,status,json:async()=>response};}};
  vm.runInNewContext(fs.readFileSync('netlify/functions/adaptar-tarea.js','utf8'),ctx);
  return {ctx,run:()=>ctx.exports.handler({httpMethod:'POST',headers:{origin:'https://dainty-churros-901cbd.netlify.app'},body:JSON.stringify({image:'data:image/png;base64,YQ==',task:{notes:'Count blocks'}})})};
}
test('REST output message is parsed without SDK output_text',async()=>{
  const x=service({status:'completed',output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:JSON.stringify(plan)}]}]});
  const r=await x.run();assert.equal(r.statusCode,200);assert.deepEqual(JSON.parse(r.body).adaptation,plan);assert.equal(x.ctx.sent.model,'gpt-4.1-mini');assert.equal(x.ctx.sent.reasoning,undefined);
});
for(const [status,code,expected] of [[401,'invalid_api_key','ai_invalid_key'],[429,'insufficient_quota','ai_quota'],[404,'model_not_found','ai_model_access']]) test('Provider error '+code,async()=>{const r=await service({error:{code,message:'private provider detail'}},status).run();assert.equal(JSON.parse(r.body).error,expected);assert.ok(!r.body.includes('private provider detail'));});
test('Incomplete output cannot be approved',async()=>{const r=await service({status:'incomplete',output:[]}).run();assert.equal(JSON.parse(r.body).error,'ai_incomplete');});
test('Malformed plan cannot reach rendering',async()=>{const r=await service({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...plan,steps:[]})}]}]}).run();assert.equal(JSON.parse(r.body).error,'ai_invalid_result');});
test('Parent buttons save, analyze, persist and approve using the actual learning engine',async()=>{
  const L=require('../web/js/aprendizaje.js'), state={esmeraldas:0,esmeraldasGanadasTotal:0};
  L.create(state);const nodes=new Map(), buttons=[];let apiError=null;let sent,photo='data:image/png;base64,YQ==';
  function node(){return {value:'',dataset:{},hidden:false,innerHTML:'',textContent:'',appendChild(){},setAttribute(){},scrollIntoView(){}};}
  const el=node();el.querySelector=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);};
  const w={APRENDIZAJE:L,DATOS:{},NUCLEO:{Util:{esc:s=>s},Bus:{emitir(){}},Almacen:{leer:()=>state,guardar(){},leerImagenTarea:()=>photo,guardarImagenTarea:x=>{photo=x;return true;}}},JUEGOS:{ui:{boton:(text,cls,fn)=>{const b={text,fn,disabled:false};buttons.push(b);return b;}}}};
  vm.runInNewContext(fs.readFileSync('web/js/aventura.js','utf8'),{window:w,document:{createElement:node},console,AbortSignal,setTimeout,clearTimeout,fetch:async(url,opts)=>{sent=JSON.parse(opts.body);if(apiError)return {ok:false,json:async()=>apiError};return {ok:true,json:async()=>({adaptation:plan})};}});
  w.AVENTURA.panel(el);
  el.querySelector('#av-task-title').value='Worksheet';el.querySelector('#av-task-notes').value='Five blocks';
  const save=buttons.find(b=>b.text.startsWith('Save task'));save.fn();assert.equal(state.aprendizaje.task.title,'Worksheet');
  const analyze=buttons.find(b=>b.text==='Analyze task with AI');await analyze.fn({currentTarget:analyze});
  assert.equal(sent.task.notes,'Five blocks');assert.equal(state.aprendizaje.task.analysis.title,plan.title);assert.equal(state.aprendizaje.task.adaptation,null);assert.equal(analyze.disabled,false);
  buttons.find(b=>b.text==='Approve for the next mission').fn();assert.equal(state.aprendizaje.task.adaptation.title,plan.title);
  apiError={error:'ai_insufficient_credits',message:'Créditos insuficientes. Agrega saldo a la API.'};
  await analyze.fn({currentTarget:analyze});
  assert.equal(el.querySelector('#av-task-status').textContent,apiError.message);
  assert.equal(analyze.disabled,false);assert.equal(photo,'data:image/png;base64,YQ==');
});

for(const field of ['code','type']) test('Credit exhaustion in '+field+' is distinguished from rate limit',async()=>{
  const r=await service({error:{[field]:'credit_balance_exhausted'}},429).run();
  assert.equal(r.statusCode,402);assert.equal(JSON.parse(r.body).error,'ai_insufficient_credits');
  assert.match(JSON.parse(r.body).message,/Créditos insuficientes/);
});
test('Explicit rate limit is temporary, unknown 429 is not diagnosed as no credit',async()=>{
  const temporary=await service({error:{code:'rate_limit_exceeded'}},429).run();
  assert.equal(JSON.parse(temporary.body).error,'ai_busy');
  const unknown=await service({},429).run();assert.equal(JSON.parse(unknown.body).error,'ai_limit_unknown');
});
