export const simulator = {
  console: {
    heading: 'Threat assessment',
    live: 'Live',
    attacker: 'Attacker',
    target: 'Target',
    fields: {
      attacks: 'Attacks',
      skill: 'Skill (N+)',
      strength: 'Strength',
      ap: 'AP',
      damage: 'Damage',
      toughness: 'Toughness',
      save: 'Save (N+)',
      wounds: 'Wounds',
      models: 'Models',
    },
  },
  readout: {
    meanDamage: 'Mean damage',
    modelsSlain: 'Models slain',
    atLeastOneKill: '≥1 kill',
    unitWiped: 'Unit wiped',
    takeaway:
      'The average says <m>{{mean}}</m> — but you only meet or beat it <p>{{pct}}</p> of the time. That spread is the difference between a plan and a prayer.',
  },
  chart: {
    mean: 'mean {{mean}}',
    min: '0 dmg',
    max: '{{max}} dmg',
  },
} as const
