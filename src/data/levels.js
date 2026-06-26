export const MAX_PLAYER_LEVEL = 50;

const BASE_XP_REQUIRED = 400;
const XP_GROWTH_RATE = 1.39;

// Player level XP requirements. Early levels move quickly, while most of the
// long-term grind lives in the 35-50 range.
export const levels = Array.from({ length: MAX_PLAYER_LEVEL }, (_, index) => ({
  level: index + 1,
  xpRequired: index + 1 >= MAX_PLAYER_LEVEL
    ? Infinity
    : Math.round(BASE_XP_REQUIRED * XP_GROWTH_RATE ** index)
}));
