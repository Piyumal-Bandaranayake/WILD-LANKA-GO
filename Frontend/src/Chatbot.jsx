import { useState, useEffect, useRef } from "react";
import { FiMessageSquare, FiX, FiSend } from "react-icons/fi";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to WildLanka! How can I help you today? If you need urgent assistance, you can call us at +94 77 886 8965.",
    },
  ]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const res = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response from the server.');
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again later." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col">
          <div className="bg-green-600 text-white p-3 flex justify-between items-center rounded-t-lg">
            <h3 className="font-bold text-lg">WildLanka Chat</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <FiX size={24} />
            </button>
          </div>
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-3`}>
                <div className={`px-4 py-2 rounded-2xl max-w-xs ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-white border-t border-gray-200 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me something..."
              className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={sendMessage} className="ml-3 bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition-colors">
              <FiSend size={20} />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-110">
          <FiMessageSquare size={32} />
        </button>
      )}
    </div>
  );
}

export default Chatbot;