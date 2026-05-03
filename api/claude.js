export default async function handler(req, res) {
  const { messages } = req.body;
  const content = messages[0].content;
  
  const parts = Array.isArray(content) 
    ? content.map(c => c.type === 'text' 
        ? { text: c.text } 
        : { inline_data: { mime_type: c.source.media_type, data: c.source.data }})
    : [{ text: content }];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    }
  );
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  res.status(200).json({ content: [{ type: 'text', text }] });
}
