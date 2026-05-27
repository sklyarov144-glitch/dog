export class YandexGamesManager {
  constructor() {
    this.ysdk = null;
  }

  async init() {
    if (!window.YaGames) return;
    try {
      this.ysdk = await window.YaGames.init();
      this.ysdk.features.LoadingAPI?.ready();
    } catch {
      this.ysdk = null;
    }
  }
}
