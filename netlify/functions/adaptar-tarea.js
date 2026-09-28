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
    upstream = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }, body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna", store: false, reasoning: { effort: "none" }, max_output_tokens: 700,
      instructions, input: [{ role: "user", content: [{ type: "input_text", text: inputText }, { type: "input_image", image_url: image, detail: "low" }] }],
      text: { format: { type: "json_schema", name: "task_adaptation", strict: true, schema } }
    }) });
  } catch (_) { return reply(502, { error: "ai_unavailable" }); }
  if (!upstream.ok) return reply(502, { error: "ai_request_failed" });
  let data;
  try { data = await upstream.json(); } catch (_) { return reply(502, { error: "ai_invalid_response" }); }
  if (!data.output_text) return reply(502, { error: "ai_empty_response" });
  let adaptation;
  try { adaptation = JSON.parse(data.output_text); } catch (_) { return reply(502, { error: "ai_invalid_result" }); }
  if (!skills.has(adaptation.skill) || !["reading", "math"].includes(adaptation.subject)) return reply(502, { error: "ai_invalid_result" });
  return reply(200, { adaptation, usage: data.usage ? { input_tokens: data.usage.input_tokens, output_tokens: data.usage.output_tokens } : null });
};
function reply(statusCode, body) { return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }, body: JSON.stringify(body) }; }
