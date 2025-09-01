import { useState } from "react";

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);

    // Send to backend
    const res = await fetch("http://localhost:5001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setInput("");
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", width: "300px", background: "#fff", border: "1px solid #ccc", borderRadius: "10px", padding: "10px" }}>
      <h3>WildLanka Chatbot</h3>
      <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "10px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
            <p><b>{msg.role}:</b> {msg.content}</p>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me something..."
        style={{ width: "80%" }}
      />
      <button onClick={sendMessage} style={{ width: "18%", marginLeft: "2%" }}>Send</button>
    </div>
  );
}

export default Chatbot;
