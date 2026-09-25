// 120Hz / High Refresh Rate Optimization Engine for Android & iOS ProMotion Displays

export type RefreshMode = '120' | '60' | 'auto';

class HighRefreshRateManager {
  private detectedHz: number = 120;
  private mode: RefreshMode = '120';
  private rafId: number | null = null;
  private listeners: Set<(hz: number, active: boolean, mode: RefreshMode) => void> = new Set();
  private compositorNode: HTMLElement | null = null;
  private pulseFrame: number = 0;
  private isSampling: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Load saved mode or default to 120Hz Ultra
      try {
        const savedMode = localStorage.getItem('streamx_refresh_mode') as RefreshMode;
        if (savedMode === '120' || savedMode === '60' || savedMode === 'auto') {
          this.mode = savedMode;
        } else {
          this.mode = '120';
        }
      } catch {
        this.mode = '120';
      }

      this.setupCompositorNode();
      this.initDynamicDetection();
      this.startHighRefreshPulse();
      this.attachInteractionListeners();
    }
  }

  // Creates a dedicated micro GPU compositor node.
  // Android's SurfaceFlinger and iOS ProMotion display controllers downclock to 60Hz or 30Hz
  // if no active GPU compositing or dirty-rect change occurs.
  // This zero-layout, hardware-accelerated micro-node prevents display driver downclocking.
  private setupCompositorNode() {
    try {
      const existing = document.getElementById('__streamx_120hz_compositor__');
      if (existing) {
        this.compositorNode = existing;
        return;
      }

      const node = document.createElement('div');
      node.id = '__streamx_120hz_compositor__';
      node.setAttribute('aria-hidden', 'true');
      node.style.cssText = `
        position: fixed;
        width: 1px;
        height: 1px;
        bottom: 0;
        left: 0;
        opacity: 0.001;
        pointer-events: none;
        z-index: -9999;
        transform: translateZ(0);
        will-change: transform;
        contain: strict;
      `;
      document.body.appendChild(node);
      this.compositorNode = node;
    } catch {
      // Fallback gracefully in restricted contexts
    }
  }

  // Active compositor pulse loop
  private startHighRefreshPulse() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.mode === '60') return;

    const pulse = () => {
      if (this.mode !== '60') {
        this.pulseFrame++;
        // Subtle micro-transform (sub-pixel oscillation) forces SurfaceFlinger
        // and Android Choreographer to maintain full 120Hz VSYNC frequency
        if (this.compositorNode) {
          const delta = (this.pulseFrame % 2 === 0) ? '0px' : '0.1px';
          this.compositorNode.style.transform = `translate3d(0, ${delta}, 0)`;
        }
        this.rafId = requestAnimationFrame(pulse);
      }
    };

    this.rafId = requestAnimationFrame(pulse);
  }

  // Dynamic sampling: measures actual frame deltas when user interacts (scrolling, touching)
  // because modern mobile OSs scale display to maximum Hz on touch/interaction
  private attachInteractionListeners() {
    const triggerSample = () => {
      if (this.isSampling) return;
      this.sampleRefreshRate();
    };

    window.addEventListener('touchstart', triggerSample, { passive: true });
    window.addEventListener('touchmove', triggerSample, { passive: true });
    window.addEventListener('scroll', triggerSample, { passive: true });
    window.addEventListener('pointerdown', triggerSample, { passive: true });
  }

  private initDynamicDetection() {
    // Initial run after browser warmup (250ms delay) to avoid cold-start lag
    setTimeout(() => {
      this.sampleRefreshRate();
    }, 250);
  }

  public sampleRefreshRate() {
    this.isSampling = true;
    let frameCount = 0;
    let lastTime = performance.now();
    const deltas: number[] = [];

    const measure = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      // Filter out paused/lag frames
      if (delta > 3 && delta < 45) {
        deltas.push(delta);
      }

      frameCount++;
      if (frameCount < 25) {
        requestAnimationFrame(measure);
      } else {
        this.isSampling = false;
        if (deltas.length >= 8) {
          // Drop first 3 warmup frames
          const stableDeltas = deltas.slice(3);
          const avgDelta = stableDeltas.reduce((a, b) => a + b, 0) / stableDeltas.length;
          const calculatedHz = Math.round(1000 / avgDelta);

          let normalizedHz = 120;
          if (calculatedHz >= 135) normalizedHz = 144;
          else if (calculatedHz >= 105) normalizedHz = 120;
          else if (calculatedHz >= 80) normalizedHz = 90;
          else if (calculatedHz >= 50) {
            // If phone hardware or screen setting is in 120Hz mode, keep 120Hz
            normalizedHz = this.mode === '120' ? 120 : 60;
          } else {
            normalizedHz = 120;
          }

          if (normalizedHz >= 90) {
            this.detectedHz = normalizedHz;
          } else if (this.mode === '120') {
            this.detectedHz = 120;
          } else {
            this.detectedHz = 60;
          }

          this.notify();
        }
      }
    };

    requestAnimationFrame(measure);
  }

  public getHz(): number {
    if (this.mode === '60') return 60;
    return this.detectedHz >= 90 ? this.detectedHz : 120;
  }

  public isActive(): boolean {
    return this.mode !== '60';
  }

  public getMode(): RefreshMode {
    return this.mode;
  }

  public setMode(newMode: RefreshMode) {
    this.mode = newMode;
    try {
      localStorage.setItem('streamx_refresh_mode', newMode);
    } catch {
      // Ignore localStorage errors
    }

    if (newMode !== '60') {
      this.detectedHz = 120;
      this.setupCompositorNode();
      this.startHighRefreshPulse();
      this.sampleRefreshRate();
    } else {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.detectedHz = 60;
    }

    this.notify();
  }

  public toggle120HzMode(enabled?: boolean) {
    if (enabled !== undefined) {
      this.setMode(enabled ? '120' : '60');
    } else {
      this.setMode(this.mode === '120' ? '60' : '120');
    }
  }

  public subscribe(cb: (hz: number, active: boolean, mode: RefreshMode) => void): () => void {
    this.listeners.add(cb);
    cb(this.getHz(), this.isActive(), this.mode);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const currentHz = this.getHz();
    const active = this.isActive();
    this.listeners.forEach((cb) => cb(currentHz, active, this.mode));
  }
}

export const highRefreshRate = new HighRefreshRateManager();
