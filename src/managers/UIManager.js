export class UIManager {
  constructor() {
    this.refs = {
      hud: document.getElementById('hud'),
      menu: document.getElementById('menu'),
      gameOver: document.getElementById('gameOver'),
      shop: document.getElementById('shop'),
      missions: document.getElementById('missions'),
      score: document.getElementById('score'),
      coins: document.getElementById('coins'),
      best: document.getElementById('best'),
    };
  }

  showOverlay(name) {
    ['menu', 'gameOver', 'shop', 'missions'].forEach((k) => this.refs[k].classList.toggle('hidden', k !== name));
  }

  setHudVisible(flag) {
    this.refs.hud.classList.toggle('hidden', !flag);
  }

  updateHud({ score, coins, best }) {
    this.refs.score.textContent = Math.floor(score);
    this.refs.coins.textContent = coins;
    this.refs.best.textContent = best;
  }
}
