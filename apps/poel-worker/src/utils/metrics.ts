// Simple metrics collection for observability
export interface Metrics {
  incrementCounter: (
    name: string,
    value?: number,
    tags?: Record<string, string>,
  ) => void;
  recordHistogram: (
    name: string,
    value: number,
    tags?: Record<string, string>,
  ) => void;
  recordTimer: (
    name: string,
    duration: number,
    tags?: Record<string, string>,
  ) => void;
}

class SimpleMetrics implements Metrics {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private timers: Map<string, number[]> = new Map();

  incrementCounter(
    name: string,
    value: number = 1,
    tags?: Record<string, string>,
  ) {
    const key = this.createKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  recordHistogram(name: string, value: number, tags?: Record<string, string>) {
    const key = this.createKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  recordTimer(name: string, duration: number, tags?: Record<string, string>) {
    this.recordHistogram(name, duration, tags);
  }

  private createKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const sortedTags = Object.keys(tags).sort().map((key) =>
      `${key}=${tags[key]}`
    ).join(",");
    return `${name}{${sortedTags}}`;
  }

  // Method to get current metrics (for health checks or monitoring)
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(this.histograms),
      timers: Object.fromEntries(this.timers),
    };
  }
}

// Create and export default metrics instance
export const metrics = new SimpleMetrics();
