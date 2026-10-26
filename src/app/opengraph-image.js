import { ImageResponse } from 'next/og'
import { profile } from '@/data/site'

// The card LinkedIn, WhatsApp and Slack show when the site link is shared.
export const alt = `${profile.name}, ${profile.title}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#0b111c',
          backgroundImage: 'linear-gradient(rgba(125,162,209,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(125,162,209,0.08) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          color: '#e2e8f0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 700 }}>{profile.name}</div>
          <div style={{ fontSize: 40, marginTop: 12 }}>{profile.title}</div>
          <div style={{ fontSize: 28, marginTop: 14, color: '#ffb020' }}>{profile.domains}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 26, color: '#94a3b8' }}>
          <div style={{ display: 'flex', borderLeft: '4px solid #ffb020', paddingLeft: 18, color: '#e2e8f0' }}>{profile.openTo}</div>
          <div style={{ display: 'flex', marginTop: 22 }}>{`${profile.company} · ${profile.location.replace(', India', '')}`}</div>
        </div>
      </div>
    ),
    size,
  )
}
