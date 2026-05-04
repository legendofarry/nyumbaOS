import { c as createLucideIcon, t as toast } from "./router-DRMkp4_G.js";
const __iconNode = [
  [
    "path",
    {
      d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
      key: "1s2grr"
    }
  ],
  ["path", { d: "M20 2v4", key: "1rf3ol" }],
  ["path", { d: "M22 4h-4", key: "gwowj6" }],
  ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }]
];
const Sparkles = createLucideIcon("sparkles", __iconNode);
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_URL = OPENROUTER_URL;
const OPENROUTER_KEY = "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";
const OPENROUTER_MODEL = "openrouter/auto";
async function streamAi({
  mode,
  messages,
  context,
  onDelta,
  onDone,
  signal
}) {
  const headers = { "Content-Type": "application/json" };
  const aiKey = OPENROUTER_KEY;
  headers.Authorization = `Bearer ${aiKey}`;
  {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "NyumbaOS";
  }
  const requestMessages = [
    {
      role: "system",
      content: [
        "You are NyumbaOS AI, a concise property-management assistant.",
        `Mode: ${mode}.`,
        context ? `Context: ${JSON.stringify(context)}` : ""
      ].filter(Boolean).join("\n")
    },
    ...messages
  ];
  let resp;
  try {
    resp = await fetch(AI_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: requestMessages,
        stream: true
      }),
      signal
    });
  } catch {
    toast.error("AI unreachable");
    return;
  }
  if (resp.status === 429) {
    toast.error("AI is busy. Try again shortly.");
    return;
  }
  if (resp.status === 402) {
    toast.error("AI credits exhausted. Check your OpenRouter account.");
    return;
  }
  if (!resp.ok || !resp.body) {
    toast.error("AI failed");
    return;
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;
  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    buf += decoder.decode(value, { stream: true });
    let lineBreak;
    while ((lineBreak = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, lineBreak);
      buf = buf.slice(lineBreak + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        done = true;
        break;
      }
      try {
        const parsed = JSON.parse(json);
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) onDelta(chunk);
      } catch {
        buf = `${line}
${buf}`;
        break;
      }
    }
  }
  onDone?.();
}
export {
  Sparkles as S,
  streamAi as s
};
