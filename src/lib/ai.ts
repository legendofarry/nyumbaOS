// src\lib\ai.ts
import { toast } from "sonner";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_URL = import.meta.env.VITE_AI_URL ?? OPENROUTER_URL;
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL;

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
}): Promise<boolean> {
  if (!OPENROUTER_KEY && AI_URL === OPENROUTER_URL) {
    toast.error("OpenRouter key not configured (VITE_OPENROUTER_API_KEY).");
    onDelta("AI is not configured. Add VITE_OPENROUTER_API_KEY in Netlify environment variables.");
    onDone?.();
    return false;
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
    onDelta("AI is unreachable. Check the OpenRouter key, model, and network access.");
    onDone?.();
    return false;
  }

  if (resp.status === 429) {
    toast.error("AI is busy. Try again shortly.");
    onDelta("AI is busy. Try again shortly.");
    onDone?.();
    return false;
  }
  if (resp.status === 402) {
    toast.error("AI credits exhausted. Check your OpenRouter account.");
    onDelta("AI credits are exhausted. Check your OpenRouter account.");
    onDone?.();
    return false;
  }
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    toast.error("AI failed");
    onDelta(detail ? `AI failed: ${detail.slice(0, 240)}` : "AI failed. Check your OpenRouter configuration.");
    onDone?.();
    return false;
  }
  if (!resp.body) {
    toast.error("AI response was empty");
    onDelta("AI response was empty.");
    onDone?.();
    return false;
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
        buf = `${line}\n${buf}`;
        break;
      }
    }
  }

  onDone?.();
  return true;
}
