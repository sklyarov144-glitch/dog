export class InputManager {
  constructor(target = window) {
    this.target = target;
    this.actions = [];
  }

  init() {
    this.target.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'a'].includes(k)) this.actions.push('left');
      if (['arrowright', 'd'].includes(k)) this.actions.push('right');
      if (['arrowup', 'w', ' '].includes(k)) this.actions.push('jump');
      if (['arrowdown', 's'].includes(k)) this.actions.push('slide');
    });
  }

  consumeActions() {
    const out = this.actions;
    this.actions = [];
    return out;
  }
}
