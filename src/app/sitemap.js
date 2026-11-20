import { SITE } from '@/data/site'

export default function sitemap() {
  const now = new Date()
  return [
    { url: SITE, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE}/resume`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
