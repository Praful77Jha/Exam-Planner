export default async (req) => {
  const body = await req.json();
  const { messages, max_tokens } = body;
  const prompt = messages[0].content;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: prompt }]
    })
  });
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return Response.json({ content: [{ type: 'text', text }] });
};

export const config = { path: '/api/claude' };
