# Conversational SHL Assessment Recommender

A production-ready, stateless conversational agent that guides recruiters and hiring managers from a vague hiring intent (e.g., "I'm hiring a Java developer") to a structured, grounded shortlist of **SHL Individual Test Solutions** through dynamic, natural dialogue.

---

## 🚀 Key Features
- **Stateless API Design**: The backend maintains no session state. The complete conversational history is carried in each request, allowing standard REST scaling.
- **Robust RAG Architecture**: Grounded in the SHL Individual Test Solutions catalog, utilizing **FAISS** vector search and `sentence-transformers` with a fully automatic keyword/TF-IDF fallback.
- **Four Smart Behaviors**:
  - **Clarify**: Prompts for details (role, seniority, skills) when input is vague before recommending.
  - **Recommend**: Suggests 1 to 10 matching assessments with official URLs and test types (`K` for Cognitive/Aptitude/Skills, `P` for Personality/Behavior).
  - **Refine**: Honors edits and constraint changes mid-conversation (e.g., adding personality tests) by adapting the shortlist.
  - **Compare**: Compares assessments directly using only grounded catalog details.
- **Scope Defense**: Politely refuses out-of-scope requests (e.g., legal/compliance, general hiring advice) and prompt-injection attempts.
- **Guaranteed Schema Compliance**: Integrates Gemini 2.5 Flash with strict Pydantic JSON schema generation to guarantee 100% compliant responses.

---

## 🛠️ Tech Stack
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic v2
- **Vector Database**: FAISS (cpu), Sentence-Transformers (`all-MiniLM-L6-v2`)
- **LLM**: Google Gemini 2.5 Flash via the modern `google-genai` SDK
- **Frontend**: React, Tailwind CSS, Lucide icons, Motion (Animate)
- **Deployment**: Docker, Render-compatible

---

## 📂 Project Structure
```text
├── app/
│   ├── __init__.py
│   ├── config.py          # Environment, configuration, and logger setup
│   ├── main.py            # FastAPI entrypoint (GET /health, POST /chat)
│   ├── scraper.py         # Catalog crawler and data organization script
│   ├── database.py        # Vector DB manager (FAISS + MiniLM, fallback keyword search)
│   └── recommender.py     # RAG core, Gemini integrations, conversational logic
├── data/
│   └── shl_catalog.json   # Grounded SHL Individual Test Solutions catalog
├── tests/
│   ├── __init__.py
│   ├── test_api.py        # API endpoint validation and schema checks
│   └── test_recommender.py# Vector database search and recommender checks
├── src/                   # React web application frontend
├── server.ts              # Express server to host Vite development environment
├── Dockerfile             # Container configuration for Python deployment
├── requirements.txt       # Python dependencies list
├── approach_document.md   # Architectural details and design patterns
└── README.md              # Project documentation
```

---

## ⚙️ Setup & Local Execution

### Prerequisites
- Python 3.12+ installed.
- Google Gemini API Key configured.

### 1. Configure Secrets
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="your_google_gemini_api_key"
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Scraper (Optional)
To verify the catalog loading:
```bash
python -m app.scraper
```

### 4. Run the FastAPI Application
Start the development server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API is now running locally at `http://localhost:8000`.
- **Swagger UI Docs**: `http://localhost:8000/docs`
- **Health Check**: `GET http://localhost:8000/health`
- **Chat Endpoint**: `POST http://localhost:8000/chat`

---

## 🧪 Running Unit Tests
Execute the comprehensive test suite using `pytest`:
```bash
pytest -v
```

---

## 🐳 Docker Support
To build and run the application using Docker:

```bash
# Build the Docker image
docker build -t shl-recommender .

# Run the container (injecting your Gemini API Key)
docker run -p 8000:8000 -e GEMINI_API_KEY="your_api_key" shl-recommender
```

---

## 🌐 Deploying to Render
To deploy this project to Render:
1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Select **Docker** as the Runtime environment.
3. Under Environment Variables, add your `GEMINI_API_KEY` secret.
4. Render will automatically build the `Dockerfile` and run the FastAPI service!
