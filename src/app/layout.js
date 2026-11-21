import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SITE, profile } from '@/data/site'
import './globals.css'

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

const description =
  'Shubham Shinde: port operations and digital transformation at JSW Infrastructure, India. Berth planning, port ERP for dry and liquid bulk, SAP and GST integration, live operations dashboards and AI across seven port sites, with 30+ processes automated. Open to port and terminal roles in the UAE, Saudi Arabia, Qatar, Oman, Singapore and Europe.'
const title = 'Shubham Shinde · Port Operations & Digital Transformation · JSW Infrastructure'

export const metadata = {
  metadataBase: new URL(SITE),
  title,
  description,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: SITE }],
  creator: profile.name,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: SITE, siteName: profile.name, type: 'profile', firstName: 'Shubham', lastName: 'Shinde', username: 'shubham-shnd' },
  twitter: { card: 'summary_large_image', title, description },
  // Google Search Console: paste the content value of its HTML-tag verification here.
  ...(profile.googleVerification && { verification: { google: profile.googleVerification } }),
}

// Structured data so Google can tell this Shubham Shinde apart from others with the same name,
// and tie the site to the LinkedIn and GitHub profiles.
const person = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  url: SITE,
  mainEntity: {
    '@type': 'Person',
    '@id': `${SITE}/#person`,
    name: profile.name,
    url: SITE,
    email: `mailto:${profile.email}`,
    jobTitle: profile.role,
    description,
    worksFor: { '@type': 'Organization', name: profile.company, url: 'https://www.jsw.in/infrastructure' },
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Ramrao Adik Institute of Technology' },
      { '@type': 'CollegeOrUniversity', name: 'IIM Mumbai' },
    ],
    address: { '@type': 'PostalAddress', addressLocality: 'Navi Mumbai', addressRegion: 'Maharashtra', addressCountry: 'IN' },
    knowsAbout: ['Port operations', 'Terminal operations', 'Berth planning', 'Port management systems', 'Liquid bulk terminals', 'Dry bulk terminals', 'Digital transformation', 'SAP integration', 'Process automation', 'Operations dashboards', 'AI'],
    sameAs: profile.links.filter((l) => l.href.startsWith('http')).map((l) => l.href),
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
