exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { messages } = body;
  const prompt = messages[0].content;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: prompt }] })
    }
  );
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: [{ type: 'text', text }] })
  };
};
