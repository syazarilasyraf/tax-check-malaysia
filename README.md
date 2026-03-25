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
