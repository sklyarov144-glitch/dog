import { gameConfig } from '../config/gameConfig.js';
import { SaveManager } from '../managers/SaveManager.js';
import { InputManager } from '../managers/InputManager.js';
import { UIManager } from '../managers/UIManager.js';
import { YandexGamesManager } from '../managers/YandexGamesManager.js';
import { PerformanceManager } from '../managers/PerformanceManager.js';
import { PlayerController } from '../game/PlayerController.js';
import { LaneSystem } from '../game/LaneSystem.js';
import { ProgressionManager } from '../game/ProgressionManager.js';

export class App {
  constructor() {
    this.saveManager = new SaveManager();
    this.inputManager = new InputManager(window);
    this.ui = new UIManager();
    this.yandex = new YandexGamesManager();
    this.performance = new PerformanceManager();

    this.save = this.saveManager.load();
    this.lanes = new LaneSystem(gameConfig.lanes);
    this.player = new PlayerController(gameConfig.player);
    this.progression = new ProgressionManager();

    this.state = 'menu';
    this.score = 0;
    this.runCoins = 0;
    this.time = 0;
    this.lastTs = 0;
  }

  async init() {
    this.bindUi();
    this.inputManager.init();
    await this.yandex.init();
    this.ui.showOverlay('menu');
    this.ui.updateHud({ score: 0, coins: this.save.coins, best: this.save.best });
    requestAnimationFrame((ts) => this.loop(ts));
  }

  bindUi() {
    document.getElementById('playBtn').onclick = () => this.startRun();
    document.getElementById('restartBtn').onclick = () => this.startRun();
    document.getElementById('homeBtn').onclick = () => this.toMenu();
  }

  startRun() {
    this.state = 'play';
    this.score = 0;
    this.runCoins = 0;
    this.time = 0;
    this.player = new PlayerController(gameConfig.player);
    this.ui.setHudVisible(true);
    this.ui.showOverlay('none');
  }

  toMenu() {
    this.state = 'menu';
    this.ui.setHudVisible(false);
    this.ui.showOverlay('menu');
  }

  loop(ts) {
    const dt = Math.min(0.033, (ts - this.lastTs) / 1000 || 0);
    this.lastTs = ts;

    if (this.state === 'play') {
      this.time += dt;
      const actions = this.inputManager.consumeActions();
      this.player.applyActions(actions);
      this.player.update(dt, this.lanes.lanes);
      const speed = this.progression.getSpeed(this.time, gameConfig.difficulty);
      this.score += dt * speed * 10;

      this.ui.updateHud({
        score: this.score,
        coins: this.save.coins + this.runCoins,
        best: this.save.best,
      });
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}
