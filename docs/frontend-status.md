# Frontend Status

## Implemented Frontend Systems

- Level 50 player progression with a long-tail idle XP curve.
- Fifteen-ship progression spread across the full level range.
- Six world regions with level requirements, recommended ship levels, reward multipliers, and enemy scaling.
- Active combat, idle combat, offline rewards, bosses, hull repair, and world event modifiers.
- Multi-ammo combat with selected ammo, ammo inventory, and cannon loadouts.
- Ship shop, cannon purchases, cannon upgrades, ship improvements, and port trading.
- Daily and weekly quests with rotating objectives and rewards.
- Crew upgrades, skills, talent trees, treasure digs, achievements, and save tools.
- Local save export, import, reset, and developer balance previews.

## Known Limitations

- Persistence is local-only through `localStorage`; there are no accounts or cloud saves yet.
- Save import validates only the broad save shape, then relies on frontend normalizers for compatibility.
- Economy and combat balancing are frontend data only and will need backend authority before launch.
- Developer balance tools remain visible in Settings for testing and should be gated or removed for production.

## Backend-Ready Status

The frontend vertical slice is playable and stable enough for backend integration. Current systems already read and write through a single game state reducer, which gives the backend phase a clear save payload to validate, migrate, and persist.

## Next Backend Phase

- Add authentication and account registration.
- Define server-side save schema, validation, and migration for legacy local saves.
- Implement cloud save sync and conflict handling.
- Move trusted reward, purchase, and progression validation to backend endpoints.
- Add deployment configuration, monitoring, and backup strategy.
