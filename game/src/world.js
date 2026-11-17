// Game world state and update logic for NEON CYBER PULSE

import { FIELD, LIVES, PLAYER, LASER } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_SCORE = 4;
export const EVENT_SHOOT = 8;

export const KIND_DRONE = 1;
export const KIND_ENERGY = 2;

export function createWorld(rng) {
  const state = {
    player: {
      x: FIELD.width / 2 - PLAYER.width / 2,
      y: PLAYER.y,
      width: PLAYER.width,
      height: PLAYER.height,
      vx: 0,
    },
    bullets: [],
    items: [], // drones and energy nodes
    particles: [],
    score: 0,
    lives: LIVES,
    wave: 1,
    time: 0,
    shootCooldown: 0,
    spawnTimer: 0,
  };

  function reset() {
    state.player.x = FIELD.width / 2 - PLAYER.width / 2;
    state.player.y = PLAYER.y;
    state.bullets = [];
    state.items = [];
    state.particles = [];
    state.score = 0;
    state.lives = LIVES;
    state.wave = 1;
    state.time = 0;
    state.shootCooldown = 0;
    state.spawnTimer = 0;
  }

  function addExplosion(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = rng.range(0, Math.PI * 2);
      const speed = rng.range(50, 250);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rng.range(0.3, 0.7),
        maxLife: 0.7,
        color,
      });
    }
  }

  function step(dt, direction, isTitle) {
    state.time += dt;
    let events = EVENT_NONE;

    // Update player position
    if (!isTitle) {
      state.player.x = Math.min(
        FIELD.width - state.player.width,
        Math.max(0, state.player.x + direction * PLAYER.speed * dt)
      );

      // Shooting cooldown
      if (state.shootCooldown > 0) {
        state.shootCooldown -= dt;
      }
    }

    // Auto-shoot or title ambient shots
    if (!isTitle && state.shootCooldown <= 0) {
      state.bullets.push({
        x: state.player.x + state.player.width / 2 - LASER.width / 2,
        y: state.player.y,
        width: LASER.width,
        height: LASER.height,
      });
      state.shootCooldown = 0.2;
      events |= EVENT_SHOOT;
    } else if (isTitle && rng.next() < 0.05) {
      state.bullets.push({
        x: rng.range(100, FIELD.width - 100),
        y: FIELD.height,
        width: LASER.width,
        height: LASER.height,
      });
    }

    // Update bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.y += (isTitle ? -LASER.speed : -LASER.speed) * dt;
      if (b.y + b.height < 0 || b.y > FIELD.height) {
        state.bullets.splice(i, 1);
      }
    }

    // Spawn items (drones / energy)
    if (!isTitle) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        state.spawnTimer = Math.max(0.4, 1.2 - state.wave * 0.1);
        const isEnergy = rng.next() < 0.3;
        const w = isEnergy ? 28 : rng.range(36, 64);
        const h = isEnergy ? 28 : rng.range(30, 50);
        state.items.push({
          x: rng.range(50, FIELD.width - 50 - w),
          y: -h,
          width: w,
          height: h,
          kind: isEnergy ? KIND_ENERGY : KIND_DRONE,
          speed: rng.range(120, 220) + state.wave * 25,
          color: isEnergy ? '#00ffcc' : rng.next() < 0.5 ? '#ff0055' : '#ffaa00',
        });
      }
    }

    // Update items and check collisions
    for (let i = state.items.length - 1; i >= 0; i--) {
      const item = state.items[i];
      item.y += item.speed * dt;

      // Check collision with player
      if (
        !isTitle &&
        item.y + item.height > state.player.y &&
        item.y < state.player.y + state.player.height &&
        item.x + item.width > state.player.x &&
        item.x < state.player.x + state.player.width
      ) {
        if (item.kind === KIND_ENERGY) {
          state.score += 50;
          events |= EVENT_SCORE;
          addExplosion(item.x + item.width / 2, item.y + item.height / 2, '#00ffcc');
        } else {
          state.lives -= 1;
          events |= EVENT_HIT;
          addExplosion(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, '#ff0055');
          if (state.lives <= 0) {
            events |= EVENT_OVER;
          }
        }
        state.items.splice(i, 1);
        continue;
      }

      // Check collision with bullets
      let hitBullet = false;
      if (!isEnergy) {
        for (let j = state.bullets.length - 1; j >= 0; j--) {
          const b = state.bullets[j];
          if (
            b.y < item.y + item.height &&
            b.y + b.height > item.y &&
            b.x + b.width > item.x &&
            b.x < item.x + item.width
          ) {
            state.bullets.splice(j, 1);
            hitBullet = true;
            break;
          }
        }
      }

      if (hitBullet) {
        state.score += 100;
        events |= EVENT_SCORE;
        addExplosion(item.x + item.width / 2, item.y + item.height / 2, item.color);
        state.items.splice(i, 1);
        if (state.score >= state.wave * 500) {
          state.wave += 1;
        }
        continue;
      }

      // Remove off-screen items
      if (item.y > FIELD.height) {
        if (!isEnergy && !isTitle) {
          // missed drone score penalty or just pass
        }
        state.items.splice(i, 1);
      }
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    return events;
  }

  return {
    state,
    reset,
    step,
  };
}
