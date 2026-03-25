# Tax Check Malaysia

A simple, client-side tax estimator for Malaysian residents.

**Live Demo:** [tax-check-malaysia.netlify.app](https://tax-check-malaysia.netlify.app)

---

## What This Is

A static web tool that helps Malaysians estimate their income tax before filing on MyTax. Built to be simple, transparent, and educational.

**Key Features:**
- Tax year selection (YA 2024, 2025)
- Relief calculator with auto-capping
- Progressive tax bracket calculation
- Plain-English result explanations
- No data collection, no backend

---

## Supported Scope

**Currently supports:**
- Malaysian resident individuals
- Employment income only
- Basic relief scenarios (EPF, lifestyle, medical, etc.)

**Not supported:**
- Business or freelance income
- Foreign income
- Non-resident tax cases
- Complex tax situations

---

## Disclaimer

This tool provides an **educational estimate only** and does not replace official LHDN guidance, MyTax filing, or professional tax advice.

- Not affiliated with LHDN
- Tax rules may change
- Always verify with official sources

---

## Run Locally

No build step required. Just open the files in a browser:

```bash
# Option 1: Direct open
open index.html

# Option 2: Simple HTTP server
python -m http.server 8000
# Then visit: http://localhost:8000
```

---

## Deploy to Netlify

### Option 1: Drag & Drop (Quickest)

1. Zip the project files (`index.html`, `styles.css`, `app.js`, `README.md`)
2. Go to [netlify.com/drop](https://app.netlify.com/drop)
3. Drag and drop the zip file
4. Done! Your site is live.

### Option 2: Git-based Deploy

1. Push this repo to GitHub
2. Log in to [netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `/`
6. Click "Deploy site"

### Option 3: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

---

## Project Structure

```
.
├── index.html      # Main HTML
├── styles.css      # Styles (mobile-first)
├── app.js          # Tax calculation logic
└── README.md       # This file
```

---

## Updating Tax Rules

Tax rules are defined in `app.js` in the `taxRules` object.

To add a new tax year:
1. Copy an existing year entry (e.g., 2025)
2. Update values based on LHDN announcements
3. Add the year to the selector in the init function

---

## License

MIT - Feel free to use, modify, or learn from this project.
