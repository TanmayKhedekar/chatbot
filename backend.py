from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import logging
import subprocess
import pyttsx3
import pyautogui
import threading
import webbrowser
import speech_recognition as sr
import cohere
from dotenv import load_dotenv
from langdetect import detect
from transformers import pipeline

# Load environment variables
load_dotenv()

# Flask app setup
app = Flask(__name__)
CORS(app)

# Logging configuration
logging.basicConfig(filename="jarvis.log", level=logging.INFO, format="%(asctime)s - %(message)s")

# Initialize TTS Engine
engine = pyttsx3.init()
engine.setProperty("rate", 150)

# Load API keys
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
cohere_client = cohere.Client(COHERE_API_KEY)

# Intent detection model
intent_classifier = pipeline("text-classification", model="facebook/bart-large-mnli")

# Context storage
user_contexts = {}
CREATOR_NAME = "Tanmay Khedekar"
CHATBOT_NAME = "J.A.R.V.I.S"

# Speak function
def speak(text):
    engine.say(text)
    engine.runAndWait()

# Continuous listening function
def continuous_listen():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        while True:
            try:
                print("Listening...")
                audio = recognizer.listen(source)
                command = recognizer.recognize_google(audio).lower()
                if "jarvis stop" in command:
                    speak("Stopping continuous mode.")
                    break
                response = handle_intent(command)
                if response == "Command not recognized.":
                    response = generate_chatbot_response(command, "default_user", True)["output"]
                speak(response)
            except sr.UnknownValueError:
                speak("I couldn't understand that.")

# Weather function
def get_weather(city):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
        response = requests.get(url).json()
        if response.get("cod") != 200:
            return "Couldn't fetch weather."
        return f"{city} weather: {response['main']['temp']}°C, {response['weather'][0]['description']}"
    except:
        return "Error fetching weather."

# News function
def get_news():
    try:
        url = f"https://newsapi.org/v2/top-headlines?country=in&apiKey={NEWS_API_KEY}"
        response = requests.get(url).json()
        if response.get("status") != "ok":
            return "Couldn't fetch news."
        return "Top news: " + " ".join([a['title'] for a in response["articles"][:3]])
    except:
        return "Error fetching news."

# YouTube search
def play_song(song):
    threading.Thread(target=lambda: webbrowser.open(f"https://www.youtube.com/results?search_query={song}"), daemon=True).start()
    return f"Playing {song} on YouTube."

# Google search
def google_search(query):
    webbrowser.open(f"https://www.google.com/search?q={query}")
    return f"Searching for {query}."

# Open applications
def open_app(app_name):
    apps = {
        "notepad": "notepad.exe",
        "chrome": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "vs code": "C:\\Users\\Asus\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
    }
    if app_name in apps:
        subprocess.Popen(apps[app_name])
        return f"Opening {app_name}."
    return "Application not found."

# Shutdown or Restart system
def system_control(action):
    if action == "shutdown":
        os.system("shutdown /s /t 1")
        return "Shutting down the system."
    elif action == "restart":
        os.system("shutdown /r /t 1")
        return "Restarting the system."
    return "Invalid system command."

# Intent-based command execution
def handle_intent(user_input):
    intents = {
        "play music": play_song,
        "check weather": get_weather,
        "get news": get_news,
        "search google": google_search,
        "open app": open_app,
        "shutdown": lambda _: system_control("shutdown"),
        "restart": lambda _: system_control("restart")
    }
    
    prediction = intent_classifier(user_input)[0]["label"].lower()
    for intent, function in intents.items():
        if intent in prediction:
            return function(user_input.replace(intent, "").strip())
    return "Command not recognized."

# API Endpoints
@app.route("/start_listening", methods=["GET"])
def start_listening():
    threading.Thread(target=continuous_listen, daemon=True).start()
    return jsonify({"success": True, "message": "JARVIS is now continuously listening. Say 'Jarvis stop' to stop."})

if __name__ == "__main__":
    app.run(debug=True, port=5000)