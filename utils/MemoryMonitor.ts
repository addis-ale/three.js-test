/**
 * Memory monitoring utility for stress testing
 * Tracks WebGL memory usage and performance metrics
 */
export class MemoryMonitor {
  private renderer: THREE.WebGLRenderer;
  private memoryHistory: Array<{
    timestamp: number;
    geometries: number;
    textures: number;
    triangles: number;
    drawCalls: number;
  }> = [];
  
  private maxHistoryLength = 100;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
  }

  /**
   * Capture current memory state
   */
  public captureMemoryState(): {
    timestamp: number;
    geometries: number;
    textures: number;
    triangles: number;
    drawCalls: number;
  } {
    const info = this.renderer.info;
    const state = {
      timestamp: Date.now(),
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      triangles: info.render.triangles,
      drawCalls: info.render.calls
    };

    // Add to history
    this.memoryHistory.push(state);
    
    // Limit history length
    if (this.memoryHistory.length > this.maxHistoryLength) {
      this.memoryHistory.shift();
    }

    return state;
  }

  /**
   * Get current memory info
   */
  public getCurrentMemoryInfo(): any {
    return this.renderer.info;
  }

  /**
   * Get memory usage summary
   */
  public getMemorySummary(): {
    current: any;
    peak: any;
    history: Array<any>;
    trends: {
      geometries: 'increasing' | 'decreasing' | 'stable';
      textures: 'increasing' | 'decreasing' | 'stable';
      triangles: 'increasing' | 'decreasing' | 'stable';
    };
  } {
    const current = this.getCurrentMemoryInfo();
    const history = this.memoryHistory;
    
    let peak = { ...current };
    history.forEach(state => {
      if (state.geometries > peak.geometries) peak.geometries = state.geometries;
      if (state.textures > peak.textures) peak.textures = state.textures;
      if (state.triangles > peak.triangles) peak.triangles = state.triangles;
    });

    // Calculate trends
    const trends = this.calculateTrends(history);

    return {
      current,
      peak,
      history: [...history],
      trends
    };
  }

  /**
   * Calculate memory usage trends
   */
  private calculateTrends(history: Array<any>): {
    geometries: 'increasing' | 'decreasing' | 'stable';
    textures: 'increasing' | 'decreasing' | 'stable';
    triangles: 'increasing' | 'decreasing' | 'stable';
  } {
    if (history.length < 2) {
      return {
        geometries: 'stable',
        textures: 'stable',
        triangles: 'stable'
      };
    }

    const recent = history.slice(-10); // Last 10 samples
    const older = history.slice(-20, -10); // Previous 10 samples

    if (older.length === 0) {
      return {
        geometries: 'stable',
        textures: 'stable',
        triangles: 'stable'
      };
    }

    const calculateTrend = (recent: number[], older: number[]): 'increasing' | 'decreasing' | 'stable' => {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      const diff = recentAvg - olderAvg;
      const threshold = Math.max(1, olderAvg * 0.1); // 10% threshold or at least 1

      if (diff > threshold) return 'increasing';
      if (diff < -threshold) return 'decreasing';
      return 'stable';
    };

    return {
      geometries: calculateTrend(
        recent.map(h => h.geometries),
        older.map(h => h.geometries)
      ),
      textures: calculateTrend(
        recent.map(h => h.textures),
        older.map(h => h.textures)
      ),
      triangles: calculateTrend(
        recent.map(h => h.triangles),
        older.map(h => h.triangles)
      )
    };
  }

  /**
   * Log memory information to console
   */
  public logMemoryInfo(label: string = 'Memory Info'): void {
    const info = this.getCurrentMemoryInfo();
    const summary = this.getMemorySummary();

    console.log(`🧠 ${label}:`);
    console.log(`  Geometries: ${info.memory.geometries} (Peak: ${summary.peak.geometries})`);
    console.log(`  Textures: ${info.memory.textures} (Peak: ${summary.peak.textures})`);
    console.log(`  Triangles: ${info.render.triangles} (Peak: ${summary.peak.triangles})`);
    console.log(`  Draw Calls: ${info.render.calls}`);
    
    console.log('📈 Trends:');
    console.log(`  Geometries: ${summary.trends.geometries}`);
    console.log(`  Textures: ${summary.trends.textures}`);
    console.log(`  Triangles: ${summary.trends.triangles}`);
  }

  /**
   * Check for memory leaks
   */
  public checkMemoryLeaks(): {
    hasLeaks: boolean;
    severity: 'low' | 'medium' | 'high';
    details: string[];
  } {
    const summary = this.getMemorySummary();
    const details: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check for increasing trends
    if (summary.trends.geometries === 'increasing') {
      details.push('Geometries count is increasing');
      severity = 'medium';
    }

    if (summary.trends.textures === 'increasing') {
      details.push('Textures count is increasing');
      severity = 'medium';
    }

    if (summary.trends.triangles === 'increasing') {
      details.push('Triangle count is increasing');
      severity = 'low';
    }

    // Check for high absolute values
    if (summary.current.memory.geometries > 1000) {
      details.push(`High geometry count: ${summary.current.memory.geometries}`);
      severity = 'high';
    }

    if (summary.current.memory.textures > 100) {
      details.push(`High texture count: ${summary.current.memory.textures}`);
      severity = 'high';
    }

    return {
      hasLeaks: details.length > 0,
      severity,
      details
    };
  }

  /**
   * Reset memory history
   */
  public resetHistory(): void {
    this.memoryHistory = [];
  }

  /**
   * Export memory data for analysis
   */
  public exportMemoryData(): string {
    const summary = this.getMemorySummary();
    return JSON.stringify(summary, null, 2);
  }
}
