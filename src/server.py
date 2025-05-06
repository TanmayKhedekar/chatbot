def generate_cohere_response(prompt):
    try:
        response = cohere.Client("AmcoynN0RFQEAXzxVQHsktkyhqA5ew78h7JEj95m").generate(
            model='command-xlarge-nightly',
            prompt=prompt,
            max_tokens=100
        )
        return response.generations[0].text.strip()
    except Exception as e:
        return f"Error: {str(e)}"
