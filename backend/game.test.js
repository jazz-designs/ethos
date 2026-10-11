'use strict';

const assert = require('assert');
const { xpNeeded, applyXp, characterLevel, defaultState } = require('./game');

// ── xpNeeded ────────────────────────────────────────────────────────────
console.log('Testing xpNeeded...');
assert.strictEqual(xpNeeded(1), 100, 'L1→2 = 100');
assert.strictEqual(xpNeeded(2), 115, 'L2→3 = 115');
assert.strictEqual(xpNeeded(3), 132, 'L3→4 = 132');
assert.strictEqual(xpNeeded(5), Math.round(100 * Math.pow(1.15, 4)), 'L5→6');
assert.strictEqual(xpNeeded(10), Math.round(100 * Math.pow(1.15, 9)), 'L10→11');
console.log('  ✓ xpNeeded OK');

// ── Single level-up ─────────────────────────────────────────────────────
console.log('Testing single level-up...');
// Level 1, 0 XP, score +10 = 100 XP → exactly reaches L2
const r1 = applyXp('strength', 1, 0, 10);
assert.strictEqual(r1.level, 2);
assert.strictEqual(r1.xp, 0);
assert.strictEqual(r1.xpChange, 100);
assert.deepStrictEqual(r1.levelUps, [{ stat: 'strength', newLevel: 2 }]);

// Level 1, 90 XP, score +10 → 190 XP → L2 (190-100=90, 90<115)
const r2 = applyXp('health', 1, 90, 10);
assert.strictEqual(r2.level, 2);
assert.strictEqual(r2.xp, 90);
assert.strictEqual(r2.levelUps.length, 1);
console.log('  ✓ single level-up OK');

// ── Multi level-up ──────────────────────────────────────────────────────
console.log('Testing multi level-up...');
// Level 1, 200 XP (artificial), score +5 = 50 → total 250
// 250 ≥ 100 → L2, xp=150  |  150 ≥ 115 → L3, xp=35  |  35 < 132 → stop
const r3 = applyXp('intelligence', 1, 200, 5);
assert.strictEqual(r3.level, 3);
assert.strictEqual(r3.xp, 35);
assert.strictEqual(r3.levelUps.length, 2);
assert.deepStrictEqual(r3.levelUps[0], { stat: 'intelligence', newLevel: 2 });
assert.deepStrictEqual(r3.levelUps[1], { stat: 'intelligence', newLevel: 3 });
console.log('  ✓ multi level-up OK');

// ── Negative XP floor ───────────────────────────────────────────────────
console.log('Testing negative XP floor...');
// Level 2, 50 XP, score -10 = -100 → 50-100=-50 → clamp to 0, stay L2
const r4 = applyXp('mental_health', 2, 50, -10);
assert.strictEqual(r4.level, 2, 'level must not decrease');
assert.strictEqual(r4.xp, 0, 'xp floors at 0');
assert.strictEqual(r4.levelUps.length, 0);

// Level 1, 0 XP, score -5 → 0-50=-50 → clamp to 0
const r5 = applyXp('strength', 1, 0, -5);
assert.strictEqual(r5.level, 1);
assert.strictEqual(r5.xp, 0);

// Partial wipe: Level 3, 80 XP, score -3 = -30 → 80-30=50 → stays L3, xp=50
const r6 = applyXp('health', 3, 80, -3);
assert.strictEqual(r6.level, 3);
assert.strictEqual(r6.xp, 50);
console.log('  ✓ negative XP floor OK');

// ── characterLevel ──────────────────────────────────────────────────────
console.log('Testing characterLevel...');
const state = defaultState();
assert.strictEqual(characterLevel(state.stats), 1, 'default = 1');

state.stats.health.level = 3;
state.stats.strength.level = 2;
state.stats.intelligence.level = 4;
state.stats.mental_health.level = 3;
// (3+2+4+3)/4 = 3.0 → floor = 3
assert.strictEqual(characterLevel(state.stats), 3);
console.log('  ✓ characterLevel OK');

// ── No level-up on zero score ───────────────────────────────────────────
console.log('Testing zero score...');
const r7 = applyXp('health', 1, 50, 0);
assert.strictEqual(r7.level, 1);
assert.strictEqual(r7.xp, 50);
assert.strictEqual(r7.xpChange, 0);
assert.strictEqual(r7.levelUps.length, 0);
console.log('  ✓ zero score OK');

console.log('\n✅ All tests passed!');
