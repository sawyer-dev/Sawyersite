# Sawyer Knowles — personal website

A static portfolio, project journal, and interactive playground. Pages are generated at build time and hosted on GitHub Pages; interactive apps load on demand.

Live site (after first deploy): <https://sawyer-dev.github.io/Sawyersite/>

## Stack and architecture decisions

| Choice                                   | Why                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Astro 7 + strict TypeScript              | Static HTML per route, minimal JavaScript, first-class Markdown/MDX content collections.                                  |
| React 19 (apps only)                     | One UI library for interactive experiments. Static pages ship no React; each app is code-split and loaded on demand.      |
| Content collections (Zod schemas)        | Frontmatter is validated at build time. Index pages, previous/next links, and the home page derive from the content.      |
| CSS custom properties, no CSS framework  | Palette and spacing live in [src/styles/tokens.css](src/styles/tokens.css); light/dark themes switch the semantic tokens. |
| Vitest, ESLint, Prettier, Playwright+axe | Unit tests, lint/format, and a browser smoke test for accessibility and overflow.                                         |
| GitHub Actions → GitHub Pages            | Official Pages deploy flow with least-privilege permissions. No backend, database, or CMS.                                |

Decisions worth knowing:

- **One base-path setting.** [site.config.mjs](site.config.mjs) holds `siteUrl` and `basePath`. All internal links use the `url()` helper in [src/lib/urls.ts](src/lib/urls.ts), so the site works at `/Sawyersite/` today and at a domain root later.
- **Every route is a real HTML file** (`trailingSlash: 'always'`), so refreshing or bookmarking nested routes works on GitHub Pages. Unknown URLs get `404.html`.
- **Frontmatter uses `contentLayout`, not `layout`.** MDX treats `layout` as a layout-component import and fails the build.
- **Project order rule:** newest `year` first; ties by ascending `order`, then title. Previous/next links follow the same order and do not loop.
- **No filters on the Projects index yet.** The spec asks for them only when there are enough projects to need them. Add a category filter once there are roughly eight or more.

## Prerequisites

Node.js 22.12 or newer and npm (a `package-lock.json` is committed).

## Commands

```bash
npm ci                # install exactly what the lockfile specifies
npm run dev           # dev server at http://localhost:4321/Sawyersite/
npm run build         # production build into dist/
npm run preview       # serve dist/ locally (same base path as production)

npm run format        # prettier --write
npm run format:check  # prettier --check
npm run lint          # eslint (including jsx-a11y rules)
npm run typecheck     # astro check (strict TypeScript)
npm test              # vitest unit tests
npm run validate      # after a build: metadata, h1 count, internal links, anchors, assets, rel=noopener
npm run test:a11y     # after a build: axe (light + dark), horizontal overflow at 320/768/1280/1920, console errors
npm run check         # format:check + lint + typecheck + test + build + validate
```

`npm run test:a11y` needs a Chromium-based browser. It uses installed Edge or Chrome, or Playwright's Chromium (`npx playwright install chromium`). It serves `dist/` with the same base path and 404 behaviour as GitHub Pages, so it also exercises direct navigation to nested routes.

The build prints a harmless warning that the `hobbies` collection is empty until the first hobby is added.

## Deployment (GitHub Pages)

Workflows live in [.github/workflows](.github/workflows):

- `ci.yml` runs on pull requests and pushes to `main`: install from lockfile, format check, lint, type check, tests, build, validation, and the accessibility smoke test.
- `deploy.yml` runs on pushes to `main` (and manually): tests, build, validation, then publishes `dist/` with the official `upload-pages-artifact` and `deploy-pages` actions. Only the deploy job gets `pages: write` and `id-token: write`.

**To activate:** in the repository, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. Push to `main`. The deployed URL appears in the workflow run and under Settings → Pages.

By default the workflow builds for `https://<owner>.github.io/<repo>/`. Override with repository **variables** (Settings → Secrets and variables → Actions → Variables): `SITE_URL` and `BASE_PATH`.

**Inspecting a failed deployment:** open the run under the Actions tab. The `build` job shows which step failed. Run the same steps locally with `npm ci && npm run check`. If the page loads without styles after deploy, `BASE_PATH` does not match the URL path.

### Moving to a custom domain or your own server

1. **Custom domain on GitHub Pages:** add the domain under Settings → Pages, create the DNS records GitHub lists (an `A`/`AAAA` set for an apex domain or a `CNAME` for `www`), then enable **Enforce HTTPS** once the certificate is issued. Set the variables `SITE_URL=https://yourdomain.com` and `BASE_PATH=/`, and re-run the deploy workflow.
2. **Conventional web server:** run `SITE_URL=https://yourdomain.com BASE_PATH=/ npm run build` and copy `dist/` to the web root. Configure the server to return `dist/404.html` with status 404 for unknown paths. No server-side code is needed.

## Adding content

All content lives in `src/content/`. Slugs come from file names (lowercase, hyphenated). Schemas are in [src/content.config.ts](src/content.config.ts) and fail the build on invalid metadata.

### A project

Create `src/content/projects/<slug>.md` (or `.mdx`):

```md
---
title: My project
summary: One or two sentences, 20 to 240 characters.
year: 2026 # completion or last meaningful update; drives ordering
startYear: 2025 # optional
status: complete # complete | in-progress | archived
featured: true # shown on the Home page (first three)
order: 0 # tie-break for the same year (lower first)
role: Design and development
categories: [Web]
technologies: [Astro, TypeScript]
links:
  - label: Source on GitHub
    url: https://github.com/you/repo
thumbnail: ../../assets/my-project.png # optional; requires thumbnailAlt
thumbnailAlt: Screenshot of the dashboard
contentLayout: article # article | wide | custom
draft: false # drafts show in dev only
---

Write the article with Markdown headings. `##` headings feed the table of contents.
```

### A hobby

Same as a project, in `src/content/hobbies/`, with `status: current | historical`, optional `started` and `updated` years. [src/content/hobbies/\_template.md](src/content/hobbies/_template.md) is an unpublished starter (files beginning with `_` are ignored). Current hobbies sort first.

### Media

- Put source images in `src/assets/` (lowercase, hyphenated names). Markdown images (`![alt](../../assets/x.png)`) and `thumbnail` are optimised (converted to WebP with explicit dimensions and responsive sizes).
- Large videos should not be committed. For YouTube videos use `<VideoFrame youtubeId="…" title="…" />`: it shows a play button and requests nothing from YouTube (via the `youtube-nocookie.com` domain) until the visitor presses it. For short local clips, use `public/media/` (pass the path inside `public/`, such as `media/demo.mp4`, to `src`; the base path is added for you). Other hosts can use `embedUrl` after a privacy review.
- Always write alt text. Use `alt=""` only for decorative images.
- Confirm you have the right to publish every image, font, and clip.

### Content blocks in MDX

In `.mdx` files these components are available without imports ([src/components/content/mdx-components.ts](src/components/content/mdx-components.ts)):

```mdx
import shot from '../../assets/shot.png';

<MediaFrame src={shot} alt="What the screenshot shows" caption="Optional caption" />
<Gallery images={[{ src: shot, alt: '…', caption: '…' }]} />
<VideoFrame title="Demo" src="media/demo.mp4" captionsSrc="media/demo.vtt" />
<VideoFrame title="Trailer" youtubeId="dQw4w9WgXcQ" />
<Callout title="Heads up">Note text.</Callout>
```

Fenced code blocks are syntax highlighted and get a Copy button. Other components can be imported at the top of the MDX file like any Astro component.

### A custom article layout

`contentLayout` picks how the body is framed: `article` (reading column with a contents sidebar), `wide` (full-width body), or `custom` (no prose styling; the MDX controls everything). For a fully bespoke page, create a new route file such as `src/pages/projects/<slug>.astro`. A static route takes priority over the dynamic `[slug].astro` route for that slug. Remove or draft the content entry so it is not built twice.

## Adding an interactive app

Apps are isolated modules, and the shell never imports them directly.

1. Create `src/app-registry/<key>/MyApp.tsx` with a default-exported React component. Import its CSS from the component file so it is code-split with the app. Use the shared tokens (`var(--accent)`, `var(--surface)`, and so on) so it works in both themes.
2. Register it in [src/app-registry/index.ts](src/app-registry/index.ts) with a dynamic import:
   ```ts
   'my-app': () => import('./my-app/MyApp'),
   ```
3. Create `src/content/apps/my-app.md` with `entryComponent: my-app`, `status`, `interaction`, `updated`, optional `limitations`, and the written explanation as the body. The collection schema only accepts keys that exist in the registry.

The Apps index, Home preview, and detail page are generated from that file. Behaviour you get for free: on-demand loading with a status message, a failure state with retry if the code cannot load (reload retries), an error boundary so a crashing app cannot take down the page, and a `noscript` message.

Each app should provide its own reset, help text, and error states, work by keyboard and touch, and avoid persistence unless it documents what is stored. [Rule Explorer](src/app-registry/rule-explorer/RuleExplorer.tsx) is the reference implementation.

### Bulletin Board backend

The Bulletin Board's React app and its paste-ready Apps Script are kept together in [src/app-registry/bulletin-board](src/app-registry/bulletin-board). The script uses an Apps Script HTML-service iframe bridge and `google.script.run`; it does not use cross-origin `fetch` or expose the Sheet ID in the site bundle.

1. Create a private Google Sheet. Open **Extensions → Apps Script** from that Sheet.
2. Replace the starter contents of `Code.gs` with [src/app-registry/bulletin-board/Code.gs](src/app-registry/bulletin-board/Code.gs), then save. If you pasted an earlier version, replace it with the latest file before testing.
3. Run `setupBulletinBoard` once from the Apps Script editor (or reload the Sheet and choose **Bulletin Board → Initialize or verify setup**). Review and approve the requested Google Sheets and email permissions. This creates the `Bulletin Notes` tab, stores the spreadsheet ID in Script Properties, sets the moderation recipient to `sawyer.k.dev@gmail.com`, and installs the default allowed origins for GitHub Pages and local development.
4. To test before public deployment, choose **Deploy → Test deployments → Web app** and copy its `/dev` URL. `/dev` runs the latest saved code and is restricted to script editors, so stay signed in to the Google account that owns/edits the script. The app accepts `/dev` only from local Astro development; it cannot be used by a production site.
5. For local development, copy `.env.example` to `.env`, set `PUBLIC_BULLETIN_SCRIPT_URL` to the `/dev` URL, and restart `npm run dev`. The default origin allowlist includes `http://localhost:4321` and `http://127.0.0.1:4321`. Run `setupBulletinBoard` first so the test app can access the Sheet and send email. Moderation links generated during test mode point to the `/dev` URL and are only usable by script editors.
6. When ready for visitors, create a **Web app** deployment that executes as your account and allows access to **Anyone**. Set the repository Actions **variable** `PUBLIC_BULLETIN_SCRIPT_URL` to that deployment's `/exec` URL and rerun the Pages deployment workflow. Keep `/dev` URLs out of repository variables.

After changing `Code.gs`, save it and publish the change: **Deploy → Manage deployments → Edit → Version → New version → Deploy**. The `/exec` URL normally remains the same; update `.env` or the Actions variable if the deployment URL changes.

The app’s hidden iframe is served by this web app. The bridge checks the parent site origin against the comma-separated `BULLETIN_ALLOWED_ORIGINS` Script Property. The setup function installs `https://sawyer-dev.github.io`, `http://localhost:4321`, and `http://127.0.0.1:4321` by default; add the origin if the site moves to a custom domain. Apps Script's `google.script.run` channel carries board reads and submissions. Email review links open a confirmation page; merely opening or previewing the link does not change a note. Approving makes it public; rejecting deletes its row. Remove an approved note by deleting its row from the private `Bulletin Notes` tab.

The Sheet must remain private. The public deployment exposes only approved notes and a validated submission operation. Apps Script applies a daily submission cap and its email quota; the visitor name and note text are plain text and never interpreted as HTML. Do not put spreadsheet IDs, moderation tokens, or credentials into `.env`, the React app, or GitHub Pages variables.

## Outstanding content

Nothing below is invented. The site hides or omits each item until you supply it.

| Item                                       | Where to supply                                                                                                                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub profile URL                         | `links.github` in [src/data/site.ts](src/data/site.ts). Appears in the Home hero and footer once set.                                                                                                                                                           |
| Résumé PDF                                 | Put it in `public/media/` and set `links.resume` (for example `media/sawyer-knowles-resume.pdf`). It then replaces "Contact" as the header action.                                                                                                              |
| Hobbies                                    | Add files to `src/content/hobbies/`. The Hobbies page shows an empty state until then, and the Home section is omitted.                                                                                                                                         |
| Project media for the résumé-only projects | Wedding Website has no screenshots or links yet. Add `thumbnail`/`thumbnailAlt` and images; until then its card uses a generated pattern.                                                                                                                       |
| Public demo or repo links                  | Add `links:` to the project frontmatter, only if the code or demo is public.                                                                                                                                                                                    |
| Further project detail                     | Wedding Website is intentionally brief and limited to résumé facts. Several imported projects (Keystone, SoVeIt, Salad Siege, Saving Grace, and others) also only restate what the old site said, so add your personal contributions where you want them shown. |
| Phone number                               | Deliberately not published. Only email and LinkedIn are listed.                                                                                                                                                                                                 |
| Social preview image                       | Regenerate with `node scripts/make-brand-assets.mjs` if you change branding (needs Edge, Chrome, or Playwright Chromium).                                                                                                                                       |

## Known limitations

- Imported project pages come from the former Wix site. Their old URLs are not redirected, and the old Facebook and YouTube channel links were deliberately not carried over.
- The Gallery lightbox is implemented and was tested in a browser, but not with a screen reader.
- Screen-reader testing was not performed. Automated axe checks and manual keyboard checks were.
- No analytics, contact form, or comments by design.
- The hero and placeholder card patterns are generated, not authored artwork. Real project images replace the placeholders automatically.

## Troubleshooting

- **Unstyled page or missing images after deploy:** `BASE_PATH` does not match the deployed URL path. See Deployment.
- **Build fails on a content file:** the error names the file and field. Common causes are `thumbnail` without `thumbnailAlt`, a `summary` outside 20 to 240 characters, or an unknown `entryComponent`.
- **MDX build error about an unresolved import named `article`:** use `contentLayout`, not `layout`.
- **A new app does not show up:** it needs both a registry entry and a content file, and its `entryComponent` must match the registry key exactly.
- **Bulletin Board says the Apps Script bridge did not load with a `/dev` URL:** `/dev` only works for Google accounts with edit access to the script. Sign into that account in the same browser profile, check the `BULLETIN_ALLOWED_ORIGINS` Script Property contains the exact local origin, and open the `/dev` URL directly once to complete any Google access/authorization prompt. Do not use `/dev` in production; use an `/exec` deployment when ready to make the endpoint public.
- **`npm run test:a11y` cannot find a browser:** run `npx playwright install chromium`.
