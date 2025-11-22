import { useState, useEffect, useRef } from "react";
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiMic,
  FiVolume2,
  FiVolumeX,
  FiDownload,
} from "react-icons/fi";
import jsPDF from "jspdf";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [spirit, setSpirit] = useState("elephant");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to WildLanka! 🐘 How can I assist you today with your adventure through the wilderness?",
      isHTML: false,
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  const parks = [
    { name: "Yala National Park", lat: 6.3619, lon: 81.521 },
    { name: "Wilpattu National Park", lat: 8.426, lon: 80.024 },
    { name: "Udawalawe National Park", lat: 6.4746, lon: 80.8987 },
    { name: "Minneriya National Park", lat: 8.027, lon: 80.82 },
    { name: "Kumana National Park", lat: 6.5142, lon: 81.6794 },
    { name: "Horton Plains National Park", lat: 6.801, lon: 80.7998 },
  ];

  useEffect(() => {
    if (isOpen) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech Recognition not supported");
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      handleVoiceResponse(transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis || !voiceEnabled) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
  };
  const toggleVoice = () => {
    if (voiceEnabled) stopSpeaking();
    setVoiceEnabled((p) => !p);
  };

  const toggleSpirit = () => {
    const newSpirit = spirit === "elephant" ? "leopard" : "elephant";
    setSpirit(newSpirit);
    const greeting =
      newSpirit === "elephant"
        ? "You are now guided by the calm Elephant Spirit 🐘 — wise and peaceful."
        : "The Leopard Spirit 🐆 awakens — fierce, fast, and ready for adventure!";
    setMessages((p) => [
      ...p,
      { role: "assistant", content: greeting, ts: new Date().toISOString() },
    ]);
    speak(greeting);
  };

  // === PDF HELPERS ===
  const stripEmojis = (s) =>
    s?.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "");

  const htmlToPlainWithLinks = (html) => {
    if (!html) return { plain: "", links: [] };
    const links = [];
    const aTagRegex = /<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let working = html,
      m;
    while ((m = aTagRegex.exec(working)) !== null) links.push({ url: m[1] });
    working = working.replace(/<br\s*\/?>/gi, "\n");
    working = working.replace(/<\/?[^>]+(>|$)/g, "");
    working = working.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();
    return { plain: working, links };
  };
  const formatTime = (iso) =>
    new Date(iso || Date.now()).toLocaleString("en-GB", { hour12: false });

  // === 📄 Download Chat as PDF (with colored bubbles) ===
  const downloadChatPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48,
      marginY = 56;
    const contentWidth = pageWidth - marginX * 2,
      lineHeight = 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(34, 85, 34);
    doc.text("WildLanka Go – Chat Report", marginX, marginY - 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Generated on: ${formatTime(new Date().toISOString())}`, marginX, marginY - 4);
    doc.setDrawColor(200);
    doc.line(marginX, marginY, pageWidth - marginX, marginY);

    let cursorY = marginY + 25;
    const addPageIfNeeded = (needed) => {
      if (cursorY + needed > pageHeight - marginY - 20) {
        doc.addPage();
        cursorY = marginY + 25;
      }
    };

    const drawBubble = (textLines, who, color, alignRight = false) => {
      const padding = 10;
      const maxWidth = contentWidth * 0.8;
      const bubbleWidth = Math.min(
        doc.getTextWidth(textLines.join(" ")) + padding * 2,
        maxWidth
      );
      const bubbleHeight = textLines.length * lineHeight + padding * 1.5;
      const x = alignRight ? pageWidth - marginX - bubbleWidth : marginX;
      doc.setFillColor(...color);
      doc.roundedRect(x, cursorY, bubbleWidth, bubbleHeight, 8, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      textLines.forEach((ln, i) => {
        doc.text(ln, x + padding, cursorY + padding + (i + 1) * lineHeight - 3);
      });
      cursorY += bubbleHeight + 4;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${who}`, x, cursorY + 10);
      cursorY += 20;
    };

    const userColor = [45, 136, 255];
    const botColor = [90, 190, 90];

    messages.forEach((msg) => {
      const who =
        msg.role === "user"
          ? "You"
          : msg.role === "assistant"
          ? "WildLanka"
          : msg.role;
      const alignRight = msg.role === "user";
      const color = alignRight ? userColor : botColor;
      let body = msg.isHTML
        ? htmlToPlainWithLinks(msg.content).plain
        : msg.content ?? "";
      body = stripEmojis(body);
      const wrapped = doc.splitTextToSize(body, contentWidth * 0.8);
      addPageIfNeeded(wrapped.length * lineHeight + 40);
      drawBubble(wrapped, who, color, alignRight);
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text("© 2025 WildLanka Go", marginX, pageHeight - 18);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 18, {
        align: "right",
      });
    }
    doc.save("WildLanka_Chat_Report.pdf");
  };

  // === same rest of code ===
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const findNearestPark = () => {
    if (!navigator.geolocation) {
      const msg = "Geolocation not supported by your browser.";
      setMessages((p) => [
        ...p,
        { role: "assistant", content: msg, ts: new Date().toISOString() },
      ]);
      speak(msg);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = null,
          min = Infinity;
        parks.forEach((p) => {
          const d = getDistance(latitude, longitude, p.lat, p.lon);
          if (d < min) {
            min = d;
            nearest = p;
          }
        });
        const mapURL = `https://www.google.com/maps?q=${nearest.lat},${nearest.lon}`;
        const html = `The nearest wildlife park is <b>${nearest.name}</b>, approximately <b>${min.toFixed(
          1
        )} km</b> away. 🐾<br><br><a href="${mapURL}" target="_blank" style="color:#007bff;text-decoration:underline;">View on Google Maps</a>`;
        setMessages((p) => [
          ...p,
          { role: "assistant", content: html, isHTML: true, ts: new Date().toISOString() },
        ]);
        speak(`The nearest park is ${nearest.name}, about ${min.toFixed(1)} kilometers away.`);
      },
      () => {
        const msg = "I couldn't access your location. Please enable GPS.";
        setMessages((p) => [
          ...p,
          { role: "assistant", content: msg, ts: new Date().toISOString() },
        ]);
        speak(msg);
      }
    );
  };

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  const linkifyText = (text) =>
    text.replace(
      /(https?:\/\/[^\s]+)/g,
      (u) =>
        `<a href="${u}" target="_blank" style="color:#007bff;text-decoration:underline;">${u}</a>`
    );

  const sendMessage = async (msgText) => {
    const text = (msgText ?? input).trim();
    if (!text) return;
    const newMsgs = [...messages, { role: "user", content: text, ts: new Date().toISOString() }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    if (/nearest park|closest park|find park|wildlife park near me/i.test(text)) {
      findNearestPark();
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = linkifyText(data.reply ?? "");
      setMessages([
        ...newMsgs,
        { role: "assistant", content: reply, isHTML: true, ts: new Date().toISOString() },
      ]);
    } catch {
      setMessages([
        ...newMsgs,
        { role: "assistant", content: "Sorry, I'm having trouble connecting.", ts: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceResponse = async (msgText) => {
    const text = (msgText ?? "").trim();
    if (!text) return;
    const newMsgs = [...messages, { role: "user", content: text, ts: new Date().toISOString() }];
    setMessages(newMsgs);
    setLoading(true);
    if (/nearest park|closest park|find park|wildlife park near me/i.test(text)) {
      findNearestPark();
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = linkifyText(data.reply ?? "");
      setMessages([
        ...newMsgs,
        { role: "assistant", content: reply, isHTML: true, ts: new Date().toISOString() },
      ]);
      speak(data.reply ?? "");
    } catch {
      const failMsg = "Sorry, I couldn't connect right now.";
      setMessages([
        ...newMsgs,
        { role: "assistant", content: failMsg, ts: new Date().toISOString() },
      ]);
      speak(failMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const theme =
    spirit === "elephant"
      ? {
          bg: "bg-green-50",
          header: "bg-green-700",
          userBubble: "bg-blue-500 text-white",
          botBubble: "bg-gray-200 text-gray-800",
        }
      : {
          bg: "bg-amber-50",
          header: "bg-amber-600",
          userBubble: "bg-orange-500 text-white",
          botBubble: "bg-yellow-100 text-yellow-900 border border-yellow-300",
        };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div
          className={`w-80 h-96 rounded-lg shadow-2xl flex flex-col relative overflow-hidden ${theme.bg}`}
        >
          {showWelcome && (
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn bg-white/90 border border-green-300 text-green-800 px-4 py-2 rounded-xl shadow-lg text-center w-64">
              🌺 Welcome to <b>WildLanka!</b>
              <br />Ask me about parks, safaris, or wildlife 🐾
            </div>
          )}
          <div
            className={`${theme.header} text-white p-3 flex justify-between items-center rounded-t-lg`}
          >
            <h3 className="font-bold text-lg flex items-center gap-2">
              {spirit === "elephant" ? "🐘 Elephant Spirit" : "🐆 Leopard Spirit"}
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={downloadChatPDF} className="text-white hover:text-gray-200">
                <FiDownload size={20} />
              </button>
              <button onClick={toggleSpirit} className="text-white hover:text-gray-200 text-xl">
                {spirit === "elephant" ? "🐆" : "🐘"}
              </button>
              <button onClick={toggleVoice} className="text-white hover:text-gray-200">
                {voiceEnabled ? <FiVolume2 size={20} /> : <FiVolumeX size={20} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <FiX size={22} />
              </button>
            </div>
          </div>
          <div ref={chatContainerRef} className={`flex-1 p-4 overflow-y-auto ${theme.bg}`}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-3`}>
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                    msg.role === "user" ? theme.userBubble : theme.botBubble
                  }`}
                >
                  <div className="text-[10px] opacity-70 mb-1">
                    {new Date(msg.ts ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {msg.isHTML ? (
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                {spirit === "elephant" ? (
                  <div className="loader-leaf text-green-700 text-2xl">🌿</div>
                ) : (
                  <div className="loader-paw text-yellow-700 text-2xl">🐾</div>
                )}
              </div>
            )}
          </div>
          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <button
              onClick={handleVoiceInput}
              className={`p-3 rounded-full ${
                listening ? "bg-red-500" : "bg-gray-300 hover:bg-gray-400"
              } text-white transition-colors`}
            >
              <FiMic size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me something..."
              className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => sendMessage()}
              className={`${theme.header} text-white p-3 rounded-full hover:opacity-90 transition-colors`}
            >
              <FiSend size={20} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`${theme.header} text-white p-4 rounded-full shadow-lg hover:opacity-90 transform hover:scale-110`}
        >
          <FiMessageSquare size={32} />
        </button>
      )}
      <style>{`
        @keyframes fadeIn {from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}}
        .animate-fadeIn{animation:fadeIn 1s ease-in-out;}
        @keyframes pawWalk{0%,100%{transform:translateX(0);opacity:1;}50%{transform:translateX(10px);opacity:0.6;}}
        @keyframes leafSway{0%,100%{transform:rotate(0deg);}50%{transform:rotate(15deg);}}
        .loader-paw{animation:pawWalk 1s ease-in-out infinite;}
        .loader-leaf{animation:leafSway 1s ease-in-out infinite;}
      `}</style>
    </div>
  );
}

export default Chatbot;
