import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Bot.css"; // 👈 Don't forget to import the CSS file

function Bot({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const welcomeMsgs = [
      { sender: "bot", text: "👋 Hello! I am CodeSync Mate. How can I help you today?" },
      { sender: "bot", text: "💡 CodeSync is a collaborative coding platform where you can code together in real-time, compile & run code, and ask me coding doubts anytime." }
    ];
    setMessages(welcomeMsgs);
  }, []);

  const sendMessage = async () => {
    const userInput = input.trim();
    if (!userInput) return;

    const userMsg = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const requestBody = {
      contents: [
        {
          parts: [
            { text: `You are CodeSync Mate, a helpful code instructor bot. Answer the following question clearly:\n\n${userInput}` }
          ]
        }
      ]
    };

    try {
      const res = await axios.post(apiUrl, requestBody, {
        headers: { "Content-Type": "application/json" },
      });

      let reply = "🤖 Sorry, I couldn't generate a proper response.";
      if (res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        reply = res.data.candidates[0].content.parts[0].text;
      }

      const botReply = { sender: "bot", text: reply };
      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error responding. Please check your API key or try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bot-container">
      <div className="bot-header">
        <strong>🤖 CodeSync Mate</strong>
        <button onClick={onClose} className="bot-closeBtn">×</button>
      </div>

      <div className="bot-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`bot-message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            <span>{msg.text}</span>
          </div>
        ))}

        {loading && (
          <div className="bot-message bot typing">
            <span>CodeSync Mate is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bot-inputArea">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bot-input"
          placeholder="Ask your coding question..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="bot-sendBtn">Send</button>
      </div>
    </div>
  );
}

export default Bot;
