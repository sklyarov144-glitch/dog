export class PerformanceManager {
  getTier() {
    const mobile = /android|iphone|ipad/i.test(navigator.userAgent);
    return mobile ? 'mobile' : 'desktop';
  }
}
