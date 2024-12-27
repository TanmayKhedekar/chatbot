import React, { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "jarvis", text: "Hello! How can I help you today?" },
  ]);

  const handleSubmit = async () => {
    const userMessage = input;
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: userMessage },
    ]);

    try {
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          library: "cohere",
          model: "command-xlarge",
          input: userMessage,
          kwargs: {
            max_tokens: 100,
            temperature: 0.7,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "jarvis", text: data.output },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "jarvis", text: `Error: ${data.error}` },
        ]);
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "jarvis", text: `Error: ${error.message}` },
      ]);
    }

    setInput("");
  };

  return (
    <div className="App">
      {/* Navbar */}
      <header className="navbar">
        <h1>J.A.R.V.I.S</h1>
        <ul>
          <li>Home</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1>Welcome to J.A.R.V.I.S</h1>
        <p>Your AI-powered companion, always ready to assist!</p>
      </section>

      {/* Chat Container */}
      <div className="chat-container">
        <div className="chat-header">Chat with J.A.R.V.I.S</div>
        <div className="chat-box">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${message.sender}-message`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <textarea
            placeholder="Ask me something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default App;

