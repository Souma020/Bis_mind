# Know Your BIS 🏛️🤖

> **Tagline:** Your AI-powered guide to Indian Standards, BIS Certification, and Compliance.
> Built for the Bureau of Indian Standards (BIS) Hackathon.

Know Your BIS is a full-stack, production-ready AI application designed to empower businesses, manufacturers, importers, and citizens to effortlessly understand Indian Standards (IS), mandatory Quality Control Orders (QCOs), certification schemes (ISI Mark, CRS, FMCS), Gold Hallmarking (HUID), and laboratory testing requirements.

---

## 🌟 Key Features

- **🤖 Evidence-Grounded AI Assistant**: Chat in natural language to query Indian Standards, clauses, testing parameters, and compliance rules. Powered by Google Gemini API and a Retrieval-Augmented Generation (RAG) backend.
- **🔎 Product-to-Standard AI Recommender**: Describe any manufactured or imported product in natural language (e.g. *"I manufacture stainless steel water bottles"*) to instantly receive recommended Indian Standards, mandatory QCO status, and step-by-step licensing pathways.
- **📜 Quality Control Order (QCO) Verification**: Clear identification of mandatory Gazette notifications enforced by DPIIT, Ministry of Steel, MeitY, FSSAI, and Ministry of Consumer Affairs.
- **💎 Gold & Silver Hallmarking Guide**: Full coverage of 6-digit Hallmarking Unique ID (HUID) requirements, fire assaying standards, and Assaying & Hallmarking Centre (AHC) guidelines.
- **🔬 Laboratory & Testing Network**: Explore mandatory chemical, mechanical, and safety testing parameters along with recognized national labs (Sahibabad, CPRI, STQC, NABL).
- **🛡️ Zero-Hallucination Integrity**: Strict grounding rules prioritize official retrieved evidence over LLM parametric knowledge. Citations and URLs are validated line-by-line.
- **🌙 Modern Government UI**: Tiranga-accented accessible theme, dark mode support, markdown rendering, interactive tables, confidence indicators, and conversation history.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Variables, Dark Mode), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (`mongoose`)
- **AI & RAG**: Google Gemini API (`@google/generative-ai`), Hybrid Vector Cosine Similarity + BM25 Keyword Search
- **Security**: Helmet HTTP Headers, CORS, Rate Limiting, Environment Variables (`.env`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### 2. Installation
Clone or navigate to the project folder:
```bash
cd know-your-bis
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Add your Google Gemini API key to `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/know_your_bis
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
i am using Google ai studio api key
> **Note:** Set `MONGODB_URI` to your local MongoDB instance or your MongoDB Atlas connection string. If `GEMINI_API_KEY` is not provided, the application will automatically operate using its built-in offline hybrid evidence synthesis engine.

### 4. Run the Application
Start the development server (automatically seeds the database on first run):
```bash
npm run dev
```
Open your browser and visit: **`http://localhost:3000`**

### 5. Run API Tests
Execute the automated API integration test suite:
```bash
npm test
```

---

## 📡 Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check, database status, and active AI engine |
| `POST` | `/api/chat` | Main RAG AI Assistant chat endpoint |
| `POST` | `/api/recommend-standard` | Product description to Indian Standard recommendation |
| `GET` | `/api/search` | Search standards catalog by keyword or category |
| `GET` | `/api/standards` | List all Indian Standards with category filtering |
| `GET` | `/api/standards/:id` | Get detailed standard specification and clauses |
| `GET` | `/api/services` | List all BIS schemes, hallmarking, and lab services |
| `POST` | `/api/feedback` | Log user feedback rating (+1 / -1) and comments |

---

## 📁 Project Structure

```
know-your-bis/
├── package.json
├── .env.example
├── .env
├── .gitignore
├── README.md
├── server.js               # Application entry point
├── backend/
│   ├── app.js              # Express configuration & routes
│   ├── config/
│   │   └── env.js          # Environment variables
│   ├── routes/             # REST API endpoint handlers
│   ├── services/           # RAG Engine, LLM, Embeddings, Recommender, DB Services
│   └── middleware/         # Helmet, CORS, Rate Limit, Error Handling
├── database/
│   ├── schema.sql          # SQLite 8-table schema definitions
│   ├── init.js            # SQLite database initializer
│   └── seed.js            # Auto-population script with official standards & QCOs
├── data/                   # Initial JSON datasets (IS standards, QCO orders, services)
├── frontend/
│   ├── css/                # Modern UI CSS, components, dark mode rules
│   ├── js/                 # Unified API client, chatbot, product recommender logic
│   └── pages/              # 5 connected HTML pages (Home, Assistant, Recommend, Services, About)
└── tests/
    └── api.test.js         # Integration test suite
```

---

## ⚖️ Disclaimer

> "This AI is an informational assistant. Users should verify regulatory and compliance requirements using the latest official BIS and Government sources."


## 🌐 Multilingual Chat

The AI Assistant page has a **Language** dropdown (English, Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada). The choice is saved in the browser and sent with every chat request as `language`; answers, suggested follow-ups and chat UI text follow it.

- Non-English questions are translated to English internally for retrieval, so evidence matching and citations stay accurate. The answer itself is generated in the selected language.
- This adds up to two small extra AI calls per non-English message. If no AI provider is available, the answer falls back to English with a note.
- **Add a language:** add an entry in `backend/config/languages.js` and the matching UI strings in `frontend/js/languages.js`.
- The non-English UI strings should be reviewed by a native speaker before production use.


## Design and database updates

- New look: warm palette, Bricolage Grotesque + Instrument Sans, official-style seal logo, changing photo backgrounds (`frontend/assets/images`), light/dark circular theme reveal. Styles live in `frontend/css/theme.css`; behaviour in `frontend/js/theme.js` and `frontend/js/home.js`.
- Retrieval no longer falls back to unrelated chunks; confidence reflects evidence relevance; `IS 1786 (Part 1)` style numbers match `IS 1786`.
- `npm run seed` now stores an embedding on each chunk (uses Gemini when a key is set, local vectors otherwise). Re-run it once to backfill existing data.
