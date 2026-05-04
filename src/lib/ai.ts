import { toast } from "sonner";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_URL = import.meta.env.VITE_AI_URL ?? OPENROUTER_URL;
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL ?? "openrouter/auto";

export type AiMode = "owner-chat" | "tenant-chat" | "draft-notice" | "insights";

export async function streamAi({
  mode,
  messages,
  context,
  onDelta,
  onDone,
  signal,
}: {
  mode: AiMode;
  messages: { role: "user" | "assistant"; content: string }[];
  context?: any;
  onDelta: (chunk: string) => void;
  onDone?: () => void;
  signal?: AbortSignal;
}) {
  if (!OPENROUTER_KEY && AI_URL === OPENROUTER_URL) {
    toast.error("OpenRouter key not configured (VITE_OPENROUTER_API_KEY).");
    return;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const aiKey = import.meta.env.VITE_AI_KEY ?? OPENROUTER_KEY;
  if (aiKey) headers.Authorization = `Bearer ${aiKey}`;

  if (AI_URL === OPENROUTER_URL) {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "NyumbaOS";
  }

  const requestMessages = [
    {
      role: "system",
      content: [
        "You are NyumbaOS AI, a concise property-management assistant.",
        `Mode: ${mode}.`,
        context ? `Context: ${JSON.stringify(context)}` : "",
      ].filter(Boolean).join("\n"),
    },
    ...messages,
  ];

  let resp: Response;
  try {
    resp = await fetch(AI_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: requestMessages,
        stream: true,
      }),
      signal,
    });
  } catch {
    toast.error("AI unreachable");
    return;
  }

  if (resp.status === 429) { toast.error("AI is busy. Try again shortly."); return; }
  if (resp.status === 402) { toast.error("AI credits exhausted. Check your OpenRouter account."); return; }
  if (!resp.ok || !resp.body) { toast.error("AI failed"); return; }

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
        buf = `${line}\n${buf}`;
        break;
      }
    }
  }

  onDone?.();
}
