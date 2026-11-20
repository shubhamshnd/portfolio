# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: hiring managers and recruiters at port operators and maritime consultancies outside India.** DP World, AD Ports Group, PSA, APM Terminals, Saudi Global Ports, RSGT, Gulftainer, Kaleris/Navis, Haskoning and similar. They skim fast, often from a LinkedIn message, and want to know in one screen: does he know how a terminal runs, what has he changed in one, and can we hire him from India.
- **Secondary: maritime recruiters** placing port operations, terminal systems and digital roles in the GCC, Singapore and Europe.

## Product Purpose

The personal portfolio of Shubham Shinde, at www.shubhamshnd.in. It presents him as a digital transformation and process automation consultant who gathers business requirements, writes BRDs that operations, finance and IT sign off on, maps processes, and then builds the automation himself.

A good visit ends with one of three actions:
- an email to shubhamshindesunil.work@gmail.com
- a download of the résumé (`public/shubham_resume.pdf`)
- a connection or message on LinkedIn (linkedin.com/in/shubham-shnd)

There is no contact form and no booking link.

## Positioning

Port operations and digital transformation. He has spent three years inside dry and liquid bulk terminals turning port work (berth planning, quay, yard, gate, invoicing) into systems, and can show operational outcomes: berth utilization from 65% to 68%, barge and MBC arrivals predicted to ±17 minutes, systems at seven port sites.

Goal: a port or terminal role abroad (UAE, Saudi Arabia, Qatar, Oman, Singapore, Europe), paid in USD or a USD-pegged currency, by 2028. The site speaks the port industry's language (berths, MBCs, turnaround, demurrage, terminal KPIs), not generic "process automation". Never claim Navis N4 or other TOS experience he doesn't have.

## Operating Context

- Visitors usually arrive from LinkedIn, a recruiter's shortlist or the résumé, and judge him within one or two screens.
- The site is a single, short page:
  - hero: the lead, open-to line, Email / Résumé / LinkedIn, four port KPIs
  - a 3D terminal (three.js, `src/components/terminal.js`) with six zones; each zone lists the systems built for it (`zones` in `site.js`)
  - About, and a "For hiring teams outside India" box (`abroad`)
  - ports worked at, four case studies, all work as a card grid, LinkedIn recommendations, skills, contact
- Some Indian mobile networks block *.vercel.app, so the custom domain is the address to share.

## Capabilities and Constraints

- Next.js 15 (App Router) on Vercel, deployed from `main`. All page content lives in `src/data/site.js`; components should hold no copy.
- The résumé is printed from `resume/resume.html` to `public/shubham_resume.pdf` and must stay one page.
- **No values on screens.** No ₹ cost or licensing figures anywhere. Every project screenshot keeps its numbers and names blurred, because JSW is strict about what leaves the company. Real footage from work may be company IP.
- **No invented numbers.** Never make up stats, or which port a project ran at. Shubham supplies those.
- Port names carry the JSW prefix (JSW Dharamtar Port, JSW Jaigarh Port, JSW South West Port, JSW Mangalore Port).

## Brand Commitments

- **Voice: human copy.** Plain, factual, first person, with contractions. Short sentences with concrete specifics and plain verbs (built, replaced, moved). No AI-marketing taglines, puns, em-dash triplets, marketing intros under headings, or "let's talk" closers. The About section covers who he is and how he works; project specifics belong in Journey and Work.
- Name: Shubham Shinde. Title: "Port Operations & Digital Transformation". Domains line: "Berth Planning · Port Management Systems · Terminal KPIs · Automation · AI".

## Evidence on Hand

- **15 projects** with blurred screenshots in `public/projects/`. They include:
  - PortBird (in-house port ERP)
  - SAP and GST integration
  - automated reports and RAG-based reporting
  - centralized and per-port operations dashboards
  - Siemens and Moxa energy monitoring
  - weighbridge, gatepass and vehicle speed systems
  - digital logbook, smart canteen and headcount dashboard
- **Headline numbers he has confirmed:**
  - berth utilization at Dharamtar from 65% to 68%
  - MBC and barge arrivals predicted to ±17 minutes
  - 50+ in-house projects
  - 7 sites running his systems
  - 7,500 hours of manual work removed a year
  - 90+ reports automated
- **Five case studies** (in `site.js`):
  - replacing a licensed system with one built in-house
  - one live view across every site
  - digitising registers across seven sites
  - knowing who is on site
  - answering operations questions in plain English
- **Four LinkedIn recommendations**, quoted as written: Sambasiva Rao Gattu, Manish Gupta, Arabinda Moharana and Karun Kant Dave.
- A GitHub contribution chart, pulled live from github.com/shubhamshnd.
- **Not available, so don't fabricate:**
  - clients outside JSW
  - testimonials beyond the four above
  - costs, savings in ₹, or licence figures
  - unblurred screens
  - per-port stats he hasn't given

## Product Principles

1. **Proof over claims.** Every capability should point to something he built and shipped.
2. **Port first.** Describe work by where it sits in a terminal and what it changed operationally.
3. **Respect the employer.** Never expose data, values or names from JSW systems.
4. **Fast to judge.** A recruiter should get role, proof and contact within the first screen or two.
5. **Sounds like him.** If a sentence reads like marketing, rewrite it plainly.
