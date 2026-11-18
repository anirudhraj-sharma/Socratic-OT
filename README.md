# Socratic OT Tutor

A University at Buffalo CSE 635 project that helps occupational therapy students
reason through anatomy and neuroscience questions. Socratic mode retrieves
textbook evidence and guides students with questions. Study mode gives direct,
grounded explanations. The architecture view can replay recorded turns or show
live retrieval, classification, generation, and review steps.

## Tech Stack

| Component | Technology |
| --- | --- |
| Tutor orchestration | Python 3.12 and LangGraph |
| Language and vision models | Claude via Anthropic, Bedrock, or Vertex AI |
| Retrieval | ChromaDB, Nomic embeddings with late chunking, corrective RAG (CRAG), and a MiniLM cross-encoder |
| Query embeddings | Transformers by default, with Ollama as an option |
| Session persistence | SQLite and the LangGraph checkpointer |
| Backend and deployment | FastAPI, Server-Sent Events (SSE), Docker, and Docker Compose |
| Frontend and deployment | Next.js 14, React, TypeScript, Tailwind CSS, and GitHub Pages |
| PDF parsing | PyMuPDF |

## Project Structure

```text
Socratic-OT/
|-- .github/workflows/
|   |-- ci-backend.yml
|   \-- deploy-frontend.yml
|-- .env.example
|-- backend/
|   |-- api/main.py
|   |-- config.py
|   |-- data/demo_traces/
|   |-- evaluation/
|   |-- graph/
|   |   |-- edges.py
|   |   |-- graph_builder.py
|   |   |-- nodes/
|   |   \-- state.py
|   |-- ingest/
|   |-- prompts/
|   |-- retrieval/
|   |-- download_data.py
|   |-- Dockerfile
|   \-- requirements.txt
|-- docs/
|-- frontend/
|   |-- .env.example
|   |-- app/
|   |-- components/
|   |-- lib/
|   |-- next.config.mjs
|   \-- package.json
|-- scripts/
|   |-- record_demo_trace.py
|   \-- verify_downloads.py
\-- docker-compose.yml
```

## Local Setup

### Backend and Textbook Index

Use Python 3.12 and Node.js 22. Clone the repository and create a virtual
environment from its root.

```sh
git clone https://github.com/anirudhraj-sharma/Socratic-OT.git
cd Socratic-OT
python -m venv .venv
```

Activate it with `source .venv/bin/activate` on Bash or
`.\.venv\Scripts\Activate.ps1` in PowerShell. Copy `.env.example` to `.env`
in the repository root. Set `ANTHROPIC_API_KEY` there for live tutoring
with the default provider.

```sh
python -m pip install "torch==2.10.0" --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r backend/requirements.txt
```

An existing, compatible Chroma index can be reused. For the default anatomy
domain, it must contain `OT_anatomy_chunks` and be located at
`backend/data/processed/chroma_db` or at the path set by `CHROMA_DIR`. Skip
the download and ingestion commands when the index already has the needed
collection.

To build a fresh anatomy index, install the PDF parser and run the following
from `backend/`. If the OpenStax download fails, download the PDF from the
book page and save it as `backend/data/raw/textbooks/openStax_AP2e.pdf`.
[OpenStax Anatomy and Physiology 2e](https://openstax.org/details/books/anatomy-and-physiology-2e)

```sh
cd backend
python -m pip install "PyMuPDF==1.26.4"
python download_data.py
python ../scripts/verify_downloads.py
python -m ingest.parse_pdf OT_anatomy
```

The full ingestion runner deletes the **entire** configured Chroma
directory before it builds the selected domain. Use it on a fresh path
or back up the index first. A second run against the same directory for
another domain would erase the first collection.

```sh
python -m ingest.run_ingest_pipeline
```

To add the physics collection to an existing index, save the [OpenStax
University Physics Volume 1](https://openstax.org/details/books/university-physics-volume-1)
PDF at `backend/data/raw/physics/openStax_physics_v1.pdf`. From `backend/`,
parse and embed it, then load the chunks into `physics_chunks`.

```sh
python -m ingest.parse_pdf physics
python -m ingest.late_chunker --domain physics
python -c "from pathlib import Path; import config; from ingest.vector_store import VectorStore; VectorStore(config.CHROMA_DIR, 'physics').load_from_late_chunks(str(Path(config.CHUNKS_DIR) / 'late_chunks_physics.json'))"
```

Set `DOMAIN=physics` in the root `.env` to use that collection and restart
the backend. The default is `DOMAIN=OT_anatomy`.

Launch FastAPI from `backend/`, which puts the top-level Python packages on
the import path. From the repository root, use `PYTHONPATH=backend` if starting
Uvicorn there.

```sh
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

`GET http://localhost:8000/health` returns `{"status":"ok"}`. Live retrieval
needs a populated index and can download query embedding and reranker models
on first use.

### Frontend

In a second terminal, change to `frontend/` and copy `.env.example` to
`.env.local`. The example points to `http://localhost:8000`. Set
`NEXT_PUBLIC_API_URL` to change the API origin used by the browser.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To create the
GitHub Pages artifact locally, run `GITHUB_PAGES=true npm run build` in Bash
or `$env:GITHUB_PAGES = 'true'; npm run build` in PowerShell. The output is
`frontend/out/` and uses the `/Socratic-OT` base path.

### Docker Compose

From the repository root, copy `.env.example` to `.env` and configure the
backend credentials. For live retrieval on a fresh deployment, use the
existing host index at `backend/data/processed/chroma_db` or build it with the
steps above. Stop any process writing to that index before copying it. Seed
the fresh Chroma volume before starting the backend.

```sh
docker compose --profile seed run --rm seed-chroma
docker compose up --build
```

Skip seeding when the Chroma volume already contains the index. Compose
persists the SQLite session database and the Chroma index in separate named
volumes. Check `http://localhost:8000/health` after startup. The frontend
runs separately using the steps above.

For optional Ollama query embeddings, set `EMBED_BACKEND=ollama` in `.env`
and leave `OLLAMA_BASE_URL` unset to use the internal service. Start the
profile with `docker compose --profile ollama up --build`. The profile pulls
`nomic-embed-text` into its model volume.

## GitHub Pages Deployment

1. Deploy the backend container behind HTTPS. Configure its credentials and
   persistent data on the host. Allow streaming responses on `/chat` and
   `/chat/trace` through the reverse proxy.
2. Include `https://anirudhraj-sharma.github.io` in the backend's
   `CORS_ORIGINS`. The origin consists of the scheme and host.
3. In [repository settings](https://github.com/anirudhraj-sharma/Socratic-OT/settings),
   choose **Pages → Source → GitHub Actions**. Under **Secrets and variables
   → Actions → Variables**, add `NEXT_PUBLIC_API_URL` with the public HTTPS
   origin of the backend. Keep provider credentials on the backend.
4. Push a change to `frontend/` or the deploy workflow on `main`, or run
   **Deploy frontend to GitHub Pages** from the Actions tab. The published
   frontend uses `https://anirudhraj-sharma.github.io/Socratic-OT/`.

The session API is designed for a single-user demo. Use access controls and
session isolation before serving multiple users.

## Architectural Invariants & Design Decisions

- `backend/graph/edges.py` owns the deterministic routing policy. The
  turn-based reveal branch requires `turn_count >= 3` and `student_attempted`.
  Mastery and post-mastery phases have their own routes. Three consecutive
  `idk` classifications reach the teaching branch through a separate rule.
- LangGraph nodes divide responsibilities across classification, retrieval,
  generation, and review. The Dean checks Socratic drafts, and the graph
  routes rejected drafts back for a bounded revision or to a fallback
  scaffold. Study mode follows a direct-answer path.
- Generation templates live in `backend/prompts/` so they can be reviewed
  separately from routing and state. `backend/graph/state.py` defines the
  state contract.
- Runtime retrieval goes through `corrective_retrieve` in
  `backend/retrieval/crag.py`. Domain configuration selects a Chroma
  collection and the language used in prompts. The graph serves anatomy
  and physics using the same routing logic.

## Historical Evaluation Results

These results are from recorded evaluation runs on earlier project versions.

| Evaluation | Recorded result |
| --- | --- |
| [Milestone 2 Socratic purity](backend/evaluation/eval.md) | 0 premature reveals across 5 prompts |
| [Milestone 2 retrieval](backend/evaluation/eval.md) | 8 of 10 relevant top-ranked sections, up from 7 with cosine search |
| [Milestone 2 classification and Dean review](backend/evaluation/eval.md) | 15 of 20 responses classified correctly and 7 of 10 natural drafts passed the Dean |
| [50-scenario faithfulness evaluation](backend/evaluation/results/faithfulness_results_50.json) | 0.81 before Dean and 0.91 after Dean |
| [End-to-end evaluation](docs/end_to_end_eval.md) | 116 of 119 scenarios passed |
| [Physics evaluation](docs/cross_domain_physics_eval.md) | 10 of 10 scenarios passed |

Additional measurements are in [the token cost analysis](docs/token_cost_analysis.md)
and [evaluation results](backend/evaluation/results/).

## Authors

Anirudh Raj Sharma — University at Buffalo
