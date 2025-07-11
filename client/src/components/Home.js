import React, { useState } from "react";
import { nanoid } from "nanoid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const id = nanoid(7);
    setRoomId(id);
    toast.success("Room ID generated!");
  };

  const joinRoom = () => {
    if (!roomId.trim() || !username.trim()) {
      toast.error("Both fields are required!");
      return;
    }

    navigate(`/editor/${roomId}`, {
      state: { username },
    });
    toast.success("Joining room...");
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2024/09/19/17/34/ai-generated-9059345_1280.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        className="p-4"
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "rgba(0, 0, 0, 0.6)",
          borderRadius: "20px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 0 20px rgba(0, 255, 128, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      >
<div className="text-center mb-4">
  <img
    src="https://tse3.mm.bing.net/th/id/OIP.-8CNbxYfFqQWQcdwmTwXhwHaHa?pid=Api&P=0&h=220"
    alt="CodeSync Logo"
    className="img-fluid mb-3 rounded-circle shadow"
    style={{ maxWidth: "90px", border: "2px solid #00ffcc" }}
  />
  <h2 style={{ fontWeight: "700", color: "#00ffcc" }}>CodeSync</h2>
  <p
    className="text-light"
    style={{
      fontSize: "14px",
      fontStyle: "italic",
      fontWeight: "300",
      letterSpacing: "0.3px",
    }}
  >
    Code together. Build smarter. Sync in style.
  </p>
</div>


        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="form-control mb-3"
          placeholder="Enter Room ID"
          onKeyUp={handleInputEnter}
          style={{
            backgroundColor: "#fff",
            color: "#222",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "10px",
            fontWeight: "500",
          }}
        />

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-control mb-4"
          placeholder="Enter Username"
          onKeyUp={handleInputEnter}
          style={{
            backgroundColor: "#fff",
            color: "#222",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "10px",
            fontWeight: "500",
          }}
        />

        <button
          onClick={joinRoom}
          className="btn w-100 mb-3"
          style={{
            backgroundColor: "#00ffcc",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "10px",
            boxShadow: "0 0 10px #00ffcc",
          }}
        >
          🚀 Join Room
        </button>

        <p className="text-center text-light">
          Don't have a room?{" "}
          <span
            onClick={generateRoomId}
            style={{
              color: "#00ffcc",
              cursor: "pointer",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            Create New Room
          </span>
        </p>
      </div>
    </div>
  );
}

export default Home;
