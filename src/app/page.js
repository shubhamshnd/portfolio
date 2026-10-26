import Portfolio from '@/components/portfolio'

// GitHub contribution calendar, read from the public profile page and refreshed daily.
// ponytail: HTML scrape, no token; if GitHub changes the markup the chart just hides.
async function commits() {
  try {
    const html = await (await fetch('https://github.com/users/shubhamshnd/contributions', { next: { revalidate: 86400 } })).text()
    const tips = Object.fromEntries([...html.matchAll(/for="(contribution-day-component-[\d-]+)"[^>]*>([^<]+)/g)].map((m) => [m[1], m[2].trim()]))
    const days = [...html.matchAll(/data-date="([\d-]+)" id="(contribution-day-component-(\d+)-(\d+))" data-level="(\d)"/g)].map((m) => ({
      row: +m[3],
      col: +m[4],
      level: +m[5],
      tip: tips[m[2]] || m[1],
    }))
    const total = html.match(/([\d,]+)\s+contributions\s+in the last year/)?.[1]
    return days.length && total ? { days, total } : null
  } catch {
    return null
  }
}

export default async function Home() {
  return <Portfolio commits={await commits()} />
}
