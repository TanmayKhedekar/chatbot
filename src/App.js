import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "jarvis", text: "Hello! How can I help you today?", isCode: false },
  ]);
  const [listening, setListening] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);

  const synth = window.speechSynthesis;
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  useEffect(() => {
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
      const voiceInput = event.results[0][0].transcript.toLowerCase();
      setInput(voiceInput);
      setListening(false);
      
      if (voiceInput.includes("jarvis")) {
        const response = ["Hello, Boss!", "Okay, Boss!"][Math.floor(Math.random() * 2)];
        setMessages((prev) => [...prev, { sender: "jarvis", text: response, isCode: false }]);
        handleTTS(response);
      } else {
        const commandResponse = await handleCommand(voiceInput);
        if (commandResponse) {
          setMessages((prev) => [...prev, { sender: "jarvis", text: commandResponse, isCode: false }]);
          handleTTS(commandResponse);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      alert("Error capturing voice input. Please check microphone access and try again.");
      setListening(false);
    };
  }, []);

  const handleTTS = (text) => {
    if (synth && typeof synth.speak === "function") {
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    } else {
      console.error("Speech synthesis not supported.");
    }
  };

  const executeSystemCommand = async (command) => {
    try {
      const response = await fetch("http://localhost:5001/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error("Error executing system command:", error);
      return "Failed to execute system command.";
    }
  };

  const takePicture = async () => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await new Promise((resolve) => (video.onloadedmetadata = resolve));
      video.play();
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      stream.getTracks().forEach(track => track.stop());
      
      return "Picture taken successfully!";
    } catch (error) {
      console.error("Error capturing picture:", error);
      return "Failed to take picture.";
    }
  };

  const handleCommand = useCallback(async (command) => {
    if (command.includes("jarvis")) {
      return null; // Already handled in recognition.onresult
    }
    if (command.includes("open google")) {
      window.open("https://www.google.com", "_blank");
      return "Opening Google...";
    } else if (command.includes("open youtube")) {
      window.open("https://www.youtube.com", "_blank");
      return "Opening YouTube...";
    } else if (command.includes("check weather")) {
      window.open("https://weather.com", "_blank");
      return "Checking the weather...";
    } else if (command.includes("take my picture")) {
      return await takePicture();
    } else if (command.includes("open notepad") || command.includes("open calculator") || command.includes("open command prompt")) {
      return await executeSystemCommand(command);
    }
    return null;
  }, []);

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    setListening(true);
    setIsVoiceInput(true);
    recognition.start();
  };

  const handleSubmit = async () => {
    const userMessage = input;
    setMessages((prevMessages) => [...prevMessages, { sender: "user", text: userMessage, isCode: false }]);

    const commandResponse = await handleCommand(userMessage.toLowerCase());
    if (commandResponse) {
      setMessages((prev) => [...prev, { sender: "jarvis", text: commandResponse, isCode: false }]);
      handleTTS(commandResponse);
      setInput("");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user123",
          input: userMessage,
          model: "command-xlarge",
          kwargs: { max_tokens: 100, temperature: 0.7 },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, { sender: "jarvis", text: data.output, isCode: data.is_code }]);
        if (isVoiceInput) {
          handleTTS(data.output);
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, { sender: "jarvis", text: `Error: ${data.error}`, isCode: false }]);
      }
    } catch (error) {
      setMessages((prevMessages) => [...prevMessages, { sender: "jarvis", text: `Error: ${error.message}`, isCode: false }]);
    }
    setInput("");
    setIsVoiceInput(false);
  };

  return (
    <div className="App">
      <header className="navbar">
        <h1>J.A.R.V.I.S</h1>
      </header>
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
            <span className={`voice-icon ${listening ? "listening" : ""}`} onClick={handleVoiceInput}>🎤</span>
          </div>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default App;
