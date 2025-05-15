# Client – Voice Assistant Frontend

This project is the frontend for the Voice Assistant application. It is built with **React**, **Vite**, and **TypeScript**, using **Tailwind CSS** for styling and **Shadcn UI** components.

## Features

- Modern, responsive interface to interact with the voice assistant.
- Integration with Web VAD for voice activity detection.
- Reusable components and modular design.
- Light and dark themes.

## Requirements

- Node.js >= 18.x
- npm >= 9.x

## Installation

```bash
npm install
```

## Available Scripts

- `npm run dev` – Starts the development server with Vite.
- `npm run build` – Builds the app for production.
- `npm run preview` – Previews the production build.
- `npm run lint` – Runs ESLint for code analysis.

## Main Dependencies

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [@ricky0123/vad-web](https://github.com/ricky0123/vad-web) (voice activity detection)

## Folder Structure

- `src/` – Main source code.
- `src/components/` – UI components.
- `src/contexts/` – React contexts.
- `src/hooks/` – Custom hooks.
- `src/lib/` – Utilities and audio logic.

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Notes

- Make sure the backend (server) is running for the app to work properly.
- Feel free to customize styles and components as needed.
