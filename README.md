# DocuMind AI

**Your documents. Your knowledge. Your AI.**

A production-ready Retrieval-Augmented Generation (RAG) AI assistant powered by **Groq** (or **OpenRouter**) and **ChromaDB** — answers questions strictly grounded in your uploaded documents with source citations and zero hallucinations.

---

## 🚀 Live Demo

> Deployment URL will appear here after `vercel --prod`

---

## 🧠 Architecture

```
User Question
     │
     ▼
[chromadb-default-embed]  ← all-MiniLM-L6-v2 (local, 384-dim)
     │
     ▼
[ChromaDB Vector Search]  ← Cosine similarity → Top 5 chunks
     │
     ▼
[System Prompt + Context] ← Retrieved passages injected
     │
     ▼
[Groq / OpenRouter LLM]   ← Llama 3.3 70B (or any model)
     │
     ▼
[Response + Citations]    ← Returned to user
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| LLM (primary) | Groq — Llama 3.3 70B Versatile |
| LLM (alternative) | OpenRouter — 100+ models |
| Embeddings | `chromadb-default-embed` (all-MiniLM-L6-v2, local) |
| Vector DB | ChromaDB |
| Document parsing | pdf-parse (PDF) · mammoth (DOCX) · native (TXT) |
| Hosting | Vercel |

---

## 📋 Prerequisites

- **Node.js 18+**
- **npm**
- **ChromaDB** running (Docker or pip — see below)
- **Groq API key**: [console.groq.com](https://console.groq.com) ← free tier available
- **OpenRouter API key** (optional): [openrouter.ai/keys](https://openrouter.ai/keys)
- **Vercel account** (for deployment)

---

## ⚙️ Installation

### 1. Clone and install

```bash
git clone https://github.com/yourusername/documind-ai.git
cd documind-ai
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
GROQ_API_KEY=gsk_...
CHROMA_URL=http://localhost:8000

# Optional — only needed if LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...

# Provider selection: "groq" (default) or "openrouter"
LLM_PROVIDER=groq
```

### 3. Start ChromaDB

**Option A — Docker (easiest):**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**Option B — Python:**
```bash
pip install chromadb
chroma run --path ./chroma_data --port 8000
```

**Option C — Docker Compose:**
```bash
docker-compose up -d   # uses docker-compose.yml in project root
```

Verify ChromaDB is running:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → upload documents → start chatting.

---

## 🤖 LLM Configuration

### Groq (default — fastest)

| Env Var | Value | Notes |
|---------|-------|-------|
| `LLM_PROVIDER` | `groq` | Default |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | 128k context |

Other Groq models: `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `gemma2-9b-it`

### OpenRouter (alternative — 100+ models)

| Env Var | Value | Notes |
|---------|-------|-------|
| `LLM_PROVIDER` | `openrouter` | Switch provider |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.1-70b-instruct:free` | Free models available |

Other OpenRouter models: `anthropic/claude-3.5-sonnet`, `google/gemini-pro`, `mistralai/mistral-7b-instruct:free`

---

## 🗄️ ChromaDB Collections

| Collection | Purpose |
|-----------|---------|
| `documind_docs` | Document metadata (filename, status, chunk count) |
| `documind_chunks` | Text chunks + 384-dim embeddings (all-MiniLM-L6-v2) |

Collections are created automatically — no manual setup.

---

## 📄 Document Processing Pipeline

1. **Upload** → File received via multipart form (max 50MB)
2. **Validate** → Check file type (PDF/TXT/DOCX) and size
3. **Extract** → Parse text using pdf-parse / mammoth / Buffer
4. **Clean** → Remove null bytes, normalize whitespace
5. **Chunk** → Split into ~600-token segments with ~100-token overlap
6. **Embed** → `all-MiniLM-L6-v2` via `chromadb-default-embed` (runs locally)
7. **Store** → Insert chunks + embeddings into ChromaDB

---

## 🔍 RAG Query Pipeline

1. User submits question
2. Question → embedding via `all-MiniLM-L6-v2` (local, no API call)
3. ChromaDB cosine similarity search → top 5 chunks above 0.3 threshold
4. Chunks injected into engineered system prompt as context
5. Groq (or OpenRouter) generates answer **only from retrieved context**
6. Response returned with citations (document name, chunk index, similarity score)

---

## 🚢 Deployment to Vercel

### 1. Deploy ChromaDB for production

Deploy ChromaDB on Railway, Render, or Fly.io (see [`chroma/setup.md`](./chroma/setup.md)).

### 2. Install Vercel CLI and deploy

```bash
npm install -g vercel
vercel login
vercel link
```

Set environment variables:
```bash
vercel env add GROQ_API_KEY production
vercel env add OPENROUTER_API_KEY production
vercel env add CHROMA_URL production
vercel env add LLM_PROVIDER production
```

Deploy:
```bash
vercel --prod
```

---

## 🧪 Testing Checklist

- [ ] Start ChromaDB locally
- [ ] Upload a PDF document
- [ ] Verify chunk count appears in document library
- [ ] Ask a question answerable from the PDF → answer cites correct source
- [ ] Ask a question NOT in the document → "I couldn't find sufficient information…"
- [ ] Delete a document → chunks also removed
- [ ] Test mobile layout
- [ ] Test loading and error states
- [ ] Switch `LLM_PROVIDER=openrouter` and verify it works

---

## 📁 Project Structure

```
documind-ai/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # RAG chat endpoint (Groq/OpenRouter)
│   │   ├── upload/route.ts        # Document ingestion → ChromaDB
│   │   └── documents/route.ts     # List & delete documents
│   ├── chat/page.tsx              # Chat interface
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   └── globals.css
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx          # Main chat UI
│   │   └── SourcePanel.tsx        # Source citation display
│   ├── documents/
│   │   └── DocumentLibrary.tsx    # Document management UI
│   └── layout/
│       └── Sidebar.tsx
├── lib/
│   ├── chroma/
│   │   └── client.ts              # ChromaDB client + collections
│   ├── llm/
│   │   ├── groq.ts                # Groq chat client
│   │   ├── openrouter.ts          # OpenRouter chat client
│   │   └── index.ts               # LLM router (Groq|OpenRouter)
│   ├── rag/
│   │   ├── chunker.ts             # Text chunking (500-800 tokens)
│   │   ├── document-processor.ts  # Text extraction (PDF/DOCX/TXT)
│   │   └── retrieval.ts           # Vector search + prompt building
│   └── utils.ts
├── types/index.ts
├── chroma/setup.md                # ChromaDB deployment guide
├── .env.example
└── README.md
```

---

## 🔐 Security

- API keys (Groq, OpenRouter) stored only in server-side env variables
- Never exposed to browser-side JavaScript
- File type and size validation on every upload
- Input length limits on chat messages (4000 chars)
- ChromaDB connection isolated to server-side API routes

---

## License

MIT
