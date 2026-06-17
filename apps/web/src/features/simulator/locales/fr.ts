export const simulator = {
  console: {
    heading: 'Évaluation de menace',
    live: 'En direct',
    attacker: 'Attaquant',
    target: 'Cible',
    fields: {
      attacks: 'Attaques',
      skill: 'Touché (N+)',
      strength: 'Force',
      ap: 'PA',
      damage: 'Dégâts',
      toughness: 'Endurance',
      save: 'Svg (N+)',
      wounds: 'PV',
      models: 'Figurines',
    },
  },
  readout: {
    meanDamage: 'Dégâts moyens',
    modelsSlain: 'Figurines tuées',
    atLeastOneKill: '≥1 mort',
    unitWiped: 'Unité anéantie',
    takeaway:
      'La moyenne annonce <m>{{mean}}</m> — mais tu ne l’atteins ou la dépasses que <p>{{pct}}</p> du temps. Cet écart, c’est la différence entre un plan et une prière.',
  },
  chart: {
    mean: 'moy. {{mean}}',
    min: '0 dég',
    max: '{{max}} dég',
  },
} as const
