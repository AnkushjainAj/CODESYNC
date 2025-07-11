import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

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
    <div style={styles.container} className="bot-container">
      <div style={styles.header} className="bot-header">
        <strong>🤖 CodeSync Mate</strong>
        <button onClick={onClose} style={styles.closeBtn}>×</button>
      </div>

      <div style={styles.messages} className="bot-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.sender === "user" ? "#007bff" : "#333",
              color: "#fff",
            }}
          >
            <span style={{ wordBreak: "break-word" }}>{msg.text}</span>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.message, alignSelf: "flex-start", backgroundColor: "#333", fontStyle: "italic", opacity: 0.7 }}>
            <span>CodeSync Mate is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea} className="bot-inputArea">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
          placeholder="Ask your coding question..."
          className="bot-input"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={styles.sendBtn} className="bot-sendBtn">Send</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: "100px",
    right: "80px",
    width: "380px",
    maxWidth: "95vw",
    height: "520px",
    maxHeight: "80vh",
    backgroundColor: "#1e1e2f",
    color: "#fff",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 0 20px #00ffcc",
    zIndex: 1200,
    transition: "all 0.3s ease-in-out",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #00ffcc",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "16px",
    fontWeight: "bold",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "14px",
  },
  message: {
    maxWidth: "85%",
    padding: "10px 14px",
    borderRadius: "16px",
  },
  inputArea: {
    display: "flex",
    padding: "12px",
    borderTop: "1px solid #00ffcc",
    backgroundColor: "#1e1e2f",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "20px",
    border: "none",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    marginLeft: "10px",
    border: "none",
    backgroundColor: "#00ffcc",
    color: "#000",
    borderRadius: "20px",
    padding: "8px 16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Bot;
