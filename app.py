import webbrowser

def execute_command(input_text):
    """Execute system commands based on input"""
    if "open google" in input_text.lower():
        webbrowser.open("https://www.google.com")
        return "Opening Google..."
    if "open youtube" in input_text.lower():
        webbrowser.open("https://www.youtube.com")
        return "Opening YouTube..."
    return None

@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.json
        input_text = data.get("input", "").lower()

        # Check for system commands
        command_response = execute_command(input_text)
        if command_response:
            return jsonify({"success": True, "output": command_response, "is_code": False})

        # If no system command, use AI response
        response = cohere_client.generate(
            model="command-xlarge",
            prompt=input_text,
            max_tokens=100,
            temperature=0.7,
        )
        return jsonify({"success": True, "output": response.generations[0].text.strip(), "is_code": False})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
