const ironBaseCostPer100 = 100;

export const ammunition = [
  {
    id: "iron",
    name: "Iron Cannonballs",
    damageMultiplier: 1.0,
    purchasable: true,
    costPer100: ironBaseCostPer100,
    source: "Standard ship supplies"
  },
  {
    id: "steel",
    name: "Steel Cannonballs",
    damageMultiplier: 1.2,
    purchasable: true,
    costPer100: Math.round(ironBaseCostPer100 * 2.2),
    source: "Shop"
  },
  {
    id: "explosive",
    name: "Explosive Cannonballs",
    damageMultiplier: 1.5,
    purchasable: true,
    costPer100: Math.round(ironBaseCostPer100 * 4.5),
    source: "Shop"
  },
  {
    id: "leviathan",
    name: "Leviathan Cannonballs",
    damageMultiplier: 2.0,
    purchasable: false,
    costPer100: 0,
    source: "Future events, bosses, Doubloons"
  }
];
