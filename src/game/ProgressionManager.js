export class ProgressionManager {
  getSpeed(t, cfg) {
    return Math.min(cfg.maxSpeed, cfg.baseSpeed + t * 0.15);
  }
}
