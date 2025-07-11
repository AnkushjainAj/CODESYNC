import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import { useNavigate, useLocation, Navigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import Bot from "./Bot";

const LANGUAGES = ["c", "cpp", "java", "python3", "sql", "javascript"];

const DEFAULT_TEMPLATES = {
  c: `#include<stdio.h>

int main() {
    // Your code here
    return 0;
}`,
  cpp: `#include<iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        // Your code here
    }
}`,
  python3: `# Your Python code here
print("Hello, CodeSync!")`,
  sql: `-- Your SQL query here
SELECT * FROM table_name;`,
  javascript: `// Your JavaScript code here
console.log("Hello, CodeSync!");`,
};

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python3");
  const [code, setCode] = useState(DEFAULT_TEMPLATES["python3"]);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const codeRef = useRef(code);

  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const socketRef = useRef(null);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      function handleErrors(err) {
        console.error("Socket error:", err);
        toast.error("Socket connection failed, Try again later.");
        navigate("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room.`);
        }
        setClients(clients);
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });
    };
    init();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current?.off(ACTIONS.JOINED);
      socketRef.current?.off(ACTIONS.DISCONNECTED);
    };
  }, [navigate, location.state, roomId]);

  if (!location.state) return <Navigate to="/" />;

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch {
      toast.error("Failed to copy Room ID");
    }
  };

  const leaveRoom = () => navigate("/");

  const runCode = async () => {
    setIsCompiling(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/compile`, {
        code: codeRef.current,
        language: selectedLanguage,
      });

      setOutput(response.data.output || JSON.stringify(response.data));
    } catch (err) {
      setOutput(err.response?.data?.error || "Error compiling code");
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () => {
    setIsCompileWindowOpen((prev) => !prev);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const defaultCode = DEFAULT_TEMPLATES[lang] || "";
    setSelectedLanguage(lang);
    setCode(defaultCode);
    codeRef.current = defaultCode;
    socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
      roomId,
      code: defaultCode,
    });
  };

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column" style={{ backgroundColor: "#0f111a" }}>
      <div className="row flex-grow-1">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2 d-flex flex-column text-white p-2" style={{ backgroundColor: "#1e1e2f" }}>
          <div className="text-center mb-3">
            <img
              src="https://tse3.mm.bing.net/th/id/OIP.-8CNbxYfFqQWQcdwmTwXhwHaHa?pid=Api&P=0&h=220"
              alt="CodeSync Logo"
              className="img-fluid rounded-circle shadow"
              style={{ width: "80px", border: "2px solid #00ffcc" }}
            />
            <h5 className="mt-2" style={{ color: "#00ffcc", fontWeight: "600" }}>CodeSync</h5>
            <p className="small" style={{ fontStyle: "italic", color: "#00ffcc", fontWeight: "300" }}>
              Real-time collaboration. Smarter coding. 🚀
            </p>
          </div>

          <hr className="text-light" />

          <div className="flex-grow-1 overflow-auto">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong style={{ color: "#bbb" }}>Members:</strong>
              <span style={{ color: "#00ffcc", fontSize: "14px", fontWeight: "500" }}> Participants :
                {clients.length}
              </span>
            </div>

            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

          <hr className="text-light" />

          <div className="mt-auto mb-2">
            <button
              className="btn w-100 mb-2 d-flex align-items-center justify-content-center"
              style={{
                fontWeight: 600,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #00ffcc, #0077ff)",
                color: "#000",
                transition: "all 0.3s",
              }}
              onClick={copyRoomId}
            >
              <i className="bi bi-clipboard me-2"></i> Copy Room ID
            </button>

            <button
              className="btn w-100 d-flex align-items-center justify-content-center"
              style={{
                fontWeight: 600,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ff4e50, #f9d423)",
                color: "#000",
                transition: "all 0.3s",
              }}
              onClick={leaveRoom}
            >
              <i className="bi bi-box-arrow-left me-2"></i> Leave Room
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="col-12 col-md-9 col-lg-10 d-flex flex-column p-0">
          <div className="bg-dark p-2 d-flex justify-content-end flex-wrap">
            <select
              className="form-select form-select-sm w-auto bg-light text-dark"
              style={{ borderRadius: "8px", fontWeight: "500" }}
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <Editor
            key={selectedLanguage}
            socketRef={socketRef}
            roomId={roomId}
            code={code}
            onCodeChange={(updatedCode) => {
              setCode(updatedCode);
              codeRef.current = updatedCode;
            }}
            selectedLanguage={selectedLanguage}
          />
        </div>
      </div>

      {/* Compile Button */}
      <button
        className="btn btn-primary position-fixed bottom-0 end-0 m-3"
        onClick={toggleCompileWindow}
        style={{ zIndex: 1050 }}
      >
        {isCompileWindowOpen ? "Close Compiler" : "Open Compiler"}
      </button>

      {/* Compiler Output */}
      <div
        className={`bg-black text-light ${isCompileWindowOpen ? "d-block" : "d-none"}`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30vh",
          transition: "all 0.3s ease-in-out",
          overflowY: "auto",
          zIndex: 1040,
          borderTop: "2px solid #00ffcc",
        }}
      >
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
          <h5 className="m-0">Compiler Output ({selectedLanguage})</h5>
          <div>
            <button
              className="btn btn-success btn-sm me-2"
              onClick={runCode}
              disabled={isCompiling}
            >
              {isCompiling ? "Compiling..." : "Run Code"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={toggleCompileWindow}>
              Close
            </button>
          </div>
        </div>
        <pre
          className="p-3 rounded"
          style={{
            backgroundColor: "#121212",
            color: "#00ff90",
            fontFamily: "Fira Code, monospace",
            fontSize: "14px",
          }}
        >
          {output || "// Output will appear here after compilation..."}
        </pre>
      </div>

      {/* Bot Button */}
      <div
        className="position-fixed end-0 m-4"
        style={{ bottom: "80px", zIndex: 1100 }}
      >
        <img
          src="https://tse2.mm.bing.net/th/id/OIP.Xy3MEyqhqGeKjY5VznKpUgHaHa?pid=Api&P=0&h=220"
          alt="Bot"
          style={{
            width: "65px",
            height: "65px",
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: "0 0 12px #00ffcc",
            border: "2px solid #00ffcc",
            backgroundColor: "#1e1e2f",
            padding: "5px",
          }}
          onClick={() => setIsBotOpen(!isBotOpen)}
        />
      </div>

      {isBotOpen && <Bot onClose={() => setIsBotOpen(false)} />}
    </div>
  );
}

export default EditorPage;
