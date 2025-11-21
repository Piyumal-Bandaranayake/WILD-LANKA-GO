const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

console.log("🔍 OpenAI key loaded?", process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No");

const router = express.Router();

// GET route for testing
router.get("/", (req, res) => {
  res.json({ message: "Chatbot routes are working", status: "success" });
});

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key not found, using fallback responses");
      const fallbackReply = getFallbackResponse(message);
      return res.json({ reply: fallbackReply });
    }

    const context = `
      You are a friendly and knowledgeable virtual assistant for WildLanka Go — a Sri Lankan wildlife and eco-tourism platform.
      Key information:
      - Safari and wildlife tours can be booked through the Tours page.
      - Accommodation booking is available on the Accommodation section.
      - Feedback and complaints can be submitted through respective pages.
      - Study materials for wildlife enthusiasts are available under Study Materials.
      - Job opportunities and careers are listed under Careers.
      - Donations support wildlife conservation.
      - Contact: +94 77 886 8965 | Open 9AM–6PM daily.
      - For emergencies, users should call the hotline or use the emergency form.
      Always respond politely, warmly, and only about WildLanka Go.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: context },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    console.log(data);

    if (data.choices && data.choices.length > 0) {
      res.json({ reply: data.choices[0].message.content });
    } else if (data.error && data.error.code === "insufficient_quota") {
      console.log("OpenAI API quota exceeded, using fallback responses");
      const fallbackReply = getFallbackResponse(message);
      res.json({ reply: fallbackReply });
    } else {
      console.log("OpenAI API error, using fallback responses");
      const fallbackReply = getFallbackResponse(message);
      res.json({ reply: fallbackReply });
    }
  } catch (err) {
    console.log("OpenAI API request failed, using fallback responses:", err.message);
    const fallbackReply = getFallbackResponse(req.body.message);
    res.json({ reply: fallbackReply });
  }
});

// Fallback responses for when API is offline or key missing
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Greetings
  if (["hello", "hi", "hey", "good morning", "good afternoon", "good evening"].some(w => lowerMessage.includes(w))) {
    return "Hello! 👋 Welcome to WildLanka Go — your gateway to Sri Lanka’s wildlife and adventures! How can I help you today?";
  }

  // Safari / Tours
  if (lowerMessage.includes("safari") || lowerMessage.includes("tour") || lowerMessage.includes("booking")) {
    return "🐘 You can book safaris and wildlife tours on our **Tours** page. Explore amazing destinations like Yala, Udawalawe, and Wilpattu!";
  }

  // Accommodation
  if (lowerMessage.includes("hotel") || lowerMessage.includes("stay") || lowerMessage.includes("accommodation") || lowerMessage.includes("room")) {
    return "🏡 We offer comfortable wildlife-friendly stays. Visit the **Accommodation** page to view and book your preferred lodging.";
  }

  // Complaints
  if (lowerMessage.includes("complaint") || lowerMessage.includes("problem") || lowerMessage.includes("issue")) {
    return "⚠️ You can report any problems through the **Complaints** page. Our team will review and take necessary action promptly.";
  }

  // Feedback
  if (lowerMessage.includes("feedback") || lowerMessage.includes("review") || lowerMessage.includes("suggestion")) {
    return "💬 We’d love your feedback! Visit the **Feedback** page to share your thoughts and experiences with us.";
  }

  // Study materials
  if (lowerMessage.includes("study") || lowerMessage.includes("material") || lowerMessage.includes("learn") || lowerMessage.includes("education")) {
    return "📚 Explore our **Study Materials** section to find wildlife facts, guides, and learning resources for students and enthusiasts.";
  }

  // Careers / Jobs
  if (lowerMessage.includes("job") || lowerMessage.includes("career") || lowerMessage.includes("vacancy") || lowerMessage.includes("work")) {
    return "💼 Check out our **Careers** page for current job openings and internship opportunities related to wildlife and tourism.";
  }

  // Donations
  if (lowerMessage.includes("donation") || lowerMessage.includes("donate") || lowerMessage.includes("support") || lowerMessage.includes("help conservation")) {
    return "💚 Thank you for caring! You can support our wildlife conservation efforts through the **Donations** page.";
  }

  // Emergency
  if (lowerMessage.includes("emergency") || lowerMessage.includes("urgent") || lowerMessage.includes("help")) {
    return "🚨 For emergencies, please call our hotline **+94 77 886 8965** or use the **Emergency** form on our website.";
  }

  // Contact
  if (lowerMessage.includes("contact") || lowerMessage.includes("call") || lowerMessage.includes("phone") || lowerMessage.includes("email")) {
    return "📞 You can contact us at **+94 77 886 8965** or email **info@wildlankago.com**. We’re available daily from 9AM to 6PM.";
  }

  // Opening hours
  if (lowerMessage.includes("open") || lowerMessage.includes("hour") || lowerMessage.includes("time")) {
    return "🕘 We’re open every day from **9:00 AM to 6:00 PM**. You can reach us or make bookings anytime online!";
  }

  // About WildLanka
  if (lowerMessage.includes("about") || lowerMessage.includes("wildlanka") || lowerMessage.includes("who are you")) {
    return "🌿 WildLanka Go is Sri Lanka’s premier wildlife and eco-tourism platform — offering safaris, accommodation bookings, conservation support, and study materials for nature lovers.";
  }

  // Events / Activities
  if (lowerMessage.includes("event") || lowerMessage.includes("activity") || lowerMessage.includes("program")) {
    return "🎉 We organize wildlife-related events, safaris, and awareness programs. Keep an eye on our site and social media for updates!";
  }

  // Location / Directions
  if (lowerMessage.includes("where") || lowerMessage.includes("location") || lowerMessage.includes("map")) {
    return "📍 We operate across multiple national parks and wildlife zones in Sri Lanka. Visit our **Contact** page for directions and park locations.";
  }

  // Social media
  if (lowerMessage.includes("instagram") || lowerMessage.includes("facebook") || lowerMessage.includes("tiktok") || lowerMessage.includes("social")) {
    return "📲 Follow WildLanka Go on **Instagram**, **Facebook**, and **TikTok** for the latest wildlife moments and updates!";
  }

  // 🐘 Elephant facts
  if (lowerMessage.includes("elephant")) {
    return "🐘 The Sri Lankan elephant is a subspecies of the Asian elephant and one of the most iconic animals in Sri Lanka! You can often spot them in **Udawalawe** and **Minneriya National Parks**. They are gentle giants and play a vital role in maintaining the ecosystem.";
  }

  // 🐆 Leopard facts
  if (lowerMessage.includes("leopard")) {
    return "🐆 The Sri Lankan leopard (*Panthera pardus kotiya*) is the top predator in Sri Lanka and found mainly in **Yala National Park**. It’s unique to the island and is a symbol of strength and grace in the wild.";
  }

  // 🇱🇰 National bird of Sri Lanka
  if (lowerMessage.includes("national bird")) {
    return "🐦 The **national bird of Sri Lanka** is the **Sri Lankan Junglefowl** (*Gallus lafayettii*). It’s an endemic bird species found only in Sri Lanka and resembles a colorful wild rooster.";
  }

  // 🇱🇰 National animal of Sri Lanka
  if (lowerMessage.includes("national animal")) {
    return "🦣 The **national animal of Sri Lanka** is the **Sri Lankan elephant** (*Elephas maximus maximus*). It represents strength, wisdom, and cultural pride of the nation.";
  }

  // Technical help
  if (lowerMessage.includes("chatbot") || lowerMessage.includes("website") || lowerMessage.includes("error") || lowerMessage.includes("cannot")) {
    return "🧭 If you’re facing technical issues, try refreshing the page or clearing your browser cache. For further help, reach us via the **Contact** page.";
  }

  // General help
  if (lowerMessage.includes("help") || lowerMessage.includes("how") || lowerMessage.includes("what")) {
    return "🤝 I’m here to assist you! You can ask about tours, accommodation, jobs, donations, complaints, or any WildLanka service.";
  }

  // Default
  return "🌺 Thank you for your message! I’m your WildLanka assistant. You can ask me about safari bookings, accommodation, feedback, jobs, or conservation support. For emergencies, call **+94 77 886 8965**.";
}

module.exports = router;
