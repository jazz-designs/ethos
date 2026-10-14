import { xpNeeded, applyXp, characterLevel, defaultState, deriveState } from './game';
import { createBackupJson } from './storage';

function strictEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Assertion failed: expected ${expected}, got ${actual}`);
  }
}

console.log('Testing ethos/src/game.ts client XP math...');

// 1. xpNeeded
strictEqual(xpNeeded(1), 100);
strictEqual(xpNeeded(2), 115);
strictEqual(xpNeeded(3), 132);
strictEqual(xpNeeded(5), Math.round(100 * Math.pow(1.15, 4)));

// 2. applyXp single level up
const r1 = applyXp('health', 1, 0, 10);
strictEqual(r1.level, 2);
strictEqual(r1.xp, 0);
strictEqual(r1.xpChange, 100);
strictEqual(r1.levelUps.length, 1);

// 3. applyXp multi level up
const r2 = applyXp('intelligence', 1, 200, 5);
strictEqual(r2.level, 3);
strictEqual(r2.xp, 35);
strictEqual(r2.levelUps.length, 2);

// 4. Negative XP floor at 0
const r3 = applyXp('strength', 2, 50, -10);
strictEqual(r3.level, 2, 'Level must never decrease');
strictEqual(r3.xp, 0, 'XP floors at 0');

// 5. characterLevel
const st = defaultState();
strictEqual(characterLevel(st.stats), 1);
st.stats.health.level = 3;
st.stats.strength.level = 2;
st.stats.intelligence.level = 4;
st.stats.mental_health.level = 3;
strictEqual(characterLevel(st.stats), 3);

// 6. Backup envelope creation
console.log('Testing backup serialization & validation...');
const stateForExport = deriveState(st);
const json = createBackupJson(stateForExport);
if (!json.includes('"appName": "Ethos"') || !json.includes('"schemaVersion": 1')) {
  throw new Error('Backup json serialization failed');
}

console.log('✅ All ethos client math and backup tests passed successfully!');
