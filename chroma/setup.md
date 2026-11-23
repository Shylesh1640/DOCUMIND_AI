# ChromaDB Setup for DocuMind AI

DocuMind AI uses **ChromaDB** as its vector database with the built-in `all-MiniLM-L6-v2` embedding model.
No external embedding API key is required — embeddings are generated locally via ONNX.

---

## Option 1: Docker (Recommended for local dev)

```bash
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

ChromaDB will be available at `http://localhost:8000`.

---

## Option 2: Python (pip)

```bash
pip install chromadb
chroma run --path ./chroma_data --port 8000
```

---

## Option 3: Docker Compose

Create a `docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  chroma:
    image: chromadb/chroma
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - ALLOW_RESET=true

volumes:
  chroma_data:
```

Then run:

```bash
docker-compose up -d
```

---

## Option 4: Hosted ChromaDB (for Vercel production)

Deploy ChromaDB on a free/cheap cloud service:

### Railway.app
1. Create a new project on [Railway](https://railway.app)
2. Deploy from Docker image: `chromadb/chroma`
3. Expose port 8000
4. Copy the public URL and set `CHROMA_URL=https://your-chroma-url.railway.app` in Vercel

### Render.com
1. Create a new Web Service on [Render](https://render.com)
2. Use Docker image: `chromadb/chroma`
3. Set port to 8000
4. Copy the URL for your Vercel env vars

### Fly.io
```bash
fly launch --image chromadb/chroma --name documind-chroma
fly scale memory 512
```

---

## Verifying ChromaDB is Running

```bash
curl http://localhost:8000/api/v1/heartbeat
# Expected: {"nanosecond heartbeat": 1234567890}
```

---

## Collections Created by DocuMind AI

| Collection | Purpose |
|-----------|---------|
| `documind_docs` | Document metadata (filename, status, chunk count, etc.) |
| `documind_chunks` | Text chunks with 384-dim embeddings (all-MiniLM-L6-v2) |

Collections are created automatically on first use — no manual setup needed.

---

## Environment Variables

```env
CHROMA_URL=http://localhost:8000
CHROMA_CHUNKS_COLLECTION=documind_chunks
CHROMA_DOCS_COLLECTION=documind_docs
```

---

## Embedding Model

DocuMind AI uses `all-MiniLM-L6-v2` via `chromadb-default-embed`:
- **Dimensions**: 384
- **Model size**: ~25MB (cached after first download)
- **Performance**: Fast inference, ~80ms per batch
- **Quality**: Excellent for semantic similarity search
