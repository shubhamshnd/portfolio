'use client'

import { track } from '@vercel/analytics'
import { profile, SITE } from '@/data/site'

const PDF = '/shubham_resume.pdf'
// What gets sent: the PDF link plus the portfolio, so whoever receives it can open either.
const message = `${profile.name}, ${profile.title}\nRésumé: ${SITE}${PDF}\nPortfolio: ${SITE}`
const mail = `mailto:?subject=${encodeURIComponent(`Résumé: ${profile.name}`)}&body=${encodeURIComponent(message)}`
const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`

const BUTTON = 'flex min-h-11 flex-1 items-center justify-center rounded-md font-medium'

// Fixed bar at the bottom of /resume: save the PDF, or send it on by email or WhatsApp.
export default function ResumeActions() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex max-w-3xl gap-2">
        <a href={PDF} download="Shubham_Shinde_Resume.pdf" onClick={() => track('Résumé saved')} className={`${BUTTON} bg-accent text-bg hover:bg-accent/90`}>
          Save PDF
        </a>
        <a href={mail} onClick={() => track('Résumé shared', { via: 'email' })} className={`${BUTTON} border border-line text-head hover:border-accent`}>
          Email
        </a>
        <a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => track('Résumé shared', { via: 'whatsapp' })} className={`${BUTTON} border border-line text-head hover:border-accent`}>
          WhatsApp
        </a>
      </div>
    </div>
  )
}
