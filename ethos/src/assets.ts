export type CharacterId = 'mage' | 'monk' | 'ranger' | 'warrior';

export type MoodId = 'worst' | 'bad' | 'neutral' | 'good' | 'excellent';

export type StatId = 'health' | 'intelligence' | 'mental_health' | 'strength';

export const CHARACTER_IMAGES: Record<CharacterId, any> = {
  mage: require('../assets/images/mage.svg'),
  monk: require('../assets/images/monk.svg'),
  ranger: require('../assets/images/ranger.svg'),
  warrior: require('../assets/images/warrior.svg'),
};

export const MOOD_IMAGES: Record<MoodId, any> = {
  worst: require('../assets/images/worst.svg'),
  bad: require('../assets/images/bad.svg'),
  neutral: require('../assets/images/neutral.svg'),
  good: require('../assets/images/good.svg'),
  excellent: require('../assets/images/excellent.svg'),
};

export const STAT_IMAGES: Record<StatId, any> = {
  health: require('../assets/images/health.png'),
  intelligence: require('../assets/images/intelligence.png'),
  mental_health: require('../assets/images/mental-health.png'),
  strength: require('../assets/images/strength.png'),
};
