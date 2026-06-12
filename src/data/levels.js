// Player level XP requirements. Level 1 starts at 1000 XP and doubles each level.
export const levels = Array.from({ length: 15 }, (_, index) => ({
  level: index + 1,
  xpRequired: 1000 * 2 ** index
}));
