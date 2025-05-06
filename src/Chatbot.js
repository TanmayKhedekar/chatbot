import React, { useState } from "react";
import "./App.css";

function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "jarvis", text: "Hello! How can I help you today?", isCode: false },
  ]);
  const [listening, setListening] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);

  const synth = window.speechSynthesis;
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  const handleVoiceInput = () => {
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);
    setIsVoiceInput(true);

    recognition.onresult = (event) => {
      const voiceInput = event.results[0][0].transcript;
      setInput(voiceInput);
      setListening(false);
    };

    recognition.onerror = () => {
      alert("Error capturing voice input. Please try again.");
      setListening(false);
    };
  };

  const handleTTS = (text) => {
    if (synth && typeof synth.speak === "function") {
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    } else {
      console.error("Speech synthesis not supported.");
    }
  };

  const handleSubmit = async () => {
    const userMessage = input;
    setMessages((prevMessages) => [...prevMessages, { sender: "user", text: userMessage, isCode: false }]);

    try {
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user123",
          input: userMessage,
          model: "command-xlarge",
          kwargs: {
            max_tokens: 100,
            temperature: 0.7,
          },
        }),
      });

      const data = await res.json();
      console.log("API response:", data);

      if (data.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "jarvis", text: data.output, isCode: data.is_code },
        ]);
        if (isVoiceInput) {
          handleTTS(data.output);
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, { sender: "jarvis", text: `Error: ${data.error}`, isCode: false }]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessages((prevMessages) => [...prevMessages, { sender: "jarvis", text: `Error: ${error.message}`, isCode: false }]);
    }

    setInput("");
    setIsVoiceInput(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((message, index) => (
          <div key={index} className={`chat-message ${message.sender}-message`}>
            {message.isCode ? <pre><code>{message.text}</code></pre> : message.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <div className="input-container">
          <textarea placeholder="Ask me something..." value={input} onChange={(e) => setInput(e.target.value)}></textarea>
          <span className={`voice-icon ${listening ? "listening" : ""}`} onClick={handleVoiceInput}>
            🎤
          </span>
        </div>
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}

export default Chatbot;
