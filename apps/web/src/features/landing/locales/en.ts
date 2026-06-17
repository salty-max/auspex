export const landing = {
  hero: {
    eyebrow: 'Tactical combat augury',
    title: 'Win the fight before the dice hit the table.',
    subtitle:
      'Auspex computes the exact math behind any Warhammer 40,000 attack, builds and prices your army, and tells you what actually wins — no guesswork.',
    cta: 'Launch the simulator',
  },
  features: {
    label: 'Augur capabilities',
    heading: 'Out-think the table.',
    exact: {
      title: 'Exact to the decimal',
      body: 'Every keyword, re-roll and point of overkill in the 10th-edition attack sequence, resolved exactly — the full picture, never a sample.',
    },
    factions: {
      title: '{{count}} factions, battle-ready',
      body: 'Every faction imported from community data, validated and costed. Point any weapon at any target.',
    },
    builder: {
      title: 'Build & price your army',
      body: 'Pick units with keyword filters, write lists as plain text, and resolve them end to end. (Coming soon.)',
    },
    save: {
      title: 'Save and share your lists',
      body: 'Create an account to store your army lists, refine them, and simulate your whole force.',
    },
  },
  cta: {
    label: 'Engage',
    title: 'Ready to scan the battlefield?',
    body: 'Jump into the simulator — no account needed. Create one when you want to save your lists.',
    button: 'Launch the simulator',
  },
} as const
