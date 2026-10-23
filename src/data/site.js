// Everything on the page comes from this file. Edit text here, not in components.

export const profile = {
  name: 'Shubham Shinde',
  title: 'Digital & AI Solution Architect',
  domains: 'Ports · Supply Chain · Manufacturing',
  lead: 'I build software for ports, plants and supply chains.',
  intro: [
    "I like to start on the ground. I sit with the people doing the work, see where their time goes, and find the spreadsheets and reports nobody enjoys making. Then I design something better and build it myself.",
    "Most of what I make is data pipelines, ERP and SAP integrations, dashboards and, more and more, AI tools that answer questions from operations data. I'm also doing a PGPM at IIM Mumbai, so I can think about the business side as much as the tech.",
  ],
  // Totals of the per-port numbers below.
  highlights: [
    { value: '₹4 Cr', label: 'licensing avoided' },
    { value: '7,500 h', label: 'manual work removed a year' },
    { value: '90+', label: 'reports automated' },
  ],
  email: 'shubhamshindesunil.work@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shubham-shnd/' },
    { label: 'GitHub', href: 'https://github.com/shubhamshnd' },
    { label: 'Résumé', href: '/shubham_resume.pdf' },
  ],
}

// Globe stops, in scroll order. location = [lat, lon].
// ponytail: coordinates are approximate, good enough at globe zoom.
export const journey = [
  {
    id: 'dharamtar',
    port: 'Dharamtar Port',
    place: 'Raigad, Maharashtra',
    location: [18.7, 73.03],
    when: 'Aug 2023',
    role: 'Graduate Engineer Trainee, then Assistant Manager, Digitalisation',
    facts: ['5 berths', '34 MTPA', 'River port on the Amba, 16 km inland'],
    text: 'Where I started. I learned how a bulk cargo port actually runs, then started writing software for the problems I saw on the ground.',
  },
  {
    id: 'jnpa',
    port: 'JSW JNPA Liquid Terminal',
    place: 'JNPA, Navi Mumbai',
    location: [18.95, 72.95],
    when: '',
    role: '',
    facts: ['Liquid cargo terminal'],
    text: 'I rolled PortBird out here with the same features as Dharamtar.',
  },
  {
    id: 'jaigarh',
    port: 'Jaigarh Port',
    place: 'Ratnagiri, Maharashtra',
    location: [17.3, 73.22],
    when: '',
    role: '',
    facts: ['7 berths', '55 MTPA', 'Deep-water, all-weather'],
    text: '',
  },
  {
    id: 'swpl',
    port: 'South West Port Limited',
    place: 'Mormugao, Goa',
    location: [15.41, 73.8],
    when: '',
    role: '',
    facts: ['2 berths', '8.5 MTPA'],
    text: '',
  },
  {
    id: 'mangalore',
    port: 'Mangalore Port Limited',
    place: 'Panambur, Karnataka',
    location: [12.93, 74.81],
    when: '',
    role: '',
    facts: ['315 m berth', '14 m draft', '6.73 MTPA'],
    text: '',
  },
]

// Shown together at the "network" stop.
export const network = [
  { name: 'PNP Port', location: [18.78, 72.94] },
  { name: 'Paradip', location: [20.26, 86.67] },
  { name: 'Ennore', location: [13.25, 80.33] },
  { name: 'Fujairah', location: [25.12, 56.36] },
  { name: 'Dibba', location: [25.62, 56.27] },
]

// ports: journey ids where the project runs ('network' = the JSW Infrastructure stop); listed under them on the route.
// stats: short proof lines shown in accent. portStats / portMedia: per-port overrides shown when opened from that port.
// media: files in /public/projects/<id>/ — images (.png/.jpg/.webp) or videos (.mp4/.webm).
// e.g. media: ['/projects/weighbridge/1.png', '/projects/weighbridge/demo.mp4']
export const projects = [
  {
    id: 'portbird',
    name: 'PortBird',
    ports: ['dharamtar', 'jnpa'],
    summary: 'A full port management system (port ERP) with SAP and GST integration. Built in-house instead of buying a licence.',
    stats: ['₹2.5 crore licensing avoided at Dharamtar', '₹1.5 crore at JNPA', '₹10 lakh / site / year maintenance avoided'],
    portStats: {
      dharamtar: ['₹2.5 crore licensing avoided', '₹10 lakh / year maintenance avoided'],
      jnpa: ['₹1.5 crore licensing avoided', '₹10 lakh / year maintenance avoided'],
    },
    stack: ['Python', 'PostgreSQL', 'SAP API', 'GST API', 'Azure Data Lake', 'Entra ID'],
    media: [
      '/projects/portbird/02-home.webp',
      '/projects/portbird/03-vcn01.webp',
      '/projects/portbird/04-mbc01.webp',
      '/projects/portbird/01-login.webp',
    ],
    portMedia: {
      jnpa: [
        '/projects/portbird-jnpa/app1.webp',
        '/projects/portbird-jnpa/app2.webp',
        '/projects/portbird-jnpa/app3.webp',
        '/projects/portbird-jnpa/app4.webp',
        '/projects/portbird-jnpa/app5.webp',
        '/projects/portbird-jnpa/app6.webp',
      ],
    },
  },
  {
    id: 'sap-gst',
    name: 'SAP and GST Integration',
    ports: ['dharamtar', 'jnpa'],
    summary: 'Invoices raised in PortBird are e-invoiced on the GST portal and posted to SAP automatically, so finance never re-enters them.',
    stats: [],
    stack: ['SAP API', 'GST e-invoice API', 'Python'],
    // Dharamtar invoices; JNPA shows "screens coming" until it has its own.
    media: [
      '/projects/sap-gst/10-sap.webp',
      '/projects/sap-gst/08-invoices.webp',
    ],
    portMedia: { jnpa: [] },
  },
  {
    id: 'automated-reports',
    name: 'Automated Reports',
    ports: ['dharamtar', 'jnpa'],
    summary: 'Daily and recurring port reports generated automatically instead of compiled by hand.',
    // ponytail: hours = hours per working day × ~300 working days
    stats: ['90+ reports automated across both sites', '~7,500 hours saved a year'],
    portStats: {
      dharamtar: ['50+ reports automated', '~6,000 hours saved a year'],
      jnpa: ['40+ reports automated', '~1,500 hours saved a year'],
    },
    stack: ['Python', 'PostgreSQL'],
    media: [
      '/projects/automated-reports/05-rp01.webp',
      '/projects/automated-reports/05b-rp01-full.webp',
      '/projects/automated-reports/06-port-overview.webp',
    ],
    portMedia: {
      jnpa: [
        '/projects/automated-reports/jnpa-reports1.webp',
        '/projects/automated-reports/jnpa-reports2.webp',
      ],
    },
  },
  {
    id: 'cargo-prediction',
    name: 'Predictive Analysis on Cargo Handling',
    ports: ['dharamtar'],
    summary: 'Predictive models on cargo handling data.',
    stats: [],
    stack: ['Python'],
    media: [
      '/projects/cargo-prediction/12-forecast.webp',
      '/projects/cargo-prediction/13-forecast-scenarios.webp',
      '/projects/cargo-prediction/arrival-planner.webp',
    ],
  },
  {
    id: 'rag-reporting',
    name: 'RAG-based Automated Reporting',
    ports: ['dharamtar'],
    summary: 'Ask about cargo, equipment or delays in plain English and get an answer with a chart, plus the SQL behind it so every number can be checked.',
    stats: [],
    stack: ['LLM', 'RAG', 'Text-to-SQL'],
    media: [
      '/projects/rag-reporting/14-ai-chat.webp',
      '/projects/rag-reporting/15-ai-chart.webp',
      '/projects/rag-reporting/16-ai-sql.webp',
    ],
  },
  {
    id: 'central-dashboard',
    name: 'Centralized Dashboard',
    ports: ['network'],
    summary: "One live view of every JSW Infrastructure port and terminal. Pick a port on the map to see today's discharge, berths, cargo mix, delays, tides and the barge fleet.",
    stats: [],
    stack: [],
    // A YouTube link plays in the viewer; its thumbnail becomes the card cover.
    media: [
      'https://youtu.be/DTitukTEaww',
      '/projects/central-dashboard/01.webp',
      '/projects/central-dashboard/02.webp',
      '/projects/central-dashboard/03.webp',
      '/projects/central-dashboard/04.webp',
    ],
  },
  {
    id: 'jaigarh-ops',
    name: 'Jaigarh Operations Dashboard',
    ports: ['jaigarh'],
    summary: 'Live operations for Jaigarh: berth and anchorage status, cargo against targets, truck and vessel turnaround, yard stock, weather and tides.',
    stats: [],
    stack: [],
    media: [
      '/projects/jaigarh-ops/01.webp',
      '/projects/jaigarh-ops/02.webp',
      '/projects/jaigarh-ops/03.webp',
      '/projects/jaigarh-ops/04.webp',
      '/projects/jaigarh-ops/05.webp',
    ],
  },
  {
    id: 'swpl-ops',
    name: 'SWPL Operations Dashboard',
    ports: ['swpl'],
    summary: 'Cargo, rake and vessel tracking for South West Port: stock by product, live rake loading, berth-wise discharge and dispatch, turnaround and demurrage.',
    stats: [],
    stack: [],
    media: [
      '/projects/swpl-ops/01.webp',
      '/projects/swpl-ops/02.webp',
      '/projects/swpl-ops/03.webp',
    ],
  },
  {
    id: 'digital-logbook',
    name: 'Digital Logbook',
    ports: ['network'],
    summary: 'Turns paper registers into digital ones. Built on an EAV model, so new forms are configured rather than coded, with approval workflows and role-based access.',
    stats: ['30+ processes digitized'],
    stack: ['EAV', 'RBAC', 'Workflows'],
    media: [
      '/projects/digital-logbook/01.webp',
    ],
  },
  {
    id: 'headcount-dashboard',
    name: 'Headcount Dashboard',
    ports: ['network'],
    summary: 'Linked to the punch-in system to show headcount at every site in real time, with overstay alerts and overstay reports.',
    stats: [],
    stack: [],
    // TODO(shubham): screenshots to come.
    media: [],
  },
  {
    id: 'weighbridge',
    name: 'Weighbridge Management System',
    summary: 'Captures cargo weights straight from the weighbridge instead of typed entries.',
    stack: ['Electron', 'IoT', 'REST API'],
    media: [
      '/projects/weighbridge/01.webp',
    ],
  },
  {
    id: 'anpr-speed',
    name: 'Vehicle Speed Detection',
    summary: 'Number-plate based speed checks on port roads, with a live violations dashboard.',
    stack: ['YOLOv8', 'Flask', 'Chart.js'],
    media: [
      '/projects/anpr-speed/01.webp',
      '/projects/anpr-speed/02.webp',
    ],
  },
  {
    id: 'headcount',
    name: 'Manpower Headcount',
    summary: 'Real-time people count from RTSP cameras.',
    stack: ['YOLOv4-tiny', 'OpenCV', 'Express', 'SQL Server'],
    media: [],
  },
  {
    id: 'gate-permit',
    name: 'Vehicle Gate Permits',
    summary: 'Replaced paper gate passes for employee vehicles.',
    stack: ['Django', 'SQLite'],
    media: [],
  },
]
