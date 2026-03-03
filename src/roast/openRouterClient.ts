export interface RoastContext {
  runner: string;
  passes: number;
  fails: number;
  total: number;
  streak: number;
}

export async function getInsult(apiKey: string, context: RoastContext): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  const prompt = `You are a cold, ruthless code reviewer.
A developer just ran ${context.total} tests. ${context.fails} failed, ${context.passes} passed. Failure streak: ${context.streak}.
Write ONE devastating insult. Max 15 words. No profanity. Be specific and clever.
Only output the insult, nothing else.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'vscode-test-motivation'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        max_tokens: 30,
        temperature: 0.9,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    if (!response.ok) { throw new Error('API error'); }

    const data: any = await response.json();
    return data.choices[0].message.content.trim();

  } finally {
    clearTimeout(timeout);
  }
}