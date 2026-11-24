# CIN & LLPIN checker

Paste a list of Indian company numbers (CIN) and LLP numbers (LLPIN), one per line.
For each one you get: valid or not (and exactly what is wrong), company or LLP, listed or
unlisted, state, year of incorporation and company type.

Built for the FileSure Tech Support & Operations internship assignment.

**Live:** `<paste your live link here>`  
**Repo:** `<paste your GitHub link here>`

## What it does

| Input | Result |
|---|---|
| `L17110MH1973PLC019786` | Valid · Company · Listed · Maharashtra · 1973 · Public limited company |
| `U72900KA2031PTC123456` | Not valid: the year segment is highlighted, "Year 2031 is in the future." |
| `U7290KA2019PTC123456` | Not valid: "Too short: 21 characters needed, this has 20 (1 missing)." |
| `AAA-1234` | Valid · LLP |
| `AAA1234` | Not valid: "Missing hyphen. An LLPIN is written AAA-1234." |

Extras: live results while typing, filter (All / Valid / Invalid), duplicate detection,
CSV download, "Try an example", 500+ lines handled (rows load 100 at a time), works on phones.

## Flow

```
 paste text
     │
     ▼
 tokenize()        split on newline / space / comma / ; and clean quotes
     │
     ▼
 parseOne()        UPPERCASE → detectKind()
     │                  ├─ has "-" or looks like AAA1234 → LLPIN
     │                  ├─ short, no hyphen             → Unknown
     │                  └─ otherwise                    → CIN
     ▼
 parseCIN() / parseLLPIN()   → { valid, errors[{segs, msg}], segments[], info }
     │
     ▼
 app.js render()   summary + filter + rows (coloured segments, bad segment in red)
```

## How a CIN is read (the research)

A CIN has 21 characters: `L 17110 MH 1973 PLC 019786`

| Chars | Meaning | Rule used |
|---|---|---|
| 1 | Listing status | `L` listed, `U` unlisted |
| 2–6 | Industry (NIC) code | 5 digits |
| 7–8 | State / UT of registered office | must be a known 2-letter MCA code (MH, DL, KA, SK, TG, UR…) |
| 9–12 | Year of incorporation | 4 digits, between 1850 and the current year |
| 13–15 | Company type | PLC, PTC, OPC, GOI, SGC, FTC, FLC, NPL, GAP, GAT, ULL, ULT |
| 16–21 | Registration number | 6 digits |

Cross-checks: a private company, OPC, private guarantee or private unlimited company
cannot be **L** (listed). An OPC cannot exist before 2013 (Companies Act 2013).

An **LLPIN** is `AAA-1234`: three letters, hyphen, four digits. It does not encode state,
year or listing, so the page says so instead of inventing values.

Sources to cross-check: the MCA company master data pages and the Companies Act 2013.
Type-code labels (especially FTC, FLC, ULL, ULT) should be re-verified against MCA's latest list.

## Design decisions

- **Colour-coded CIN anatomy.** Each of the 6 parts has its own colour and a label under it.
  A first-time visitor learns the format just by looking, and for an invalid number the
  exact wrong part turns red with a wavy underline (not colour alone, for colour-blind users).
- **Empty state teaches.** Before you paste anything, the page shows a real CIN taken apart.
- **Errors say what and where**, in plain words ("found XX, not a recognised state code").
- **Mobile first.** One column on phones, sticky input on desktop, 16px+ text, big tap targets.
- **Privacy line.** All checking is in the browser. Nothing is uploaded.

## Project structure

```
index.html            page structure
css/style.css         layout, colours, responsive rules
js/cin-parser.js      pure logic (no DOM): tokenizing, CIN/LLPIN rules, CSV
js/app.js             DOM: events, rendering, filter, "show more"
tests/                node tests for the logic
SUBMISSION_GUIDE.md   step-by-step submission checklist (Hinglish)
```

## Run locally

No build step. Either double-click `index.html`, or:

```bash
npx serve .          # then open the printed http://localhost URL
node --test          # run the 12 logic tests (Node 18+)
```

## Deploy (free)

**GitHub Pages:** push to a public repo → Settings → Pages → Source: `main` / root → Save.
Live at `https://<username>.github.io/<repo>/` in about a minute.  
**Netlify:** app.netlify.com/drop → drag the folder.  
**Vercel:** `npx vercel` (or import the GitHub repo), framework "Other", no build command.

## Known limits / next steps

- Only the format is checked; there is no lookup against MCA, so "valid" does not mean "registered".
- Industry code is shown as a number; a NIC code → industry name table could be added.
- Old/rare CINs (pre-2000 formats) may not follow this pattern.
- Idea: file upload (.csv/.txt) and a one-click "copy invalid only".
