import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// yveyeh.github.io is a GitHub *user* site, so it is served from the domain root ("/").
// Everything in /public (cv, apps, relax, media, robots, sitemap) is copied verbatim into /dist.
export default defineConfig({
  base: '/',
  plugins: [vue(), tailwindcss()],
})
