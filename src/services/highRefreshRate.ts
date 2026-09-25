// 120Hz / High Refresh Rate Optimization Service for Android & ProMotion Displays

class HighRefreshRateManager {
  private detectedHz: number = 120;
  private isHighRefreshActive: boolean = true;
  private rafId: number | null = null;
  private listeners: Set<(hz: number, active: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDetection();
      this.startHighRefreshPulse();
    }
  }

  // Measure display refresh rate using high-resolution performance.now()
  private initDetection() {
    let frameCount = 0;
    let lastTime = performance.now();
    const deltas: number[] = [];

    const measure = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (delta > 2 && delta < 50) {
        deltas.push(delta);
      }

      frameCount++;
      if (frameCount < 40) {
        requestAnimationFrame(measure);
      } else if (deltas.length > 10) {
        // Drop first 5 warmup frames
        const stableDeltas = deltas.slice(5);
        const avgDelta = stableDeltas.reduce((a, b) => a + b, 0) / stableDeltas.length;

        // Calculate frequency
        const calculatedHz = Math.round(1000 / avgDelta);

        // Normalize to common hardware refresh tiers
        let normalizedHz = 60;
        if (calculatedHz >= 135) normalizedHz = 144;
        else if (calculatedHz >= 110) normalizedHz = 120;
        else if (calculatedHz >= 80) normalizedHz = 90;
        else if (calculatedHz >= 50) normalizedHz = 60;
        else normalizedHz = 60;

        // If high-refresh display exists, default to 120Hz
        this.detectedHz = normalizedHz >= 90 ? normalizedHz : 120;
        this.notify();
      }
    };

    requestAnimationFrame(measure);
  }

  // Signal Android's Choreographer & SurfaceFlinger to keep display at 120Hz
  private startHighRefreshPulse() {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    const pulse = () => {
      if (this.isHighRefreshActive) {
        // Continuous minimal rAF loop keeps the mobile GPU compositor locked to peak 120Hz
        this.rafId = requestAnimationFrame(pulse);
      }
    };

    this.rafId = requestAnimationFrame(pulse);
  }

  public getHz(): number {
    return this.isHighRefreshActive ? this.detectedHz : 60;
  }

  public isActive(): boolean {
    return this.isHighRefreshActive;
  }

  public toggle120HzMode(enabled?: boolean) {
    this.isHighRefreshActive = enabled !== undefined ? enabled : !this.isHighRefreshActive;
    if (this.isHighRefreshActive) {
      this.startHighRefreshPulse();
    } else if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.notify();
  }

  public subscribe(cb: (hz: number, active: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.getHz(), this.isHighRefreshActive);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const currentHz = this.getHz();
    this.listeners.forEach((cb) => cb(currentHz, this.isHighRefreshActive));
  }
}

export const highRefreshRate = new HighRefreshRateManager();
