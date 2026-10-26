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
    // Keep the last 26 weeks and add up their counts from the tooltips ("5 contributions on …").
    const last = Math.max(...days.map((d) => d.col))
    const recent = days.filter((d) => d.col > last - 26).map((d) => ({ ...d, col: d.col - (last - 25) }))
    const total = recent.reduce((n, d) => n + (parseInt(d.tip) || 0), 0)
    return recent.length ? { days: recent, total: total.toLocaleString('en-IN') } : null
  } catch {
    return null
  }
}

export default async function Home() {
  return <Portfolio commits={await commits()} />
}
