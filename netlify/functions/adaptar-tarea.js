const ALLOWED_SKILLS = new Set(["lectura", "dictado", "escucha", "comprension", "operaciones", "numeros", "formas", "graficas"]);
const WINDOW_MS = 60_000;
const LIMIT = 3;
const seen = new Map();
const schema = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: "string" }, subject: { type: "string", enum: ["reading", "math"] },
    skill: { type: "string", enum: ["lectura", "dictado", "escucha", "comprension", "operaciones", "numeros", "formas", "graficas"] },
    objective: { type: "string" }, difficulty: { type: "integer", enum: [0, 1, 2] },
    steps: { type: "array", minItems: 4, maxItems: 4, items: { type: "object", additionalProperties: false,
      properties: { phase: { type: "string", enum: ["recordar", "aprender", "resolver", "demostrar"] }, instruction: { type: "string" }, game: { type: "string" } }, required: ["phase", "instruction", "game"] } },
    transfer: { type: "array", minItems: 2, maxItems: 2, items: { type: "string" } },
    adultCheck: { type: "string" }, uncertain: { type: "array", items: { type: "string" } }
  }, required: ["title", "subject", "skill", "objective", "difficulty", "steps", "transfer", "adultCheck", "uncertain"]
};
exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return reply(405, { error: "method_not_allowed" });
  const origin = event.headers && (event.headers.origin || event.headers.Origin);
  const allowedOrigins = new Set([
    "https://learningamy.netlify.app",
    "https://dainty-churros-901cbd.netlify.app",
    "http://localhost:8790",
    "http://localhost:8791"
  ]);
  if (origin && !allowedOrigins.has(origin)) return reply(403, { error: "origin_not_allowed" });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return reply(503, { error: "ai_not_configured", message: "La clave de OpenAI todavía no está configurada en Netlify." });
  if (!event.body || event.body.length > 6_000_000) return reply(413, { error: "request_too_large" });
  let body;
  try { body = JSON.parse(event.body); } catch (_) { return reply(400, { error: "invalid_json" }); }
  const image = String(body.image || "");
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(image) || image.length > 5_500_000) return reply(400, { error: "valid_image_required" });
  const ip = (event.headers && (event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"]) || "unknown").split(",")[0].trim();
  const now = Date.now(), recent = (seen.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return reply(429, { error: "rate_limited", message: "Esperá un minuto antes de volver a analizar una tarea." });
  recent.push(now); seen.set(ip, recent);
  const task = body.task || {}, skills = ALLOWED_SKILLS;
  const diagnostic = Array.isArray(body.diagnostic) ? body.diagnostic.slice(0, 8).map(x => ({ skill: skills.has(x.skill) ? x.skill : "", level: Math.max(0, Math.min(2, Number(x.level) || 0)), status: String(x.status || "").slice(0, 40) })) : [];
  const instructions = "Analyze the photo of a school assignment and adapt it for a second-grade student who is learning to read. Preserve the academic goal. Treat difficulty as provisional guidance for practice, never as proof of a school grade level. Use recent diagnostic observations if provided. Do not copy names, school names, identifiers, or personal details visible in the photo. If an instruction is unreadable, mark the uncertainty in uncertain and do not guess. Create four short phases with playable steps, simple reading, and gradual support. Write every child-facing instruction and adultCheck in clear American English. Do not provide answers to school assessments. Return only the requested schema.";
  const inputText = JSON.stringify({ task: { title: String(task.title || "").slice(0, 100), subject: String(task.subject || "").slice(0, 20), skill: skills.has(task.skill) ? task.skill : "", notes: String(task.notes || "").slice(0, 500) }, diagnostic });
  let upstream;
  try {
    upstream = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: AbortSignal.timeout(25000), headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini", store: false, max_output_tokens: 2400,
      instructions, input: [{ role: "user", content: [{ type: "input_text", text: inputText }, { type: "input_image", image_url: image, detail: "high" }] }],
      text: { format: { type: "json_schema", name: "task_adaptation", strict: true, schema } }
    }) });
  } catch (_) { return reply(502, { error: "ai_unavailable", message: "No se pudo conectar con OpenAI a tiempo. Intenta nuevamente." }); }
  if (!upstream.ok) {
    let failure={}; try { failure=await upstream.json(); } catch (_) {}
    const code=failure.error && failure.error.code;
    const type=failure.error && failure.error.type;
    const hasCode=value=>code===value || type===value;
    if (upstream.status===401) return reply(502,{error:"ai_invalid_key",message:"OpenAI rechazó la clave. Revisa OPENAI_API_KEY en Netlify y publica nuevamente."});
    if (hasCode("credit_balance_exhausted")) return reply(402,{error:"ai_insufficient_credits",message:"Créditos insuficientes: OpenAI informa que el saldo de la API está agotado. Agrega créditos en OpenAI → Billing y vuelve a analizar la foto. No es un fallo del juego."});
    if (hasCode("insufficient_quota")) return reply(402,{error:"ai_quota",message:"Saldo o cuota de OpenAI insuficiente: revisa los créditos de la API y los límites de gasto en OpenAI → Billing / Limits. El análisis está bloqueado por la cuenta de AI."});
    if (upstream.status===429 && hasCode("rate_limit_exceeded")) return reply(429,{error:"ai_busy",message:"Límite temporal de solicitudes de OpenAI. Espera un minuto y vuelve a intentar. Este aviso no indica falta de créditos."});
    if (upstream.status===429) return reply(429,{error:"ai_limit_unknown",message:"OpenAI limitó el análisis sin especificar la causa. Revisa Billing y Limits; no se pudo confirmar si faltan créditos o si es un límite temporal."});
    if (code==="model_not_found" || upstream.status===403) return reply(502,{error:"ai_model_access",message:"La clave no tiene acceso al modelo. Revisa OPENAI_MODEL y los permisos de la clave en Netlify."});
    return reply(502,{error:"ai_request_failed",message:"OpenAI rechazó la solicitud de análisis. Revisa la configuración del servicio.",upstreamStatus:upstream.status});
  }
  let data;
  try { data = await upstream.json(); } catch (_) { return reply(502, { error: "ai_invalid_response" }); }
  if(data.status==="incomplete") return reply(502,{error:"ai_incomplete",message:"El análisis quedó incompleto. Intenta con menos fotos."});
  const content=(Array.isArray(data.output)?data.output:[]).filter(x=>x.type==="message").flatMap(x=>Array.isArray(x.content)?x.content:[]);
  if(content.some(x=>x.type==="refusal")) return reply(422,{error:"ai_refused",message:"No se pudo adaptar esta imagen. Revisa que sea una tarea legible."});
  const output=content.filter(x=>x.type==="output_text" && typeof x.text==="string").map(x=>x.text).join("") || data.output_text;
  if (!output) return reply(502, { error: "ai_empty_response",message:"OpenAI no devolvió un análisis. Intenta nuevamente." });
  let adaptation;
  try { adaptation = JSON.parse(output); } catch (_) { return reply(502, { error: "ai_invalid_result" }); }
  if (!skills.has(adaptation.skill) || !["reading", "math"].includes(adaptation.subject)) return reply(502, { error: "ai_invalid_result" });
  const phases=["recordar","aprender","resolver","demostrar"];
  if (!Number.isInteger(adaptation.difficulty) || adaptation.difficulty<0 || adaptation.difficulty>2 ||
      !["title","objective","adultCheck"].every(k=>typeof adaptation[k]==="string") ||
      !Array.isArray(adaptation.steps) || adaptation.steps.length!==4 ||
      !phases.every(p=>adaptation.steps.filter(s=>s && s.phase===p && typeof s.instruction==="string" && typeof s.game==="string").length===1) ||
      !Array.isArray(adaptation.transfer) || adaptation.transfer.length!==2 || !adaptation.transfer.every(x=>typeof x==="string") ||
      !Array.isArray(adaptation.uncertain) || !adaptation.uncertain.every(x=>typeof x==="string"))
    return reply(502,{error:"ai_invalid_result",message:"El análisis no tiene todos los pasos necesarios. Intenta nuevamente."});
  return reply(200, { adaptation, usage: data.usage ? { input_tokens: data.usage.input_tokens, output_tokens: data.usage.output_tokens } : null });
};
function reply(statusCode, body) { return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }, body: JSON.stringify(body) }; }
