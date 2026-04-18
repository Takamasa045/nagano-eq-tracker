import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages配下に置く場合は env BASE_PATH=/repo-name/ で渡す
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
