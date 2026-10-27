## [Yufenyuy Veyeh Didier - Online](https://yveyeh.github.io)

This is my online personal digital space...

### Stack

- [Vue 3](https://vuejs.org) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- Deployed to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

### Development

Requires Node 20+ (see `.nvmrc`).

```bash
nvm use
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

Static sub-sites (`/cv`, `/apps`, `/relax`), media, `robots.txt` and `sitemap.xml` live in `public/`
and are copied as-is into the build.

### Deployment

Pushing to `master` builds and deploys automatically.
In the repo's **Settings → Pages**, set **Source** to **GitHub Actions** (one-time).