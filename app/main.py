from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal

from app.config import logger
from app.recommender import recommender

app = FastAPI(
    title="SHL Conversational Assessment Recommender API",
    description="Stateless Conversational Agent to recommend SHL Individual Test Solutions.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Request / Response Models
# =========================

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[Message] = Field(
        ...,
        description="Full conversation history (stateless)."
    )


class RecommendationItem(BaseModel):
    name: str
    url: str
    test_type: Literal["K", "P"]


class ChatResponse(BaseModel):
    reply: str
    recommendations: List[RecommendationItem]
    end_of_conversation: bool


# =========================
# Routes
# =========================

@app.get("/")
async def root():
    return {
        "message": "SHL Assessment Recommender API is running 🚀",
        "health": "/health",
        "docs": "/docs"
    }


@app.get("/health", status_code=200)
async def health():
    logger.info("Health endpoint called.")
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):

    logger.info(f"Received chat request with {len(request.messages)} messages.")

    if not request.messages:
        raise HTTPException(
            status_code=400,
            detail="Conversation history cannot be empty."
        )

    try:
        history = [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in request.messages
        ]

        result = recommender.chat(history)

        return ChatResponse(
            reply=result["reply"],
            recommendations=result["recommendations"],
            end_of_conversation=result["end_of_conversation"]
        )

    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail="Internal Server Error"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )