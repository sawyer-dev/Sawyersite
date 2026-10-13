# Personal Website — Developer Specification

**Document status:** Implementation-ready product and technical specification  
**Initial deployment:** GitHub Pages  
**Future deployment:** Self-hosted server  
**Primary purpose:** Professional portfolio, personal brand, and interactive project playground

---

## 1. Product vision

Build a polished, fast, accessible, mobile-friendly personal website that serves three purposes:

1. **Professional portfolio:** A credible destination to include in job applications and LinkedIn, helping recruiters and hiring managers quickly understand the owner's experience, skills, education, and work.
2. **Project documentation:** A home for personal projects and hobbies, with flexible project pages that can combine prose, images, video, code, diagrams, and embedded demos.
3. **Interactive playground:** A place to publish small web apps and experiments that demonstrate the ability to take an idea from concept to a working product.

The site should feel like a cohesive personal product rather than a generic résumé template. It should communicate technical competence through excellent interaction design, careful details, performance, responsive behavior, and a few memorable interactive touches—not through excessive animation or visual noise.

### Success criteria

- A recruiter can understand the owner's professional profile and reach the résumé/contact links in under 30 seconds.
- Experience, education, projects, hobbies, and apps are easy to discover from any page.
- Project and hobby pages support materially different content layouts without requiring a redesign of the site shell.
- Interactive apps can be added as independent modules without destabilizing the rest of the site.
- Core content remains readable and navigable on narrow mobile screens, with touch-friendly controls.
- The site can deploy to GitHub Pages from the repository and can later be hosted on a conventional server with minimal architectural changes.
- The website remains useful when JavaScript is slow or an optional interactive demo fails.
- No fabricated project details, metrics, dates, or professional claims are introduced. Content should come from supplied source material or clearly marked placeholders.

---

## 2. Brand and visual direction

### 2.1 Color palette

Use the supplied palette as the site's core identity. Treat the first four colors as the dark-theme foundation and the near-white as the light surface/background color.

| Token | Hex | Intended role |
|---|---|---|
| `--color-ink` | `#040F0F` | Primary dark background, footer, deep panels |
| `--color-forest` | `#248232` | Dark green surfaces, selected navigation, restrained brand accents |
| `--color-green` | `#2BA84A` | Primary accent, calls to action, active indicators |
| `--color-slate` | `#2D3A3A` | Elevated dark surfaces, cards, borders on dark UI |
| `--color-paper` | `#FCFFFC` | Main light background, text on dark surfaces where appropriate |

**Color usage rules**
- Use `#040F0F` for the main dark canvas and high-contrast footer sections.
- Use `#FCFFFC` for the primary light canvas and dark-theme foreground text.
- Use `#2BA84A` for high-value actions and small emphasis areas, not as a large, saturated background on every section.
- Use `#248232` for secondary accents and selected/hover states.
- Use `#2D3A3A` for dark cards, navigation surfaces, dividers, and subdued UI elements.
- Add derived neutral shades only when needed for accessible hierarchy (muted text, borders, subtle surface differences). Derived shades must feel consistent with the five supplied colors.
- Never rely on color alone to communicate state. Combine color with text, iconography, shape, or another visual cue.
- Verify text and control contrast against WCAG 2.2 AA targets. If a palette pairing fails, adjust the foreground/surface pairing rather than forcing the original colors into an inaccessible combination.

### 2.2 Design language

- **Overall feel:** Modern, deliberate, technical, editorial, and quietly distinctive.
- **Layout:** Generous whitespace, strong alignment, clear typographic hierarchy, restrained borders, and consistent spacing.
- **Shape language:** Mostly clean geometry with moderate corner radii. Avoid making every element a rounded pill or floating card.
- **Typography:** Use a highly readable sans-serif for body text and a complementary display face or variable font for headings if useful. Prefer locally bundled or privacy-friendly font delivery; provide system fallbacks.
- **Motion:** Subtle transitions for hover, focus, navigation, reveal, and app feedback. Respect `prefers-reduced-motion`. Do not make scroll-jacking, long entrance animations, or motion a prerequisite for understanding content.
- **Imagery:** Use authentic project screenshots, diagrams, photos, and media where available. Avoid generic stock imagery that adds no information.
- **Iconography:** Use one consistent icon set. Decorative icons must not replace accessible labels.
- **Brand signature:** Establish a recognizable recurring motif from the green palette—such as a slim green rule, small geometric marker, or understated grid detail—without turning the whole site into a dashboard.

### 2.3 Theme behavior

Implement a light theme and a dark theme, with a system-preference default and a user-controlled toggle.

- The palette must remain recognizable in both themes.
- Persist the selected theme where browser storage is available.
- Avoid a visible flash of the wrong theme during initial load.
- If persistence is unavailable, fall back gracefully to the system preference.
- All pages and interactive apps must use the shared theme tokens unless an app has a deliberate, documented visual treatment.

---

## 3. Information architecture and routes

Use a clear global navigation with the following top-level destinations:

1. Home
2. Experience
3. Education
4. Projects
5. Hobbies
6. Apps

Also provide persistent access to the résumé (if available), LinkedIn, GitHub, and contact details. These links may live in the header, footer, or both, depending on screen size.

### Recommended route structure

| Route | Purpose |
|---|---|
| `/` | Home / professional landing page |
| `/experience/` | Employment history |
| `/education/` | Education |
| `/projects/` | Project index, newest first |
| `/projects/:slug/` | Individual project article/demo |
| `/hobbies/` | Hobby index |
| `/hobbies/:slug/` | Individual hobby article |
| `/apps/` | Interactive app and experiment index |
| `/apps/:slug/` | Individual app or experiment |
| `/404.html` or equivalent | Friendly not-found page |

Use human-readable, stable slugs. Avoid route names based on dates or transient implementation details.

### Navigation requirements

- The active top-level section is clearly indicated.
- On project, hobby, and app detail pages, provide a breadcrumb or equivalent context.
- Detail pages provide previous/next navigation where it makes sense.
- Previous/next project navigation follows the same newest-to-oldest chronological order as the index and clearly identifies the destination.
- Do not force all sub-pages into one identical template. Reuse the shell and content primitives, but allow each entry to select an appropriate layout.
- All routes must work when loaded directly from a bookmark or refreshed on GitHub Pages.

---

## 4. Global page shell

### Header

**Desktop**
- Brand/home link on the left.
- Primary navigation in the center or right.
- Theme toggle and one high-priority action (such as “Résumé” or “Contact”) where space permits.
- Keep the header compact and avoid competing with page content.

**Mobile**
- Brand/home link remains visible.
- Use a clear menu button with an accessible name, expanded state, and keyboard support.
- The open menu should be easy to dismiss, should not create horizontal overflow, and should close after navigation.
- Theme and résumé/contact links must remain discoverable without a crowded header.

**Behavior**
- A sticky header is acceptable if it does not consume too much viewport height or obscure anchored headings.
- Add a visible keyboard-focus treatment.
- Do not use hover as the only way to reveal navigation.

### Footer

Include:
- Name/brand.
- A concise professional positioning statement or short sign-off.
- Links to the main sections.
- LinkedIn, GitHub, and email/contact links where supplied.
- Copyright year generated automatically.
- Optional “Back to top” link on long pages.

### Shared content components

Create reusable components for:
- Page title/intro.
- Section heading.
- Project/hobby/app cards.
- Timeline entry.
- Skill or technology list.
- Media frame with caption and alt text.
- Callout/note.
- Code block with syntax highlighting and copy action where appropriate.
- Image gallery/lightbox with keyboard and touch support.
- Video/embed frame with responsive sizing.
- Breadcrumbs.
- Previous/next navigation.
- Empty state and not-found state.
- Loading, success, and error states for interactive apps.

Components should have a consistent baseline style but allow useful variants. Avoid building an unnecessarily elaborate design system before there are enough pages to justify it.

---

## 5. Page specifications

## 5.1 Home

### Primary goal
Make the owner's professional identity, strengths, and best work understandable at a glance, while signaling that the site also contains experiments and interactive projects.

### Recommended structure
1. **Hero**
   - Name and concise role/positioning line.
   - Two or three sentences describing the owner's engineering interests and strengths.
   - Primary action: view projects or experience.
   - Secondary actions: résumé, LinkedIn, GitHub, or contact, depending on available URLs/assets.
   - Optional restrained interactive visual or small signature animation; the content must remain compelling without it.
2. **Selected work**
   - A curated selection of 2–4 strong projects.
   - Each item explains what it is and why it is interesting, not merely its technology stack.
   - Include a clear link to the full project index.
3. **Professional snapshot**
   - Current role/company and a short summary.
   - A small number of evidence-backed highlights or skills.
   - Link to the full Experience page.
4. **Interactive playground preview**
   - Feature one or two current apps/experiments.
   - Label prototypes honestly as experiments or works in progress.
5. **Personal interests**
   - A brief preview of hobbies that gives the site personality without overwhelming the professional purpose.
6. **Contact / closing CTA**
   - A simple, direct invitation to connect.
   - Do not include a contact form unless it can be implemented and maintained reliably on static hosting. A mail link is sufficient initially.

### Home page rules
- The first viewport should communicate identity, professional focus, and a useful next action.
- Avoid a long biography before the visitor sees concrete work.
- Prioritize real project imagery or a strong typographic composition over a generic hero illustration.
- Use a clear visual distinction between professional content and experimental content.

## 5.2 Experience

### Primary goal
Present employment history in a recruiter-friendly format, emphasizing impact, technical scope, collaboration, and progression.

### Structure
- Page heading and short introduction.
- Employment entries in reverse chronological order.
- Each entry contains:
  - Employer and role/title.
  - Employment dates and location/work arrangement if useful and accurate.
  - One-sentence role summary.
  - 3–6 concise impact-oriented bullets for the most relevant roles; fewer for older or less relevant roles.
  - Technology tags only when they add value.
  - Optional links to public work, company/product context, or related portfolio projects.
- A compact skills/technical focus section may follow the timeline, but should not simply repeat the entire résumé.

### Content guidance
- Lead bullets with outcomes, ownership, or the problem solved.
- Use measurable results only when verified.
- Explain acronyms or product-specific terms when the target audience may not know them.
- Keep detailed project narratives on their own project pages and link to them from the relevant role when useful.
- Avoid duplicate entries for contract/client arrangements; represent the employer and client relationship clearly and consistently.
- The résumé should remain downloadable or viewable as a separate artifact if provided.

## 5.3 Education

### Primary goal
Show formal education clearly without giving it disproportionate weight relative to professional experience.

### Structure
- Institution.
- Degree/program and field.
- Attendance or graduation dates.
- GPA only if the owner chooses to include it.
- Relevant coursework, awards, clubs, or academic projects only when they add signal.
- Link to a related project where appropriate.

This page should be intentionally shorter and visually simpler than Experience. If there is only one education entry, use a compact editorial layout rather than a large, empty timeline.

## 5.4 Projects index

### Primary goal
Make it easy to scan personal projects and open a project that matches a visitor's interests.

### Index behavior
- Display projects in reverse chronological order by a clear, consistent date rule (prefer project completion or latest meaningful update; define the chosen rule in content data).
- Each card should include:
  - Project name.
  - One-sentence description.
  - Date/year or status.
  - Small set of relevant technologies or categories, if useful.
  - Thumbnail, screenshot, or other representative media when available.
  - Status label such as “Complete,” “In progress,” or “Archived” where relevant.
- Provide category filters only if there are enough projects for filtering to be useful. Filters must be keyboard accessible and work well on touch devices.
- Include a helpful empty state for categories with no results.
- Do not make cards so uniform that project differences are hidden.

### Project detail pages

Project pages are an editorial/documentation system, not just a fixed case-study template. Every project should be able to select and order content blocks such as:

- Rich text: headings, paragraphs, lists, links, quotes.
- Images with captions, alt text, optional full-size view, and galleries.
- Video embeds or locally hosted clips.
- Animated GIFs or short looping videos, with reduced-motion and performance considerations.
- Diagrams and architecture drawings.
- Code snippets with language labels and copy buttons.
- Before/after comparisons.
- Feature callouts.
- Technology/tool lists.
- Timeline or development milestones.
- External demo/repository links.
- Interactive demo mount point.
- Credits, collaborators, and references where applicable.

### Recommended project article structure
Use only the sections that fit the project:
1. Overview / one-sentence pitch.
2. Problem, goal, or motivation.
3. Role and contributions (especially for team projects).
4. Solution and implementation.
5. Important design or technical decisions.
6. Visual walkthrough / media.
7. Challenges, lessons, and results.
8. Links to demo, repository, or related work.

Clearly distinguish personal contributions from team contributions. Never imply that private or employer-owned code is publicly available if it is not.

### Navigation
- Breadcrumb: Home → Projects → Project name.
- Previous project / next project links near the bottom.
- “All projects” link.
- Optional table of contents for long pages, generated from article headings.
- On mobile, the table of contents should collapse into a compact disclosure rather than occupying a large permanent region.

## 5.5 Hobbies index and detail pages

### Primary goal
Add personality and show sustained curiosity, creativity, and interests outside formal work.

### Index
- Use a flexible grid/list of current and historical hobbies.
- Each item includes title, short description, representative image if available, and current/historical status where relevant.
- Do not imply a hobby is current if it is no longer active.
- The layout may be more visual and informal than the Projects index, while retaining the same overall brand system.

### Hobby detail pages
Support the same flexible content blocks as project pages, plus:
- Photo galleries.
- Collections or lists.
- Maps or timelines where genuinely useful.
- Rules, notes, or reference material.
- Embedded audio/video where relevant.
- Personal reflections and progress logs.

A hobby page should not be forced to contain a “problem/solution/results” case-study structure. Choose sections appropriate to the subject. Preserve consistent typography, navigation, captions, and accessibility.

## 5.6 Apps index

### Primary goal
Present working interactive experiments as real, usable products rather than static portfolio screenshots.

### Index cards
Each app card should contain:
- Name and concise purpose.
- Status: prototype, active experiment, stable, or archived.
- A representative visual or interactive preview where practical.
- Main interaction or feature.
- A clear “Open app” action.
- Optional source-code link if public.

Clearly label prototypes and known limitations. Avoid making the visitor guess whether an app is interactive or just a concept.

### App detail pages
An app may use a custom full-width layout or a constrained tool layout while retaining the shared site shell. Provide:
- App name and short explanation.
- Instructions or a quick-start hint.
- The interactive surface.
- Reset/restart action when appropriate.
- Loading, empty, success, and error states.
- Keyboard and touch support.
- An explanation of the experiment, relevant technical notes, and limitations when helpful.
- Optional repository/source link and “Back to Apps” navigation.

### Isolation and reliability
- Each app should be a self-contained module with minimal shared mutable state.
- A broken demo must not break global navigation or other pages.
- Prefer local computation and static assets for early experiments; avoid requiring a backend unless the app's purpose requires it.
- If an app needs a backend, document the service, configuration, secrets, deployment, and failure behavior. Never commit secrets.
- Avoid arbitrary third-party scripts and embeds. Review their privacy, security, and performance impact.
- If an app is resource-intensive, load it only when opened or when the user explicitly starts it.
- If an app uses WebGL, canvas, audio, video, or other browser capabilities, provide a graceful unsupported/failed state and an explanation.

---

## 6. Content model and flexible page authoring

Use a data-driven content model so that adding a project, hobby, or app does not require hand-editing multiple index pages.

### Recommended approach
- Store editorial content in Markdown/MDX or a similarly simple content format.
- Store structured metadata in frontmatter or typed data objects.
- Keep media in organized asset directories.
- Build pages from reusable content blocks, while allowing custom layouts for exceptional projects or apps.
- Avoid building a full CMS or database for the initial static site.

### Suggested metadata

Projects:
- `title`
- `slug`
- `summary`
- `date` or `year`
- `updated`
- `status`
- `featured`
- `categories`
- `technologies`
- `thumbnail`
- `externalLinks`
- `contentLayout` or page component selection

Hobbies:
- `title`
- `slug`
- `summary`
- `started` (optional)
- `updated` (optional)
- `status` (`current` / `historical`)
- `categories`
- `thumbnail`
- `contentLayout`

Apps:
- `title`
- `slug`
- `summary`
- `status`
- `categories`
- `thumbnail`
- `entryComponent` or registry key
- `sourceUrl` (optional)
- `updated`

### Content rules
- Validate required metadata during build.
- Warn or fail on duplicate slugs, missing thumbnails, invalid dates, or broken internal references where practical.
- Missing optional content should not leave awkward blank sections.
- Make it easy to mark an item featured, archived, or in progress.
- Index pages should derive from the content source rather than maintaining a separate manual list.
- Do not store secrets or private employer data in public content.
- Include clear instructions for adding a new item in the README.

---

## 7. Technical architecture

### Recommended baseline

Use a static-first, component-based TypeScript framework with strong support for content pages and selectively interactive client-side modules. A suitable default is **Astro + TypeScript**, with React (or another single chosen UI library) for interactive apps that benefit from component state. If the developer chooses a different stack, it must preserve the requirements below.

Why this approach:
- Content pages can ship as static HTML with minimal JavaScript.
- Individual interactive apps can hydrate only when needed.
- Markdown/MDX works naturally for flexible project documentation.
- Static output works with GitHub Pages and can later be served from a normal web server.
- App modules can be isolated from the editorial site.

Avoid introducing multiple frontend frameworks, a backend, a database, or a complex state-management library without a concrete need.

### Requirements
- TypeScript enabled with strict checking.
- Consistent formatting and linting.
- Shared design tokens using CSS custom properties.
- CSS Grid and Flexbox for layout; avoid layout frameworks that force fixed desktop assumptions.
- Use semantic HTML and progressive enhancement.
- Keep global JavaScript minimal.
- Use lazy loading for below-the-fold images and nonessential app bundles.
- Use optimized, appropriately sized images with explicit dimensions/aspect ratios to reduce layout shift.
- Prefer locally hosted media and dependencies when reasonable.
- Pin dependency versions through the package manager lockfile.
- Add a small, meaningful test suite and build validation.

### Static hosting and future portability
- No feature may depend on a long-running Node server for normal page rendering.
- Configure a single base-path setting so deployment can work at a GitHub Pages project URL as well as a custom domain/root path.
- Internal links and assets must respect the configured base path.
- Use relative or framework-managed asset paths rather than hardcoded root URLs.
- Support direct navigation and refresh on nested routes. Prefer a static generation strategy that emits a real HTML page for each known route. If client-side routing is used, include a tested GitHub Pages fallback strategy.
- Keep host-specific deployment configuration isolated from application logic.
- Document how to add a custom domain later, including DNS and HTTPS setup at a high level.
- Do not assume that GitHub Pages can run API endpoints or server-side code.

### Suggested repository structure

Adapt to the chosen framework, but preserve the separation of concerns:

```text
/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── media/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── content/
│   │   └── ui/
│   ├── layouts/
│   ├── pages/
│   │   ├── index
│   │   ├── experience
│   │   ├── education
│   │   ├── projects/
│   │   ├── hobbies/
│   │   └── apps/
│   ├── content/
│   │   ├── projects/
│   │   ├── hobbies/
│   │   └── apps/
│   ├── app-registry/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── utilities.css
│   └── types/
├── tests/
├── scripts/
├── .github/
│   └── workflows/
├── README.md
├── package.json
└── lockfile
```

This is a conceptual structure; use framework conventions rather than forcing the exact tree.

---

## 8. Responsive design requirements

Design mobile-first and verify actual behavior at narrow, medium, and wide viewports. Do not treat responsive design as merely shrinking desktop elements.

### Required behavior
- No horizontal page overflow at 320 CSS pixels, except inside intentionally scrollable media/code regions with an accessible alternative.
- Body text remains comfortably readable without pinch zoom.
- Buttons and interactive targets should generally be at least 44 × 44 CSS pixels where practical.
- Navigation collapses cleanly and can be used with keyboard, touch, and screen readers.
- Project cards adapt from a multi-column layout to a single-column layout without losing useful information.
- Media uses responsive sizing and maintains intended aspect ratios.
- Code blocks can scroll horizontally without forcing the whole page to scroll.
- Tables either reflow or have a deliberate mobile overflow treatment.
- Avoid text columns that become too wide on large monitors; constrain reading width.
- Do not rely on hover-only effects or tiny pointer targets.
- Dialogs, menus, galleries, and interactive apps remain usable in portrait orientation.
- Respect safe-area insets on devices where relevant.
- Test landscape orientation for app surfaces that may benefit from it.

### Suggested test widths
- 320–360 px: small mobile.
- 375–430 px: common mobile.
- 600–800 px: tablet/small laptop transition.
- 1024 px: laptop.
- 1280–1440 px: desktop.
- 1920 px: wide desktop.

Use fluid spacing and type where appropriate, with sensible maximum widths. Breakpoints should be based on content needs, not a device-brand checklist.

---

## 9. Accessibility requirements

Target **WCAG 2.2 AA**.

- Semantic landmarks: header, nav, main, footer.
- Correct heading hierarchy, with one clear page-level heading.
- All navigation and controls work without a mouse.
- Visible focus indicators that are not removed by CSS resets.
- Skip-to-content link.
- Accessible names for icon-only buttons.
- Forms, if any, have explicit labels, instructions, and error messaging.
- Dialogs and menus manage focus correctly and close predictably.
- Images have meaningful alt text; decorative images use empty alt text.
- Captions or transcripts for meaningful audio/video content where applicable.
- Do not autoplay sound.
- Reduced-motion support.
- Contrast verification for text, icons, borders, and focus indicators.
- Interactive app state changes are communicated to assistive technology when appropriate.
- Do not use color as the only status signal.
- Use native HTML controls whenever they satisfy the need.
- Automated accessibility checks are useful, but manually test keyboard flows and at least one screen-reader flow.

---

## 10. Performance and quality targets

Use these as goals, not as claims until measured.

- Aim for Core Web Vitals in the “good” range on real devices:
  - LCP ≤ 2.5 seconds.
  - INP ≤ 200 milliseconds.
  - CLS ≤ 0.1.
- Keep the Home page fast on a typical mobile connection.
- Avoid shipping a large client-side bundle for static content.
- Lazy-load noncritical media and app code.
- Specify image dimensions to prevent layout shifts.
- Prefer modern image formats where supported and preserve a sensible fallback.
- Avoid unnecessary animation libraries.
- Avoid loading every app's JavaScript on the Apps index.
- Use a clear loading state for large media and interactive demos.
- Check for broken internal links and missing assets during CI.
- Do not add analytics by default. If analytics are later added, document the privacy implications and avoid collecting unnecessary personal data.

---

## 11. SEO and social sharing

- Provide unique page titles and meta descriptions.
- Use canonical URLs where a stable production domain exists.
- Include Open Graph and social preview metadata.
- Provide a default social preview image using the site's brand palette.
- Generate a sitemap and `robots.txt` appropriate to the deployment.
- Use descriptive URLs and meaningful link text.
- Add structured data only where it accurately describes the content.
- Ensure the site is not accidentally marked `noindex` in production.
- Ensure GitHub Pages project-path deployment does not produce broken canonical URLs or metadata.
- Provide a favicon and app icons where practical.

---

## 12. Security and privacy

- Never commit API keys, passwords, private tokens, or other secrets.
- Treat all third-party embeds and packages as dependencies that require a reason.
- Sanitize or safely render user-controlled content if any app later accepts it.
- Do not use unsafe HTML injection for Markdown or app content without a reviewed sanitization strategy.
- External links that open a new tab must use safe `rel` attributes.
- Do not expose private work, confidential screenshots, client data, or employer-owned code.
- Any future app requiring persistence should explain what is stored and where.
- Static hosting does not provide a secure server-side secret store. A future backend must handle secrets server-side.

---

## 13. Testing and CI/CD

### Automated checks
On every pull request and push to the primary branch, run:
1. Dependency installation from the lockfile.
2. Formatting check.
3. Lint.
4. Type checking.
5. Unit/component tests where applicable.
6. Production build.
7. Internal-link/content validation where practical.
8. Accessibility smoke checks where practical.

### Deployment
- Configure GitHub Actions to build and deploy the static site to GitHub Pages.
- Use the official Pages deployment flow with least-privilege permissions.
- Deploy only from the designated branch/workflow.
- Ensure the base path and public URL are configured for the repository's deployment type.
- Document how to preview locally and how to validate a production build.
- Keep generated output out of source control unless the selected deployment method explicitly requires it.
- Add a deployment status badge to the README only if it is useful and maintained.

### Manual acceptance checks
- Test every top-level route and at least one nested route by direct URL entry.
- Refresh nested project, hobby, and app pages in the deployed site.
- Test the mobile navigation with keyboard and touch.
- Test theme switching and persistence.
- Test a project with images, a long article, code, and previous/next navigation.
- Test a custom-layout project or hobby page.
- Test an app in its normal, reset, empty, and error states.
- Confirm that an app failure does not break the surrounding site.
- Check reduced-motion behavior and keyboard focus.
- Confirm no horizontal overflow at the specified widths.
- Test external links, résumé link, and social links.
- Verify browser console and network requests are free of avoidable errors.

---

## 14. Initial content and assets

Do not block the initial build on having every project fully written. Establish the structure first and use clearly marked draft placeholders for missing information.

### Initial professional content
Use verified source material supplied by the owner for:
- Current and previous roles.
- Role dates and descriptions.
- Education.
- Technical skills.
- Public links and résumé.
- Selected projects and project status.

### Initial content priorities
1. Home page with clear positioning and calls to action.
2. Experience page with the strongest and most relevant experience first.
3. Education page.
4. Projects index and at least one representative detailed project page.
5. Hobbies index and one representative detail page, if content is available.
6. Apps index with at least one working, modest interactive experiment or an explicit “coming soon” state.

Do not invent the content of projects or claim an app is functional when it is not. Use a content checklist in the README to identify unfinished pages.

### Asset conventions
- Use descriptive lowercase filenames with hyphens.
- Store source images at reasonable quality and generate optimized display variants when appropriate.
- Include alt text and captions in content metadata.
- Keep source media separate from generated thumbnails if both are needed.
- Avoid committing unnecessarily large raw video files; use optimized clips or a suitable external host when appropriate.
- Confirm licensing/permission for all included fonts, images, and media.

---

## 15. Implementation phases

### Phase 1 — Foundation
- Inspect the empty repository and confirm the deployment URL/repository name.
- Initialize the selected framework, TypeScript, linting, formatting, and tests.
- Establish palette tokens, typography, spacing scale, global reset, and responsive layout primitives.
- Build the global shell, navigation, footer, theme switch, 404 page, and base metadata.
- Configure GitHub Pages deployment and verify direct-route refresh behavior.
- Write the initial README.

**Exit criteria:** Clean install, local development, production build, accessible shell, and successful GitHub Pages deployment.

### Phase 2 — Professional portfolio
- Implement Home, Experience, and Education.
- Add résumé/social/contact links from verified URLs.
- Establish reusable timeline, skill, CTA, and featured-project components.
- Verify the main recruiter journey on desktop and mobile.

**Exit criteria:** A recruiter can quickly understand the owner's profile and navigate to experience and selected work.

### Phase 3 — Content publishing system
- Implement project, hobby, and app metadata/content schemas.
- Build index pages from content data.
- Build flexible content blocks, media components, breadcrumbs, and previous/next navigation.
- Add content validation and documentation for adding entries.

**Exit criteria:** A developer can add a new project or hobby primarily by adding a content file and assets, without editing index-page code.

### Phase 4 — Interactive playground
- Build the Apps index and app registry.
- Add one small, complete demonstration app as a reference implementation.
- Ensure apps are loaded on demand and have reset/error/help states.
- Document the pattern for adding a new app.

**Exit criteria:** A new app can be added without changing the global shell or unrelated app modules.

### Phase 5 — Polish and release
- Audit mobile layouts, accessibility, performance, metadata, and broken links.
- Verify all direct URLs on the deployed site.
- Optimize media and remove unused dependencies.
- Replace placeholders with verified content where available.
- Document future custom-domain and self-hosting migration.

**Exit criteria:** Acceptance checklist passes, known limitations are documented, and deployment is repeatable.

---

## 16. Definition of done

The initial implementation is complete when all of the following are true:

- [ ] Site builds from a clean checkout using documented commands.
- [ ] CI validates the project and deploys successfully to GitHub Pages.
- [ ] All six top-level pages exist and are linked from the global navigation.
- [ ] Project, hobby, and app detail routes are supported.
- [ ] Direct URL entry and refresh work for nested routes on the deployed site.
- [ ] The supplied five-color palette is represented in centralized design tokens.
- [ ] Light and dark themes work, including system preference and manual override.
- [ ] Responsive layouts work from 320 px through wide desktop.
- [ ] Keyboard navigation, visible focus, skip link, and reduced-motion support are implemented.
- [ ] Project/hobby pages can combine different content blocks and media.
- [ ] Projects are chronologically ordered using a documented rule.
- [ ] Previous/next navigation works and does not loop or point to missing entries.
- [ ] Apps are modular, load only when needed, and fail gracefully.
- [ ] SEO/social metadata, favicon, sitemap, and robots configuration are present.
- [ ] No secrets, private employer data, or invented professional claims are present.
- [ ] README explains setup, scripts, content authoring, app authoring, deployment, and common troubleshooting.
- [ ] No known critical accessibility, mobile usability, build, or routing defects remain.

---

## 17. README requirements

The repository README should explain:

- Project purpose and technology stack.
- Prerequisites and package manager.
- Install, development, lint, test, type-check, and build commands.
- How to configure the GitHub Pages base path and production URL.
- How to add a project, hobby, or app.
- How to add and optimize media.
- How to create a custom article layout.
- How to register an interactive app and isolate its dependencies.
- How deployment works and how to inspect a failed deployment.
- How to migrate to a custom domain or conventional static web server.
- Any known limitations or intentionally deferred features.

---

## 18. Explicit non-goals for the first release

Do not build these unless a concrete requirement emerges:

- User accounts, authentication, or profiles.
- A database or server-side API solely to support static portfolio content.
- A full CMS or visual page builder.
- Comments, likes, social feeds, or complex analytics.
- A general-purpose plugin marketplace for apps.
- A custom animation framework.
- A large number of placeholder projects just to fill the page.
- A contact form that silently fails on static hosting.
- A monolithic client-side bundle containing every interactive experiment.

The initial goal is a high-quality, extensible static site—not an over-engineered platform.

---

## 19. Developer-agent execution instructions

Start by inspecting the repository and confirming whether it is truly empty. Then implement Phase 1 through Phase 5 in order, keeping each phase buildable.

Before making major architecture choices, document the choice briefly in the README or a short architecture note. Favor the simplest solution that meets the requirements. Do not stop after producing a plan: implement the working site, add tests and deployment configuration, and verify the production build.

If required personal details, URLs, résumé files, or project media are absent, create clearly marked content placeholders and list exactly what the owner needs to supply. Do not invent them. Keep the code organized so future additions are straightforward, but do not add abstractions without a current use case.

At completion, report:
1. What was implemented.
2. The selected stack and why.
3. How to run and test locally.
4. How GitHub Pages deployment is configured.
5. Any owner-supplied content/assets still needed.
6. Any known limitations or deferred work.
