import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SITE } from '@/data/site'
import './globals.css'

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

const description =
  'Digital transformation and process automation: turning manual processes into working systems, from requirements and BRDs to ERP and SAP integration, automated reporting, dashboards and AI. Built and rolled out across seven JSW Infrastructure sites. Open to Digital Transformation Consultant, Business Analyst and Solution Consultant roles.'

export const metadata = {
  metadataBase: new URL(SITE),
  title: 'Shubham Shinde · Digital Transformation & Process Automation',
  description,
  openGraph: { title: 'Shubham Shinde · Digital Transformation & Process Automation', description, url: SITE, type: 'website' },
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
