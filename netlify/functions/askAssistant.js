const OPENROUTER_URL = process.env.OPENROUTER_URL || 'https://api.openrouter.ai/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o-mini';

function extractTextFromResponse(body) {
  try {
    if (!body) return null;
    if (body.choices && body.choices.length) {
      const choice = body.choices[0];
      // choice.message may be { role, content }
      if (choice.message) {
        const content = choice.message.content;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
          // content may be array of strings or objects
          for (const part of content) {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object') {
              if (part.text) return part.text;
              if (Array.isArray(part.content)) {
                for (const c of part.content) {
                  if (typeof c === 'string') return c;
                  if (c?.text) return c.text;
                }
              }
            }
          }
        }
      }
      if (choice.text) return choice.text;
    }
    if (body.output_text) return body.output_text;
    if (body.output && Array.isArray(body.output) && body.output.length) {
      const out = body.output[0];
      if (typeof out === 'string') return out;
      if (out?.content) {
        if (Array.isArray(out.content)) {
          for (const c of out.content) {
            if (typeof c === 'string') return c;
            if (c?.text) return c.text;
          }
        }
      }
    }
    return JSON.stringify(body);
  } catch (e) {
    return String(e);
  }
}

exports.handler = async function (event) {
  if (!OPENROUTER_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }) };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    const context = payload.context_json ? String(payload.context_json).slice(0, 8000) : null;

    const systemMessages = [
      { role: 'system', content: 'You are Apartment Assistant — answer concisely and helpfully based on the data provided.' },
    ];
    if (context) {
      systemMessages.push({ role: 'system', content: `Context:
${context}` });
    }

    const chatMessages = [...systemMessages, ...messages.map((m) => ({ role: m.role, content: m.content }))];

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages: chatMessages }),
    });

    const body = await response.json();
    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: body }) };
    }

    const text = extractTextFromResponse(body) || '';
    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
