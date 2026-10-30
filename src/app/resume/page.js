import ResumeActions from '@/components/resume-actions'

export const metadata = {
  title: 'Résumé · Shubham Shinde',
  description: 'Résumé of Shubham Shinde: digital transformation and process automation. Save it as a PDF or send it by email or WhatsApp.',
}

// The résumé as an image (embedded PDFs don't show on most Android phones), with save and share actions below.
// The PNG is printed from resume/resume.html alongside the PDF; see the note at the top of that file.
export default function Resume() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-36 pt-4">
      <a href="/" className="inline-flex min-h-11 items-center font-mono text-sm text-ink hover:text-accent">
        ← shubhamshnd.in
      </a>
      {/* Small on a phone, so a tap opens the PDF to zoom into. */}
      <a href="/shubham_resume.pdf" target="_blank" rel="noreferrer" className="mt-2 block">
        <img
          src="/shubham_resume.png"
          alt="Résumé of Shubham Shinde. Opens the PDF, which has the same content as text."
          width={1588}
          height={2246}
          className="w-full rounded-md shadow-[0_8px_30px_rgb(0_0_0/0.45)]"
        />
      </a>
      <ResumeActions />
    </main>
  )
}
