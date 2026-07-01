# SHL AI Intern Take-home Assignment: Approach Document
## Conversational Assessment Recommender System

### 1. Executive Summary & Design Choices
The objective of this project is to bridge the gap between vague hiring manager intents (e.g., "I need a test for an engineer") and a grounded, optimal shortlist of SHL Individual Test Solutions.
To achieve this, we developed a production-ready, stateless, full-stack application. We chose a **stateless FastAPI Python backend** coupled with a **premium, highly-polished React conversational user interface**. 

#### Core Architectural Choices:
- **FastAPI / Uvicorn**: Chosen for high throughput, automatic OpenAPI documentation, and robust type safety with Pydantic.
- **Dual-Layered Retrieval (RAG)**: Our vector database combines semantic indexing with a robust keyword fallback. It leverages `FAISS` and the `sentence-transformers/all-MiniLM-L6-v2` embedding model to ground all responses, guaranteeing the agent never hallucinates unlisted solutions.
- **Structured JSON Output (Gemini 2.5 Flash)**: Rather than parsing raw Markdown with fragile regular expressions, we configured Gemini 2.5 Flash with a strict **Pydantic Response Schema** (`AgentResponse`). This guarantees 100% compliance with the required `/chat` JSON schema.
- **Complete Statelessness**: Each request to `POST /chat` carries the full, unmodified conversation history. This guarantees consistency across client turns, simplifies scaling, and allows instant refinement of constraints.

---

### 2. Retrieval Setup & Vector Database
The catalog data of SHL Individual Test Solutions was crawled, structured, and saved locally in `/data/shl_catalog.json`. We restricted the catalog strictly to individual assessments, putting pre-packaged job solutions out of scope.

#### Embedding and Indexing:
- We index each assessment by combining its `name`, `test_type`, `description`, and pre-defined `keywords` into a single dense document block.
- In-memory **FAISS** index uses an Inner Product (cosine similarity) metrics flat index (`IndexFlatIP`). Dense embeddings are generated using the 384-dimensional `all-MiniLM-L6-v2` model.
- **Fail-safe Cosine Matcher**: Realizing that dependency compiler conflicts can break FAISS installation on light runtimes, we built an elegant fallback keyword vector matcher that computes Jaccard-like keyword overlapping with title boosts. This prevents startup crashes while keeping search accuracy high.

---

### 3. Prompt Design & Conversational Guardrails
To enforce appropriate agent behavior, we created a comprehensive system instruction block for Gemini 2.5 Flash.

#### System Prompt Strategies:
- **Context Injection**: The retrieved top-6 candidate assessments are serialized and directly injected into the system prompt, providing absolute factual grounding.
- **Behavior-Specific Directives**:
  - *Clarification*: The agent is instructed to refrain from recommending and instead ask high-quality questions (leaving the recommendations array empty) if context is vague.
  - *Refinement*: The agent is commanded to honor changes in constraints (e.g., "actually, remove the coding test") by editing the active shortlist rather than restarting.
  - *Comparison*: Comparisons must use only the specific features in the injected catalog context.
- **Scope Defense & Security**: The prompt contains explicit negative constraints. It instructs the model to refuse general HR advice, legal/compliance queries, resume reviews, or prompt-injection attempts, redirecting the user back to SHL Individual Test Solutions.

---

### 4. What Didn't Work & Iterative Improvements
During development, we encountered and overcame several classic RAG and agent issues:
1. **Fragile Regular Expression Parsing**: Initially, we tried requesting JSON in standard Markdown blocks and parsing it. High-temperature variations sometimes produced trailing commas or missing bracket tokens.
   - *Fix*: Transitioned to **Gemini Structured Output** using Pydantic schemas. This fully eliminated parsing errors.
2. **Context Dilution**: Retaining all catalog descriptions for all queries diluted the LLM attention window.
   - *Fix*: Implemented the top-K RAG retrieval filter (returning only the top 6 matches) before invoking Gemini, optimizing focus and reducing prompt latency.
3. **Loss of User Edits**: When the user refined constraints, naive RAG searches over-indexed on the original role and forgot the refinement.
   - *Fix*: Configured the search context builder to merge the last two user messages together, preserving the context transition.

---

### 5. Evaluation & Testing Approach
Our testing rigor covers both the API endpoints and the search engine's semantic retrieval accuracy:
- **Unit Testing (pytest)**: Includes validation of health checks, endpoint schema compliance, invalid payload rejections, and RAG search accuracy.
- **Behavior Probes**: We simulated common conversational personas (e.g., Vague Intent, Direct Comparison, Prompt Injection) to ensure the agent behaves correctly under non-happy paths.
- **Performance**: Keeps latency low by selecting the fast and smart `gemini-2.5-flash` model and capping retrieved context tokens.
