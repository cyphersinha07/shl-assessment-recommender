from fastapi import FastAPI, HTTPException, Request
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

# Enable CORS for frontend and automated testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input and Output schemas matching assignment spec
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="Full conversation history (stateless).")

class RecommendationItem(BaseModel):
    name: str
    url: str
    test_type: Literal["K", "P"]

class ChatResponse(BaseModel):
    reply: str
    recommendations: List[RecommendationItem]
    end_of_conversation: bool

@app.get("/health", status_code=200)
async def health():
    """
    GET /health
    Health readiness endpoint. Returns status 'ok' with HTTP 200.
    """
    logger.info("Health check endpoint pinged.")
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    POST /chat
    Main stateless conversation endpoint. Takes the entire dialogue history
    and returns the next agent turn, recommendations list, and conversation status.
    """
    logger.info(f"Received chat request with {len(request.messages)} messages.")
    
    if not request.messages:
        raise HTTPException(status_code=400, detail="Conversation history cannot be empty.")
        
    try:
        # Convert Pydantic models to dict lists for recommender engine
        history_dicts = [{"role": m.role, "content": m.content} for m in request.messages]
        
        # Run through the RAG recommender
        response_data = recommender.chat(history_dicts)
        
        return ChatResponse(
            reply=response_data["reply"],
            recommendations=response_data["recommendations"],
            end_of_conversation=response_data["end_of_conversation"]
        )
    except Exception as e:
        logger.error(f"Error handling chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error processing your conversation.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
