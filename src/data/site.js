// Everything on the page comes from this file. Edit text here, not in components.

// One place for the public URL.
export const SITE = 'https://www.shubhamshnd.in'

export const profile = {
  name: 'Shubham Shinde',
  title: 'Port Operations & Digital Transformation',
  domains: 'Berth Planning · Port Management Systems · Terminal KPIs · Automation · AI',
  // Above the fold: what I'm looking for, and where.
  openTo: 'Open to port operations, terminal systems and digital transformation roles with port operators and maritime consultancies in the UAE, Saudi Arabia, Qatar, Oman, Singapore and Europe. Ready to relocate on an employer-sponsored work visa.',
  lead: 'I make ports run on data instead of paper, from the anchorage to the invoice.',
  // Shown as a facts row under the hero.
  role: 'Deputy Manager, Digital Solutions Engineer',
  company: 'JSW Infrastructure',
  experience: '3+ years in port operations and systems',
  location: 'Navi Mumbai, India · relocating',
  education: 'PGPM (MBA), IIM Mumbai, weekend programme · Jul 2026 – Jul 2028',
  intro: [
    "I'm a Deputy Manager and Digital Solutions Engineer at JSW Infrastructure, India's second-largest private port operator. For three years I've worked inside its bulk and liquid terminals, taking the work that ran on paper, Excel and phone calls and turning it into systems the berth, yard, gate and finance teams use every shift.",
    "I start on the quay, not in a meeting room. I sit with shift in-charges, planners and finance, see where the hours and the demurrage go, and write down what the terminal needs. That becomes a requirements document operations, finance and IT all sign. Then I design the solution and build it myself, and roll it out port by port.",
    "The results are operational: berth utilization at Dharamtar up from 65% to 68% after we started predicting barge and MBC arrivals to within ±17 minutes, invoices that post to SAP without re-entry, and one live view of every JSW port. I'm doing a weekend PGPM at IIM Mumbai alongside, so I can make the commercial case for a change as well as deliver it.",
  ],
  // Headline numbers in the hero. All confirmed by Shubham (see PRODUCT.md).
  highlights: [
    { value: '65→68%', label: 'berth utilization at Dharamtar' },
    { value: '±17 min', label: 'barge and MBC arrival prediction' },
    { value: '7', label: 'port sites running my systems' },
    { value: '7,500 h', label: 'manual work removed a year' },
  ],
  email: 'shubhamshindesunil.work@gmail.com',
  // From Google Search Console > Add property > HTML tag: the content="..." value only.
  googleVerification: '',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shubham-shnd/' },
    { label: 'GitHub', href: 'https://github.com/shubhamshnd' },
    { label: 'Résumé', href: '/resume' },
  ],
}

// The 3D terminal: each zone is a part of a port, with the systems I built for it.
// id matches a hotspot in components/terminal.js; projects = ids in `projects`.
export const zones = [
  {
    id: 'anchorage',
    name: 'Anchorage and berth planning',
    text: 'Barges and mother-vessel MBCs are predicted to within ±17 minutes, so the berthing sequence and cargo priorities are set before they arrive. Berth utilization went from 65% to 68%.',
    projects: ['cargo-prediction'],
  },
  {
    id: 'quay',
    name: 'Quay and vessel operations',
    text: 'Dry bulk vessel calls, barge and MBC operations, berth allocation and services run in PortBird, the port ERP I built to replace a licensed system. Crane-side energy is read straight off PLCs and Moxa gateways.',
    projects: ['portbird', 'jaigarh-ems', 'mangalore-ems'],
  },
  {
    id: 'liquid',
    name: 'Liquid jetty and tank farm',
    text: 'At the JNPA liquid terminal, every tanker parcel is tied to a pipeline and a tank-farm terminal, pumping is logged hour by hour, and NOR and pilot times feed laytime and delay records.',
    projects: ['portbird-liquid'],
  },
  {
    id: 'yard',
    name: 'Yard and stockpiles',
    text: 'Live yard stock by product, rake loading, berth-wise discharge and dispatch, turnaround and demurrage, per port.',
    projects: ['jaigarh-ops', 'swpl-ops'],
  },
  {
    id: 'gate',
    name: 'Gate, weighbridge and roads',
    text: 'Truck weights captured straight from the weighbridge, QR gate passes checked at the gate, and vehicle speed enforced with YOLO and number-plate reading.',
    projects: ['weighbridge', 'gate-permit', 'anpr-speed'],
  },
  {
    id: 'control',
    name: 'Control room',
    text: 'One live map of every JSW port, and an assistant that answers operations questions in plain English with the SQL behind every number.',
    projects: ['central-dashboard', 'rag-reporting'],
  },
  {
    id: 'admin',
    name: 'Finance, HR and admin',
    text: 'Invoices e-invoiced on the GST portal and posted to SAP automatically, 90+ reports that build themselves, and paper registers, headcount and canteen tokens moved online.',
    projects: ['sap-gst', 'automated-reports', 'digital-logbook', 'headcount-dashboard', 'smart-canteen'],
  },
]

// For hiring managers outside India: the practical questions, answered up front.
export const abroad = [
  ['Roles', 'Port operations analyst or consultant, terminal systems or TOS business analyst, port digital transformation, operations excellence.'],
  ['Where', 'UAE, Saudi Arabia, Qatar, Oman, Singapore, the Netherlands and wider Europe. Open to other port hubs.'],
  ['Visa', 'Needs an employer-sponsored work visa. Ready to relocate.'],
  ['Terminals', 'Dry bulk such as coal and iron ore, liquid bulk, barge and MBC transshipment, river and deep-water ports.'],
  ['Remote now', 'Open to remote or short project work for port operators and consultancies: requirements, process mapping, KPI dashboards and automation.'],
]

// Ports I've worked at, in order. location = [lat, lon] (approximate).
export const journey = [
  {
    id: 'dharamtar',
    port: 'JSW Dharamtar Port',
    place: 'Raigad, Maharashtra',
    location: [18.7, 73.03],
    when: 'Aug 2023',
    role: 'Graduate Engineer Trainee, then Assistant Manager, Digitalisation',
    facts: ['5 berths', '34 million tonnes a year', 'River port on the Amba, 16 km inland'],
    text: 'Where I started. I learned how a bulk cargo port actually runs, then started writing software for the problems I saw on the ground.',
  },
  {
    id: 'jnpa',
    port: 'JSW JNPA Liquid Terminal',
    place: 'JNPA, Navi Mumbai',
    location: [18.95, 72.95],
    when: '',
    role: '',
    facts: ['Liquid bulk terminal', 'Chemicals, petroleum products, edible oils'],
    text: 'I took PortBird from dry bulk to liquid: tanker parcels, pipelines, tank farms and hourly pumping logs.',
  },
  {
    id: 'jaigarh',
    port: 'JSW Jaigarh Port',
    place: 'Ratnagiri, Maharashtra',
    location: [17.3, 73.22],
    when: '',
    role: '',
    facts: ['7 berths', '55 million tonnes a year', 'Deep-water, all-weather'],
    text: '',
  },
  {
    id: 'swpl',
    port: 'JSW South West Port',
    place: 'Mormugao, Goa',
    location: [15.41, 73.8],
    when: '',
    role: '',
    facts: ['2 berths', '8.5 million tonnes a year'],
    text: '',
  },
  {
    id: 'mangalore',
    port: 'JSW Mangalore Port',
    place: 'Panambur, Karnataka',
    location: [12.93, 74.81],
    when: '',
    role: '',
    facts: ['315 m berth', '14 m draft', '6.73 million tonnes a year'],
    text: '',
  },
]

// Shown together at the "network" stop.
export const network = [
  { name: 'JSW PNP Port', location: [18.78, 72.94] },
  { name: 'JSW Paradip', location: [20.26, 86.67] },
  { name: 'JSW Ennore', location: [13.25, 80.33] },
  { name: 'JSW Fujairah', location: [25.12, 56.36] },
  { name: 'JSW Dibba', location: [25.62, 56.27] },
]

// ports: journey ids where the project runs ('network' = the JSW Infrastructure stop); listed under them on the route.
// areas: AI / Data / IoT/OT / ERP / Apps, used by the Work filter.
// sites: where a JSW-wide project is running, shown as chips.
// stats: short proof lines shown in accent. portStats / portMedia: per-port overrides shown when opened from that port.
// media: files in /public/projects/<id>/ — images (.png/.jpg/.webp) or videos (.mp4/.webm).
// e.g. media: ['/projects/weighbridge/1.png', '/projects/weighbridge/demo.mp4']
// Projects with no media are still listed, just without a "View screens" link.
export const projects = [
  {
    id: 'portbird',
    areas: ['ERP', 'Data'],
    name: 'PortBird',
    ports: ['dharamtar'],
    summary: 'A full port management system (port ERP) for dry bulk: vessel calls, barge and MBC operations, berth planning, services and invoicing, with SAP and GST integration. Built in-house instead of buying a licence.',
    stats: [],
    stack: ['Python', 'PostgreSQL', 'SAP API', 'GST API', 'Azure Data Lake', 'Entra ID'],
    // First item plays in the viewer.
    media: [
      'https://youtu.be/BC4qWmioQ4s',
      '/projects/portbird/02-home.webp',
      '/projects/portbird/03-vcn01.webp',
      '/projects/portbird/04-mbc01.webp',
      '/projects/portbird/01-login.webp',
    ],
  },
  {
    id: 'portbird-liquid',
    areas: ['ERP', 'Data'],
    name: 'PortBird for Liquid Cargo',
    ports: ['jnpa'],
    summary: 'PortBird rebuilt for the JNPA liquid terminal. One tanker call carries many parcels of chemicals, petroleum products or edible oil, each tied to a pipeline and a tank-farm terminal. Berths are planned by dragging vessels onto them, pumping is logged hour by hour with rate, pressure, shift and equipment, and NOR, anchorage and pilot times feed laytime. Delays are checked against the anchorage-to-pilot and alongside-to-cast-off windows.',
    stats: [],
    stack: ['Python', 'PostgreSQL', 'SAP API', 'GST API'],
    media: [
      '/projects/portbird-jnpa/app3.webp',
      '/projects/portbird-jnpa/app2.webp',
      '/projects/portbird-jnpa/app6.webp',
      '/projects/portbird-jnpa/app4.webp',
      '/projects/portbird-jnpa/app5.webp',
      '/projects/portbird-jnpa/app1.webp',
    ],
  },
  {
    id: 'sap-gst',
    areas: ['ERP'],
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
    areas: ['Data'],
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
    areas: ['AI', 'Data'],
    name: 'Predictive Analysis on Cargo Handling',
    ports: ['dharamtar'],
    summary: "Forecasts where the year's cargo throughput will land against target. It simulates the remaining days thousands of times from the port's own seasonality, gives a P10 to P90 range and the odds of hitting target, and an arrival planner turns ETAs into an hour-by-hour plan.",
    stats: [],
    stack: ['Python', 'Monte Carlo simulation', 'Forecasting'],
    media: [
      '/projects/cargo-prediction/12-forecast.webp',
      '/projects/cargo-prediction/13-forecast-scenarios.webp',
      '/projects/cargo-prediction/arrival-planner.webp',
    ],
  },
  {
    id: 'rag-reporting',
    areas: ['AI'],
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
    areas: ['Data'],
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
    areas: ['Data'],
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
    areas: ['Data'],
    name: 'SWPL Operations Dashboard',
    ports: ['swpl'],
    summary: 'Cargo, rake and vessel tracking for JSW South West Port: stock by product, live rake loading, berth-wise discharge and dispatch, turnaround and demurrage.',
    stats: [],
    stack: [],
    media: [
      '/projects/swpl-ops/01.webp',
      '/projects/swpl-ops/02.webp',
      '/projects/swpl-ops/03.webp',
    ],
  },
  {
    id: 'smart-canteen',
    areas: ['Apps'],
    name: 'Smart Canteen',
    ports: ['jaigarh'],
    summary: 'Replaced printed meal tokens with QR codes. People scan at the canteen to log their meal, a voice announces their name, and daily meal-log alerts keep it transparent.',
    stats: [],
    stack: ['QR', 'Text-to-speech'],
    media: ['/projects/smart-canteen/01.webp'],
  },
  {
    id: 'jaigarh-ems',
    areas: ['IoT/OT'],
    name: 'Siemens-Based Energy Monitoring',
    ports: ['jaigarh'],
    summary: 'The same idea as Mangalore, built on Siemens PLCs: energy data read straight off the PLCs over S7.',
    stats: [],
    stack: ['Siemens S7', 'PLC'],
    // TODO(shubham): screenshots to come.
    media: [],
  },
  {
    id: 'mangalore-ems',
    areas: ['IoT/OT', 'Data'],
    name: 'Moxa-Based Energy Monitoring',
    ports: ['mangalore'],
    summary: 'Where I learned to read energy meters through Moxa gateways. Readings stream through Kafka and Spark into a landing zone and PostgreSQL, and show on a live dashboard.',
    stats: [],
    stack: ['Moxa', 'Kafka', 'Spark', 'PostgreSQL'],
    media: [
      '/projects/mangalore-ems/01.webp',
      '/projects/mangalore-ems/02.webp',
    ],
  },
  {
    id: 'digital-logbook',
    areas: ['Apps'],
    name: 'Digital Logbook',
    ports: ['network'],
    summary: 'Turns paper registers into digital ones. Built on an EAV model, so new forms are configured rather than coded, with approval workflows and role-based access.',
    stats: ['30+ processes digitized'],
    sites: ['DPPL', 'SWPL', 'JPL', 'JNPA', 'Keni', 'MCPL', 'MCTPL'],
    stack: ['EAV', 'RBAC', 'Workflows'],
    media: [
      'https://youtu.be/K5eaKjdn3os',
      '/projects/digital-logbook/01.webp',
    ],
  },
  {
    id: 'headcount-dashboard',
    areas: ['Data', 'IoT/OT'],
    name: 'Headcount Dashboard',
    ports: ['network'],
    summary: 'Built after HR said they could not track manpower on site. Linked to the punch-in system, it shows live headcount at every site and alerts on people who have not punched out, with overstay reports.',
    stats: [],
    sites: ['DPPL', 'SWPL', 'JPL', 'JNPA', 'Keni', 'MCPL', 'MCTPL'],
    stack: [],
    // Names, IDs and the signed-in email are blurred in these screens.
    media: [
      '/projects/headcount-dashboard/01.webp',
      '/projects/headcount-dashboard/02.webp',
    ],
  },
  {
    id: 'weighbridge',
    areas: ['IoT/OT'],
    name: 'Weighbridge Management System',
    ports: ['swpl'],
    summary: 'Captures truck weights straight from the weighbridge instead of typed entries. Getting the software to talk to the weighbridge took a lot of trial and error, and it is where I learned PySerial.',
    stack: ['Electron', 'PySerial', 'REST API'],
    media: [
      '/projects/weighbridge/01.webp',
    ],
  },
  {
    id: 'anpr-speed',
    areas: ['AI', 'IoT/OT'],
    name: 'Vehicle Speed Detection',
    summary: 'Speed checks on port roads: YOLO26 spots vehicles, an ANPR model running on ONNX reads the plates, and violations go to a live dashboard and reports.',
    stack: ['YOLO26', 'ANPR', 'ONNX', 'Flask', 'Chart.js'],
    media: [
      '/projects/anpr-speed/01.webp',
      '/projects/anpr-speed/02.webp',
    ],
  },
  {
    id: 'gate-permit',
    areas: ['Apps'],
    name: 'Vehicle Gatepass System',
    ports: ['jaigarh'],
    summary: 'Replaced paper gate passes for employee vehicles. Requests go online for approval, approved passes print as QR stickers, and security scans them at the gate with a Flutter app that shows whether the pass is valid.',
    stack: ['Django', 'Flutter', 'QR'],
    // Names, IDs, emails and vehicle numbers are blurred in these screens.
    media: [
      '/projects/gate-permit/01.webp',
      '/projects/gate-permit/02.webp',
      '/projects/gate-permit/03.webp',
    ],
  },
]

// Capabilities, split the way a consulting team staffs them.
export const capabilities = {
  Advisory: ['Berth planning and arrival prediction', 'Terminal KPIs: berth utilization, turnaround, demurrage', 'Requirement gathering and BRDs', 'As-is and to-be process mapping', 'Business cases and build versus buy', 'Vendor and solution evaluation', 'Phased multi-site rollout', 'Adoption and change management', 'Data governance and access control'],
}

// Technology tiles: [label, Simple Icons slug in public/icons].
export const tech = [
  ['Python', 'python'],
  ['AWS', 'amazonwebservices'],
  ['Azure', 'microsoftazure'],
  ['Google Cloud', 'googlecloud'],
  ['Databricks', 'databricks'],
  ['Kafka', 'apachekafka'],
  ['Spark', 'apachespark'],
  ['PostgreSQL', 'postgresql'],
  ['MongoDB', 'mongodb'],
  ['TensorFlow', 'tensorflow'],
  ['Hugging Face', 'huggingface'],
  ['YOLO', 'ultralytics'],
  ['ONNX', 'onnx'],
  ['SAP', 'sap'],
  ['Siemens S7', 'siemens'],
  ['Next.js', 'nextdotjs'],
  ['Django', 'django'],
  ['Flask', 'flask'],
  ['Flutter', 'flutter'],
  ['Electron', 'electron'],
]

// Flagship work written as engagements. project = id in `projects` (for its screens).
export const cases = [
  {
    project: 'portbird',
    title: 'Replacing a licensed system with one built in-house',
    client: 'JSW Dharamtar Port (DPPL), then JSW JNPA Liquid Terminal',
    role: 'Discovery, business case, architecture, build and rollout',
    situation: 'Port operations, billing and reporting were split between a licensed port system, spreadsheets and separate posting to SAP and the GST portal. Daily progress and MIS reports were compiled by hand.',
    diagnosis: 'Most of the effort went into moving the same data between systems. The licensed product did not follow how this port runs its barges and MBCs, and the port did not own its data.',
    options: 'Renew or buy a commercial port system, extend the existing one, or build in-house on the company stack.',
    recommendation: 'Build in-house: a port ERP shaped around our own vessel, barge and berth processes, with SAP and GST integrated so an invoice is entered once, and no licence or annual maintenance fee.',
    rollout: 'Went live at Dharamtar first, then rebuilt for the JNPA liquid terminal on the same core: multi-parcel tanker calls, pipeline and tank-farm allocation, hourly pumping logs, and NOR and laytime events.',
    impact: ['No licence or annual maintenance fees at either site', '50+ reports automated at Dharamtar, 40+ at JNPA', 'About 7,500 hours of manual reporting removed a year', 'Invoices e-invoiced and posted to SAP without re-entry'],
  },
  {
    project: 'central-dashboard',
    title: 'One live view across every site',
    client: 'JSW Infrastructure leadership',
    role: 'Design and build',
    situation: 'Each port reported through its own systems and spreadsheets, so getting a picture across the network meant collecting numbers from every site.',
    diagnosis: 'The data already existed in each site system. What was missing was one place that pulled it together the same way for every port.',
    options: 'A separate report from each site, a BI tool on top of a shared extract, or a purpose-built live map fed by the site systems.',
    recommendation: 'A live map of the whole network where picking a port shows the same view: discharge, berths, cargo mix, delays, tides and the barge fleet.',
    rollout: 'Built on top of the site pipelines, so a port appears once its data is connected.',
    impact: ['One screen for every JSW Infrastructure port and terminal', 'The same metrics, defined the same way, for each site'],
  },
  {
    project: 'digital-logbook',
    title: 'Digitising registers across seven sites',
    client: 'Operations, safety and admin teams across JSW Infrastructure',
    role: 'Architecture, build and rollout',
    situation: 'Routine processes ran on paper registers and spreadsheets, each with its own format, with no clear owner or approval trail.',
    diagnosis: 'Building one app per register would never keep up. The forms differed, but the needs were the same: fields, validation, approval and access control.',
    options: 'A separate app for each process, a low-code product licence, or one configurable platform.',
    recommendation: 'One platform built on an EAV data model, so a new register is configured rather than coded, with approval workflows, data ownership and role-based access.',
    rollout: 'Rolled out to seven sites: DPPL, SWPL, JPL, JNPA, Keni, MCPL and MCTPL.',
    impact: ['30+ processes digitized', 'Live at seven sites', 'Every entry has an owner, validation and an approval trail'],
  },
  {
    project: 'headcount-dashboard',
    title: 'Knowing who is on site, at every site',
    client: 'HR and site security, JSW Infrastructure',
    role: 'Requirement from HR, design, build and rollout',
    situation: 'HR came to us because they could not track manpower on site. Punch-in data existed, but nobody could see at a glance who was inside right now, and people who punched in and never punched out went unnoticed.',
    diagnosis: 'The punch-in system recorded every entry and exit, but only as raw logs. The missing pieces were a live count, a view by shift, department and contractor, and a flag for anyone still inside long after their shift.',
    options: 'Daily exports from the punch-in system reviewed by hand, a new attendance product, or a dashboard on top of the punch-in data the sites already had.',
    recommendation: 'A live dashboard on the existing punch-in system: headcount by site, shift, department and contractor, with alerts when someone has not punched out and overstay reports for HR.',
    rollout: 'Started at one site, then rolled out to all seven: DPPL, SWPL, JPL, JNPA, Keni, MCPL and MCTPL.',
    impact: ['HR sees live headcount at every site', 'Alerts for people who have not punched out', 'Overstay reports instead of manual checks', 'Live at seven sites'],
  },
  {
    project: 'rag-reporting',
    title: 'Answering operations questions in plain English',
    client: 'Port operations and management, Dharamtar',
    role: 'Design and build',
    situation: 'Questions like which equipment handled the most cargo, or which delays were most common, needed someone to pull data and build a one-off report.',
    diagnosis: 'The answers were already in the equipment and shift records. The bottleneck was getting from the question to the right query.',
    options: 'More fixed reports, a self-service BI tool, or an assistant that writes the query.',
    recommendation: 'An assistant that uses an LLM with retrieval to answer from operations data, and always shows its date range and the SQL behind the answer, so every number can be checked.',
    rollout: 'Built into PortBird, next to the reports people already use.',
    impact: ['An answer with a chart in one step', 'Every number comes with the query that produced it'],
  },
]

// LinkedIn recommendations, quoted as written (trims marked with an ellipsis).
export const testimonials = [
  {
    quote: 'His ability to understand the requirements of end users, business stakeholders, and top management is truly exceptional. … One of his standout contributions was the development of a comprehensive Management Port Dashboard, which he delivered within a tight timeline. It was not only technically sound but also strategically valuable for decision-making.',
    name: 'Sambasiva Rao Gattu',
    title: 'Head IT · Maritime Digital Transformation Leader',
    note: 'Worked together at JSW Infrastructure, Aug 2025',
  },
  {
    quote: 'What makes Shubham special is his disciplined work ethic and a go-getter attitude. He doesn’t shy away from complexity—instead, he thrives in it.',
    name: 'Manish Gupta',
    title: 'Executive Vice President, JSW Infrastructure',
    note: 'Senior colleague, Jul 2025',
  },
  {
    quote: 'Good IT resource and takes initiative to business requirements.',
    name: 'Karun Kant Dave',
    title: 'Group CEO · Infrastructure, Mining & Ports',
    note: 'Senior colleague, Oct 2026',
  },
  {
    quote: 'His contributions in digitalization, smart port technologies, and business applications are truly commendable. A self reliant developer and tester, Shubham consistently delivers quality digital solutions.',
    name: 'Arabinda Moharana',
    title: 'IT Infrastructure Head · Ports, Logistics, Oil & Gas',
    note: 'Same team, Jul 2025',
  },
]
