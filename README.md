# Real-Time Polling App

A full-stack web application that allows users to create and participate in real-time polls. Built with Next.js, TypeScript, Tailwind CSS, and MongoDB, this app offers a seamless and responsive user experience.

## Live Demo

Try it out: http://54.159.151.217:3000

## Features

- **Real-Time Voting** — Results update instantly across clients
- **Cookie-Based Auth** — Secure user login/logout handled via Flask sessions
- **Create Custom Polls** — Authenticated users can create polls or muliti-question quizzes
- **Responsive UI** — Fully mobile-friendly interface

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend (API + Auth):** [Flask](https://flask.palletsprojects.com/) with cookie-based sessions
- **Database:** [MongoDB](https://www.mongodb.com)
- **Real-time Updates:** [Socket.IO](https://socket.io/) for poll result updates
- **Deployment:** [EC2](https://aws.amazon.com/ec2/)

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