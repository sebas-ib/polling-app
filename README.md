# Real-Time Polling App _*Work in progress*_

A full-stack web application that allows users to create and participate in real-time polls. Built with Next.js, TypeScript, Tailwind CSS, and Firebase, this app offers a seamless and responsive user experience.

## Live Demo

Try it out: _Live demo coming soon!_

## Features

- **Real-Time Voting** — Results update instantly across clients
- **Cookie-Based Auth** — Secure user login/logout handled via Flask sessions
- **Create Custom Polls** — Authenticated users can create polls or muliti-question quizzes
- **Responsive UI** — Fully mobile-friendly interface

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend (API + Auth):** [Flask](https://flask.palletsprojects.com/) with cookie-based sessions
- **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Real-time Updates:** [Socket.IO](https://socket.io/) for poll result updates
- **Deployment:** [Vercel](https://vercel.com) (Frontend) + Render/Fly.io/Other (Backend)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Clone git repo

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

3. Install needed packages:
```bash
npm install next react react-dom
pip install -r path-to/requirements.txt
```

4. Flask config:
```bash
Interpreter: venv
Environment Varibales: FLASK_APP=src/server/home.py;FLASK_ENV=development;FLASK_DEBUG=1;FLASK_RUN_PORT=3001
Working directory: path-to/polling-app
```

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
