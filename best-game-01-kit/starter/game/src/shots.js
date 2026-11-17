// Screenshot staging for ?shot=start|early|mid|end

import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_OVER, KIND_DRONE } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = 1 / 30;
const DIRECTIONS = [0, -1, 1];
const MARGIN = 10;

function timeToHit(state, direction, horizon) {
  const player = state.player;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const x = Math.min(FIELD.width - player.width, Math.max(0, player.x + direction * PLAYER.speed * t));
    for (let index = 0; index < state.items.length; index += 1) {
      const item = state.items[index];
      if (item.kind === KIND_DRONE) {
        const y = item.y + item.speed * t;
        if (y + item.height > player.y && y < player.y + player.height && item.x < x + player.width + MARGIN && item.x + item.width > x - MARGIN) return t;
      }
    }
  }
  return Infinity;
}

function autopilot(state, horizon) {
  const player = state.player;
  let targetItem = null;
  for (let index = 0; index < state.items.length; index += 1) {
    const item = state.items[index];
    if (targetItem === null || item.y > targetItem.y) targetItem = item;
  }
  const target = targetItem === null ? FIELD.width / 2 : targetItem.x + targetItem.width / 2;
  const centre = player.x + player.width / 2;
  const wanted = target > centre + 8 ? 1 : target < centre - 8 ? -1 : 0;
  let best = wanted;
  let bestTime = timeToHit(state, wanted, horizon);
  for (let index = 0; index < DIRECTIONS.length; index += 1) {
    const time = timeToHit(state, DIRECTIONS[index], horizon);
    if (time > bestTime) {
      bestTime = time;
      best = DIRECTIONS[index];
    }
  }
  return best;
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'early') {
    for (let i = 0; i < 40; i++) world.step(STEP, 0, false);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'mid') {
    for (let i = 0; i < 120; i++) world.step(STEP, autopilot(world.state, 0.5), false);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    for (let i = 0; i < 300; i++) {
      if (world.step(STEP, autopilot(world.state, 0.2), false) & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  // default 'start'
  for (let i = 0; i < 30; i++) world.step(STEP, 0, true);
  return { screen: SCREEN_TITLE, best: 0 };
}
