import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SITE } from '@/data/site'
import './globals.css'

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

const description =
  'Port operations and digital transformation: berth planning, port management systems, terminal KPIs, SAP and GST integration, dashboards and AI, built and rolled out across seven JSW Infrastructure port sites. Berth utilization up from 65% to 68%. Open to port and terminal roles in the UAE, Saudi Arabia, Qatar, Oman, Singapore and Europe.'
const title = 'Shubham Shinde · Port Operations & Digital Transformation'

export const metadata = {
  metadataBase: new URL(SITE),
  title,
  description,
  openGraph: { title, description, url: SITE, type: 'website' },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
