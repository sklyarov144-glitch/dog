const SAVE_KEY = 'dogSurfSave_v3';

export class SaveManager {
  load() {
    try {
      return Object.assign({ best: 0, coins: 0, owned: ['classic'], skin: 'classic', missions: {} }, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
    } catch {
      return { best: 0, coins: 0, owned: ['classic'], skin: 'classic', missions: {} };
    }
  }

  persist(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }
}
