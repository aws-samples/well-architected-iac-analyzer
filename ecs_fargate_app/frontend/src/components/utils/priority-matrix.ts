/**
 * priority-matrix.ts
 *
 * Pure (UI-agnostic) helpers powering the "Priorities" tab.
 *
 * Responsibilities:
 *  - Flatten analysis results into a single list of best practices.
 *  - Detect whether a result set contains Prioritization Framework data
 *    (Criticality / Complexity / Priority). Legacy analyses produced before the
 *    framework existed do not, and the Priorities tab is disabled for them.
 *  - Classify each actionable best practice into an Eisenhower-style quadrant.
 *  - Deterministically position each best practice inside the matrix so that
 *    items never overlap and their placement reflects their Criticality (impact,
 *    Y axis) and Complexity (effort, X axis).
 *  - Provide the color maps used by the matrix dots and the pie charts.
 */
import {
  colorChartsStatusHigh,
  colorChartsStatusMedium,
  colorChartsStatusPositive,
  colorChartsStatusNeutral,
  colorChartsStatusInfo,
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5,
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9,
  colorChartsPaletteCategorical10,
} from '@cloudscape-design/design-tokens';
import {
  AnalysisResult,
  BestPractice,
  CriticalityLevel,
  ComplexityLevel,
} from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuadrantId = 'quick-wins' | 'major-initiatives' | 'delegate' | 'reconsider';

/** A best practice flattened together with its parent pillar/question context. */
export interface FlatBestPractice extends BestPractice {
  /** Stable unique key for React lists (bp ids can repeat across questions). */
  uid: string;
  /** Pillar display name (taken from the parent AnalysisResult). */
  pillar: string;
  /** Question display text (taken from the parent AnalysisResult). */
  question: string;
}

/** A best practice that has been placed on the matrix. */
export interface MatrixItem extends FlatBestPractice {
  quadrant: QuadrantId;
  /** Horizontal position 0..1 (0 = low effort / left, 1 = high effort / right). */
  x: number;
  /** Vertical position 0..1 (0 = low impact / bottom, 1 = high impact / top). */
  y: number;
}

export interface QuadrantMeta {
  id: QuadrantId;
  accent: string;
  tint: string;
}

// ---------------------------------------------------------------------------
// Level helpers
// ---------------------------------------------------------------------------

const RATED_LEVELS = ['High', 'Medium', 'Low'];

const isRatedLevel = (value?: string): boolean =>
  !!value && RATED_LEVELS.includes(value);

/** Order used when sorting by criticality / complexity (High first). */
export const LEVEL_RANK: Record<string, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  'N/A': 3,
};

/** Order used when sorting by priority (Immediate first). */
export const PRIORITY_RANK: Record<string, number> = {
  Immediate: 0,
  'Short-term': 1,
  'Long-term': 2,
  'N/A': 3,
};

// ---------------------------------------------------------------------------
// Color maps (data visualization)
// ---------------------------------------------------------------------------

/** Semantic colors for the criticality pie chart and matrix legend. */
export const CRITICALITY_CHART_COLOR: Record<string, string> = {
  High: colorChartsStatusHigh,
  Medium: colorChartsStatusMedium,
  Low: colorChartsStatusPositive,
  'N/A': colorChartsStatusNeutral,
};

/** Semantic colors for the priority pie chart and matrix legend. */
export const PRIORITY_CHART_COLOR: Record<string, string> = {
  Immediate: colorChartsStatusHigh,
  'Short-term': colorChartsStatusInfo,
  'Long-term': colorChartsStatusPositive,
  'N/A': colorChartsStatusNeutral,
};

/** Cloudscape <Badge> color names, matching the Analysis Results table. */
export const levelBadgeColor = (value?: string): 'red' | 'blue' | 'green' | 'grey' => {
  switch (value) {
    case 'High':
      return 'red';
    case 'Medium':
      return 'blue';
    case 'Low':
      return 'green';
    default:
      return 'grey';
  }
};

export const priorityBadgeColor = (value?: string): 'red' | 'blue' | 'green' | 'grey' => {
  switch (value) {
    case 'Immediate':
      return 'red';
    case 'Short-term':
      return 'blue';
    case 'Long-term':
      return 'green';
    default:
      return 'grey';
  }
};

const PILLAR_PALETTE = [
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5,
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9,
  colorChartsPaletteCategorical10,
];

/**
 * Assigns a stable categorical color to each pillar name, in order of first
 * appearance. Works for any lens, including custom lenses with arbitrary
 * pillar names.
 */
export function buildPillarColorMap(pillarNames: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  pillarNames.forEach((name, index) => {
    if (!(name in map)) {
      map[name] = PILLAR_PALETTE[index % PILLAR_PALETTE.length];
    }
  });
  return map;
}

// ---------------------------------------------------------------------------
// Quadrant metadata
// ---------------------------------------------------------------------------

export const QUADRANTS: Record<QuadrantId, QuadrantMeta> = {
  'quick-wins': { id: 'quick-wins', accent: '#d91515', tint: '#fff5f5' },
  'major-initiatives': { id: 'major-initiatives', accent: '#0972d3', tint: '#f0f7ff' },
  delegate: { id: 'delegate', accent: '#037f0c', tint: '#f1faf2' },
  reconsider: { id: 'reconsider', accent: '#5f6b7a', tint: '#f7f8f9' },
};

/**
 * Maps a (criticality, complexity) pair to an Eisenhower quadrant.
 *
 *  - "High impact"  => criticality is High OR Medium
 *  - "Low effort"   => complexity is Low OR Medium
 *
 *      Low effort        High effort
 *   +----------------+----------------+
 *   |  Quick wins    | Major          |  High impact
 *   |  (do first)    | initiatives    |
 *   +----------------+----------------+
 *   |  Delegate      | Reconsider     |  Low impact
 *   +----------------+----------------+
 */
export function getQuadrant(
  criticality: CriticalityLevel | undefined,
  complexity: ComplexityLevel | undefined,
): QuadrantId {
  const impactHigh = criticality === 'High' || criticality === 'Medium';
  const lowEffort = complexity === 'Low' || complexity === 'Medium';
  if (impactHigh && lowEffort) return 'quick-wins';
  if (impactHigh && !lowEffort) return 'major-initiatives';
  if (!impactHigh && lowEffort) return 'delegate';
  return 'reconsider';
}

// ---------------------------------------------------------------------------
// Flattening & detection
// ---------------------------------------------------------------------------

/**
 * Flattens analysis results into a single list, attaching the parent pillar and
 * question to every best practice and generating a stable unique key.
 */
export function flattenBestPractices(results: AnalysisResult[] | null | undefined): FlatBestPractice[] {
  if (!results) return [];
  return results.flatMap((result, ri) =>
    (result.bestPractices || []).map((bp, bi) => ({
      ...bp,
      uid: `${result.questionId || ri}__${bp.id || bp.name}__${bi}`,
      pillar: result.pillar,
      question: result.question,
    })),
  );
}

/**
 * Returns true when the result set contains Prioritization Framework data, i.e.
 * at least one best practice with a rated Criticality / Complexity / Priority.
 *
 * Legacy analyses (produced before the framework existed) leave these fields
 * undefined, so the Priorities tab is disabled for them. A brand-new analysis
 * where every relevant best practice is already applied also returns false —
 * in that case there is nothing to prioritize.
 */
export function hasPrioritizationData(results: AnalysisResult[] | null | undefined): boolean {
  if (!results) return false;
  return results.some((result) =>
    (result.bestPractices || []).some(
      (bp) =>
        (bp.priority && bp.priority !== 'N/A') ||
        isRatedLevel(bp.criticality) ||
        isRatedLevel(bp.complexity),
    ),
  );
}

/**
 * The best practices that need action and can be plotted on the matrix:
 * relevant, not applied, and with a rated criticality and complexity.
 */
export function getActionItems(results: AnalysisResult[] | null | undefined): FlatBestPractice[] {
  return flattenBestPractices(results).filter(
    (bp) => bp.relevant && !bp.applied && isRatedLevel(bp.criticality) && isRatedLevel(bp.complexity),
  );
}

// ---------------------------------------------------------------------------
// Distributions (for the pie charts)
// ---------------------------------------------------------------------------

export interface Distribution {
  reviewed: number;
  applied: number;
  notApplied: number;
  notRelevant: number;
  priority: { Immediate: number; 'Short-term': number; 'Long-term': number };
  criticality: { High: number; Medium: number; Low: number; 'N/A': number };
}

export function computeDistribution(results: AnalysisResult[] | null | undefined): Distribution {
  const all = flattenBestPractices(results);
  const dist: Distribution = {
    reviewed: all.length,
    applied: 0,
    notApplied: 0,
    notRelevant: 0,
    priority: { Immediate: 0, 'Short-term': 0, 'Long-term': 0 },
    criticality: { High: 0, Medium: 0, Low: 0, 'N/A': 0 },
  };

  all.forEach((bp) => {
    if (!bp.relevant) {
      dist.notRelevant += 1;
    } else if (bp.applied) {
      dist.applied += 1;
    } else {
      dist.notApplied += 1;
    }

    // Criticality distribution across every reviewed best practice.
    const crit = isRatedLevel(bp.criticality) ? (bp.criticality as string) : 'N/A';
    dist.criticality[crit as keyof Distribution['criticality']] += 1;

    // Priority distribution only for actionable (relevant + not applied) items.
    if (bp.relevant && !bp.applied && bp.priority && bp.priority !== 'N/A') {
      const prio = bp.priority as keyof Distribution['priority'];
      if (prio in dist.priority) {
        dist.priority[prio] += 1;
      }
    }
  });

  return dist;
}

// ---------------------------------------------------------------------------
// Deterministic matrix layout
// ---------------------------------------------------------------------------

/**
 * Vertical bands (impact) per criticality level — the maximum box an item of
 * that criticality may occupy. Coordinates are fractions with 1 = top. The
 * quadrant divider sits at y = 0.5: "Low" lives entirely below it,
 * "Medium"/"High" entirely above it. The bands are disjoint, so cells never
 * collide across criticality levels.
 */
const CRIT_BANDS: Record<string, [number, number]> = {
  High: [0.68, 0.95],
  Medium: [0.52, 0.66],
  Low: [0.06, 0.45],
  'N/A': [0.43, 0.57],
};

/**
 * Horizontal bands (effort) per complexity level. The quadrant divider sits at
 * x = 0.5: "Low"/"Medium" live entirely left of it, "High" entirely right of it.
 */
const COMP_BANDS: Record<string, [number, number]> = {
  Low: [0.05, 0.26],
  Medium: [0.30, 0.46],
  High: [0.56, 0.95],
  'N/A': [0.43, 0.57],
};

/**
 * Representative center for each level. Items of a given criticality/complexity
 * are clustered tightly around this point (rather than filling the whole band),
 * so that items sharing the same level stay grouped together.
 */
const CRIT_CENTER: Record<string, number> = { High: 0.82, Medium: 0.60, Low: 0.22, 'N/A': 0.5 };
const COMP_CENTER: Record<string, number> = { Low: 0.16, Medium: 0.38, High: 0.74, 'N/A': 0.5 };

/** Preferred spacing between adjacent dots, in fraction-of-plot units. */
const DOT_SPACING = 0.058;

interface Box {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Packs n items into a compact grid clustered around `center`, never overlapping
 * and never leaving `box` (the box keeps the cluster inside its quadrant and
 * away from neighboring cells). With few items the cluster is tight around the
 * center; with many items the spacing shrinks so they still fit within the box.
 */
function packCell(items: FlatBestPractice[], box: Box, center: { x: number; y: number }): MatrixItem[] {
  const n = items.length;
  const withMeta = (bp: FlatBestPractice, x: number, y: number): MatrixItem => ({
    ...bp,
    quadrant: getQuadrant(bp.criticality, bp.complexity),
    x,
    y,
  });

  if (n === 1) {
    return [withMeta(items[0], center.x, center.y)];
  }

  const boxW = box.xMax - box.xMin;
  const boxH = box.yMax - box.yMin;

  // Choose a near-square grid that respects the box aspect ratio.
  const aspect = boxW / boxH;
  let cols = Math.max(1, Math.round(Math.sqrt(n * aspect)));
  cols = Math.min(cols, n);
  const rows = Math.ceil(n / cols);

  // Use the preferred spacing, shrinking only if the grid would exceed the box.
  const stepX = cols > 1 ? Math.min(DOT_SPACING, boxW / cols) : DOT_SPACING;
  const stepY = rows > 1 ? Math.min(DOT_SPACING, boxH / rows) : DOT_SPACING;

  const gridW = (cols - 1) * stepX;
  const gridH = (rows - 1) * stepY;
  const halfW = gridW / 2;
  const halfH = gridH / 2;

  // Center the cluster on the level center, clamped so it stays inside the box.
  const cx = Math.min(Math.max(center.x, box.xMin + halfW), box.xMax - halfW);
  const cy = Math.min(Math.max(center.y, box.yMin + halfH), box.yMax - halfH);

  return items.map((bp, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const itemsInRow = r === rows - 1 ? n - r * cols : cols;

    let x: number;
    if (cols === 1) {
      x = cx;
    } else if (itemsInRow < cols) {
      // Center the partial last row under the cluster center.
      const rowW = (itemsInRow - 1) * stepX;
      x = cx - rowW / 2 + c * stepX;
    } else {
      x = cx - halfW + c * stepX;
    }

    const y = cy + halfH - r * stepY; // first row renders highest
    return withMeta(bp, x, y);
  });
}

/**
 * Produces the deterministic matrix layout for the given action items.
 *
 * Items are grouped into (criticality x complexity) cells; each cell occupies a
 * disjoint rectangle whose position encodes impact (Y) and effort (X). Within a
 * cell items are packed on a grid so nothing overlaps. The result is fully
 * deterministic: the same input always yields the same positions.
 */
export function computeMatrixLayout(items: FlatBestPractice[]): MatrixItem[] {
  const cells = new Map<string, FlatBestPractice[]>();
  items.forEach((bp) => {
    const key = `${bp.criticality}|${bp.complexity}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(bp);
  });

  const layout: MatrixItem[] = [];
  cells.forEach((group, key) => {
    const [crit, comp] = key.split('|');
    const [yMin, yMax] = CRIT_BANDS[crit] || CRIT_BANDS['N/A'];
    const [xMin, xMax] = COMP_BANDS[comp] || COMP_BANDS['N/A'];
    const center = {
      x: COMP_CENTER[comp] ?? COMP_CENTER['N/A'],
      y: CRIT_CENTER[crit] ?? CRIT_CENTER['N/A'],
    };

    // Stable ordering within a cell so positions never shuffle between renders.
    const sorted = [...group].sort((a, b) => {
      const pr =
        (PRIORITY_RANK[a.priority || 'N/A'] ?? 3) - (PRIORITY_RANK[b.priority || 'N/A'] ?? 3);
      if (pr !== 0) return pr;
      return a.uid.localeCompare(b.uid);
    });

    layout.push(...packCell(sorted, { xMin, xMax, yMin, yMax }, center));
  });

  return layout;
}

/** Sorts action items the way the action-plan table presents them. */
export function sortByPriority(items: MatrixItem[]): MatrixItem[] {
  return [...items].sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority || 'N/A'] ?? 3) - (PRIORITY_RANK[b.priority || 'N/A'] ?? 3);
    if (pr !== 0) return pr;
    const cr = (LEVEL_RANK[a.criticality || 'N/A'] ?? 3) - (LEVEL_RANK[b.criticality || 'N/A'] ?? 3);
    if (cr !== 0) return cr;
    const cx = (LEVEL_RANK[a.complexity || 'N/A'] ?? 3) - (LEVEL_RANK[b.complexity || 'N/A'] ?? 3);
    if (cx !== 0) return cx;
    return a.name.localeCompare(b.name);
  });
}

/** Builds the documentation URL for a best practice, matching AnalysisResults. */
export function bestPracticeDocUrl(
  item: FlatBestPractice,
  lensAlias: string,
  lensName: string,
): string {
  if (lensAlias === 'wellarchitected') {
    return `https://docs.aws.amazon.com/wellarchitected/latest/framework/${item.id}.html`;
  }
  return `https://docs.aws.amazon.com/search/doc-search.html?searchPath=documentation-guide&searchQuery=${encodeURIComponent(
    `"${lensName}"+"${item.pillar}"`,
  )}`;
}
