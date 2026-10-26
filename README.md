# Portfolio

Next.js site, deployed on Vercel. `npm run dev` to work locally.

- All text, ports and projects live in `src/data/site.js`.
- Project screenshots and videos go in `public/projects/<project id>/` and are listed in that project's `media` array (first item is the card thumbnail).
- The globe is `src/components/globe.js` (cobe). Each port's `location` is `[lat, lon]`.
- The résumé PDF is printed from `resume/resume.html`:
  `chrome --headless=new --no-pdf-header-footer --print-to-pdf=public/shubham_resume.pdf resume/resume.html`
