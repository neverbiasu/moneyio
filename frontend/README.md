# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Local API Integration

1. Start backend server at `http://127.0.0.1:8000`.
2. Start frontend dev server with `bun dev` (or `npm run dev` if using npm).
3. Frontend dev server proxies `/api/*` to backend via `vite.config.ts`.
4. If you override `VITE_API_BASE_URL`, ensure it points to a reachable backend `/api` path.
