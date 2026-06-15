# VINme Backend API — Frontend Integration Guide

> **Version:** v1.0 | June 2026  
> **Base URL (local):** `http://localhost:3000`  
> **Base URL (production):** `https://vinme-backend.vercel.app`

This document covers every API endpoint the frontend needs to call, including the exact request shape, response schema, and a complete worked example of the full AI valuation flow.

---

## Environment Setup

The backend expects these variables. Ask the backend team for the values — **never commit them to git.**

```env
GROQ_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Endpoints

### 1. VIN Decode

Decodes a VIN using the NHTSA database. Results are cached for 24 hours.

```
GET /api/vehicle/decode/:vin
```

**Example Request:**
```bash
GET /api/vehicle/decode/1HGCM82633A004352
```

**Response:**
```json
{
  "vin": "1HGCM82633A004352",
  "year": 2003,
  "make": "HONDA",
  "model": "Accord",
  "trim": "EX",
  "engine": "2.4L Inline 4",
  "drivetrain": "FWD",
  "bodyType": "Sedan/Saloon",
  "fuelType": "Gasoline",
  "raw": [ ...raw NHTSA array... ]
}
```

**Usage in the widget:**
- Call this after the user types a VIN in the **VIN Tab**.
- Show a preview card of `year`, `make`, `model`, `trim` for the user to confirm before starting valuation.
- Once confirmed, use `year + make + model + trim` to build `carSummary` and `carDetails` for `/api/valuate`.

---

### 2. AI Valuation Engine

The main AI endpoint. Call this once to start, then call it again after each user answer to get the next question and a narrowed price range.

```
POST /api/valuate
```

**Rate limit:** 10 requests per IP per hour.

#### Request Body

```typescript
{
  carSummary: string;        // e.g. "2018 Toyota Camry SE"
  carDetails: {
    year: number;            // e.g. 2018
    make: string;            // e.g. "Toyota"
    model: string;           // e.g. "Camry"
  };
  previousRounds: Round[];   // Empty array [] on first call
  isFirstCall: boolean;      // true on first call, false after
}

type Round = {
  question: string;
  questionCategory: string;
  answer: string;
}
```

#### Response Body

```typescript
{
  priceRange: {
    low: number;             // e.g. 14000
    high: number;            // e.g. 21000
    currency: "USD";
  };
  confidence: number;        // 0–100
  nextQuestion: string | null; // null = final offer, stop asking
  questionCategory: string | null;
  reasoning: string;         // Internal, do not show to user
}
```

---

## Full Valuation Flow — Worked Example

This is the exact sequence the frontend widget should implement.

### Step 1 — First Call (Widget Submitted)

```bash
POST /api/valuate
{
  "carSummary": "2018 Toyota Camry SE",
  "carDetails": { "year": 2018, "make": "Toyota", "model": "Camry" },
  "previousRounds": [],
  "isFirstCall": true
}
```
```json
{
  "priceRange": { "low": 14000, "high": 21000, "currency": "USD" },
  "confidence": 30,
  "nextQuestion": "What is the vehicle's mileage?",
  "questionCategory": "mileage",
  "reasoning": "Wide range based on baseline market price"
}
```
➡️ **Show:** Price range `$14,000 – $21,000` | Confidence bar 30% | Display `nextQuestion` to user with chips.

---

### Step 2 — User answers mileage

```bash
POST /api/valuate
{
  "carSummary": "2018 Toyota Camry SE",
  "carDetails": { "year": 2018, "make": "Toyota", "model": "Camry" },
  "previousRounds": [
    { "question": "What is the vehicle's mileage?", "questionCategory": "mileage", "answer": "70–120k mi" }
  ],
  "isFirstCall": false
}
```
```json
{
  "priceRange": { "low": 15810, "high": 19590, "currency": "USD" },
  "confidence": 40,
  "nextQuestion": "What is the vehicle's condition?",
  "questionCategory": "condition",
  "reasoning": "Applied mileage adjustment of -10% to baseline price"
}
```
➡️ **Animate:** Price range narrows | Confidence ticks up to 40% | Ask condition question.

---

### Step 3 — User answers condition

```bash
POST /api/valuate
{
  ...
  "previousRounds": [
    { "question": "...", "questionCategory": "mileage", "answer": "70–120k mi" },
    { "question": "What is the vehicle's condition?", "questionCategory": "condition", "answer": "Good" }
  ],
  "isFirstCall": false
}
```
```json
{
  "priceRange": { "low": 16310, "high": 20390, "currency": "USD" },
  "confidence": 60,
  "nextQuestion": "Are there any reported accidents?",
  "questionCategory": "accidents",
  "reasoning": "Applied mileage and condition adjustments"
}
```

---

### Step 4 — Final Round (`nextQuestion: null`)

After 4 rounds OR when confidence ≥ 85, `nextQuestion` will be `null`.

```json
{
  "priceRange": { "low": 17350, "high": 19650, "currency": "USD" },
  "confidence": 80,
  "nextQuestion": null,
  "questionCategory": null,
  "reasoning": "Baseline adjusted for good condition and no accidents"
}
```
➡️ **Show:** Final offer in **Signal Amber**. Slide up the `InquiryForm`.

---

## Frontend Logic Summary

```
nextQuestion !== null  →  Show question + answer chips → call /api/valuate again
nextQuestion === null  →  Show final offer → slide up InquiryForm
confidence >= 85       →  "Your offer: $X,XXX – $X,XXX" (strong offer)
confidence 65–84       →  Add caveat: "A specialist may refine this further."
confidence < 65        →  Hide price range, show InquiryForm immediately
```

---

### 3. Submit Lead

Call this after the user fills in the `InquiryForm` post-valuation.

```
POST /api/leads
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "555-123-4567",
  "email": "john@example.com",
  "city": "Los Angeles",
  "car_summary": "2018 Toyota Camry SE"
}
```

**Response:**
```json
{ "success": true }
```

---

## Answer Chips — Per Question Category

Use these as the pill options in the `AnswerChips` component. Map `questionCategory` from the API response to the corresponding chip set.

| `questionCategory` | Chips |
|---|---|
| `mileage` | `< 30,000 mi` · `30–70k mi` · `70–120k mi` · `120–200k mi` · `> 200k mi` |
| `condition` | `Excellent` · `Good` · `Fair` · `Needs work` |
| `accidents` | `No accidents` · `Minor damage` · `Major accident` |
| `features` | _(Free text input — no chips)_ |

---

## Confidence Bar Behaviour

| Confidence | Color | UI State |
|---|---|---|
| 85–100 | `#e8a020` (Signal Amber) | Final offer. InquiryForm slides up. |
| 65–84 | `#e8a020` at 70% opacity | Offer with caveat text. |
| < 65 | `#888880` (Ash) | Hide price. Show InquiryForm immediately. |

---

## Error Handling

| Status | Meaning |
|---|---|
| `400` | Missing required fields (`carDetails.year/make/model`) |
| `429` | Rate limited — too many requests from this IP |
| `500` | Internal error — show generic "Try again" message |

---

## TypeScript Types (copy into your project)

```typescript
export type ValuationRound = {
  question: string;
  questionCategory: 'mileage' | 'condition' | 'accidents' | 'features' | 'other';
  answer: string;
};

export type PriceRange = {
  low: number;
  high: number;
  currency: 'USD';
};

export type ValuationResponse = {
  priceRange: PriceRange;
  confidence: number;           // 0–100
  nextQuestion: string | null;  // null = show final offer
  questionCategory: string | null;
  reasoning: string;            // Internal — do not display
};

export type ValuationRequest = {
  carSummary: string;
  carDetails: { year: number; make: string; model: string };
  previousRounds: ValuationRound[];
  isFirstCall: boolean;
};
```
