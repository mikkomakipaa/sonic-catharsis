import { EmotionToGenreMapping } from '@/types';

// Emotion to Metal Subgenre Mapping
export const emotionToMetalMapping: EmotionToGenreMapping = {
  // Happy/Positive Emotions
  happy: {
    primary: ['power', 'folk', 'symphonic'],
    secondary: ['progressive', 'thrash'],
    keywords: ['uplifting', 'energetic', 'triumphant', 'celebration', 'joy']
  },
  content: {
    primary: ['progressive', 'symphonic'],
    secondary: ['power', 'folk'],
    keywords: ['satisfied', 'peaceful', 'balanced', 'harmony']
  },
  focused: {
    primary: ['progressive', 'death'],
    secondary: ['thrash', 'black'],
    keywords: ['concentrated', 'intense', 'precision', 'technical']
  },
  relaxed: {
    primary: ['doom', 'progressive'],
    secondary: ['symphonic', 'folk'],
    keywords: ['calm', 'peaceful', 'slow', 'meditative']
  },
  excited: {
    primary: ['thrash', 'power'],
    secondary: ['industrial', 'nu-metal'],
    keywords: ['energetic', 'fast', 'intense', 'pumped']
  },

  // Sad/Low Energy Emotions
  sad: {
    primary: ['doom', 'black', 'symphonic'],
    secondary: ['progressive', 'folk'],
    keywords: ['melancholy', 'grief', 'sorrow', 'despair', 'loss']
  },
  disappointed: {
    primary: ['doom', 'progressive'],
    secondary: ['symphonic', 'black'],
    keywords: ['letdown', 'unfulfilled', 'regret', 'melancholic']
  },
  bored: {
    primary: ['progressive', 'doom'],
    secondary: ['symphonic', 'industrial'],
    keywords: ['monotonous', 'unstimulated', 'repetitive', 'slow']
  },
  lonely: {
    primary: ['black', 'doom'],
    secondary: ['symphonic', 'progressive'],
    keywords: ['isolated', 'solitude', 'empty', 'longing']
  },
  tired: {
    primary: ['doom', 'progressive'],
    secondary: ['symphonic', 'folk'],
    keywords: ['exhausted', 'weary', 'slow', 'heavy']
  },
  inconsolable: {
    primary: ['black', 'doom'],
    secondary: ['death', 'symphonic'],
    keywords: ['devastated', 'heartbroken', 'overwhelming sadness']
  },

  // Angry/High Energy Emotions
  angry: {
    primary: ['thrash', 'death', 'black'],
    secondary: ['industrial', 'nu-metal'],
    keywords: ['aggressive', 'furious', 'rage', 'violent', 'intense']
  },
  enraged: {
    primary: ['death', 'black', 'thrash'],
    secondary: ['industrial', 'nu-metal'],
    keywords: ['furious', 'violent', 'explosive', 'extreme']
  },
  frustrated: {
    primary: ['thrash', 'nu-metal'],
    secondary: ['industrial', 'death'],
    keywords: ['irritated', 'blocked', 'annoyed', 'aggressive']
  },
  terrified: {
    primary: ['black', 'death'],
    secondary: ['doom', 'symphonic'],
    keywords: ['fear', 'horror', 'panic', 'dread', 'terror']
  },
  hysterical: {
    primary: ['black', 'death', 'industrial'],
    secondary: ['thrash', 'nu-metal'],
    keywords: ['uncontrolled', 'chaotic', 'extreme', 'overwhelming']
  },

  // Calm/Neutral Emotions
  calm: {
    primary: ['progressive', 'symphonic'],
    secondary: ['doom', 'folk'],
    keywords: ['peaceful', 'balanced', 'contemplative', 'steady']
  },
  worried: {
    primary: ['progressive', 'black'],
    secondary: ['doom', 'symphonic'],
    keywords: ['anxious', 'concerned', 'uneasy', 'troubled']
  },
  nervous: {
    primary: ['black', 'progressive'],
    secondary: ['thrash', 'industrial'],
    keywords: ['anxious', 'restless', 'agitated', 'tense']
  },
  energetic: {
    primary: ['thrash', 'power'],
    secondary: ['folk', 'industrial'],
    keywords: ['dynamic', 'vigorous', 'lively', 'powerful']
  },
  silly: {
    primary: ['nu-metal', 'folk'],
    secondary: ['industrial', 'power'],
    keywords: ['playful', 'humorous', 'lighthearted', 'fun']
  }
};

export const metalGenreDescriptions = {
  death: 'Extreme metal with growled vocals and complex riffing',
  black: 'Atmospheric extreme metal with raw, dark themes',
  power: 'Melodic metal with soaring vocals and fantasy themes',
  doom: 'Slow, heavy metal with melancholic atmosphere',
  thrash: 'Fast, aggressive metal with precise rhythms',
  progressive: 'Complex, experimental metal with varied song structures',
  symphonic: 'Metal combined with orchestral arrangements',
  folk: 'Metal incorporating traditional folk instruments and melodies',
  industrial: 'Metal with electronic and mechanical elements',
  'nu-metal': 'Alternative metal with hip-hop and electronic influences'
};