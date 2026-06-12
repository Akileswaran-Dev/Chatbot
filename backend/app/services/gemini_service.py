from typing import List
from google import genai
from google.genai import types
from app.core.config import settings
from app.models.message import Message


class GeminiService:
    def __init__(self):
        # Initialize client with settings key
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def compile_history(self, history: List[Message]) -> List[types.Content]:
        """Format database message history into standard Gemini SDK parts."""
        contents = []
        for msg in history:
            # Map role names: database 'user'/'model' to Gemini SDK roles
            role = "user" if msg.role == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.content)]
                )
            )
        return contents

    def generate_stream(
        self,
        contents: List[types.Content],
        system_prompt: str,
        temperature: float
    ):
        """Generate response tokens using gemini-2.5-flash stream."""
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=2048
        )

        return self.client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=contents,
            config=config
        )
