# Time Hero Simulator - Reports
## Document 7: Analysis, Comparison & Export

### Purpose & Goals
The Reports page serves as the **analytical command center** for completed simulations, providing comprehensive analysis tools, cross-simulation comparisons, bottleneck detection algorithms, and professional export capabilities. It transforms raw simulation data into actionable insights that drive game balance decisions.

### Integration with Simulator Goals
- **Data-Driven Decisions**: Convert simulation results into clear recommendations
- **Pattern Recognition**: Identify trends across multiple simulation runs
- **Bottleneck Analysis**: Pinpoint exact progression blockers with solutions
- **Comparison Tools**: A/B test different configurations side-by-side
- **Documentation**: Generate reports for stakeholders and version control

### Report Architecture

#### Report System Structure
```typescript
interface ReportSystem {
  library: {
    reports: Report[];
    filters: ReportFilters;
    sorting: SortConfiguration;
    selection: Set<string>;
  };
  
  viewer: {
    activeReport: Report | null;
    viewMode: 'summary' | 'detailed' | 'raw';
    comparison: ComparisonView | null;
  };
  
  analysis: {
    bottlenecks: BottleneckAnalysis;
    efficiency: EfficiencyAnalysis;
    progression: ProgressionAnalysis;
    recommendations: Recommendation[];
  };
  
  export: {
    formats: ExportFormat[];
    templates: ExportTemplate[];
    llmOptimized: boolean;
  };
}

interface Report {
  id: string;
  metadata: {
    name: string;
    timestamp: Date;
    duration: number; // Simulation time in minutes
    realTime: number; // Real execution time in seconds
    version: string;
  };
  
  configuration: {
    persona: PlayerPersona;
    gameData: GameDataConfig;
    settings: SimulationSettings;
  };
  
  results: {
    success: boolean;
    completionDay?: number;
    finalPhase: GamePhase;
    bottlenecks: Bottleneck[];
    metrics: MetricsSummary;
  };
  
  data: {
    timeline: TimelineData;
    resources: ResourceData;
    actions: ActionData;
    state: FinalGameState;
  };
}
```

### Layout Structure

#### Report Library View
```
┌─────────────────────────────────────────────────────────────┐
│                    Simulation Reports                       │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search] [Filter ▼] [Sort: Date ▼] [Compare] [Export]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ □ | Status |        Name         | Persona | Phase | Days││
│ ├─────────────────────────────────────────────────────────┤│
│ │ □ |   ✅   | Balance Test v2.1   | Casual  | End   | 32  ││
│ │ □ |   ✅   | Speedrun Validation | Speed   | End   | 18  ││
│ │ □ |   ⚠️   | Weekend Warrior     | Weekend | Late  | 35  ││
│ │ □ |   ❌   | Extreme Casual      | Custom  | Mid   | 35  ││
│ │ □ |   ✅   | Progression Check   | Casual  | End   | 34  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Showing 5 of 47 reports         [First][Prev][1][2][Next]  │
└─────────────────────────────────────────────────────────────┘
```

#### Individual Report View
```
┌─────────────────────────────────────────────────────────────┐
│     Balance Test v2.1 - Casual Player (32 days)            │
├─────────────────────────────────────────────────────────────┤
│ [Summary][Timeline][Resources][Actions][Analysis][Export]  │
├─────────────────────────────────────────────────────────────┤
│                        Summary Dashboard                    │
│                                                             │
│ ┌─────────────┬──────────────┬──────────────┬────────────┐│
│ │   SUCCESS    │ Completion   │ Efficiency   │Bottlenecks ││
│ │     ✅       │   32 days    │    68%       │     3      ││
│ └─────────────┴──────────────┴──────────────┴────────────┘│
│                                                             │
│ Phase Progression                                          │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Tutorial    ████████ Day 1-3   (Target: 3)   ✅        ││
│ │ Early Game  ████████ Day 4-10  (Target: 10)  ✅        ││
│ │ Mid Game    ████████ Day 11-20 (Target: 18)  ⚠️ +2     ││
│ │ Late Game   ████████ Day 21-28 (Target: 25)  ⚠️ +3     ││
│ │ Endgame     ████████ Day 29-32 (Target: 32)  ✅        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Key Metrics                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Total Actions: 4,827      Check-ins: 89                 ││
│ │ Gold Earned: 127,450      Energy Generated: 89,230      ││
│ │ Adventures: 47            Mining Runs: 34               ││
│ │ Upgrades Purchased: 76    Tools Crafted: 18             ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Critical Bottlenecks                                       │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 1. Day 8-10: Energy shortage (waiting for Shed II)      ││
│ │ 2. Day 15-16: Gold shortage (need Mountain Pass)        ││
│ │ 3. Day 24-26: Material shortage (Silver for upgrades)   ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. Report Library Manager
```typescript
interface ReportLibrary {
  reports: Report[];
  
  filters: {
    status: Set<'success' | 'partial' | 'failed'>;
    personas: Set<string>;
    dateRange: { start: Date; end: Date; };
    phases: Set<GamePhase>;
    tags: Set<string>;
  };
  
  sorting: {
    field: 'date' | 'name' | 'persona' | 'completion' | 'efficiency';
    direction: 'asc' | 'desc';
  };
  
  actions: {
    view(reportId: string): void;
    compare(reportIds: string[]): void;
    delete(reportIds: string[]): void;
    export(reportIds: string[], format: ExportFormat): void;
    duplicate(reportId: string): void;
    tag(reportIds: string[], tags: string[]): void;
  };
  
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

interface ReportFilters {
  apply(reports: Report[]): Report[] {
    return reports.filter(report => {
      // Status filter
      if (this.status.size > 0) {
        const status = this.getReportStatus(report);
        if (!this.status.has(status)) return false;
      }
      
      // Date range filter
      if (this.dateRange) {
        if (report.metadata.timestamp < this.dateRange.start ||
            report.metadata.timestamp > this.dateRange.end) {
          return false;
        }
      }
      
      // Persona filter
      if (this.personas.size > 0) {
        if (!this.personas.has(report.configuration.persona.id)) {
          return false;
        }
      }
      
      return true;
    });
  }
}
```

#### 2. Timeline Analysis
```typescript
interface TimelineAnalysis {
  events: TimelineEvent[];
  phases: PhaseData[];
  milestones: MilestoneData[];
  
  visualization: {
    type: 'linear' | 'spiral' | 'calendar';
    granularity: 'minute' | 'hour' | 'day';
    highlights: Set<string>;
  };
  
  patterns: {
    dailyActivity: ActivityPattern[];
    peakHours: TimeRange[];
    idlePeriods: IdlePeriod[];
  };
}

interface PhaseData {
  name: GamePhase;
  startDay: number;
  endDay: number;
  duration: number;
  targetDuration: number;
  variance: number; // Positive = behind, negative = ahead
  
  keyEvents: TimelineEvent[];
  bottlenecks: Bottleneck[];
  efficiency: number;
}

interface MilestoneData {
  id: string;
  name: string;
  day: number;
  time: GameTime;
  category: 'upgrade' | 'unlock' | 'achievement' | 'phase';
  impact: 'minor' | 'moderate' | 'major' | 'critical';
  dependencies: string[];
}
```

**Timeline Visualization Component**:
```typescript
class TimelineVisualizer {
  render(timeline: TimelineAnalysis): VNode {
    switch (timeline.visualization.type) {
      case 'linear':
        return this.renderLinearTimeline(timeline);
      case 'spiral':
        return this.renderSpiralTimeline(timeline);
      case 'calendar':
        return this.renderCalendarView(timeline);
    }
  }
  
  private renderLinearTimeline(timeline: TimelineAnalysis): VNode {
    return (
      <div class="timeline-linear">
        <svg width="100%" height="200">
          {/* Phase blocks */}
          {timeline.phases.map((phase, i) => (
            <g key={phase.name}>
              <rect
                x={`${phase.startDay * 3}%`}
                y="50"
                width={`${phase.duration * 3}%`}
                height="40"
                fill={this.getPhaseColor(phase.name)}
                opacity="0.3"
              />
              <text
                x={`${(phase.startDay + phase.duration/2) * 3}%`}
                y="70"
                text-anchor="middle"
                fill="white"
              >
                {phase.name}
              </text>
            </g>
          ))}
          
          {/* Milestone markers */}
          {timeline.milestones.map(milestone => (
            <g key={milestone.id}>
              <circle
                cx={`${milestone.day * 3}%`}
                cy="100"
                r={this.getMilestoneRadius(milestone.impact)}
                fill={this.getMilestoneColor(milestone.category)}
              />
              <title>{milestone.name}</title>
            </g>
          ))}
          
          {/* Bottleneck indicators */}
          {timeline.events
            .filter(e => e.type === 'bottleneck')
            .map(bottleneck => (
              <rect
                x={`${bottleneck.day * 3}%`}
                y="45"
                width="2"
                height="50"
                fill="#ef4444"
                opacity="0.8"
              />
            ))
          }
        </svg>
      </div>
    );
  }
}
```

#### 3. Resource Analysis
```typescript
interface ResourceAnalysis {
  resources: {
    energy: ResourceMetrics;
    gold: ResourceMetrics;
    water: ResourceMetrics;
    materials: Map<string, ResourceMetrics>;
  };
  
  efficiency: {
    overall: number;
    byPhase: Map<GamePhase, number>;
    byResource: Map<string, number>;
  };
  
  waste: {
    overflow: WasteMetric[];
    idle: WasteMetric[];
    inefficient: WasteMetric[];
  };
  
  charts: {
    resourceOverTime: ChartData;
    efficiencyTrend: ChartData;
    generationRates: ChartData;
  };
}

interface ResourceMetrics {
  total: {
    generated: number;
    consumed: number;
    wasted: number;
  };
  
  peaks: {
    maximum: { value: number; time: GameTime; };
    minimum: { value: number; time: GameTime; };
  };
  
  rates: {
    averageGeneration: number;
    averageConsumption: number;
    peakGeneration: number;
    peakConsumption: number;
  };
  
  efficiency: number; // 0-100%
}

interface WasteMetric {
  resource: string;
  amount: number;
  reason: 'cap_reached' | 'no_storage' | 'expired' | 'inefficient_use';
  time: GameTime;
  preventable: boolean;
  suggestion?: string;
}
```

**Resource Chart Component**:
```vue
<template>
  <div class="resource-charts">
    <div class="chart-tabs">
      <button 
        v-for="resource in resources" 
        :class="{ active: selected === resource }"
        @click="selected = resource"
      >
        {{ resource }}
      </button>
    </div>
    
    <canvas ref="chartCanvas"></canvas>
    
    <div class="chart-stats">
      <div class="stat">
        <label>Total Generated</label>
        <value>{{ formatNumber(metrics.generated) }}</value>
      </div>
      <div class="stat">
        <label>Efficiency</label>
        <value :class="getEfficiencyClass(metrics.efficiency)">
          {{ metrics.efficiency }}%
        </value>
      </div>
      <div class="stat">
        <label>Waste</label>
        <value class="negative">{{ formatNumber(metrics.wasted) }}</value>
      </div>
    </div>
  </div>
</template>
```

#### 4. Bottleneck Detector
```typescript
interface BottleneckDetector {
  analyze(report: Report): BottleneckAnalysis {
    const bottlenecks: Bottleneck[] = [];
    
    // Detect resource bottlenecks
    bottlenecks.push(...this.detectResourceBottlenecks(report));
    
    // Detect progression bottlenecks
    bottlenecks.push(...this.detectProgressionBottlenecks(report));
    
    // Detect efficiency bottlenecks
    bottlenecks.push(...this.detectEfficiencyBottlenecks(report));
    
    // Detect decision bottlenecks
    bottlenecks.push(...this.detectDecisionBottlenecks(report));
    
    // Rank by severity
    bottlenecks.sort((a, b) => b.severity - a.severity);
    
    return {
      bottlenecks,
      patterns: this.identifyPatterns(bottlenecks),
      recommendations: this.generateRecommendations(bottlenecks)
    };
  }
  
  private detectResourceBottlenecks(report: Report): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const resourceHistory = report.data.resources;
    
    // Check for extended periods at cap
    for (const [resource, data] of resourceHistory) {
      const cappedPeriods = this.findCappedPeriods(data);
      
      cappedPeriods.forEach(period => {
        if (period.duration > 60) { // More than 1 hour
          bottlenecks.push({
            type: 'resource_cap',
            resource,
            startTime: period.start,
            duration: period.duration,
            severity: this.calculateSeverity(period.duration),
            impact: `Lost ${period.overflow} ${resource}`,
            solution: `Upgrade ${resource} storage before day ${period.start.day}`
          });
        }
      });
    }
    
    return bottlenecks;
  }
}

interface Bottleneck {
  type: BottleneckType;
  resource?: string;
  startTime: GameTime;
  duration: number; // minutes
  severity: number; // 1-10
  impact: string;
  solution: string;
  
  relatedSystems: string[];
  cascadeEffects: string[];
  preventable: boolean;
}

type BottleneckType = 
  | 'resource_cap'
  | 'resource_shortage'
  | 'prerequisite_missing'
  | 'inefficient_decision'
  | 'schedule_gap'
  | 'combat_failure'
  | 'material_shortage';
```

#### 5. Comparison View
```typescript
interface ComparisonView {
  reports: Report[];
  mode: 'side-by-side' | 'overlay' | 'diff';
  
  metrics: {
    aligned: ComparisonMetric[];
    divergent: DivergencePoint[];
    correlation: CorrelationData;
  };
  
  visualization: {
    type: 'table' | 'chart' | 'timeline';
    syncScroll: boolean;
    highlightDifferences: boolean;
  };
}

interface ComparisonMetric {
  name: string;
  values: Map<string, any>; // reportId -> value
  variance: number;
  significant: boolean;
}

interface DivergencePoint {
  time: GameTime;
  metric: string;
  reports: Map<string, any>;
  impact: 'minor' | 'moderate' | 'major';
  cause?: string;
}
```

**Comparison Table Component**:
```
┌─────────────────────────────────────────────────────────────┐
│                  Simulation Comparison                      │
├─────────────────────────────────────────────────────────────┤
│ Metric              │ Speedrun │ Casual │ Weekend │ Δ Max  │
├─────────────────────────────────────────────────────────────┤
│ Completion Days     │    18    │   32   │    28   │  78%   │
│ Total Efficiency    │    94%   │   68%  │    76%  │  38%   │
│ Gold Earned         │  98,420  │127,450 │ 112,380 │  30%   │
│ Energy Generated    │  67,890  │ 89,230 │  78,560 │  31%   │
│ Bottlenecks         │     1    │    3   │     2   │  200%  │
│ Adventures Complete │    52    │   47   │    49   │  11%   │
│ Check-ins           │   298    │   89   │   124   │  235%  │
├─────────────────────────────────────────────────────────────┤
│ Phase Timing                                                │
├─────────────────────────────────────────────────────────────┤
│ Tutorial            │   2 days │ 3 days │  3 days │  50%   │
│ Early Game          │   4 days │ 7 days │  6 days │  75%   │
│ Mid Game            │   5 days │10 days │  9 days │  100%  │
│ Late Game           │   4 days │ 8 days │  7 days │  100%  │
│ Endgame             │   3 days │ 4 days │  3 days │  33%   │
└─────────────────────────────────────────────────────────────┘
```

#### 6. Action Analysis
```typescript
interface ActionAnalysis {
  summary: {
    totalActions: number;
    actionsByType: Map<ActionType, number>;
    actionsByScreen: Map<GameScreen, number>;
    actionsPerDay: number;
    actionsPerSession: number;
  };
  
  patterns: {
    sequences: ActionSequence[];
    frequencies: ActionFrequency[];
    efficiency: ActionEfficiency[];
  };
  
  optimization: {
    inefficientActions: IneffcientAction[];
    missedOpportunities: MissedOpportunity[];
    suggestions: OptimizationSuggestion[];
  };
}

interface ActionSequence {
  actions: Action[];
  frequency: number;
  efficiency: number;
  context: string;
}

interface IneffcientAction {
  action: Action;
  reason: string;
  betterAlternative: Action;
  efficiencyLoss: number;
}

interface MissedOpportunity {
  time: GameTime;
  opportunity: string;
  impact: string;
  prevention: string;
}
```

### Analysis Algorithms

#### 1. Efficiency Calculator
```typescript
class EfficiencyCalculator {
  calculate(report: Report): EfficiencyMetrics {
    const metrics: EfficiencyMetrics = {
      overall: 0,
      resource: new Map(),
      time: new Map(),
      decision: new Map()
    };
    
    // Resource efficiency
    metrics.resource = this.calculateResourceEfficiency(report);
    
    // Time efficiency
    metrics.time = this.calculateTimeEfficiency(report);
    
    // Decision efficiency
    metrics.decision = this.calculateDecisionEfficiency(report);
    
    // Overall weighted average
    metrics.overall = this.calculateOverallEfficiency(metrics);
    
    return metrics;
  }
  
  private calculateResourceEfficiency(report: Report): Map<string, number> {
    const efficiency = new Map<string, number>();
    
    for (const [resource, data] of report.data.resources) {
      const generated = data.total.generated;
      const wasted = data.total.wasted;
      const utilized = generated - wasted;
      
      efficiency.set(resource, (utilized / generated) * 100);
    }
    
    return efficiency;
  }
  
  private calculateTimeEfficiency(report: Report): Map<string, number> {
    const efficiency = new Map<string, number>();
    
    // Active vs idle time
    const activeTime = report.data.timeline.activeMinutes;
    const totalTime = report.data.timeline.totalMinutes;
    efficiency.set('active', (activeTime / totalTime) * 100);
    
    // Screen time efficiency
    for (const [screen, time] of report.data.timeline.screenTime) {
      const expectedTime = this.getExpectedScreenTime(screen, report.configuration.persona);
      efficiency.set(screen, Math.min(100, (expectedTime / time) * 100));
    }
    
    return efficiency;
  }
}
```

#### 2. Pattern Recognition
```typescript
class PatternRecognizer {
  identifyPatterns(reports: Report[]): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Progression patterns
    patterns.push(...this.findProgressionPatterns(reports));
    
    // Bottleneck patterns
    patterns.push(...this.findBottleneckPatterns(reports));
    
    // Success patterns
    patterns.push(...this.findSuccessPatterns(reports));
    
    // Failure patterns
    patterns.push(...this.findFailurePatterns(reports));
    
    return patterns;
  }
  
  private findBottleneckPatterns(reports: Report[]): Pattern[] {
    const bottleneckMap = new Map<string, number>();
    
    // Count bottleneck occurrences
    reports.forEach(report => {
      report.results.bottlenecks.forEach(bottleneck => {
        const key = `${bottleneck.type}_${bottleneck.resource || 'general'}`;
        bottleneckMap.set(key, (bottleneckMap.get(key) || 0) + 1);
      });
    });
    
    // Identify patterns
    const patterns: Pattern[] = [];
    for (const [key, count] of bottleneckMap) {
      if (count > reports.length * 0.5) { // Occurs in >50% of runs
        patterns.push({
          type: 'common_bottleneck',
          identifier: key,
          frequency: count / reports.length,
          description: `${key} occurs in ${Math.round(count / reports.length * 100)}% of simulations`,
          recommendation: this.getBottleneckRecommendation(key)
        });
      }
    }
    
    return patterns;
  }
}

interface Pattern {
  type: 'progression' | 'bottleneck' | 'success' | 'failure';
  identifier: string;
  frequency: number;
  description: string;
  recommendation: string;
  examples: string[]; // Report IDs
}
```

### Export System

#### 1. Export Manager
```typescript
interface ExportManager {
  formats: {
    json: JSONExporter;
    csv: CSVExporter;
    markdown: MarkdownExporter;
    pdf: PDFExporter;
    llm: LLMExporter;
  };
  
  templates: Map<string, ExportTemplate>;
  
  export(reports: Report[], format: ExportFormat, options?: ExportOptions): Promise<Blob> {
    const exporter = this.formats[format];
    
    if (!exporter) {
      throw new Error(`Unsupported format: ${format}`);
    }
    
    const data = this.prepareData(reports, options);
    return exporter.export(data, options);
  }
  
  private prepareData(reports: Report[], options?: ExportOptions): ExportData {
    return {
      reports,
      metadata: {
        exportDate: new Date(),
        version: '1.0.0',
        reportCount: reports.length,
        options
      },
      analysis: options?.includeAnalysis ? 
        this.generateAnalysis(reports) : undefined,
      comparison: reports.length > 1 && options?.includeComparison ?
        this.generateComparison(reports) : undefined
    };
  }
}

interface ExportOptions {
  includeRawData: boolean;
  includeAnalysis: boolean;
  includeComparison: boolean;
  includeCharts: boolean;
  template?: string;
  compression: boolean;
}
```

#### 2. LLM-Optimized Export
```typescript
class LLMExporter {
  export(data: ExportData): string {
    const output: string[] = [];
    
    // Structured header
    output.push('# Time Hero Simulation Report\n');
    output.push('## Metadata');
    output.push(`- Export Date: ${data.metadata.exportDate}`);
    output.push(`- Simulator Version: ${data.metadata.version}`);
    output.push(`- Reports Included: ${data.metadata.reportCount}\n`);
    
    // Executive Summary
    output.push('## Executive Summary\n');
    output.push(this.generateExecutiveSummary(data));
    
    // Key Findings
    output.push('## Key Findings\n');
    data.reports.forEach(report => {
      output.push(`### ${report.metadata.name}`);
      output.push(`- **Result**: ${report.results.success ? 'SUCCESS' : 'FAILURE'}`);
      output.push(`- **Completion**: Day ${report.results.completionDay || 'N/A'}`);
      output.push(`- **Efficiency**: ${report.results.metrics.efficiency}%`);
      output.push(`- **Bottlenecks**: ${report.results.bottlenecks.length}`);
      
      if (report.results.bottlenecks.length > 0) {
        output.push('\n#### Critical Bottlenecks:');
        report.results.bottlenecks.slice(0, 3).forEach(b => {
          output.push(`1. **${b.type}** at Day ${b.startTime.day}: ${b.impact}`);
          output.push(`   - Solution: ${b.solution}`);
        });
      }
      output.push('');
    });
    
    // Comparative Analysis
    if (data.comparison) {
      output.push('## Comparative Analysis\n');
      output.push(this.formatComparison(data.comparison));
    }
    
    // Recommendations
    output.push('## Recommendations\n');
    const recommendations = this.generateRecommendations(data);
    recommendations.forEach((rec, i) => {
      output.push(`${i + 1}. **${rec.title}**`);
      output.push(`   - Issue: ${rec.issue}`);
      output.push(`   - Impact: ${rec.impact}`);
      output.push(`   - Solution: ${rec.solution}\n`);
    });
    
    // Structured Data Section
    output.push('## Structured Data for Analysis\n');
    output.push('```json');
    output.push(JSON.stringify({
      summary: this.extractSummaryData(data),
      metrics: this.extractMetricsData(data),
      patterns: this.extractPatternsData(data)
    }, null, 2));
    output.push('```\n');
    
    return output.join('\n');
  }
  
  private generateExecutiveSummary(data: ExportData): string {
    const successRate = data.reports.filter(r => r.results.success).length / data.reports.length;
    const avgCompletion = data.reports
      .filter(r => r.results.completionDay)
      .reduce((sum, r) => sum + r.results.completionDay!, 0) / data.reports.length;
    
    return `
Analysis of ${data.reports.length} simulation(s) reveals:
- **Success Rate**: ${Math.round(successRate * 100)}%
- **Average Completion**: ${avgCompletion.toFixed(1)} days
- **Common Issues**: ${this.identifyCommonIssues(data).join(', ')}
- **Recommended Focus**: ${this.identifyFocusArea(data)}
    `.trim();
  }
}
```

#### 3. Markdown Export
```typescript
class MarkdownExporter {
  export(data: ExportData): string {
    const md = new MarkdownBuilder();
    
    // Title and TOC
    md.h1('Time Hero Simulation Report');
    md.toc();
    
    // Summary Section
    md.h2('Summary');
    md.table({
      headers: ['Metric', 'Value'],
      rows: [
        ['Total Simulations', data.reports.length],
        ['Success Rate', `${this.calculateSuccessRate(data)}%`],
        ['Average Completion', `${this.calculateAvgCompletion(data)} days`],
        ['Most Common Bottleneck', this.findMostCommonBottleneck(data)]
      ]
    });
    
    // Individual Reports
    md.h2('Simulation Results');
    data.reports.forEach(report => {
      md.h3(report.metadata.name);
      
      // Report summary
      md.paragraph(`**Status**: ${report.results.success ? '✅ Success' : '❌ Failed'}`);
      md.paragraph(`**Persona**: ${report.configuration.persona.name}`);
      md.paragraph(`**Duration**: ${report.results.completionDay || 'DNF'} days`);
      
      // Phase progression chart
      md.h4('Phase Progression');
      md.code(this.generateAsciiChart(report.results.phases), 'text');
      
      // Bottlenecks
      if (report.results.bottlenecks.length > 0) {
        md.h4('Bottlenecks Encountered');
        md.list(report.results.bottlenecks.map(b => 
          `Day ${b.startTime.day}: ${b.type} - ${b.impact}`
        ));
      }
    });
    
    return md.toString();
  }
  
  private generateAsciiChart(phases: PhaseData[]): string {
    const chart: string[] = [];
    const maxDay = 35;
    
    phases.forEach(phase => {
      const bar = '█'.repeat(Math.round(phase.duration));
      const padding = ' '.repeat(Math.max(0, phase.startDay - 1));
      const label = phase.name.padEnd(12);
      
      chart.push(`${label} ${padding}${bar} (Day ${phase.startDay}-${phase.endDay})`);
    });
    
    return chart.join('\n');
  }
}
```

### State Management

#### Reports Store
```typescript
export const useReportsStore = defineStore('reports', {
  state: () => ({
    library: {
      reports: [] as Report[],
      filters: {
        status: new Set<string>(),
        personas: new Set<string>(),
        dateRange: null as DateRange | null,
        phases: new Set<GamePhase>(),
        tags: new Set<string>()
      },
      sorting: {
        field: 'date' as SortField,
        direction: 'desc' as SortDirection
      },
      selection: new Set<string>(),
      pagination: {
        page: 1,
        perPage: 20,
        total: 0
      }
    },
    
    viewer: {
      activeReport: null as Report | null,
      viewMode: 'summary' as ViewMode,
      comparison: null as ComparisonView | null
    },
    
    analysis: {
      bottlenecks: null as BottleneckAnalysis | null,
      efficiency: null as EfficiencyAnalysis | null,
      progression: null as ProgressionAnalysis | null,
      recommendations: [] as Recommendation[]
    },
    
    export: {
      inProgress: false,
      format: 'json' as ExportFormat,
      options: {} as ExportOptions
    }
  }),
  
  getters: {
    filteredReports: (state) => {
      let reports = [...state.library.reports];
      
      // Apply filters
      if (state.library.filters.status.size > 0) {
        reports = reports.filter(r => 
          state.library.filters.status.has(r.results.success ? 'success' : 'failed')
        );
      }
      
      // Apply sorting
      reports.sort((a, b) => {
        const field = state.library.sorting.field;
        const direction = state.library.sorting.direction === 'asc' ? 1 : -1;
        
        switch (field) {
          case 'date':
            return direction * (a.metadata.timestamp.getTime() - b.metadata.timestamp.getTime());
          case 'completion':
            return direction * ((a.results.completionDay || 999) - (b.results.completionDay || 999));
          default:
            return 0;
        }
      });
      
      return reports;
    },
    
    paginatedReports: (state) => {
      const start = (state.library.pagination.page - 1) * state.library.pagination.perPage;
      const end = start + state.library.pagination.perPage;
      
      return state.filteredReports.slice(start, end);
    },
    
    comparisonReady: (state) => 
      state.library.selection.size >= 2,
    
    hasActiveReport: (state) => 
      state.viewer.activeReport !== null
  },
  
  actions: {
    async loadReports() {
      // Load from IndexedDB
      const reports = await reportDatabase.getAllReports();
      this.library.reports = reports;
      this.library.pagination.total = reports.length;
    },
    
    async saveReport(simulationResult: SimulationResult) {
      const report = this.createReport(simulationResult);
      await reportDatabase.saveReport(report);
      this.library.reports.push(report);
    },
    
    viewReport(reportId: string) {
      const report = this.library.reports.find(r => r.id === reportId);
      if (report) {
        this.viewer.activeReport = report;
        this.analyzeReport(report);
      }
    },
    
    async compareReports(reportIds: string[]) {
      const reports = this.library.reports.filter(r => reportIds.includes(r.id));
      
      if (reports.length >= 2) {
        this.viewer.comparison = await this.generateComparison(reports);
      }
    },
    
    async exportReports(reportIds: string[], format: ExportFormat, options?: ExportOptions) {
      this.export.inProgress = true;
      
      try {
        const reports = reportIds.length > 0 ?
          this.library.reports.filter(r => reportIds.includes(r.id)) :
          [this.viewer.activeReport!];
        
        const blob = await exportManager.export(reports, format, options);
        
        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-hero-report-${Date.now()}.${format}`;
        a.click();
        
        URL.revokeObjectURL(url);
      } finally {
        this.export.inProgress = false;
      }
    },
    
    private analyzeReport(report: Report) {
      // Run analysis algorithms
      this.analysis.bottlenecks = bottleneckDetector.analyze(report);
      this.analysis.efficiency = efficiencyCalculator.calculate(report);
      this.analysis.progression = progressionAnalyzer.analyze(report);
      this.analysis.recommendations = recommendationEngine.generate(report);
    }
  }
});
```

### Visualization Components

#### Phase Progression Chart
```typescript
class PhaseProgressionChart {
  render(phases: PhaseData[]): VNode {
    const chartData = {
      labels: phases.map(p => p.name),
      datasets: [
        {
          label: 'Actual',
          data: phases.map(p => p.duration),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Target',
          data: phases.map(p => p.targetDuration),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2
        }
      ]
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'Phase Progression vs Target'
        },
        tooltip: {
          callbacks: {
            afterLabel: (context) => {
              const phase = phases[context.dataIndex];
              const variance = phase.variance;
              return variance > 0 ? 
                `Behind by ${variance} days` : 
                `Ahead by ${Math.abs(variance)} days`;
            }
          }
        }
      }
    };
    
    return <Bar data={chartData} options={options} />;
  }
}
```

#### Bottleneck Heatmap
```typescript
class BottleneckHeatmap {
  render(reports: Report[]): VNode {
    const days = Array.from({ length: 35 }, (_, i) => i + 1);
    const personas = [...new Set(reports.map(r => r.configuration.persona.name))];
    
    // Build heatmap data
    const data = personas.map(persona => {
      return days.map(day => {
        const relevantReports = reports.filter(r => 
          r.configuration.persona.name === persona
        );
        
        const bottleneckCount = relevantReports.reduce((count, report) => {
          const dayBottlenecks = report.results.bottlenecks.filter(b =>
            b.startTime.day <= day && 
            b.startTime.day + (b.duration / 1440) >= day
          );
          return count + dayBottlenecks.length;
        }, 0);
        
        return bottleneckCount / relevantReports.length;
      });
    });
    
    return (
      <div class="bottleneck-heatmap">
        <HeatmapGrid
          data={data}
          xLabels={days.map(d => `D${d}`)}
          yLabels={personas}
          colorScale={['#10b981', '#fbbf24', '#ef4444']}
          tooltip={(x, y, value) => 
            `${personas[y]} - Day ${days[x]}: ${value.toFixed(1)} bottlenecks avg`
          }
        />
      </div>
    );
  }
}
```

### Performance Optimizations

#### Report Caching
```typescript
class ReportCache {
  private cache = new Map<string, CachedReport>();
  private maxSize = 50;
  
  get(reportId: string): Report | null {
    const cached = this.cache.get(reportId);
    
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.report;
    }
    
    return null;
  }
  
  set(report: Report) {
    // Evict LRU if at capacity
    if (this.cache.size >= this.maxSize) {
      const lru = this.findLRU();
      this.cache.delete(lru);
    }
    
    this.cache.set(report.id, {
      report,
      lastAccessed: Date.now(),
      analysisCache: new Map()
    });
  }
  
  getCachedAnalysis<T>(reportId: string, analysisType: string): T | null {
    const cached = this.cache.get(reportId);
    return cached?.analysisCache.get(analysisType) || null;
  }
  
  setCachedAnalysis(reportId: string, analysisType: string, data: any) {
    const cached = this.cache.get(reportId);
    if (cached) {
      cached.analysisCache.set(analysisType, data);
    }
  }
}
```

#### Lazy Analysis
```typescript
class LazyAnalyzer {
  private analysisQueue: AnalysisTask[] = [];
  private isProcessing = false;
  
  async queueAnalysis(report: Report, type: AnalysisType): Promise<any> {
    // Check cache first
    const cached = reportCache.getCachedAnalysis(report.id, type);
    if (cached) return cached;
    
    // Queue for analysis
    return new Promise((resolve) => {
      this.analysisQueue.push({
        report,
        type,
        callback: resolve
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.isProcessing || this.analysisQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.analysisQueue.length > 0) {
      const task = this.analysisQueue.shift()!;
      
      // Perform analysis
      const result = await this.performAnalysis(task.report, task.type);
      
      // Cache result
      reportCache.setCachedAnalysis(task.report.id, task.type, result);
      
      // Resolve promise
      task.callback(result);
      
      // Yield to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    this.isProcessing = false;
  }
}
```

### Testing & Validation

#### Report Tests
```typescript
describe('Reports System', () => {
  it('should correctly identify bottlenecks', () => {
    const report = createTestReport({
      resourceHistory: {
        energy: createCappedResource(100, 30), // Capped for 30 minutes
        gold: createShortageResource(0, 45)    // Empty for 45 minutes
      }
    });
    
    const analysis = bottleneckDetector.analyze(report);
    
    expect(analysis.bottlenecks).toHaveLength(2);
    expect(analysis.bottlenecks[0].type).toBe('resource_shortage');
    expect(analysis.bottlenecks[0].resource).toBe('gold');
    expect(analysis.bottlenecks[0].duration).toBe(45);
  });
  
  it('should generate accurate comparisons', () => {
    const reports = [
      createTestReport({ persona: 'speedrunner', completionDay: 18 }),
      createTestReport({ persona: 'casual', completionDay: 32 }),
      createTestReport({ persona: 'weekend', completionDay: 28 })
    ];
    
    const comparison = comparisonEngine.compare(reports);
    
    expect(comparison.metrics.get('completion').variance).toBe(14);
    expect(comparison.divergencePoints).toContainEqual(
      expect.objectContaining({
        metric: 'phase_transition',
        time: expect.objectContaining({ day: 10 })
      })
    );
  });
});
```

### Future Enhancements
1. **Machine Learning Insights**: Pattern recognition and prediction models
2. **Interactive Reports**: Drill-down capabilities in exported reports
3. **Video Generation**: Create video summaries of simulations
4. **Collaborative Analysis**: Share and annotate reports with team
5. **Automated Recommendations**: AI-generated balance suggestions
6. **Historical Tracking**: Version control for balance changes over time

### Conclusion
The Reports system transforms raw simulation data into actionable insights through comprehensive analysis, intelligent comparison, and flexible export capabilities. Its sophisticated algorithms for bottleneck detection, efficiency calculation, and pattern recognition ensure that every simulation contributes to better game balance decisions. The combination of detailed visualizations, professional export formats, and LLM-optimized outputs makes it an indispensable tool for data-driven game development.
