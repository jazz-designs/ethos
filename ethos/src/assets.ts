import { CharacterType, MoodType, StatName } from './types';

export const CHARACTER_IMAGES: Record<CharacterType, any> = {
  ch_1: require('../assets/images/ch-1.png'),
  ch_2: require('../assets/images/ch-2.png'),
  ch_3: require('../assets/images/ch-3.png'),
  ch_4: require('../assets/images/ch-4.png'),
};

export const CHARACTER_INFO: Record<
  CharacterType,
  { name: string; title: string; desc: string; bgTint: string }
> = {
  ch_1: {
    name: 'Ren',
    title: 'Street Wanderer',
    desc: 'White waves, headphones, oversized sweater and baggy cargo pants',
    bgTint: '#F7F8FA',
  },
  ch_2: {
    name: 'Luna',
    title: 'Shadow Rebel',
    desc: 'Pink hair, dark ribbons, crop top, platform sneakers and straps',
    bgTint: '#FDF2F4',
  },
  ch_3: {
    name: 'Maya',
    title: 'Cozy Scholar',
    desc: 'Wavy brown hair, round glasses, headphones and knit sweater',
    bgTint: '#F6F8F6',
  },
  ch_4: {
    name: 'Kai',
    title: 'Midnight Ace',
    desc: 'Dark curls, silver chain, star windbreaker jacket and cargo pants',
    bgTint: '#F4F5F7',
  },
};

export const MOOD_IMAGES: Record<MoodType, any> = {
  worst: require('../assets/images/worst.svg'),
  bad: require('../assets/images/bad.svg'),
  neutral: require('../assets/images/neutral.svg'),
  good: require('../assets/images/good.svg'),
  excellent: require('../assets/images/excellent.svg'),
};

export const STAT_IMAGES: Record<StatName, any> = {
  health: require('../assets/images/health.png'),
  intelligence: require('../assets/images/intelligence.png'),
  mental_health: require('../assets/images/mental-health.png'),
  physique: require('../assets/images/strength.png'),
};

export const ACTIVITY_IMAGES = {
  workout: require('../assets/images/workout.jpg'),
  dance: require('../assets/images/dance.jpg'),
  couch: require('../assets/images/couch.jpg'),
  first: require('../assets/images/first.jpg'),
};

