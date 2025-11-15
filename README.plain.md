# How the Corporate Storytelling Evaluation Tool Works

## A Plain English Guide for Non-Coders

This document explains how the entire system works, from when you submit your content to when you receive your evaluation report. No technical jargon—just clear explanations and visual diagrams.

---

## The Big Picture: Three Main Parts

Think of the system like a restaurant:

1. **Frontend** = The dining room (where you place your order)
2. **Backend** = The kitchen manager (takes your order, coordinates everything)
3. **AI Processing** = The chefs (analyze your content and create the report)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Frontend   │  ────>  │   Backend   │  ────>  │ AI Processing│
│  (Website)  │         │  (Manager)  │         │   (Chefs)   │
└─────────────┘         └─────────────┘         └─────────────┘
     You see              Coordinates            Does the work
```

---

## Part 1: The Frontend (What You See)

**What it is:** The website form where you submit your content.

**What it does:**
- Shows you a form to fill out
- Lets you enter your email address
- Lets you paste a website URL (optional)
- Lets you upload files like PDFs or PowerPoints (optional)
- Lets you specify a target audience you're worried about (optional)
- Shows you a confirmation message after you submit
- Shows you error messages if something goes wrong

**How it works:**
1. You fill out the form on your web browser
2. When you click "Submit," the form checks that everything is valid:
   - Is your email address in the right format?
   - Is the URL valid (if you provided one)?
   - Did you provide either a URL or at least one file?
   - Are the files the right type (PDF, PPTX, or DOCX)?
   - Are the files under 50MB?
3. If everything looks good, it sends your information to the Backend
4. You immediately see a message like: "Your request has been received! You'll get your report in 5-10 minutes."

**Visual Flow:**
```
You (Browser)
    │
    │ Fill out form
    ▼
┌─────────────────┐
│  Form Validation │  ← Checks: email format, URL format, file types, file sizes
└─────────────────┘
    │
    │ Valid? Yes
    ▼
┌─────────────────┐
│  Send to Backend │  ← Your data goes to the Backend
└─────────────────┘
    │
    │ Success response
    ▼
┌─────────────────┐
│ Show Confirmation│  ← "Request received! Check your email."
└─────────────────┘
```

---

## Part 2: The Backend (The Coordinator)

**What it is:** The "brain" that coordinates everything. It doesn't do the actual analysis—it manages the process.

**What it does:**
- Receives your submission from the Frontend
- Validates everything one more time (double-checking)
- Stores your request in a database (Firestore)
- Saves any files you uploaded to cloud storage
- Sends you a confirmation email
- Creates a "task" to process your evaluation
- Later, when processing is done, sends you the final report email

**How it works:**

### Step 1: Receiving Your Submission
```
Frontend sends your data
    │
    ▼
┌─────────────────────┐
│  Backend Receives   │
│  - Your email       │
│  - URL (if provided)│
│  - Files (if any)   │
│  - Target audience  │
└─────────────────────┘
```

### Step 2: Validation & Storage
```
┌─────────────────────┐
│  Validate Again     │  ← Double-checks everything
│  - Email format     │
│  - URL accessible?   │
│  - File types OK?    │
└─────────────────────┘
    │
    │ All good?
    ▼
┌─────────────────────┐
│  Store in Database  │  ← Saves your request
│  (Firestore)        │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Save Files to      │  ← Uploads your files to cloud storage
│  Cloud Storage      │
└─────────────────────┘
```

### Step 3: Create Processing Task
```
┌─────────────────────┐
│  Create Task        │  ← Tells the system: "Process this evaluation"
│  (Cloud Tasks)      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Send Confirmation  │  ← Emails you: "We got your request!"
│  Email              │
└─────────────────────┘
```

### Step 4: Return Response to Frontend
```
┌─────────────────────┐
│  Return Success     │  ← Tells Frontend: "All good, here's the ID"
│  - Submission ID    │
│  - Status: pending  │
│  - Estimated time   │
└─────────────────────┘
```

**Important:** The Backend doesn't wait for the analysis to finish. It immediately tells you "we got it" and then processes your evaluation in the background. This is called "asynchronous processing"—you don't have to wait around.

---

## Part 3: AI Processing (The Analysis Engine)

**What it is:** The actual "brain" that analyzes your content and creates your report. This is where all the AI magic happens.

**What it does:**
- Downloads/scrapes content from your URL (if provided)
- Extracts text from your uploaded files
- Identifies who your target audiences are
- Evaluates your content across multiple dimensions
- Validates all quotes and examples
- Generates your PDF report

**How it works - The Complete Journey:**

### Phase 1: Content Ingestion (Getting Your Content)

```
┌─────────────────────────────────────────┐
│         Content Ingestion               │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────┐
│  If you       │      │  If you       │
│  provided URL │      │  uploaded     │
│               │      │  files        │
└───────────────┘      └───────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────┐
│  Web Scraper  │      │  File Parser  │
│  - Visits     │      │  - Reads PDF  │
│    homepage   │      │  - Reads PPTX │
│  - Visits     │      │  - Reads DOCX │
│    About page │      │  - Extracts   │
│  - Extracts   │      │    text       │
│    text       │      │               │
└───────────────┘      └───────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Combined Content      │
        │  (All text together)   │
        └───────────────────────┘
```

### Phase 2: The AI Agent Pipeline (The Analysis)

This is where it gets interesting! The system uses 8 different AI "agents" (think of them as specialized experts) that work together to analyze your content.

**Visual Flow of All Agents:**

```
                    ┌─────────────────────────┐
                    │   Your Content          │
                    │   (Text from URL/files)  │
                    └─────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  [1] Audience Identification Agent  │
        │  "Who is this content for?"         │
        │  - Reads your content               │
        │  - Identifies target audiences      │
        │  - Uses your hint if you provided   │
        │    one (e.g., "CFOs")               │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Found 3 audiences:                 │
        │  - Technical buyers                  │
        │  - CFOs (budget approvers)          │
        │  - End users                         │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  [2] Clarity Agent (per audience)   │
        │  "Is the message clear?"            │
        │                                     │
        │  Runs in PARALLEL for each audience:│
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐
        │  │ Tech    │ │ CFOs    │ │ End     │
        │  │ Buyers  │ │         │ │ Users   │
        │  └─────────┘ └─────────┘ └─────────┘
        │                                     │
        │  For each, asks:                   │
        │  - What do they do?                 │
        │  - How are they different?          │
        │  - Who uses them?                   │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  [3] Technical Level Agent          │
        │  "Is it too technical or too vague?"│
        │  - Evaluates for each audience      │
        │  - Finds mismatches                 │
        │  - Example: "CFO clarity: 8/100"    │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  [4] Importance Agent                │
        │  "Why should they care?"            │
        │  - Evaluates relevance              │
        │  - Checks if value is clear         │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  [5] Voice Agent                     │
        │  "What's the personality?"          │
        │  - Analyzes tone                    │
        │  - Checks consistency               │
        │                                     │
        │  [6] Vividness Agent                 │
        │  "Is it memorable?"                 │
        │  - Checks storytelling quality      │
        │  - Evaluates emotional engagement   │
        │                                     │
        │  (These two run in parallel)        │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  [7] Citation Validation Agent      │
        │  "Are all quotes real?"             │
        │                                     │
        │  This is CRITICAL - it checks:      │
        │  - Every quote in the assessments    │
        │  - Verifies against source material  │
        │  - Removes any fabricated quotes    │
        │  - Only keeps verified examples     │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  [8] Synthesis/Editor Agent          │
        │  "Create the final report"           │
        │                                     │
        │  - Combines all assessments          │
        │  - Writes executive summary          │
        │  - Creates recommendations          │
        │  - Formats everything               │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Final Report Content               │
        │  (Ready to convert to PDF)          │
        └─────────────────────────────────────┘
```

**What Each Agent Does (In Simple Terms):**

1. **Audience Identification Agent**: Like a detective, it reads your content and figures out who you're trying to reach. If you said "CFOs," it pays special attention to that.

2. **Clarity Agent**: For each audience, it checks: "Can they understand what you do?" It runs multiple times in parallel—once for each audience you're targeting.

3. **Technical Level Agent**: Checks if your content is too technical for some audiences (like CFOs) or too vague for others (like engineers).

4. **Importance Agent**: Asks "Why should this audience care?" and checks if you've made the value clear.

5. **Voice Agent**: Analyzes the personality and tone of your content. Is it consistent? Does it have a distinct voice?

6. **Vividness Agent**: Checks if your storytelling is memorable and engaging, or if it's generic and forgettable.

7. **Citation Validation Agent**: **This is the quality control step.** It goes through every quote and example and verifies they actually exist in your source material. If it can't find a quote, it removes it rather than making something up.

8. **Synthesis Agent**: Takes all the assessments and writes your final report, organizing everything into a clear, actionable format.

### Phase 3: Report Generation

```
┌─────────────────────────────────────┐
│  Report Generator                   │
│                                     │
│  - Takes all assessments            │
│  - Formats into sections:           │
│    • Executive Summary              │
│    • Audience Analysis               │
│    • Clarity Assessment              │
│    • Technical Appropriateness       │
│    • Importance & Value              │
│    • Voice & Personality             │
│    • Storytelling & Memorability     │
│    • Recommendations                 │
│    • Next Steps                      │
│  - Converts to PDF (2-5 pages)      │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  PDF Report Ready                    │
└─────────────────────────────────────┘
```

---

## The Complete Journey: From Submission to Report

Here's what happens from start to finish:

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: YOU SUBMIT                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Website)                                              │
│  - You fill out form                                            │
│  - Form validates your input                                    │
│  - Sends data to Backend                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Receives                                                │
│  - Validates again                                              │
│  - Stores request in database                                   │
│  - Saves files to cloud storage                                 │
│  - Creates processing task                                      │
│  - Sends you confirmation email                                 │
│  - Returns success to Frontend                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  You See Confirmation                                            │
│  "Request received! Check your email."                          │
│  (This happens in seconds)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 2: BACKGROUND PROCESSING                 │
│                    (Happens while you wait)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Task Handler                                            │
│  - Gets triggered by Cloud Tasks                                │
│  - Fetches your request from database                           │
│  - Calls AI Processing Service                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AI Processing Service                                           │
│                                                                  │
│  Phase 1: Content Ingestion                                     │
│  ├─ Scrapes URL (if provided)                                   │
│  └─ Parses files (if uploaded)                                  │
│                                                                  │
│  Phase 2: Agent Pipeline                                        │
│  ├─ [1] Identify Audiences                                     │
│  ├─ [2] Evaluate Clarity (per audience)                         │
│  ├─ [3] Evaluate Technical Level                                │
│  ├─ [4] Evaluate Importance                                     │
│  ├─ [5] Evaluate Voice                                          │
│  ├─ [6] Evaluate Vividness                                      │
│  ├─ [7] Validate Citations                                      │
│  └─ [8] Synthesize Report                                       │
│                                                                  │
│  Phase 3: Generate PDF                                          │
│  └─ Creates 2-5 page PDF report                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Task Handler (continued)                               │
│  - Receives completed report                                    │
│  - Stores results in database                                   │
│  - Updates status to "completed"                                │
│  - Calls Report Delivery Service                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Report Delivery Service                                         │
│  - Gets PDF report                                              │
│  - Composes email with summary                                  │
│  - Attaches PDF                                                 │
│  - Sends to your email address                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 3: YOU RECEIVE REPORT                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Your Email Inbox                                                │
│  - Subject: "Your Evaluation Report is Ready"                   │
│  - Body: Brief summary of key findings                          │
│  - Attachment: Your PDF report (2-5 pages)                      │
└─────────────────────────────────────────────────────────────────┘
```

**Timeline:**
- **0-30 seconds**: You submit, get confirmation
- **30 seconds - 10 minutes**: Background processing happens
- **~10 minutes**: You receive email with PDF report

---

## Key Concepts Explained

### What is "Asynchronous Processing"?

**Simple explanation:** The system doesn't make you wait. When you submit your content, it immediately says "got it!" and then works on your evaluation in the background. You can close your browser and go about your day—the system will email you when it's done.

**Why it works this way:** Analyzing content with AI takes time (5-10 minutes). If the system made you wait, your browser would timeout or you'd get frustrated. This way, you get instant confirmation and the report later.

### What is "Parallel Processing"?

**Simple explanation:** When the system needs to check clarity for 3 different audiences, it doesn't do them one at a time. It does all 3 at the same time, like having 3 people read the same book simultaneously instead of one person reading it 3 times.

**Why it's faster:** If each check takes 1 minute, doing them in parallel takes 1 minute total. Doing them one at a time would take 3 minutes.

### What is "Citation Validation"?

**Simple explanation:** Before the system includes any quote or example in your report, it double-checks that the quote actually exists in your original content. It's like fact-checking—the system won't make up quotes to support its points.

**Why it matters:** This ensures the report is honest and credible. If the system can't find evidence for a claim, it says "we found no examples" rather than inventing something.

### What is "Rate Limiting"?

**Simple explanation:** The system limits how many requests you can make to prevent abuse. You can submit:
- Maximum 3 times per email address per day
- Maximum 5 times per IP address per hour

**Why it exists:** Prevents people from spamming the system or using it in ways it wasn't designed for.

---

## Where Data is Stored

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage                             │
└─────────────────────────────────────────────────────────────┘

1. Firestore (Database)
   - Your evaluation request
   - Processing status
   - Final results
   - Audiences identified
   - All assessments

2. Cloud Storage
   - Your uploaded files (PDFs, PPTX, DOCX)
   - Generated PDF reports

3. Email Service (SendGrid)
   - Sends confirmation emails
   - Sends final report emails
```

---

## What Happens If Something Goes Wrong?

The system is designed to handle errors gracefully:

1. **Invalid URL**: You see an error message immediately, before submission
2. **File too large**: You see an error message immediately
3. **Website can't be scraped**: System emails you with specific error and suggestions
4. **Processing fails**: System emails you explaining what went wrong and next steps
5. **Email delivery fails**: System logs the error (you can still check status via API)

---

## Summary: The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Frontend (What You See)                           │
│  - Web form                                                  │
│  - Validation                                                │
│  - User feedback                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP Requests
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Backend (The Coordinator)                          │
│  - Receives submissions                                      │
│  - Validates & stores data                                   │
│  - Manages tasks                                             │
│  - Sends emails                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: AI Processing (The Analysis Engine)                │
│  - Ingests content                                           │
│  - Runs 8 specialized AI agents                               │
│  - Validates citations                                       │
│  - Generates PDF report                                      │
└─────────────────────────────────────────────────────────────┘
```

Each layer has a specific job, and they work together to deliver your evaluation report.

---

## Questions?

This system is designed to be:
- **Fast**: You get confirmation in seconds
- **Thorough**: 8 different AI agents analyze your content
- **Honest**: All quotes are verified against your source material
- **Reliable**: Handles errors gracefully and keeps you informed

The entire process from submission to report typically takes 5-10 minutes, but you don't have to wait—the system emails you when it's ready!

