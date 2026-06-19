// Central registry for public image assets.
// Paths stay in /public/assets so future UI work can reference them consistently.

export const LOGO = "/assets/logo/LOGO.png";

export const SCENES = {
  dashboard: "/assets/scenes/Captains_Cabin.png",
  battle: "/assets/scenes/Battle_Board.png",
  harbour: "/assets/scenes/Harbour.png",
  shipyard: "/assets/scenes/Shipyard.png",
  treasure: "/assets/scenes/Treasure_Vault.png",
  academy: "/assets/scenes/Crew_Academy.png",
  achievements: "/assets/scenes/Hall_of_Legends.png"
};

export const SHIP_IMAGES = {
  // The ship art is named by level, so the registry follows the same numbering.
  1: "/assets/ships/Level_01.png",
  2: "/assets/ships/Level_02.png",
  3: "/assets/ships/Level_03.png",
  4: "/assets/ships/Level_04.png",
  5: "/assets/ships/Level_05.png",
  6: "/assets/ships/Level_06.png",
  7: "/assets/ships/Level_07.png",
  8: "/assets/ships/Level_08.png",
  9: "/assets/ships/Level_09.png",
  10: "/assets/ships/Level_10.png",
  11: "/assets/ships/Level_11.png",
  12: "/assets/ships/Level_12.png",
  13: "/assets/ships/Level_13.png",
  14: "/assets/ships/Level_14.png",
  15: "/assets/ships/Level_15.png"
};

export const ENEMY_IMAGES = {
  driftingWreck: "/assets/enemies/Enemy_Drifting_Wreck.png",
  smugglerCutter: "/assets/enemies/Enemy_Smuggler_Cutter.png",
  raiderBrig: "/assets/enemies/Enemy_Raider_Brig.png",
  navalFrigate: "/assets/enemies/Enemy_Naval_Frigate.png",
  cursedWarship: "/assets/enemies/Enemy_Cursed_Warship.png"
};

export const SKILL_ICONS = {
  navigation: "/assets/skills/Skill_Navigation.png",
  fishing: "/assets/skills/Skill_Fishing.png",
  treasure: "/assets/skills/Skill_Treasure_Hunting.png",
  trading: "/assets/skills/Skill_Trading.png",
  gunnery: "/assets/skills/Skill_Gunnery.png",
  shipwright: "/assets/skills/Skill_Shipwright.png"
};

export const SKILL_ICON_ALIASES = {
  treasureHunting: SKILL_ICONS.treasure
};

export const TALENT_ICONS = {
  hairTrigger: null,
  powderKegs: "/assets/talents/firepower/Talent_Firepower_Powder_Kegs.png",
  deadEye: "/assets/talents/firepower/Talent_Firepower_Dead_Eye.png",
  powderMiser: null,
  killingBlow: "/assets/talents/firepower/Talent_Firepower_Killing_Blow.png",
  broadsideMaster: "/assets/talents/firepower/Talent_Firepower_Broadside_Master.png",
  ironHull: "/assets/talents/seamanship/Talent_Seamanship_Iron_Hull.png",
  shipsSurgeon: null,
  nightWatch: "/assets/talents/seamanship/Talent_Seamanship_Night_Watch.png",
  skeletonCrew: null,
  ghostShip: "/assets/talents/seamanship/Talent_Seamanship_Ghost_Ship.png",
  plunderersEye: "/assets/talents/fortune/Talent_Fortune_Plunderers_Eye.png",
  saltAndKnowledge: "/assets/talents/seamanship/Talent_Seamanship_Salt_and_Knowledge.png",
  chestSeeker: "/assets/talents/fortune/Talent_Fortune_Chest_Seeker.png",
  merchantsTouch: "/assets/talents/fortune/Talent_Fortune_Merchants_Touch.png",
  tradeWind: "/assets/talents/fortune/Talent_Fortune_Trade_Wind.png",
  legendsShare: null
};

export const RESOURCE_ICONS = {
  fish: "/assets/resources/Resource_Fish.png",
  whaleOil: "/assets/resources/Resource_Whale_Oil.png",
  navigationCharts: "/assets/resources/Resource_Navigation_Charts.png",
  compassFragments: "/assets/resources/Resource_Compass_Fragments.png",
  gunpowder: "/assets/resources/Resource_Gunpowder.png",
  cannonParts: "/assets/resources/Resource_Cannon_Parts.png",
  ancientRelics: "/assets/resources/Resource_Ancient_Relics.png",
  tradeContracts: "/assets/resources/Resource_Trade_Contracts.png",
  tradeSeals: "/assets/resources/Resource_Trade_Seals.png",
  rareMapPiece: "/assets/resources/Resource_Rare_Map_Piece.png"
};

export const CANNON_IMAGES = {
  1: "/assets/cannons/Cannon_Tier_01_Iron.png",
  2: "/assets/cannons/Cannon_Tier_02_Steel.png",
  3: "/assets/cannons/Cannon_Tier_03_Silver.png",
  4: "/assets/cannons/Cannon_Tier_04_Golden.png",
  5: "/assets/cannons/Cannon_Tier_05_Diamond.png",
  6: "/assets/cannons/Cannon_Tier_06_Leviathan.png"
};

export const UI_ICONS = {
  gold: "/assets/ui/UI_Gold.png",
  xp: "/assets/ui/UI_XP.png",
  hull: "/assets/ui/UI_Hull.png",
  cannonballs: "/assets/ui/UI_Cannonballs.png",
  treasureMaps: "/assets/ui/UI_Treasure_Maps.png",
  talentPoints: "/assets/ui/UI_Talent_Points.png"
};

export const UI_GOLD = UI_ICONS.gold;
export const UI_XP = UI_ICONS.xp;
export const UI_HULL = UI_ICONS.hull;
export const UI_CANNONBALLS = UI_ICONS.cannonballs;
export const UI_TREASURE_MAPS = UI_ICONS.treasureMaps;
export const UI_TALENT_POINTS = UI_ICONS.talentPoints;

export function getAsset(path, fallback = "") {
  return typeof path === "string" && path ? path : fallback;
}
