import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

// One place for the public URL.
const SITE = 'https://www.shubhamshnd.in'
const description =
  'Digital transformation for ports and maritime: port ERP, SAP and GST integration, multi-site dashboards and AI on operations data, built and rolled out across seven JSW Infrastructure sites. Open to port and maritime digital advisory roles.'

export const metadata = {
  metadataBase: new URL(SITE),
  title: 'Shubham Shinde · Digital Transformation, Ports & Maritime',
  description,
  openGraph: { title: 'Shubham Shinde · Digital Transformation, Ports & Maritime', description, url: SITE, type: 'website' },
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
