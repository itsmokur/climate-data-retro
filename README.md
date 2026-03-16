# Retro Board (Realtime)

A lightweight, single-file retrospective board that works in real time for everyone who opens the same URL.

It supports:
- **Realtime collaboration** (shared board state)
- **Presence** (see how many people are online + names)
- **Shared timer** (one timer for everyone)
- **Hidden cards until time is up** (cards stay hidden while the timer is running; they reveal when it hits 00:00)
- **Host controls** (the first person who joins becomes the host and can delete any card)

---

## How it works

- A board is identified by the URL hash:  
  `https://your-site.com/#<boardId>`
- Anyone opening the same link joins the same board.
- The app stores:
  - board state at: `boards/<boardId>/state`
  - timer state at: `boards/<boardId>/timer`
  - host metadata at: `boards/<boardId>/meta`
  - presence list at: `presence/<boardId>/<clientId>`

---

## Tech stack

- Plain **HTML/CSS/JS** (single `index.html`)
- **Firebase Realtime Database (RTDB)** for state + presence + timer
- No build step, no bundler

---

## Local development

Because Firebase modules are loaded via `type="module"`, you should run a local server (opening the file directly may break imports).

### Option A: VS Code
1. Install **Live Server**
2. Right-click `index.html` → **Open with Live Server**

### Option B: Python
```bash
python3 -m http.server 5173
