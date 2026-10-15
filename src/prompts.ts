export type Prompt = {
  name: string;
  title: string;
  description: string;
  arguments: { name: string; description: string; required?: boolean }[];
  text: (args: Record<string, string>) => string;
};

export const PROMPTS: Prompt[] = [
  {
    name: "build_private_website",
    title: "Build my own private website",
    description: "Create the dealer's own website, with Wheewise as its backend: live vehicles, enquiries and test-drive requests, no database needed.",
    arguments: [
      { name: "domain", description: "The website address, e.g. https://myshop.com (add http://localhost:3000 while building)." },
      { name: "framework", description: "What to build it with, e.g. plain HTML, Astro, Next.js. Default: the simplest that works." },
      { name: "style", description: "The look you want, e.g. premium, friendly, bold." },
    ],
    text: ({ domain, framework, style }) =>
      [
        "Build my shop's own private website. Wheewise is its backend: it supplies my live vehicles and receives enquiries and test-drive requests, so the website needs no database of its own.",
        "1. Call get_shop and get_site_api. Read the OpenAPI description at openapi_url for every field.",
        "2. If there is no site key, call rotate_site_key. Then call set_site_allowed_origins with " + (domain ? domain : "the website address I give you") + " (and http://localhost:3000 for local development).",
        `3. Build the website${framework ? " with " + framework : ""}${style ? ` in a ${style} style` : ""}: a home page with the shop's name, about text, hours and address; a vehicles page with search and filters from GET /vehicles; a page per vehicle from GET /vehicles/{id} with all photos, specs, price and an EMI estimate when finance_available is true; an enquiry form and a test-drive form (vehicle, date and time in the future) that POST to /leads, each with the hidden spam-trap field named website; a clear success and error message.`,
        "4. Use the site key in the website's code (it is safe there). Never use my assistant token in the website.",
        "5. Make it fast and mobile-first: lazy-load images, show the first vehicle photo as the card image, and cache the vehicle list briefly.",
        "6. Show me how to run and publish it. When it is live, check that a test enquiry arrives (list_leads) and tell me.",
      ].join("\n"),
  },
  {
    name: "build_my_website",
    title: "Build my shop website",
    description: "Pick a template and write the text for the shop's own website.",
    arguments: [{ name: "style", description: "The feel you want, e.g. premium, friendly, bold." }],
    text: ({ style }) =>
      [
        "Help me build my shop's own website on Wheewise.",
        "1. Call get_shop to see the current template, text and address.",
        `2. Recommend one of the available templates${style ? ` that suits a "${style}" feel` : ""} and explain the choice in one sentence.`,
        "3. Draft a short 'about the shop' text (under 500 characters) and opening hours from what you know about the shop. Show me the draft.",
        "4. Only after I approve, call update_website with the template and text. Tell me the website address when it is saved.",
      ].join("\n"),
  },
  {
    name: "daily_briefing",
    title: "Daily shop briefing",
    description: "What needs attention today: new chats, test drives, leads, reviews and old stock.",
    arguments: [],
    text: () =>
      [
        "Give me a short briefing on my shop for today.",
        "Use shop_summary, list_enquiries, list_test_drives (REQUESTED), list_leads and list_reviews.",
        "List only what needs action, most urgent first: unanswered buyer chats, test drives waiting for confirmation, new website leads, reviews without a reply, and stock older than 90 days.",
        "Do not change anything; suggest actions and ask me before doing them.",
      ].join("\n"),
  },
];
