<div align="center">
  <img src="frontend/public/favicon.svg" alt="CF UpsolveX Logo" width="100" />
  <h1>CF UpsolveX</h1>
  <p><b>Stop skipping your missed problems. Track. Upsolve. Improve.</b></p>
  <p><i>A premium, automated Codeforces upsolving companion with a smart priority queue and email nudges.</i></p>
</div>

---

## ✨ Features

- **🧠 Smart Priority Queue:** Analyzes your contest history and ranks your unsolved problems using a custom algorithm based on recency, problem difficulty, and the number of failed attempts.
- **📊 Beautiful Analytics Dashboard:** A stunning, glassmorphic UI showcasing your Upsolve Velocity, contest completion percentages, and rating progression over time.
- **✉️ Automated Email Reminders:** A background worker detects when you finish a Codeforces round and emails you a highly prioritized queue of your missed problems exactly 30 minutes after the contest ends.
- **⚙️ Deep Customization:** Tell the system to stop tracking problems past a certain index (e.g., only track up to D) or choose whether to include your Virtual contests.
- **🔒 Secure Authentication:** Powered by Supabase for fast, secure, and reliable user management.

## 🛠️ Tech Stack

**Frontend**
- React + Vite
- Recharts (for analytics graphs)
- Supabase-js
- Vanilla CSS (Premium Glassmorphism & Micro-animations)

**Backend**
- Python 3 + FastAPI
- APScheduler (for background cron jobs)
- Python smtplib (Gmail SMTP) + Jinja2 (for beautiful HTML email notifications)
- Codeforces Official API

**Database**
- Supabase (PostgreSQL)

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/adarsh7203/CF-UpsolveX.git
cd CF-UpsolveX
```

### 2. Supabase Configuration
Create a Supabase project and set up the following tables:
- `users`
- `contests`
- `user_problem_status`

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
EMAIL_ADDRESS=cfupsolvex@gmail.com
EMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

Run the FastAPI server:
```bash
uvicorn app.main:app --reload
```
*(The background scheduler will automatically start running alongside the API).*

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the Vite development server:
```bash
npm run dev
```

---

## 📬 Email System Setup
CF UpsolveX uses standard Gmail SMTP to send automated reminder emails. You must configure your `.env` file with a valid Gmail address and an **App Password** (your standard Gmail password will not work if 2-Factor Authentication is enabled).

To generate an App Password:
1. Go to your Google Account settings.
2. Navigate to **Security** -> **2-Step Verification**.
3. Scroll down to **App passwords** and generate a new 16-character password for this application.
4. Add it to `EMAIL_APP_PASSWORD` in your `backend/.env` file.

---

<div align="center">
  <p>Built with ❤️ for the Competitive Programming community.</p>
</div>
