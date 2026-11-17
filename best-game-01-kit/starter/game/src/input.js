// Input handler for keyboard, mouse, and touch

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SHOOT = 4;

export function createInput(canvas) {
  let left = false;
  let right = false;
  let shooting = false;
  let actions = 0;
  let pointerX = null;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') right = true;
    if (e.code === 'Space') {
      shooting = true;
      actions |= ACTION_CONFIRM | ACTION_SHOOT;
      e.preventDefault();
    }
    if (e.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      e.preventDefault();
    }
    if (e.code === 'KeyP') {
      actions |= ACTION_PAUSE;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') right = false;
    if (e.code === 'Space') shooting = false;
  });

  canvas.addEventListener('pointerdown', (e) => {
    pointerX = e.clientX;
    actions |= ACTION_CONFIRM;
  });

  canvas.addEventListener('pointermove', (e) => {
    if (pointerX !== null) {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      pointerX = x;
    }
  });

  canvas.addEventListener('pointerup', () => {
    pointerX = null;
  });

  return {
    direction() {
      if (pointerX !== null) {
        // Will be handled in world/main
        return 0;
      }
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    pointerX() {
      return pointerX;
    },
    isShooting() {
      return shooting;
    },
    takeActions() {
      const current = actions;
      actions = 0;
      return current;
    },
  };
}
