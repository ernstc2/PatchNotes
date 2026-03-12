# PatchNotes

> **Real‑time government updates, human‑readable summaries.** PatchNotes tracks U.S. executive orders, federal bills, and regulations, then distills them with AI so you can follow policy changes in minutes, not hours.

![patchnotes](https://github.com/user-attachments/assets/f10665e3-47dd-4478-bec8-a07d946ee688)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Unified feed** | Aggregates data from the Congressional Bills API, FederalRegister API, and presidential Executive Orders feed. |
| **AI summaries** | Google Gemini condenses each item into a plain‑English blurb on demand. |
| **Bookmarks** | Authenticated users can save any article and view them in a personal profile. |
| **Granular filters** | Toggle Bills, Executive Orders, and Regulations to tune the feed. |
| **12‑hour auto‑refresh** | The server checks data freshness and backfills anything missed while you were away. |
| **Dark mode** | One‑click 🌙 toggle, stored in local storage. |

---

## 🏗 Tech Stack

| Layer | Tech |
|-------|------|
| **Front‑end** | Vanilla HTML/CSS + React 18 (UMD) components |
| **Back‑end** | Node.js 20, Express 5 |
| **Database** | MongoDB Atlas, `connect‑mongo` session store |
| **Auth** | Sessions + `express‑session`, salted bcrypt hashes |
| **AI** | Google Gemini API for text summarisation |
| **Infra** | Deployed on Render / Railway / Fly.io (pick yours) |

### Folder Structure

```text
patchnotes/
├── public/
│   ├── index.html         # main feed
│   ├── login.html         # auth page
│   ├── styles.css         # theming
│   └── components/
│       ├── Article.js
│       └── Profile.js
├── server.js              # Express entry point
├── apiCalls/              # wrappers for each data source
│   ├── congressAPI.js
│   ├── execOrderAPI.js
│   ├── regulationAPI.js
│   └── geminiAPI.js
└── README.md
```

---

## ⚡️ Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/patchnotes.git
cd patchnotes
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
DB_CONN=mongodb+srv://<user>:<pass>@cluster.mongodb.net?retryWrites=true&w=majority
SESSION_SECRET=super‑secret‑string
GEMINI_API_KEY=your_google_gemini_key
NODE_ENV=development
PORT=3000
```

### 3. Run the app

```bash
npm run dev     # nodemon + dotenv
# OR
node server.js  # production
```

Browse to **http://localhost:3000** and start exploring.

---

## 📚 API Reference

> All responses are JSON.

### Data Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/data` | *TODO*: implement pagination (currently test stub). |
| `GET` | `/data/latest` | Latest 7 days of **all** collections. |
| `GET` | `/data/latest/:days` | Latest `:days` days (e.g. `/data/latest/30`). |
| `GET` | `/data/:YYYY-:MM-:DD` | Data for a specific day. |
| `GET` | `/data/:YYYY-MM-DD..YYYY-MM-DD` | Range query. |

Pass `?collections=bills,execOrders` to limit the response.

### Auth Endpoints

| Method | Route | Body |
|--------|-------|------|
| `POST` | `/user/register` | `{ email, password }` |
| `POST` | `/user/login` | `{ email, password }` |
| `POST` | `/user/logout` | _none_ |
| `GET`  | `/user/authenticated` | _cookie‑based_ |

### Bookmarks

| `POST` `/data/bookmark` | `{ id: { $oid }, type: bill\|order\|regulation\|proposed }`
| `GET` `/user/bookmarks` | Returns grouped saved items.

---

## 🛠 Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with nodemon and hot reload. |
| `npm test` | Run test suite (Jest / Vitest – _coming soon_). |
| `npm run lint` | ESLint + Prettier check. |

---

## 🚀 Roadmap

- [ ] Pagination & infinite scroll
- [ ] Email digest via NodeMailer
- [ ] CI/CD with GitHub Actions
- [ ] Unit + integration tests
- [ ] Dockerfile & Compose for local stacks

---

## 🤝 Contributing

1. Fork the repo & create your branch: `git checkout -b feature/awesome`  
2. Commit your changes: `git commit -m 'feat: add awesome'`  
3. Push to the branch: `git push origin feature/awesome`  
4. Open a Pull Request.

Please follow Conventional Commits and run `npm run lint` before pushing.

---

## 📜 License

This project is licensed under the MIT License — see the `LICENSE` file for details.

---

> _Made with ☕ and far too many government PDFs._

