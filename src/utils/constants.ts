export const BODY_COUNT_MILESTONES = [1, 5, 10, 25, 50, 69, 100, 150, 200, 250, 500];
export const NATIONALITY_MILESTONES = [5, 10, 15, 20, 30, 50];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const STI_REMINDER_DAYS = 14;

export const HOLE_TYPES = [
  { key: 'mouth', label: 'Mouth', icon: '👄' },
  { key: 'ass', label: 'Ass', icon: '🍑' },
  { key: 'pussy', label: 'Pussy', icon: '🐱' },
] as const;

export const VENUE_TYPES = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'their_place', label: 'Their Place', icon: '🏡' },
  { key: 'hotel', label: 'Hotel', icon: '🏨' },
  { key: 'airbnb', label: 'Airbnb', icon: '🛏️' },
  { key: 'car', label: 'Car', icon: '🚗' },
  { key: 'outdoors', label: 'Outdoors', icon: '🌳' },
  { key: 'club', label: 'Club/Bar', icon: '🍸' },
  { key: 'sauna', label: 'Sauna/Bath', icon: '♨️' },
  { key: 'office', label: 'Office', icon: '🏢' },
  { key: 'other', label: 'Other', icon: '📍' },
] as const;

export const EMOTION_TYPES = [
  { key: 'amazing', label: 'Amazing', icon: '🤩' },
  { key: 'great', label: 'Great', icon: '😊' },
  { key: 'good', label: 'Good', icon: '😐' },
  { key: 'meh', label: 'Meh', icon: '😕' },
  { key: 'bad', label: 'Bad', icon: '😣' },
] as const;

export const DURATION_PRESETS = [
  { key: 'quickie', label: 'Quickie', minutes: 10, icon: '⚡' },
  { key: 'short', label: '15-30m', minutes: 20, icon: '🕐' },
  { key: 'medium', label: '30-60m', minutes: 45, icon: '🕑' },
  { key: 'long', label: '1-2h', minutes: 90, icon: '🕒' },
  { key: 'marathon', label: 'Marathon', minutes: 150, icon: '🏆' },
] as const;

export const SOLO_METHODS = [
  { key: 'hand', label: 'Hand', icon: '✋' },
  { key: 'toy', label: 'Toy', icon: '🎀' },
  { key: 'fleshlight', label: 'Fleshlight', icon: '🔦' },
  { key: 'other', label: 'Other', icon: '✨' },
] as const;

export const RATING_CATEGORIES = [
  { key: 'oral_rating', label: 'Oral', icon: '👄' },
  { key: 'attractiveness_rating', label: 'Looks', icon: '🔥' },
  { key: 'chemistry_rating', label: 'Chemistry', icon: '⚡' },
  { key: 'overall_rating', label: 'Overall', icon: '⭐' },
] as const;
