export class PlayerController {
  constructor(config) {
    this.config = config;
    this.laneIndex = 1;
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.jumping = false;
    this.sliding = false;
    this.slideTimer = 0;
  }

  applyActions(actions) {
    for (const action of actions) {
      if (action === 'left') this.laneIndex = Math.max(0, this.laneIndex - 1);
      if (action === 'right') this.laneIndex = Math.min(2, this.laneIndex + 1);
      if (action === 'jump' && !this.jumping) {
        this.jumping = true;
        this.vy = -this.config.jumpVelocity;
      }
      if (action === 'slide' && !this.jumping) {
        this.sliding = true;
        this.slideTimer = this.config.slideDuration;
      }
    }
  }

  update(dt, lanes) {
    const tx = lanes[this.laneIndex];
    this.x += (tx - this.x) * Math.min(1, dt * this.config.laneLerp);
    if (this.jumping) {
      this.y += this.vy * dt;
      this.vy += this.config.gravity * dt;
      if (this.y >= 0) {
        this.y = 0;
        this.vy = 0;
        this.jumping = false;
      }
    }
    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }
  }
}
