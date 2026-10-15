export type Prompt = {
  name: string;
  title: string;
  description: string;
  arguments: { name: string; description: string; required?: boolean }[];
  text: (args: Record<string, string>) => string;
};

export const PROMPTS: Prompt[] = [
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
