// Content for the Startup Guide (start.cupboard.cc), adapted from
// docs/pantry-playbook.md. Voice rules applied per docs/startup-guide-handoff.md:
// generic-church, TX-aware, no invented statutes or program names.

export interface StartupCostRow {
  item: string
  cost: string
}

export const STARTUP_COSTS: StartupCostRow[] = [
  { item: 'Food/health permit', cost: '$0 in most jurisdictions' },
  { item: 'Chest freezer or fridge', cost: '$0–$400 (ask the congregation first — someone has one in a garage)' },
  { item: 'Food handler certificates (2–3 volunteers)', cost: '$7–$10 each online' },
  { item: 'Thermometers for cold storage + a notebook for temp logs', cost: '~$20' },
  { item: 'Shelving', cost: '$0 — an existing closet or classroom' },
]

export const CORE_MODEL_PITCH = `One distribution per month, fully independent. Food comes from four free streams: direct grocer and restaurant relationships, corporate direct-donation programs, congregation and community drives, and farm/garden gleaning. No partner agency agreement, no monthly reporting to anyone, no per-pound handling fees. The only regulator is your local health authority — and in most of rural Texas, there isn't one.`

// Known TX local health authorities — examples, not an exhaustive list.
export const KNOWN_TX_LOCAL_AUTHORITIES = [
  'Austin/Travis',
  'San Antonio Metro Health',
  'Williamson County & Cities Health District',
  'Hays',
  'Comal',
  'Nueces',
  'Cameron',
  'Hidalgo',
]

export const DSHS_LOCAL_HEALTH_DIRECTORY_URL =
  'https://www.dshs.texas.gov/regional-local-health-operations/local-health-entities'

export const PERMIT_CALL_SCRIPT = `We're a church starting a monthly charitable food pantry distributing donated prepackaged food at no charge. Do we need a permit, and is there a fee waiver for charitable feeding organizations?`

export const PERMIT_VERDICT_NO_AUTHORITY = {
  headline: 'No permit likely needed',
  body: `Your area is under Texas DSHS jurisdiction. Nonprofit distribution of prepackaged food requires no permit. Keep a copy of the DSHS exemption language on file and move on.`,
}

export const PERMIT_VERDICT_HAS_AUTHORITY = {
  headline: 'One phone call to confirm',
  body: `Call your local health authority with the script below. Some Texas cities — Austin, for example — formally waive permit fees for charitable feeding organizations that distribute or repack shelf-stable food.`,
}

export const COLD_CHAIN_NOTE = `What raises the bar: refrigerated and frozen food. Handle it and you're still fine — the standard is basic cold-chain discipline, not a commercial kitchen: a thermometer in every unit, a temp log, insulated coolers for transport, and a food-handler-certified volunteer supervising. Since no food bank is doing food-safety oversight for you, this discipline is your credibility — both with the health authority and with donors.`

export const NO_ONSITE_COOKING_NOTE = `Never cook or repackage on-site. Distribute everything in its original packaging and the regulatory burden stays near zero.`

export const LIABILITY_NOTE = `The federal Bill Emerson Good Samaritan Food Donation Act — strengthened by the 2023 Food Donation Improvement Act — plus the Texas Good Faith Donor Act protect both donors and your church from liability for food donated and distributed in good faith. This is the single most useful sentence when a store manager hesitates.`

// § permit statute/program names are provisional pending a verbatim check
// against the source agency, same pattern as usda-nondiscrimination.ts.
export const PERMIT_CONTENT_VERIFIED = false

export interface SourcingProgram {
  name: string
  whatYouGet: string
  howToGetIt: string
}

export const CORPORATE_PROGRAMS: SourcingProgram[] = [
  {
    name: 'Panera Day-End Dough-Nation',
    whatYouGet: 'Unsold bread, bagels, baked goods, nightly',
    howToGetIt: 'Apply online; religious organizations explicitly eligible; commit to weekly pickup on a set night',
  },
  {
    name: "Trader Joe's Neighborhood Shares",
    whatYouGet: 'Produce, prepared entrees, bakery, proteins, dairy — ~80% perishable, high quality',
    howToGetIt: "Store-level: ask for the store's Donation Coordinator; 501(c)(3) required",
  },
  {
    name: 'Whole Foods',
    whatYouGet: 'Perishable and shelf-stable surplus via Food Donation Connection, plus store-level in-kind requests',
    howToGetIt: "Contact the local store's community giving contact",
  },
  {
    name: 'Food Donation Connection (foodtodonate.com)',
    whatYouGet: 'The clearinghouse that routes surplus from chains like Pizza Hut, Olive Garden, and other Darden/Yum brands directly to local agencies — not through Feeding America',
    howToGetIt: 'Register your pantry as a receiving agency on their site; they match you to participating restaurants near you',
  },
  {
    name: 'Chick-fil-A Shared Table',
    whatYouGet: 'Surplus food direct to local nonprofits',
    howToGetIt: 'Ask the local operator — franchisees decide locally',
  },
]

export const RURAL_REALITY_CHECK = `These are metro and suburban programs. A church in a small town may have none within 30 miles. Two answers: the streams below are rural-native, and one well-located church can hold the corporate-program relationships for a few nearby sister congregations (see "The Network Model" at the end).`

export interface ChecklistStream {
  id: string
  title: string
  items: { id: string; label: string }[]
}

export const DIRECT_RELATIONSHIPS_CHECKLIST: ChecklistStream = {
  id: 'stream-2-direct',
  title: 'Direct local relationships (rural-native)',
  items: [
    { id: 'stream2-independent-grocers', label: 'Independent grocers and small-town markets — dented cans, close-dated goods, day-old bakery' },
    { id: 'stream2-dollar-general', label: 'Dollar General / Family Dollar — ask about damaged-carton releases or a donation barrel' },
    { id: 'stream2-heb', label: 'H-E-B and chain stores — ask for what the manager controls: a donation barrel, register round-up, gift cards, community giving contact' },
    { id: 'stream2-gas-bakeries', label: 'Gas station / convenience distributors, local bakeries, tortillerias — short-dated stock on a handshake' },
  ],
}

export const CONGREGATION_DRIVES_CHECKLIST: ChecklistStream = {
  id: 'stream-3-congregation',
  title: 'Congregation and community drives (your most reliable line)',
  items: [
    { id: 'stream3-first-sunday', label: 'Standing first-Sunday collection with a printed "most needed" list' },
    { id: 'stream3-reverse-calendar', label: 'Reverse Advent / reverse Lent calendars — one item a day' },
    { id: 'stream3-drives', label: 'School canned-food drives, Scout troops, 4-H, local businesses adopting a month' },
  ],
}

export const GLEANING_CHECKLIST: ChecklistStream = {
  id: 'stream-4-gleaning',
  title: 'Farms, gardens, and gleaning',
  items: [
    { id: 'stream4-society-st-andrew', label: 'Society of St. Andrew (endhunger.org) — church-rooted gleaning network active in Texas' },
    { id: 'stream4-ampleharvest', label: 'AmpleHarvest.org — free registry connecting home gardeners with surplus produce' },
    { id: 'stream4-farmers-market', label: "Farmers market end-of-day — a volunteer with a wagon at closing time, plus a \"grow a row\" ask" },
    { id: 'stream4-ranching', label: 'Ranching communities: a processed-beef donation (via a licensed processor) is hundreds of pounds of protein' },
  ],
}

export interface ScriptCard {
  id: string
  audience: string
  when: string
  text: string
}

export const SCRIPTS: ScriptCard[] = [
  {
    id: 'script-independent-grocer',
    audience: 'Independent grocer / local market',
    when: 'In person, weekday mid-morning, ask for the owner',
    text: `Hi, I'm [name] from [Church] here in [town]. We're starting a once-a-month food pantry for local families — completely free, volunteer-run, and independent, so there's no paperwork on your end. I'm asking whether we could pick up items you'd otherwise write off — dented cans, close-dated shelf goods, day-old bakery. Same volunteer, same day each week, we handle all the lifting. You're fully protected under the federal Good Samaritan Food Donation Act and the Texas Good Faith Donor Act, and donations may be tax-deductible for the store. Could we start with one pickup a month and see how it goes?`,
  },
  {
    id: 'script-chain-store',
    audience: 'Chain store manager (H-E-B, Walmart, Brookshire\'s)',
    when: 'In person or by phone',
    text: `I know your surplus goes through [regional food bank], and I'm not asking you to change that. Three things you can do at store level would make a real difference: a donation barrel by the registers, a gift card toward our startup freezer, and pointing me to your community giving contact.`,
  },
  {
    id: 'script-local-restaurant',
    audience: 'Restaurant (local, non-chain)',
    when: 'In person or by phone',
    text: `We can't take prepared hot food, but three things would help enormously: unopened surplus stock — canned goods, dry goods, bread you won't use; a monthly "give-back night" where a percentage of sales supports the pantry; or a small flyer by your register so families know we exist.`,
  },
  {
    id: 'script-chain-restaurant',
    audience: 'Chain restaurant / bakery-cafe',
    when: 'In person or by phone',
    text: `Does your location participate in [Day-End Dough-Nation / Shared Table / Food Donation Connection]? We're a registered nonprofit pantry and we'd commit to a weekly pickup on whatever night works for your closing crew.`,
  },
]

export const CLIENT_CHOICE_NOTE = `Prefer client choice (families pick from tables) over pre-packed boxes — less prep labor, less waste, more dignity. Drive-through pre-packed works better if your volunteer corps skews older.`

export const INTAKE_NOTE = `First name, zip code, household size, on a clipboard. No IDs, no proof of need, no means testing. Track only what serves you: households served and rough pounds distributed, for your own trend line and board report.`

export const NETWORK_MODEL_TITLE = 'The Network Model'
export const NETWORK_MODEL_BODY = `Direct-donation programs cluster in metro areas; the need clusters outside them. One well-located church becomes the pickup hub — it holds the Panera, Trader Joe's, and Food Donation Connection relationships and the big freezer — and two or three nearby sister congregations run spoke distributions, driving in weekly for a share. Each spoke pantry stays independent (its own permit status, its own volunteers, its own community), but the sourcing scales like a network.`

export const CUPBOARD_ONRAMP_NOTE = `When distribution day comes, Cupboard runs your check-in — free for a single device.`
