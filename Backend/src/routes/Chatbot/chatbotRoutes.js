import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const context = `
      You are a helpful assistant for WildLanka Go.
      Here are some facts:
      - Safari booking is available on our Tours page.
      - Opening hours: 9AM – 6PM daily.
      - Contact: +94-XXX-XXXXXX
      - Wildlife complaints can be submitted via the Complaints page.
      Answer ONLY based on WildLanka Go information.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: context },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    console.log(data); // log the full response for debugging

    if (data.choices && data.choices.length > 0) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "OpenAI API did not return a valid response", data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
