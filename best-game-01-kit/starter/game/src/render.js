// Renderer for NEON CYBER PULSE

import { FIELD } from './config.js';
import { KIND_ENERGY } from './world.js';

export const SCREEN_TITLE = 1;
export const SCREEN_PLAY = 2;
export const SCREEN_PAUSED = 3;
export const SCREEN_OVER = 4;

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');

  function drawGrid(time) {
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offsetY = (time * 30) % gridSize;

    for (let x = 0; x <= FIELD.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD.height);
      ctx.stroke();
    }
    for (let y = offsetY; y <= FIELD.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
      ctx.stroke();
    }
  }

  function drawPlayer(player) {
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height - 8);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBullet(b) {
    ctx.save();
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.restore();
  }

  function drawItem(item) {
    ctx.save();
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = item.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    if (item.kind === KIND_ENERGY) {
      ctx.beginPath();
      ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
    }
    ctx.restore();
  }

  function drawParticles(particles) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      ctx.restore();
    }
  }

  function drawHUD(state, best) {
    ctx.save();
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE: ${state.score}`, 30, 40);
    ctx.fillText(`BEST: ${best}`, 220, 40);
    ctx.fillText(`WAVE: ${state.wave}`, FIELD.width - 160, 40);

    // Lives
    ctx.fillStyle = '#ff0055';
    ctx.fillText('LIVES:', FIELD.width - 320, 40);
    for (let i = 0; i < state.lives; i++) {
      ctx.beginPath();
      ctx.arc(FIELD.width - 250 + i * 24, 34, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(state, screen, best) {
    drawGrid(state.time);
    drawParticles(state.particles);

    for (let i = 0; i < state.items.length; i++) {
      drawItem(state.items[i]);
    }
    for (let i = 0; i < state.bullets.length; i++) {
      drawBullet(state.bullets[i]);
    }

    if (screen !== SCREEN_TITLE) {
      drawPlayer(state.player);
      drawHUD(state, best);
    }

    if (screen === SCREEN_TITLE) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 8, 16, 0.85)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);

      ctx.textAlign = 'center';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 25;
      ctx.font = 'bold 56px monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('NEON CYBER PULSE', FIELD.width / 2, FIELD.height / 2 - 40);

      ctx.shadowColor = '#ff0055';
      ctx.font = '20px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PRESS SPACE OR CLICK TO START', FIELD.width / 2, FIELD.height / 2 + 30);
      ctx.fillText('A/D or ARROWS to Move | Auto-Shooting Enabled', FIELD.width / 2, FIELD.height / 2 + 75);
      ctx.restore();
    } else if (screen === SCREEN_PAUSED) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 8, 16, 0.7)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);

      ctx.textAlign = 'center';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2);
      ctx.font = '18px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Press P or Space to Resume', FIELD.width / 2, FIELD.height / 2 + 50);
      ctx.restore();
    } else if (screen === SCREEN_OVER) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 8, 16, 0.85)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);

      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 25;
      ctx.font = 'bold 48px monospace';
      ctx.fillStyle = '#ff0055';
      ctx.fillText('GAME OVER', FIELD.width / 2, FIELD.height / 2 - 50);

      ctx.shadowColor = '#00f0ff';
      ctx.font = '24px monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`FINAL SCORE: ${state.score}`, FIELD.width / 2, FIELD.height / 2 + 10);
      ctx.font = '18px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Press Space or Click to Restart', FIELD.width / 2, FIELD.height / 2 + 60);
      ctx.restore();
    }
  }

  return {
    draw,
  };
}
