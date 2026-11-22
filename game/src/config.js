// Puerto Solano - config.js: constants, seeded RNG, mission data, helpers.
window.PS = window.PS || {};
PS.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
PS.lerp = function (a, b, t) { return a + (b - a) * t; };
PS.dist2 = function (a, b) { var dx = a.x - b.x, dz = a.z - b.z; return dx * dx + dz * dz; };
// Tiny deterministic RNG (mulberry32) - layout never uses Math.random.
PS.makeRng = function (seed) {
  var s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
PS.CFG = {
  world: 640,          // world is world x world, centred on 0
  roadEvery: 80,       // road grid spacing
  roadHalf: 9,         // half road width
  beachZ: 235,         // sand starts here, water beyond 285
  gravity: 0,
  playerSpeed: 9, runSpeed: 15,
  carAccel: 26, carMax: 46, carReverse: 14, carTurn: 1.9,
  wantedDecay: 26,     // seconds out of sight to lose a star
  colors: {
    sand: 0xe8d29a, water: 0x1b7f9e, road: 0x33373d, sidewalk: 0x9aa0a3,
    grass: 0x5da85e, palm: 0x2e8b57, trunk: 0x8a6a45
  },
  carColors: [0xd64541, 0x3a7bd5, 0xf2c230, 0xe8e8e8, 0x22262b, 0x7ac74f, 0xff7f50, 0x9b59b6]
};
// Story campaign: 10 missions, each a list of stages.
// Stage types: goto, chase, escape, delivery, shootout, tail, race, collect, escort, heist
PS.MISSIONS = [
  { name: 'First Wheels', who: 'Marisol Vega', reward: 250, intro: 'Marisol: Welcome to Puerto Solano, primo. Grab a ride and meet me at the marina.', outro: 'Marisol: Not bad. The city is yours to learn.', stages: [{ type: 'goto', x: 40, z: 250, label: 'Meet Marisol at the marina' }] },
  { name: 'Hot Delivery', who: 'Marisol Vega', reward: 400, intro: 'Marisol: This package cannot be late. Move!', outro: 'Marisol: On time. The docks remember that.', stages: [{ type: 'delivery', x: -160, z: -80, time: 75, label: 'Deliver the package to the warehouse' }] },
  { name: 'Ram the Rat', who: 'Diego Solano', reward: 550, intro: 'Diego: A rat is fleeing in a red sedan. Ram him until he stops.', outro: 'Diego: He will talk. They always talk.', stages: [{ type: 'chase', label: 'Ram the fleeing red sedan' }] },
  { name: 'Heat Check', who: 'Diego Solano', reward: 600, intro: 'Diego: The SPPD saw too much. Lose them.', outro: 'Diego: Ghost. Just how I like it.', stages: [{ type: 'escape', stars: 3, label: 'Escape the SPPD (lose your wanted level)' }] },
  { name: 'Dockside Lead', who: 'Captain Ruiz', reward: 800, intro: 'Ruiz: The Coral gang is loading at the docks. Clear them out.', outro: 'Ruiz: The docks breathe again tonight.', stages: [{ type: 'shootout', x: 160, z: 250, count: 4, label: 'Clear the Coral gang at the docks' }] },
  { name: 'Quiet Tail', who: 'Marisol Vega', reward: 750, intro: 'Marisol: Follow the courier. Close, but never seen.', outro: 'Marisol: Now we know where the money sleeps.', stages: [{ type: 'tail', label: 'Tail the courier without being spotted' }] },
  { name: 'Bay Run', who: 'Diego Solano', reward: 900, intro: 'Diego: Hit every checkpoint before the clock dies.', outro: 'Diego: Fastest ghost on the bay.', stages: [{ type: 'race', time: 90, label: 'Bay Run: hit all checkpoints in time' }] },
  { name: 'Lost Cargo', who: 'Captain Ruiz', reward: 850, intro: 'Ruiz: Three crates fell off a truck across the city. Recover them.', outro: 'Ruiz: Every crate accounted for.', stages: [{ type: 'collect', count: 3, label: 'Recover the lost cargo crates' }] },
  { name: 'Safe Passage', who: 'Marisol Vega', reward: 1100, intro: 'Marisol: Escort my cousin to the hill suburb. Keep her car alive.', outro: 'Marisol: Family owes you now.', stages: [{ type: 'escort', x: -240, z: -240, label: 'Escort the blue sedan to the hill suburb' }] },
  { name: 'The Solano Heist', who: 'The Crew', reward: 3000, intro: 'Crew: Tonight we take the port vault. Three stages. No mistakes.', outro: 'Crew: PUERTO SOLANO IS OURS. Story complete - free roam unlocked!', stages: [{ type: 'goto', x: 200, z: 200, label: 'Heist 1/3: Reach the port vault' }, { type: 'shootout', x: 200, z: 200, count: 5, label: 'Heist 2/3: Hold the vault against the Coral gang' }, { type: 'escape', stars: 4, label: 'Heist 3/3: Escape with the take - lose the SPPD' }] }
];
PS.RADIO = [
  { name: 'SOLANO FM', root: 220, mode: [0, 3, 5, 7] },
  { name: 'BAY BASS 98.1', root: 110, mode: [0, 2, 3, 7] },
  { name: 'NOCHE LATINA', root: 196, mode: [0, 4, 7, 9] }
];
PS.KEYS = {};
window.addEventListener('keydown', function (e) { PS.KEYS[e.code] = true; });
window.addEventListener('keyup', function (e) { PS.KEYS[e.code] = false; });
PS.key = function (c) { return !!PS.KEYS[c]; };
