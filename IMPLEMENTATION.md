# VINme — Full-Stack Revamp Implementation Plan
> RAG Valuation Engine + Cinematic Dark UI

**Version:** v2.0 — June 2026
**Replaces:** Accu-Trade iframe, WordPress/Flatsome
**Design reference:** AutoVal DESIGN.md (dark cinematic system)

---

## 1. What We're Building

A ground-up rebuild of VINme.com. Same page structure as the existing WordPress site — same sections, same trust signals, same founder section — but completely re-skinned to the dark cinematic design system and powered by a custom RAG valuation engine instead of the Accu-Trade iframe.

**The user never leaves the page.** The 3-tab input in the hero (License Plate / VIN / Make+Model) triggers the AI valuation flow inline. No redirects, no iframes, no third-party widgets.

---

## 2. Tech Stack

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for SEO, API routes for backend |
| Language | TypeScript | |
| Styling | Tailwind CSS v4 | Design token-native |
| Animation | Framer Motion | Hero reveals, confidence bar, card transitions |
| Font | Geist Sans (Next.js built-in) | Inter substitute, zero config |

### Backend (API Routes inside Next.js)
| Layer | Choice |
|---|---|
| Runtime | Next.js API Routes (Node.js edge-compatible) |
| LLM Inference | Groq API — `qwen/qwen3-32b` (as per IMPLEMENTATION2.md) |
| Embeddings | `nomic-embed-text` via Ollama locally / Nomic API in prod |
| Vector DB | PostgreSQL + pgvector (Supabase or Railway) |
| Cache | Redis (Upstash — serverless-friendly) |
| VIN Decode | NHTSA vPIC API (free, official) |
| Plate Decode | Mock for now → swap to a plate API later |

### Infrastructure
| Layer | Choice |
|---|---|
| Hosting | Vercel (frontend + API routes) |
| Database | Supabase (Postgres + pgvector built-in) |
| Cache | Upstash Redis |
| Repo | GitHub |

---

## 3. Folder Structure

```
vinme/
├── app/
│   ├── layout.tsx                  # Root: Geist font, dark bg, grain overlay
│   ├── page.tsx                    # Landing page — all sections assembled
│   ├── globals.css                 # Design tokens, CSS vars, base resets
│   │
│   └── api/
│       ├── valuate/
│       │   └── route.ts            # POST — main RAG valuation endpoint
│       ├── valuate/refine/
│       │   └── route.ts            # POST — counter-question refinement round
│       ├── vehicle/decode/
│       │   └── [vin]/route.ts      # GET — NHTSA VIN decode
│       ├── vehicle/plate/
│       │   └── route.ts            # POST — plate lookup (mock initially)
│       ├── leads/
│       │   └── route.ts            # POST — save lead to DB
│       └── knowledge/
│           └── reindex/route.ts    # POST — trigger knowledge base reindex
│
├── components/
│   ├── layout/
│   │   ├── Nav.tsx                 # Sticky nav, scroll-aware bg
│   │   └── Footer.tsx
│   │
│   ├── sections/                   # One file per page section (matches existing VINme)
│   │   ├── Hero.tsx                # Full-bleed dark hero + 3-tab valuation widget
│   │   ├── HowItWorks.tsx          # 3-step strip (Tell us / Get offer / Complete deal)
│   │   ├── Founder.tsx             # Ori credibility section
│   │   ├── ValueProps.tsx          # 4-col: Convenient, Fast, Fair, Honest
│   │   ├── DealersBand.tsx         # Full-bleed dark band: Dealers & Brokers
│   │   ├── Features.tsx            # 6-col feature grid
│   │   ├── Testimonials.tsx        # Video testimonial carousel
│   │   ├── FAQ.tsx                 # Accordion
│   │   └── Contact.tsx             # Contact form
│   │
│   ├── valuation/                  # The AI valuation flow (lives inside Hero)
│   │   ├── ValuationWidget.tsx     # 3-tab container: Plate / VIN / Make+Model
│   │   ├── tabs/
│   │   │   ├── PlateTab.tsx        # License plate input + state selector
│   │   │   ├── VINTab.tsx          # VIN input + decode
│   │   │   └── MakeModelTab.tsx    # Cascading make / model / year / trim dropdowns
│   │   ├── ValuationFlow.tsx       # Hosts the full Q&A narrowing experience
│   │   ├── ValuationCard.tsx       # Price range + confidence bar + current question
│   │   ├── AnswerChips.tsx         # Pill chip answer options per question category
│   │   ├── AnswerHistory.tsx       # Compact completed Q&A log
│   │   ├── ConfidenceBar.tsx       # Animated amber fill bar
│   │   └── InquiryForm.tsx         # Post-valuation lead capture slide-up
│   │
│   └── ui/
│       ├── Button.tsx              # Amber pill + Ghost pill variants
│       ├── Input.tsx               # Sharp-edged dark input
│       ├── Select.tsx              # Dark styled select dropdown
│       ├── Accordion.tsx           # FAQ accordion
│       └── GrainOverlay.tsx        # Fixed film grain layer
│
├── lib/
│   ├── groq.ts                     # Groq client (server-only)
│   ├── embeddings.ts               # Nomic embed client
│   ├── vectordb.ts                 # pgvector query functions
│   ├── redis.ts                    # Upstash Redis client
│   ├── rag/
│   │   ├── pipeline.ts             # Full RAG pipeline: embed → search → rerank → generate
│   │   ├── retriever.ts            # Hybrid BM25 + vector search
│   │   ├── reranker.ts             # Cross-encoder reranking logic
│   │   └── prompts.ts              # System prompt + round prompt builders
│   ├── vehicle/
│   │   ├── nhtsa.ts                # NHTSA vPIC decode wrapper
│   │   └── plate-mock.ts           # Plate → car mock data (swap for real API later)
│   └── types.ts                    # All shared TypeScript types
│
├── hooks/
│   ├── useValuation.ts             # Valuation session state (useReducer)
│   └── useParticles.ts             # Hero particle canvas
│
├── db/
│   ├── schema.sql                  # Postgres schema + pgvector setup
│   └── seed/
│       └── knowledge/              # Initial knowledge base markdown docs
│           ├── depreciation_curves.md
│           ├── condition_assessment_guide.md
│           ├── regional_pricing_factors.md
│           ├── mileage_adjustment_tables.md
│           ├── popular_models_pricing.md
│           └── business_rules.md
│
└── public/
    └── grain.png                   # Tileable film grain texture
```

---

## 4. Design Token Implementation

Put this in `app/globals.css`. These are the design tokens from DESIGN.md, ready to use as Tailwind v4 `@theme` and as raw CSS vars:

```css
@import "tailwindcss";

@theme {
  --color-void-black: #080808;
  --color-carbon: #111111;
  --color-gunmetal: #1a1a1a;
  --color-soot: #333330;
  --color-ash: #888880;
  --color-bone-white: #f0ede8;
  --color-signal-amber: #e8a020;

  --font-display: 'Geist Sans', ui-sans-serif, system-ui, sans-serif;

  --text-label-xs: 13px;
  --text-caption: 16px;
  --text-body: 18px;
  --text-subheading: 24px;
  --text-heading-sm: 32px;
  --text-heading: 40px;
  --text-heading-lg: 52px;
  --text-display: 72px;
  --text-hero: 96px;

  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-120: 120px;

  --radius-full: 1000px;
  --radius-none: 0px;

  --color-surface-0: #080808;
  --color-surface-1: #111111;
  --color-surface-2: #1a1a1a;
  --color-surface-3: #333330;
}

/* Global resets */
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: #080808; color: #f0ede8; font-family: var(--font-display); }
body { min-height: 100vh; overflow-x: hidden; }

/* Film grain — applied globally, never animates */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 999;
  pointer-events: none;
  background-image: url('/grain.png');
  background-repeat: repeat;
  opacity: 0.035;
}
```

---

## 5. Page Sections — Revamp Spec

Map of every existing VINme section → what it becomes in the revamp. Same order, same purpose, different skin.

---

### Section 1 — Navigation

**Current:** Logo left, links center/right, teal "Quote" CTA button, white background, becomes fixed on scroll.

**Revamp:**
- Background: transparent on load, transitions to `#111111` at 90% opacity on scroll (with 1px `#333330` bottom border)
- Logo: "VINme" wordmark in Geist 800, 24px, `#f0ede8`. "We buy cars." sub-label in 13px `#888880` next to it
- Nav links: About Us, Contact Us, Dealers — 16px weight 400, `#888880`, +0.2px tracking. Hover: `#f0ede8`
- CTA button: Amber pill — "Get an Offer" — `#e8a020` fill, `#080808` text, 1000px radius, padding 12px 24px, weight 700 16px
- Mobile: hamburger becomes a thin `#f0ede8` menu trigger (not a filled circle)

```tsx
// components/layout/Nav.tsx — key logic
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 40);
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);

// className on nav element:
// scrolled ? 'bg-[#111111]/90 border-b border-[#333330]' : 'bg-transparent'
// Framer Motion: animate={{ backgroundColor: scrolled ? '#111111e6' : '#00000000' }}
```

---

### Section 2 — Hero

**Current:** Full-bleed lifestyle photo (person holding phone at car). Left: headline "Sell Your Car In 3 Simple Steps!" + "HOW IT WORKS" ghost CTA. Right: white card with 3-tab widget (Enter License Plate / Enter VIN / Enter Make/Model).

**Revamp:**
- Background: `#080808` with a dark car photograph at 25% opacity, desaturated, bleeding full viewport. Particle canvas behind.
- Headline: left-aligned, "Sell your car.\nGet a real offer." — 96px weight 800, `#f0ede8`, letter-spacing -4px, line-height 0.88. Word-by-word stagger reveal (Framer Motion, 120ms stagger, y: 40→0).
- Sub-label above headline: "AI-POWERED CAR VALUATION" — 13px weight 600, `#888880`, +0.8px tracking, ALL CAPS. Fades in 300ms before headline.
- The 3-tab widget: replaces the white card. Dark surface (`#111111`), 0px border-radius, 1px `#333330` border. Tabs: License Plate / VIN / Make+Model — pill tab switcher, active tab underlined in `#e8a020`. Inputs sharp-edged, dark. "Get Started" button: full-width amber pill.
- No "HOW IT WORKS" ghost CTA — replaced by a thin scroll indicator line bottom-center.

**Widget tab behavior:**
- Tab: License Plate → input for plate number + State dropdown → "Get My Offer" hits `/api/vehicle/plate` then `/api/valuate`
- Tab: VIN → single input → hits `/api/vehicle/decode/[vin]` first, shows decoded car preview, then "Looks right? Start valuation" → `/api/valuate`
- Tab: Make/Model → cascading dropdowns (Year → Make → Model → Trim) → builds `carSummary` string → `/api/valuate`

After "Get Started" — the widget expands in-place (Framer Motion layout animation) into the full `ValuationFlow` component. The hero headline stays visible above. No modal, no overlay. The card grows downward.

---

### Section 3 — How It Works (3-Step Strip)

**Current:** 3 icon cards in a light gray strip: Tell Us About Your Car / Get an Offer in Minutes / Complete the Deal.

**Revamp:**
- Background: `#111111` (Carbon)
- 3 items in a row, separated by 1px `#333330` vertical hairlines (desktop) or stacked (mobile)
- Each item: step number in 13px `#888880` ALL CAPS tracking ("STEP 01"), then subhead in 20px weight 700 `#f0ede8`, then 17px `#888880` body
- No icon illustrations — replaced by large step numbers ("01", "02", "03") in 72px weight 800, `#1a1a1a` (Gunmetal, intentionally barely visible — watermark-like). The number sits behind the text as a decorative element.
- Copy stays the same: Tell Us · Get an Offer · Complete the Deal

---

### Section 4 — Founder Section

**Current:** White bg. Left: "Lifelong automotive enthusiast and buyer." headline, paragraph body, signature "Ori Filhart" (cursive), "ABOUT US" link. Right: founder portrait photo.

**Revamp — keep this section, it converts:**
- Background: `#080808` (Void Black)
- Layout: identical split — text left, photo right. Photo: no rounded corners, no frame, slight desaturation, natural crop.
- Headline: "Lifelong automotive enthusiast and buyer." — 52px weight 800 `#f0ede8`, letter-spacing -1.5px
- Body: 18px weight 400 `#888880`, line-height 1.6
- Signature: Keep the cursive "Ori Filhart" — but render it in `#f0ede8` against dark. This is a trust anchor, don't remove it.
- "About Us →" link: 16px weight 600 `#e8a020`, no underline, arrow slides right on hover (Framer Motion x: 0→4px)
- 1px `#333330` hairline rule above the section at full width

---

### Section 5 — Value Props (4-Column)

**Current:** Light gray bg. 4 columns with icons: Convenient / Fast / Fair / Honest. Icon + ALL CAPS label + body copy.

**Revamp:**
- Background: `#111111` (Carbon)
- Same 4 columns: Convenient / Fast / Fair / Honest
- Icons removed — replaced by a thin horizontal 1px `#333330` hairline rule above each column (full-width of the column)
- Each column: hairline → 32px space → label in 13px weight 600 `#888880` ALL CAPS +0.8px tracking → 20px space → headline in 24px weight 700 `#f0ede8` → 12px space → body in 17px weight 400 `#888880`
- Copy: same as existing. "CONVENIENT — Sell your car from your home or office." etc.
- On mobile: 2×2 grid

---

### Section 6 — Dealers Dark Band

**Current:** Full-bleed car photo with a dark overlay. White headline "Dealers & Brokers, we buy trades!" center. Sub-copy. Teal "LET'S TALK" CTA. A form overlay card.

**Revamp:**
- Background: `#080808` with a full-bleed dark car photography image at 20% opacity
- Headline: "Dealers & Brokers,\nwe buy trades." — 72px weight 800 `#f0ede8`, letter-spacing -2px, left-aligned within content column
- Sub-label above headline: "FOR DEALERS" — 13px `#888880` ALL CAPS
- Body: "We buy trades, quickly and easily. Just send us the VIN, miles, and condition." — 18px `#888880`
- CTA: Amber pill button "Let's Talk →" — only one per screen
- The form card from the original: removed from this band. The "Let's Talk" CTA scrolls to the Contact section.
- 1px `#333330` full-width hairline above and below this band

---

### Section 7 — Feature Grid (6-Column)

**Current:** White bg. 6 icons with headings and body copy: Service / Long Time Buyers / Guarantee / Competitive / Come to You / Pick Up.

**Revamp:**
- Background: `#080808`
- Editorial headline above the grid: "Why VINme." — 52px weight 800 `#f0ede8`, left-aligned
- Sub-label: "SIX REASONS" — 13px `#888880` ALL CAPS
- Grid: 3 columns × 2 rows (desktop), each cell:
  - 1px `#333330` top hairline rule
  - 32px space
  - Feature name: 20px weight 700 `#f0ede8`
  - 12px space
  - Body: 17px weight 400 `#888880`, line-height 1.6
- No icons. The hairline carries the structural weight.
- Feature copy stays: Service / Long Time Buyers / Guarantee / Competitive / Come to You / Pick Up

---

### Section 8 — Testimonial Carousel

**Current:** 2 Vimeo video embeds side-by-side with carousel dots.

**Revamp:**
- Background: `#111111`
- Section label: "WHAT SELLERS SAY" — 13px `#888880` ALL CAPS
- Headline: "Real people.\nReal offers." — 52px weight 800 `#f0ede8`
- Video embeds: keep Vimeo iframes. Wrap each in a `#1a1a1a` container with 0px border-radius, 1px `#333330` border. No rounded corners on video.
- Carousel nav: thin left/right arrows in `#888880`, hover to `#f0ede8`. Dots: 6px circles `#333330`, active dot `#e8a020`
- Framer Motion `AnimatePresence` for slide transitions

---

### Section 9 — FAQ Accordion

**Current:** Light gray bg. "FAQ / Frequently asked questions" heading in a cursive/serif font. Standard accordion items.

**Revamp:**
- Background: `#080808`
- Label: "FAQ" — 13px `#888880` ALL CAPS
- Headline: "Frequently asked\nquestions." — 52px weight 800 `#f0ede8`
- Each accordion item:
  - 1px `#333330` full-width hairline above it
  - Question: 20px weight 600 `#f0ede8` + `+` / `−` toggle in `#e8a020` on the right
  - Answer: 17px weight 400 `#888880`, line-height 1.6, expands with Framer Motion height animation
  - Last item has a hairline below it too
- Questions from existing site (keep them): What kind of cars do you buy? / Leased cars? / Loan on car? / Title issues?

---

### Section 10 — Contact Form

**Current:** White bg. "Let's Talk!" heading. Standard HTML form: Name, Email, Phone, Subject, Message. Teal "SEND" button.

**Revamp:**
- Background: `#111111`
- Label: "GET IN TOUCH" — 13px `#888880` ALL CAPS
- Headline: "Let's talk." — 72px weight 800 `#f0ede8`, letter-spacing -2px
- Form fields: same fields. Each field:
  - Label: 13px weight 600 `#888880` ALL CAPS, +0.4px tracking
  - Input: `#1a1a1a` bg, 0px border-radius, 1px `#333330` border, `#f0ede8` text, `#888880` placeholder, padding 14px 16px
  - On focus: border switches to `#e8a020` (CSS `focus:border-signal-amber`)
- Submit: full-width amber pill button "Send Message →"
- On submit success: button text changes to "Sent ✓", turns Ash gray, disabled.

---

### Section 11 — Footer

**Current:** Dark gray bg. Social icons (Facebook, Instagram, LinkedIn). Nav links. Copyright.

**Revamp:**
- Background: `#080808`
- 1px `#333330` top border
- Left: "VINme" wordmark 24px weight 800 `#f0ede8` + "We buy cars." in 16px `#888880` below
- Center: nav links in 16px weight 400 `#888880`: Home / About Us / Contact Us / Dealers
- Right: social icons — Facebook / Instagram / LinkedIn. Use simple SVG icons in `#888880`, hover to `#f0ede8`
- Bottom: "© 2025 VINme" in 13px `#888880` and "vinme.com" right-aligned
- No amber in the footer — it's earned only at action moments

---

## 6. RAG Valuation Engine

This is the backend powering the widget. Translates IMPLEMENTATION2.md into Next.js API routes.

### Database Schema (`db/schema.sql`)

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Vehicles cache (decoded VINs)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin TEXT UNIQUE,
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  engine TEXT,
  drivetrain TEXT,
  body_type TEXT,
  fuel_type TEXT,
  raw_nhtsa JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Valuation sessions
CREATE TABLE valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  car_summary TEXT NOT NULL,
  offer_low INTEGER,
  offer_high INTEGER,
  confidence NUMERIC(4,2),
  mileage INTEGER,
  condition TEXT,
  zip_code TEXT,
  rounds JSONB DEFAULT '[]',
  llm_reasoning TEXT,
  source_documents JSONB DEFAULT '[]',
  status TEXT DEFAULT 'in_progress',  -- in_progress | final | expired
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '48 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge base chunks
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(768),             -- nomic-embed-text dim
  parent_chunk_id UUID REFERENCES knowledge_documents(id),
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON knowledge_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID REFERENCES valuations(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  car_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### RAG Pipeline (`lib/rag/pipeline.ts`)

```typescript
import { embedText } from '../embeddings';
import { hybridSearch } from './retriever';
import { rerank } from './reranker';
import { buildSystemPrompt, buildRoundPrompt } from './prompts';
import { groq } from '../groq';
import { redis } from '../redis';
import type { ValuationRound, GroqValuationResponse } from '../types';

export async function runValuationPipeline(
  carSummary: string,
  previousRounds: ValuationRound[],
  isFirstCall: boolean
): Promise<GroqValuationResponse> {

  // 1. Check Redis cache for this exact query
  const cacheKey = `valuation:${Buffer.from(carSummary + JSON.stringify(previousRounds)).toString('base64').slice(0, 40)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached as string);

  // 2. Build retrieval query from car + round context
  const retrievalQuery = buildRetrievalQuery(carSummary, previousRounds);

  // 3. Embed the query
  const queryEmbedding = await embedText(retrievalQuery);

  // 4. Hybrid search (BM25 + cosine)
  const candidates = await hybridSearch(queryEmbedding, retrievalQuery, 20);

  // 5. Rerank to top 5
  const topDocs = await rerank(candidates, retrievalQuery, 5);

  // 6. Format docs as context block
  const contextBlock = topDocs
    .map((doc, i) => `[${i + 1}] ${doc.source_file}\n${doc.content}`)
    .join('\n\n---\n\n');

  // 7. Build prompt
  const userPrompt = buildRoundPrompt(carSummary, previousRounds, isFirstCall, contextBlock);

  // 8. Call Groq
  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3-32b',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty Groq response');

  const result: GroqValuationResponse = JSON.parse(raw);

  // 9. Cache result for 10 minutes
  await redis.set(cacheKey, JSON.stringify(result), { ex: 600 });

  return result;
}

function buildRetrievalQuery(carSummary: string, rounds: ValuationRound[]): string {
  const context = rounds.map(r => `${r.questionCategory}: ${r.answer}`).join(', ');
  return `Used car pricing valuation for: ${carSummary}${context ? `. Known: ${context}` : ''}`;
}
```

---

### Retriever (`lib/rag/retriever.ts`)

```typescript
import { supabase } from '../vectordb';

export async function hybridSearch(
  embedding: number[],
  query: string,
  limit: number
) {
  // Vector search via pgvector
  const { data: vectorResults } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: limit,
  });

  // BM25 keyword search (Postgres full-text)
  const { data: keywordResults } = await supabase
    .from('knowledge_documents')
    .select('id, content, source_file, metadata')
    .textSearch('content', query.split(' ').join(' & '))
    .limit(limit);

  // Merge + deduplicate by id
  const seen = new Set<string>();
  const merged = [];
  for (const doc of [...(vectorResults ?? []), ...(keywordResults ?? [])]) {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      merged.push(doc);
    }
  }
  return merged;
}
```

Add this SQL function to Supabase:
```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE(id uuid, content text, source_file text, metadata jsonb, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, content, source_file, metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

---

### System Prompt (`lib/rag/prompts.ts`)

```typescript
export function buildSystemPrompt(): string {
  return `
You are VINme's AI valuation engine. VINme is a US-based car buying service.
Your job: estimate a fair cash offer range for a used car, then narrow it by
asking one targeted follow-up question per round. Max 4 rounds.

RULES:
1. Respond ONLY with valid JSON. No markdown. No preamble.
2. Schema (strict):
{
  "priceRange": { "low": number, "high": number, "currency": "USD" },
  "confidence": number,          // 0–100
  "nextQuestion": string | null, // null when done
  "questionCategory": string | null,
  "reasoning": string,           // 1 sentence internal reasoning, not shown to user
  "sourceDocuments": string[]    // which knowledge docs you used
}
3. Base your pricing ONLY on the retrieved knowledge documents provided.
   Do not invent prices from memory.
4. Start wide (confidence 20–40). Narrow aggressively as answers arrive.
5. Stop questioning when confidence >= 85 OR rounds >= 4. Set nextQuestion to null.
6. Question priority order (ask the most impactful first):
   mileage → condition → owners → accident_history → trim → features → location
7. Never ask about something already answered.
8. Keep questions conversational, max 12 words.
9. Prices in USD. US market pricing.
10. Confidence levels per IMPLEMENTATION2.md:
    0.85–1.00 = Automatic offer
    0.65–0.84 = Offer with caveat
    <0.65     = Flag for human review (set nextQuestion to null, set flag)
`.trim();
}

export function buildRoundPrompt(
  carSummary: string,
  previousRounds: ValuationRound[],
  isFirstCall: boolean,
  contextBlock: string
): string {
  const history = previousRounds.length > 0
    ? `\nANSWERED ROUNDS:\n${previousRounds.map((r, i) =>
        `[${i + 1}] ${r.questionCategory}: Q: "${r.question}" A: "${r.answer}"`
      ).join('\n')}`
    : '';

  return `
RETRIEVED KNOWLEDGE:
${contextBlock}

---

VEHICLE: ${carSummary}
ROUNDS COMPLETED: ${previousRounds.length}/4
${history}

TASK: ${isFirstCall
  ? 'First valuation call. Give initial wide range. Ask the highest-impact question.'
  : 'Update valuation using the latest answer. Narrow the range. Ask next question or finalize.'
}

Respond with JSON only.
`.trim();
}
```

---

### Embeddings (`lib/embeddings.ts`)

```typescript
// Uses Nomic API — sign up at nomic.ai, free tier available
export async function embedText(text: string): Promise<number[]> {
  const res = await fetch('https://api-atlas.nomic.ai/v1/embedding/text', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOMIC_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nomic-embed-text-v1.5',
      texts: [text],
      task_type: 'search_query',
    }),
  });
  const data = await res.json();
  return data.embeddings[0];
}
```

---

### VIN Decode (`lib/vehicle/nhtsa.ts`)

```typescript
export async function decodeVIN(vin: string) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
  const res = await fetch(url);
  const data = await res.json();

  const get = (var_: string) =>
    data.Results?.find((r: any) => r.Variable === var_)?.Value ?? null;

  return {
    vin,
    year: parseInt(get('Model Year')) || null,
    make: get('Make'),
    model: get('Model'),
    trim: get('Trim'),
    engine: `${get('Displacement (L)')}L ${get('Engine Configuration')}`,
    drivetrain: get('Drive Type'),
    bodyType: get('Body Class'),
    fuelType: get('Fuel Type - Primary'),
    raw: data.Results,
  };
}
```

---

### API Routes

#### `app/api/valuate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { runValuationPipeline } from '@/lib/rag/pipeline';

export async function POST(req: NextRequest) {
  try {
    const { carSummary, previousRounds, isFirstCall } = await req.json();
    const result = await runValuationPipeline(carSummary, previousRounds ?? [], isFirstCall ?? true);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Valuation failed' }, { status: 500 });
  }
}
```

#### `app/api/vehicle/decode/[vin]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { decodeVIN } from '@/lib/vehicle/nhtsa';
import { redis } from '@/lib/redis';

export async function GET(_: NextRequest, { params }: { params: { vin: string } }) {
  const { vin } = params;
  const cached = await redis.get(`vin:${vin}`);
  if (cached) return NextResponse.json(JSON.parse(cached as string));

  const decoded = await decodeVIN(vin);
  await redis.set(`vin:${vin}`, JSON.stringify(decoded), { ex: 86400 }); // 24hr cache
  return NextResponse.json(decoded);
}
```

#### `app/api/leads/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/vectordb';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase.from('leads').insert(body);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

---

## 7. Core Frontend Hook (`hooks/useValuation.ts`)

Uses `useReducer` to avoid stale closure issues across async rounds.

```typescript
import { useReducer, useCallback } from 'react';
import type { ValuationState, ValuationRound, GroqValuationResponse } from '@/lib/types';

type Action =
  | { type: 'START_LOADING'; carSummary: string; path: 'plate' | 'vin' | 'make-model' }
  | { type: 'SET_RESULT'; result: GroqValuationResponse }
  | { type: 'ADD_ROUND'; round: ValuationRound }
  | { type: 'SET_FINAL' }
  | { type: 'SET_ERROR' }
  | { type: 'RESET' };

const initialState: ValuationState = {
  path: null, carSummary: '', priceRange: null,
  confidence: 0, rounds: [], currentQuestion: null,
  currentCategory: null, status: 'idle',
};

function reducer(state: ValuationState, action: Action): ValuationState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, status: 'loading', carSummary: action.carSummary, path: action.path };
    case 'SET_RESULT':
      return {
        ...state,
        priceRange: action.result.priceRange,
        confidence: action.result.confidence,
        currentQuestion: action.result.nextQuestion,
        currentCategory: action.result.questionCategory,
        status: action.result.nextQuestion ? 'questioning' : 'final',
      };
    case 'ADD_ROUND':
      return { ...state, rounds: [...state.rounds, action.round], status: 'loading' };
    case 'SET_ERROR':
      return { ...state, status: 'error' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useValuation() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startValuation = useCallback(async (
    carSummary: string,
    path: 'plate' | 'vin' | 'make-model'
  ) => {
    dispatch({ type: 'START_LOADING', carSummary, path });
    const res = await fetch('/api/valuate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carSummary, previousRounds: [], isFirstCall: true }),
    });
    const result: GroqValuationResponse = await res.json();
    dispatch({ type: 'SET_RESULT', result });
  }, []);

  const answerQuestion = useCallback(async (answer: string) => {
    // state.rounds is read from reducer — no stale closure
    const newRound: ValuationRound = {
      question: state.currentQuestion!,
      questionCategory: state.currentCategory as any,
      answer,
    };
    dispatch({ type: 'ADD_ROUND', round: newRound });

    const updatedRounds = [...state.rounds, newRound];
    const res = await fetch('/api/valuate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carSummary: state.carSummary,
        previousRounds: updatedRounds,
        isFirstCall: false,
      }),
    });
    const result: GroqValuationResponse = await res.json();
    dispatch({ type: 'SET_RESULT', result });
  }, [state.currentQuestion, state.currentCategory, state.rounds, state.carSummary]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, startValuation, answerQuestion, reset };
}
```

---

## 8. Types (`lib/types.ts`)

```typescript
export type ValuationPath = 'plate' | 'vin' | 'make-model';

export type ValuationRound = {
  question: string;
  questionCategory: 'mileage' | 'condition' | 'owners' | 'accident_history' | 'trim' | 'features' | 'location' | 'other';
  answer: string;
};

export type PriceRange = {
  low: number;
  high: number;
  currency: 'USD';
};

export type GroqValuationResponse = {
  priceRange: PriceRange;
  confidence: number;
  nextQuestion: string | null;
  questionCategory: string | null;
  reasoning: string;
  sourceDocuments: string[];
};

export type ValuationState = {
  path: ValuationPath | null;
  carSummary: string;
  priceRange: PriceRange | null;
  confidence: number;
  rounds: ValuationRound[];
  currentQuestion: string | null;
  currentCategory: string | null;
  status: 'idle' | 'loading' | 'questioning' | 'final' | 'error';
};

export type Lead = {
  valuationId?: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  carSummary: string;
};
```

---

## 9. Answer Chips Map

```typescript
// lib/answer-chips.ts
export const ANSWER_CHIPS: Record<string, string[]> = {
  mileage:          ['< 30,000 mi', '30–70k mi', '70–120k mi', '120–200k mi', '> 200k mi'],
  condition:        ['Excellent', 'Good', 'Fair', 'Needs work'],
  owners:           ['1st owner', '2nd owner', '3rd or more'],
  accident_history: ['No accidents', 'Minor damage', 'Major accident'],
  features:         [],   // open text
  trim:             [],   // open text
  location:         ['Major metro', 'Mid-size city', 'Rural / small town'],
  other:            [],
};
```

---

## 10. Environment Variables

```env
# .env.local
GROQ_API_KEY=gsk_xxxx
NOMIC_API_KEY=nk-xxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx
```

---

## 11. Knowledge Base — Initial Seed Documents

These live in `db/seed/knowledge/`. Run a one-time ingestion script that chunks each file, embeds each chunk, and inserts into `knowledge_documents`. Start with these six from IMPLEMENTATION2.md:

| File | What to put in it |
|---|---|
| `depreciation_curves.md` | Year-over-year depreciation % by make/model category (luxury, economy, truck, SUV). Source: industry averages. |
| `condition_assessment_guide.md` | Condition grade definitions (Excellent/Good/Fair/Poor) mapped to price adjustment %. |
| `regional_pricing_factors.md` | US region adjustments — Sunbelt vs Northeast vs Midwest vs rural. ZIP-level when possible. |
| `mileage_adjustment_tables.md` | Mileage bands and corresponding price penalty/premium %. Below 30k = premium, above 150k = steep penalty. |
| `popular_models_pricing.md` | Baseline cash offer ranges for top 30 most common models (Civic, Camry, F-150, Silverado, CRV, RAV4, etc.) by year range. |
| `business_rules.md` | VINme-specific rules: minimum offer floor, models VINme doesn't buy, geographic coverage, offer validity window (48hr). |

**Ingestion script** (`db/seed/ingest.ts`) — run once with `npx ts-node db/seed/ingest.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import { embedText } from '../../lib/embeddings';
import { supabase } from '../../lib/vectordb';

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const CHUNK_SIZE = 500; // tokens ~= ~400 words

async function ingest() {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
    const chunks = chunkText(content, CHUNK_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);
      await supabase.from('knowledge_documents').insert({
        source_file: file,
        content: chunks[i],
        metadata: { file, chunkIndex: i },
        embedding,
        chunk_index: i,
      });
      console.log(`✓ ${file} chunk ${i + 1}/${chunks.length}`);
    }
  }
  console.log('Ingestion complete.');
}

function chunkText(text: string, maxWords: number): string[] {
  const paragraphs = text.split('\n\n').filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).split(' ').length > maxWords && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

ingest().catch(console.error);
```

---

## 12. Build Phases

### Phase 1 — Foundation (Week 1)
- [ ] `npx create-next-app@latest vinme --typescript --tailwind --app`
- [ ] Install: `groq-sdk`, `framer-motion`, `@upstash/redis`, `@supabase/supabase-js`, `react-hook-form`, `zod`
- [ ] Design tokens in `globals.css`
- [ ] `GrainOverlay` component
- [ ] Nav component (scroll-aware)
- [ ] All page sections as static shells (dark bg, correct typography, placeholder content)
- [ ] Footer

### Phase 2 — RAG Backend (Week 1–2)
- [ ] Supabase project + `schema.sql` applied
- [ ] `embeddings.ts` with Nomic API
- [ ] `vectordb.ts` with `match_documents` function
- [ ] Write 6 knowledge base seed documents
- [ ] Run ingestion script, verify embeddings stored
- [ ] `hybridSearch` + `reranker` working
- [ ] `pipeline.ts` end-to-end test (curl to `/api/valuate`)
- [ ] Redis cache layer

### Phase 3 — Valuation Widget (Week 2–3)
- [ ] `ValuationWidget` with 3 tabs
- [ ] VIN tab → NHTSA decode → car preview card → start valuation
- [ ] Plate tab → mock decode → start valuation
- [ ] Make/Model tab → dropdowns → build summary → start valuation
- [ ] `useValuation` hook wired to all three paths
- [ ] `ValuationCard` — price range + confidence bar + question
- [ ] `AnswerChips` per category
- [ ] `AnswerHistory` log
- [ ] `InquiryForm` slide-up → `/api/leads`
- [ ] In-place expansion animation (Framer Motion layout)

### Phase 4 — Hero + Animations (Week 3)
- [ ] Particle field canvas
- [ ] Hero headline stagger word reveal
- [ ] Confidence bar Framer Motion spring animation
- [ ] Price range number interpolation (count-up on each round)
- [ ] Testimonial carousel with AnimatePresence
- [ ] FAQ accordion height animation
- [ ] Contact form with focus-amber border states
- [ ] Scroll-triggered section entrance animations (Framer `whileInView`)

### Phase 5 — QA + Deploy (Week 4)
- [ ] Test valuation accuracy on 20+ car types (economy, luxury, truck, EV, high mileage)
- [ ] Tune system prompt if prices hallucinating outside knowledge docs
- [ ] Mobile responsiveness pass (all sections)
- [ ] Lighthouse: performance 90+, a11y basics
- [ ] Vercel deploy + all env vars
- [ ] Set up Supabase RLS policies on `leads` table
- [ ] Rate limiting on `/api/valuate` (max 10 req/IP/hour via Upstash)

---

## 13. Accuracy & Confidence Thresholds

Per IMPLEMENTATION2.md targets:

| Confidence | Behavior in UI |
|---|---|
| 85–100 | Show final offer. "Your offer: $X,XXX – $X,XXX" in Signal Amber. InquiryForm slides up. |
| 65–84 | Show offer with caveat. "Estimated range — a specialist may refine this further." |
| < 65 | "Your car needs a personal review." Show inquiry form immediately, no price range displayed. |

---

## 14. Rate Limiting

Add to `/api/valuate/route.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

// In the route handler, before pipeline:
const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
const { success } = await ratelimit.limit(ip);
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
```

---

## 15. Dependencies

```bash
npx create-next-app@latest vinme --typescript --tailwind --app

npm install groq-sdk
npm install framer-motion
npm install @upstash/redis @upstash/ratelimit
npm install @supabase/supabase-js
npm install react-hook-form zod @hookform/resolvers
```

Geist font is bundled with Next.js 14 — no install needed. Import in `layout.tsx`:
```tsx
import { GeistSans } from 'geist/font/sans';
```

---

*Start with Phase 1 static shells. Get every section on screen in the dark design system before touching the RAG backend — visual correctness first, then intelligence.*
