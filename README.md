# InternMatch

A web platform that matches university students with internships using a
combination of skill matching, semantic search, and profile completeness
signals. Students upload a CV, the platform extracts skills, ranks open
internships, and lets employers review and respond to applications in a
single dashboard.

- **Frontend** — React 19 + Tailwind CSS, served by Create React App on port 3000.
- **Backend** — Node.js (Express) + Socket.IO on port 5000.
- **Database** — MySQL 8.
- **Optional** — Google Gemini API for resume parsing and semantic search,
  SMTP server for transactional email. The app boots and runs without either.

---

## Prerequisites

Install these before you begin. Versions listed are the ones the project is
developed against; older majors may work but are not tested.

| Tool        | Version | Notes |
|-------------|---------|-------|
| Node.js     | 18 or newer | Includes `npm` |
| MySQL       | 8.0 or newer | Local or remote, must support `utf8mb4` |
| Git         | any | To clone the repo |

Optional:

- A **Google Gemini API key** if you want resume parsing, AI candidate
  ranking, and semantic search to actually call the LLM. Without one, the
  app falls back to keyword matching and a regex skill extractor.
- An **SMTP account** (Gmail app password works) if you want password-reset
  and notification emails to be delivered.

---

## 1. Clone the repository

```bash
git clone https://github.com/AmrSaeed-58/internmatch.git
cd internmatch
```

---

## 2. Create the database

Open a MySQL shell and create an empty database:

```sql
CREATE DATABASE internmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then load the schema and seed data. Run from the repo root:

```bash
mysql -u root -p internmatch < backend/database/Schema.sql
mysql -u root -p internmatch < backend/database/seed.sql
```

If `mysql` is not on your PATH (common on Windows), use the bundled Node
helper instead — it reads connection settings from `backend/.env`:

```bash
cd backend
node scripts/runMigration.js database/Schema.sql
node scripts/runMigration.js database/seed.sql
```

What seed.sql gives you:

- 1 admin account (`admin@internmatch.com` / **Admin@123**)
- 3 employer accounts at TechCorp, DataFlow, and DesignHub
- 4 student accounts at four Jordanian universities
- ~155 skills across 9 categories
- 6 active internships with required-skill mappings
- Welcome and approval notifications

All non-admin test accounts share the password **Test@1234**.

---

## 3. Configure the backend

```bash
cd backend
cp .env.example .env       # on Windows: copy .env.example .env
npm install
```

Open `backend/.env` and fill in the values that matter for your machine.
The minimum for a working local dev environment:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internmatch

JWT_SECRET=replace_with_a_long_random_string
```

Optional (only needed if you want the AI features or real email delivery):

```dotenv
GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the API:

```bash
npm run dev   # nodemon, restarts on file changes
# or
npm start     # plain node
```

You should see:

```
InternMatch API running on port 5000 (development)
```

---

## 4. Configure the frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env       # on Windows: copy .env.example .env
npm install
```

The default `frontend/.env` points the React app at the local API:

```dotenv
REACT_APP_API_URL=http://localhost:5000/api
```

Change this only if you ran the backend on a different port or host.

Start the dev server:

```bash
npm start
```

Create React App opens [http://localhost:3000](http://localhost:3000) in your
browser. The first compile takes 20–40 seconds.

---

## 5. Log in and try the flows

Sign in with any of the seeded accounts:

| Role     | Email                        | Password   |
|----------|------------------------------|------------|
| Admin    | admin@internmatch.com        | Admin@123  |
| Employer | sarah@techcorp.jo            | Test@1234  |
| Employer | mahmoud@dataflow.jo          | Test@1234  |
| Employer | lana@designhub.jo            | Test@1234  |
| Student  | alex@psut.edu.jo             | Test@1234  |
| Student  | jordan@just.edu.jo           | Test@1234  |
| Student  | taylor@uj.edu.jo             | Test@1234  |
| Student  | morgan@gju.edu.jo            | Test@1234  |

Suggested first walkthrough:

1. **As a student** — Browse internships, open a detail page to see the
   match-score breakdown, upload a CV (sample PDFs live in
   `backend/database/sample-cvs/`), confirm the extracted skills, then
   apply to an internship.
2. **As an employer** — Open `View Applicants` for one of the seeded
   internships, change an application status, and add an internal note.
3. **As an admin** — Approve or reject pending internships and review the
   user list.

---

## Project layout

```
internmatch/
├── backend/
│   ├── database/
│   │   ├── Schema.sql        # Single-file DDL, no migrations
│   │   ├── seed.sql          # Admin + skills + test data, idempotent
│   │   └── sample-cvs/       # PDFs for testing resume upload
│   ├── scripts/              # One-off Node helpers
│   ├── src/
│   │   ├── config/           # db.js, email.js
│   │   ├── controllers/      # Route handlers per role
│   │   ├── middleware/       # auth, upload, error handler, validator
│   │   ├── routes/           # Express routers
│   │   ├── utils/            # Embedding service, skill resolver, etc.
│   │   └── server.js         # App entry, Socket.IO wiring
│   └── uploads/              # Runtime user content (created on first upload)
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/              # Axios wrappers per role
│       ├── components/       # Reusable UI
│       ├── pages/            # Route components grouped by role
│       ├── context/          # Auth, theme, socket
│       └── utils/            # Helpers and academic data
└── README.md
```

---

## Common issues

**`ER_ACCESS_DENIED_ERROR` when running seed**
Wrong MySQL user or password in `backend/.env` (or in your `mysql -u`
command). Update the credentials and rerun.

**`ECONNREFUSED 127.0.0.1:3306`**
MySQL is not running. Start the service (`net start MySQL80` on Windows,
`brew services start mysql` on macOS, `sudo systemctl start mysql` on
Linux).

**Frontend says `Network Error` on every request**
The backend is not running, or `REACT_APP_API_URL` does not match the API
port. Check the backend terminal and confirm the URL in `frontend/.env`.

**Resume upload returns "Skill extraction failed"**
You do not have a `GEMINI_API_KEY` set. The app falls back to a regex-based
extractor that picks up common skills but is much weaker. Add a key and
restart the backend to use the LLM.

**Schema reload says foreign key errors**
Drop the database and recreate it before reloading `Schema.sql`:
```sql
DROP DATABASE internmatch;
CREATE DATABASE internmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Resetting the database

The schema is one file and the seed is idempotent, so a full reset is:

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS internmatch; CREATE DATABASE internmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p internmatch < backend/database/Schema.sql
mysql -u root -p internmatch < backend/database/seed.sql
```

You can rerun `seed.sql` on top of an existing database without
duplicating any rows — every insert uses `INSERT IGNORE` or `NOT EXISTS`.
