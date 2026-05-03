# 📚 Exam Planner

A personalized study planner that helps students build a structured exam preparation schedule based on their subjects, topics, and available study time.

## Features

- **4-Step Wizard** — Set exam date, daily study hours, subjects, and topics in a simple guided flow
- **Subject Difficulty Rating** — Mark each subject as Weak, Mid, or Strong to auto-allocate more prep time where needed
- **AI Syllabus Scanner** — Upload a photo of your syllabus and AI automatically extracts topics for each subject
- **Smart Study Plan Generator** — Automatically builds a day-by-day study plan with revision days included
- **Progress Tracker** — Track completed topics, see overall progress, and know exactly what to study today
- **Edit Plan** — Edit your exam date, subjects, topics, and study hours even after the plan is generated
- **Dark / Light Mode** — Toggle between themes
- **Data Persistence** — Your plan and progress are saved locally in the browser

## Tech Stack

- HTML, CSS, JavaScript (Vanilla)
- Hosted on Vercel
- AI feature powered by Google Gemini API (via Vercel serverless function)

## Known Issues

- **AI Syllabus Scanner** — The AI topic extraction feature is currently not working as expected. The Gemini API is returning empty responses for image inputs. The `/api/claude` serverless function is deployed and receiving requests successfully (HTTP 200), but Gemini is returning a 429 (rate limit) or empty text response. This is being investigated. As a workaround, topics can be added manually.

## Author

**Praful Jha**  
GitHub: [Praful77Jha](https://github.com/Praful77Jha)
