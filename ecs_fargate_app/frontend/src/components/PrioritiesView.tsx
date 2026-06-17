import React, { useMemo, useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  PieChart,
  Badge,
  Link,
  Button,
  SegmentedControl,
} from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { useChat } from './chat/ChatContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisResult } from '../types';
import {
  MatrixItem,
  QuadrantId,
  QUADRANTS,
  buildPillarColorMap,
  computeDistribution,
  computeMatrixLayout,
  getActionItems,
  levelBadgeColor,
  priorityBadgeColor,
  bestPracticeDocUrl,
  CRITICALITY_CHART_COLOR,
  PRIORITY_CHART_COLOR,
} from './utils/priority-matrix';
import './PrioritiesView.css';

interface PrioritiesViewProps {
  results: AnalysisResult[];
  lensAliasArn?: string;
  lensName: string;
}

const QUADRANT_POSITION: Record<QuadrantId, { top: string; left: string; labelSide: 'left' | 'right'; radius: React.CSSProperties }> = {
  'quick-wins': { top: '0', left: '0', labelSide: 'left', radius: { borderTopLeftRadius: 11 } },
  'major-initiatives': { top: '0', left: '50%', labelSide: 'right', radius: { borderTopRightRadius: 11 } },
  delegate: { top: '50%', left: '0', labelSide: 'left', radius: { borderBottomLeftRadius: 11 } },
  reconsider: { top: '50%', left: '50%', labelSide: 'right', radius: { borderBottomRightRadius: 11 } },
};

const QUADRANT_ORDER: QuadrantId[] = ['quick-wins', 'major-initiatives', 'delegate', 'reconsider'];

export const PrioritiesView: React.FC<PrioritiesViewProps> = ({ results, lensAliasArn, lensName }) => {
  const { strings } = useLanguage();
  const p = strings.priorities;
  const ar = strings.analysisResults;
  const { openChatWithSupportPrompt } = useChat();

  const lensAlias = lensAliasArn?.split('/')?.pop() || 'wellarchitected';

  // Localized labels for the rated enum values (matching the Analysis Results table).
  const localizePriority = (v?: string): string =>
    v === 'Immediate'
      ? ar.priorityImmediate
      : v === 'Short-term'
      ? ar.priorityShortTerm
      : v === 'Long-term'
      ? ar.priorityLongTerm
      : ar.notApplicable;
  const localizeLevel = (v?: string): string =>
    v === 'High' ? ar.levelHigh : v === 'Medium' ? ar.levelMedium : v === 'Low' ? ar.levelLow : ar.notApplicable;

  const [colorBy, setColorBy] = useState<'pillar' | 'priority'>('pillar');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [activePillars, setActivePillars] = useState<Set<string>>(new Set());

  // --- Derived data (memoized) ---------------------------------------------
  const actionItems = useMemo(() => getActionItems(results), [results]);
  const matrixItems = useMemo(() => computeMatrixLayout(actionItems), [actionItems]);
  const distribution = useMemo(() => computeDistribution(results), [results]);

  const pillarNames = useMemo(() => {
    const seen: string[] = [];
    actionItems.forEach((item) => {
      if (!seen.includes(item.pillar)) seen.push(item.pillar);
    });
    return seen;
  }, [actionItems]);

  const pillarColorMap = useMemo(() => buildPillarColorMap(pillarNames), [pillarNames]);

  // Active pillar set defaults to "all" (empty = all visible).
  const isPillarActive = (pillar: string) => activePillars.size === 0 || activePillars.has(pillar);

  const dotColor = (item: MatrixItem): string =>
    colorBy === 'priority'
      ? PRIORITY_CHART_COLOR[item.priority || 'N/A']
      : pillarColorMap[item.pillar] || PRIORITY_CHART_COLOR['N/A'];

  const selectedItem = matrixItems.find((m) => m.uid === selectedUid) || null;

  const askAssistant = (item: MatrixItem) => {
    const prompt = `Can you provide more detailed recommendations and instructions for the best practice '${item.name}' of the '${item.pillar}' pillar?`;
    openChatWithSupportPrompt(prompt);
  };

  const togglePillar = (pillar: string) => {
    setActivePillars((prev) => {
      // Build the current effective "on" set, then toggle.
      const allOn = prev.size === 0;
      const next = new Set(allOn ? pillarNames : prev);
      if (next.has(pillar)) {
        next.delete(pillar);
      } else {
        next.add(pillar);
      }
      // If everything ends up selected, collapse back to "all" (empty set).
      if (next.size === pillarNames.length || next.size === 0) {
        return new Set();
      }
      return next;
    });
  };

  const resetPillars = () => setActivePillars(new Set());

  // --- Pie chart data ------------------------------------------------------
  const priorityChartData = [
    { title: ar.priorityImmediate, value: distribution.priority.Immediate, color: PRIORITY_CHART_COLOR.Immediate },
    { title: ar.priorityShortTerm, value: distribution.priority['Short-term'], color: PRIORITY_CHART_COLOR['Short-term'] },
    { title: ar.priorityLongTerm, value: distribution.priority['Long-term'], color: PRIORITY_CHART_COLOR['Long-term'] },
  ].filter((d) => d.value > 0);

  const criticalityChartData = [
    { title: ar.levelHigh, value: distribution.criticality.High, color: CRITICALITY_CHART_COLOR.High },
    { title: ar.levelMedium, value: distribution.criticality.Medium, color: CRITICALITY_CHART_COLOR.Medium },
    { title: ar.levelLow, value: distribution.criticality.Low, color: CRITICALITY_CHART_COLOR.Low },
  ].filter((d) => d.value > 0);

  const criticalityTotal =
    distribution.criticality.High + distribution.criticality.Medium + distribution.criticality.Low;

  const priorityTotal =
    distribution.priority.Immediate + distribution.priority['Short-term'] + distribution.priority['Long-term'];

  // --- Render --------------------------------------------------------------
  return (
    <SpaceBetween size="l">
      {/* Overview: number + two pie charts */}
      <Container
        header={
          <Header variant="h3" info={<HelpButton contentId="priorities" />}>
            {p.overviewTitle}
          </Header>
        }
      >
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">{p.bestPracticesAnalyzed}</Box>
            <Box fontSize="display-l" fontWeight="bold" color="text-status-info">
              {distribution.reviewed}
            </Box>
            <SpaceBetween size="xxs">
              <Box color="text-body-secondary" fontSize="body-s">
                {ar.bestPracticesApplied}: {distribution.applied}
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                {ar.bestPracticesNotApplied}: {distribution.notApplied}
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                {ar.bestPracticesNotRelevant}: {distribution.notRelevant}
              </Box>
            </SpaceBetween>
          </div>

          <div>
            <Box variant="awsui-key-label">{p.priorityDistribution}</Box>
            <PieChart
              data={priorityChartData}
              size="small"
              variant="donut"
              innerMetricValue={`${priorityTotal}`}
              innerMetricDescription={ar.priority}
              hideFilter
              ariaLabel={p.priorityDistribution}
              empty={
                <Box textAlign="center" color="inherit">
                  {p.noPriorityData}
                </Box>
              }
              segmentDescription={(datum, sum) =>
                `${datum.value} (${sum > 0 ? Math.round((datum.value / sum) * 100) : 0}%)`
              }
            />
          </div>

          <div>
            <Box variant="awsui-key-label">{p.criticalityDistribution}</Box>
            <PieChart
              data={criticalityChartData}
              size="small"
              variant="donut"
              innerMetricValue={`${criticalityTotal}`}
              innerMetricDescription={ar.criticality}
              hideFilter
              ariaLabel={p.criticalityDistribution}
              empty={
                <Box textAlign="center" color="inherit">
                  {p.noPriorityData}
                </Box>
              }
              segmentDescription={(datum, sum) =>
                `${datum.value} (${sum > 0 ? Math.round((datum.value / sum) * 100) : 0}%)`
              }
            />
          </div>
        </ColumnLayout>
      </Container>

      {/* Matrix + detail panel */}
      <Container
        disableContentPaddings
        header={
          <Header
            variant="h3"
            info={<HelpButton contentId="priorities" />}
            description={p.matrixDescription}
            actions={
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Box color="text-body-secondary" fontSize="body-s">
                  {p.colorBy}
                </Box>
                <SegmentedControl
                  selectedId={colorBy}
                  onChange={({ detail }) => setColorBy(detail.selectedId as 'pillar' | 'priority')}
                  label={p.colorBy}
                  options={[
                    { id: 'pillar', text: p.colorByPillar },
                    { id: 'priority', text: p.colorByPriority },
                  ]}
                />
              </SpaceBetween>
            }
          >
            {p.matrixTitle}
          </Header>
        }
      >
        <div className="priority-matrix-layout">
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #e9ebed' }}>
              <MatrixLegend
                colorBy={colorBy}
                pillarNames={pillarNames}
                pillarColorMap={pillarColorMap}
                isPillarActive={isPillarActive}
                onTogglePillar={togglePillar}
                onReset={resetPillars}
                allPillarsActive={activePillars.size === 0}
                strings={{ pillars: p.pillars, reset: p.reset, colorByPriority: p.colorByPriority }}
                priorityLabels={{
                  Immediate: ar.priorityImmediate,
                  'Short-term': ar.priorityShortTerm,
                  'Long-term': ar.priorityLongTerm,
                }}
              />
            </div>
            <PriorityPlot
              items={matrixItems}
              colorBy={colorBy}
              dotColor={dotColor}
              isPillarActive={isPillarActive}
              selectedUid={selectedUid}
              onSelect={(uid) => setSelectedUid((cur) => (cur === uid ? null : uid))}
              hoveredUid={hoveredUid}
              onHover={setHoveredUid}
              quadrantStrings={{
                'quick-wins': { title: p.quadrantQuickWins, sub: p.quadrantQuickWinsSub },
                'major-initiatives': { title: p.quadrantMajor, sub: p.quadrantMajorSub },
                delegate: { title: p.quadrantDelegate, sub: p.quadrantDelegateSub },
                reconsider: { title: p.quadrantReconsider, sub: p.quadrantReconsiderSub },
              }}
              axisStrings={{
                impact: p.axisImpact,
                effort: p.axisEffort,
                high: p.axisHigh,
                low: p.axisLow,
              }}
              tooltipLabels={{
                criticality: ar.criticality,
                complexity: ar.complexity,
                priority: ar.priority,
              }}
              localizePriority={localizePriority}
              localizeLevel={localizeLevel}
            />
          </div>
          <div className="priority-matrix-detail">
            <SelectedDetail
              item={selectedItem}
              lensAlias={lensAlias}
              lensName={lensName}
              onAskAssistant={askAssistant}
              onClear={() => setSelectedUid(null)}
              pillarColorMap={pillarColorMap}
              localizePriority={localizePriority}
              localizeLevel={localizeLevel}
              strings={p}
              levelStrings={{
                criticality: ar.criticality,
                criticalityReason: ar.criticalityReason,
                complexity: ar.complexity,
                complexityReason: ar.complexityReason,
                priority: ar.priority,
                priorityReason: ar.priorityReason,
              }}
            />
          </div>
        </div>
      </Container>
    </SpaceBetween>
  );
};

// ===========================================================================
// Matrix plot
// ===========================================================================
interface PriorityPlotProps {
  items: MatrixItem[];
  colorBy: 'pillar' | 'priority';
  dotColor: (item: MatrixItem) => string;
  isPillarActive: (pillar: string) => boolean;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
  hoveredUid: string | null;
  onHover: (uid: string | null) => void;
  quadrantStrings: Record<QuadrantId, { title: string; sub: string }>;
  axisStrings: { impact: string; effort: string; high: string; low: string };
  tooltipLabels: { criticality: string; complexity: string; priority: string };
  localizePriority: (v?: string) => string;
  localizeLevel: (v?: string) => string;
}

const PriorityPlot: React.FC<PriorityPlotProps> = ({
  items,
  dotColor,
  isPillarActive,
  selectedUid,
  onSelect,
  hoveredUid,
  onHover,
  quadrantStrings,
  axisStrings,
  tooltipLabels,
  localizePriority,
  localizeLevel,
}) => {
  const { language } = useLanguage();
  // CJK scripts (Japanese, Korean) render upright in vertical writing mode and
  // must not be rotated 180deg, which would otherwise flip them upside down.
  const isCjkLanguage = language === 'ja' || language === 'ko';

  const quadrantCounts: Record<QuadrantId, number> = {
    'quick-wins': 0,
    'major-initiatives': 0,
    delegate: 0,
    reconsider: 0,
  };
  items.forEach((item) => {
    if (isPillarActive(item.pillar)) quadrantCounts[item.quadrant] += 1;
  });

  const hoveredItem = hoveredUid ? items.find((i) => i.uid === hoveredUid) : null;

  return (
    <div className="priority-matrix-plot-wrapper">
      {/* Y axis */}
      <div className="priority-matrix-yaxis">
        <span className="priority-matrix-axis-end">{axisStrings.high}</span>
        <span className={isCjkLanguage ? 'priority-matrix-yaxis-label--cjk' : 'priority-matrix-yaxis-label'}>
          {axisStrings.impact}
        </span>
        <span className="priority-matrix-axis-end">{axisStrings.low}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="priority-matrix-plot">
          {/* Quadrant backgrounds */}
          {QUADRANT_ORDER.map((q) => {
            const meta = QUADRANTS[q];
            const pos = QUADRANT_POSITION[q];
            const borderRight = pos.left === '0' ? '1px dashed #c6c6cd' : 'none';
            const borderBottom = pos.top === '0' ? '1px dashed #c6c6cd' : 'none';
            return (
              <div
                key={q}
                className="priority-matrix-quadrant"
                style={{
                  top: pos.top,
                  left: pos.left,
                  background: meta.tint,
                  borderRight,
                  borderBottom,
                  ...pos.radius,
                }}
              >
                <div
                  className="priority-matrix-quadrant-label"
                  style={
                    pos.labelSide === 'right'
                      ? { right: 12, flexDirection: 'row-reverse' }
                      : { left: 12 }
                  }
                >
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.accent }} />
                  <span>{quadrantStrings[q].title}</span>
                  <Badge color="grey">{quadrantCounts[q]}</Badge>
                </div>
                <div
                  className="priority-matrix-quadrant-sub"
                  style={
                    pos.labelSide === 'right'
                      ? { right: 12, top: 32, textAlign: 'right' }
                      : { left: 12, top: 32 }
                  }
                >
                  {quadrantStrings[q].sub}
                </div>
              </div>
            );
          })}

          {/* Dots */}
          {items.map((item) => {
            const active = isPillarActive(item.pillar);
            const selected = selectedUid === item.uid;
            const color = active ? dotColor(item) : '#cdd3da';
            const dim = active ? 1 : 0.28;
            const size = selected ? 20 : 14;
            return (
              <button
                key={item.uid}
                type="button"
                className="priority-matrix-dot"
                aria-label={item.name}
                title={item.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item.uid);
                }}
                onMouseEnter={() => onHover(item.uid)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(item.uid)}
                onBlur={() => onHover(null)}
                style={{
                  left: `${item.x * 100}%`,
                  top: `${(1 - item.y) * 100}%`,
                  width: size,
                  height: size,
                  background: color,
                  border: selected ? '3px solid #ffffff' : '2px solid #ffffff',
                  boxShadow: selected
                    ? `0 0 0 2px ${color}, 0 2px 6px rgba(0,7,22,0.35)`
                    : '0 1px 3px rgba(0,7,22,0.3)',
                  opacity: dim,
                  zIndex: selected ? 5 : active ? 3 : 1,
                }}
              />
            );
          })}

          {/* Hover tooltip */}
          {hoveredItem && (
            <div
              className="priority-matrix-tooltip"
              style={{
                left: `${hoveredItem.x * 100}%`,
                top: `${(1 - hoveredItem.y) * 100}%`,
                marginTop: -12,
              }}
            >
              <div className="priority-matrix-tooltip-title">{hoveredItem.name}</div>
              <div className="priority-matrix-tooltip-row">{hoveredItem.pillar}</div>
              <div className="priority-matrix-tooltip-row" style={{ marginTop: 4 }}>
                {tooltipLabels.criticality}: {localizeLevel(hoveredItem.criticality)} · {tooltipLabels.complexity}:{' '}
                {localizeLevel(hoveredItem.complexity)}
              </div>
              <div className="priority-matrix-tooltip-row">
                {tooltipLabels.priority}: {localizePriority(hoveredItem.priority)}
              </div>
            </div>
          )}
        </div>

        {/* X axis */}
        <div className="priority-matrix-xaxis">
          <span className="priority-matrix-axis-end">{axisStrings.low}</span>
          <span className="priority-matrix-xaxis-label">{axisStrings.effort}</span>
          <span className="priority-matrix-axis-end">{axisStrings.high}</span>
        </div>
      </div>
    </div>
  );
};

// ===========================================================================
// Legend
// ===========================================================================
interface MatrixLegendProps {
  colorBy: 'pillar' | 'priority';
  pillarNames: string[];
  pillarColorMap: Record<string, string>;
  isPillarActive: (pillar: string) => boolean;
  onTogglePillar: (pillar: string) => void;
  onReset: () => void;
  allPillarsActive: boolean;
  strings: { pillars: string; reset: string; colorByPriority: string };
  priorityLabels: { Immediate: string; 'Short-term': string; 'Long-term': string };
}

const MatrixLegend: React.FC<MatrixLegendProps> = ({
  colorBy,
  pillarNames,
  pillarColorMap,
  isPillarActive,
  onTogglePillar,
  onReset,
  allPillarsActive,
  strings,
  priorityLabels,
}) => {
  if (colorBy === 'priority') {
    const entries: Array<['Immediate' | 'Short-term' | 'Long-term', string]> = [
      ['Immediate', priorityLabels.Immediate],
      ['Short-term', priorityLabels['Short-term']],
      ['Long-term', priorityLabels['Long-term']],
    ];
    return (
      <div className="priority-matrix-legend">
        {entries.map(([key, label]) => (
          <span
            key={key}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#414d5c' }}
          >
            <span
              className="priority-chip-swatch"
              style={{ background: PRIORITY_CHART_COLOR[key] }}
            />
            {label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="priority-matrix-legend">
      <span style={{ fontSize: 12, color: '#5f6b7a', marginRight: 2 }}>{strings.pillars}:</span>
      {pillarNames.map((name) => {
        const on = isPillarActive(name);
        return (
          <span
            key={name}
            className={`priority-chip ${on ? 'on' : 'off'}`}
            onClick={() => onTogglePillar(name)}
            role="button"
            aria-pressed={on}
          >
            <span className="priority-chip-swatch" style={{ background: pillarColorMap[name] }} />
            {name}
          </span>
        );
      })}
      {!allPillarsActive && (
        <Link onFollow={onReset}>{strings.reset}</Link>
      )}
    </div>
  );
};

// ===========================================================================
// Selected best practice detail panel
// ===========================================================================
interface SelectedDetailProps {
  item: MatrixItem | null;
  lensAlias: string;
  lensName: string;
  onAskAssistant: (item: MatrixItem) => void;
  onClear: () => void;
  pillarColorMap: Record<string, string>;
  localizePriority: (v?: string) => string;
  localizeLevel: (v?: string) => string;
  strings: Record<string, string>;
  levelStrings: {
    criticality: string;
    criticalityReason: string;
    complexity: string;
    complexityReason: string;
    priority: string;
    priorityReason: string;
  };
}

const SelectedDetail: React.FC<SelectedDetailProps> = ({
  item,
  lensAlias,
  lensName,
  onAskAssistant,
  onClear,
  pillarColorMap,
  localizePriority,
  localizeLevel,
  strings,
  levelStrings,
}) => {
  if (!item) {
    return (
      <Box textAlign="center" color="text-body-secondary" padding={{ vertical: 'xxl', horizontal: 's' }}>
        <SpaceBetween size="s">
          <Box variant="strong" color="text-body-secondary">
            {strings.noSelectionTitle}
          </Box>
          <Box color="text-body-secondary" fontSize="body-s">
            {strings.noSelectionDescription}
          </Box>
        </SpaceBetween>
      </Box>
    );
  }

  const quadrantInfo: Record<QuadrantId, { title: string; action: string }> = {
    'quick-wins': { title: strings.quadrantQuickWins, action: strings.quadrantQuickWinsAction },
    'major-initiatives': { title: strings.quadrantMajor, action: strings.quadrantMajorAction },
    delegate: { title: strings.quadrantDelegate, action: strings.quadrantDelegateAction },
    reconsider: { title: strings.quadrantReconsider, action: strings.quadrantReconsiderAction },
  };
  const quad = quadrantInfo[item.quadrant];
  const accent = QUADRANTS[item.quadrant].accent;

  const reasonBlock = (label: string, value?: string) =>
    value && value !== 'N/A' ? (
      <div>
        <Box variant="awsui-key-label">{label}</Box>
        <Box>{value}</Box>
      </div>
    ) : null;

  return (
    <SpaceBetween size="m">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{ width: 10, height: 10, borderRadius: '50%', background: pillarColorMap[item.pillar], flex: 'none' }}
          />
          <Box variant="strong">{item.pillar}</Box>
        </span>
        <Button iconName="close" variant="icon" ariaLabel={strings.clearSelection} onClick={onClear} />
      </div>

      <div>
        <Link external href={bestPracticeDocUrl(item, lensAlias, lensName)}>
          {item.name}
        </Link>
        <Box color="text-body-secondary" fontSize="body-s" padding={{ top: 'xxs' }}>
          {item.question}
        </Box>
      </div>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: QUADRANTS[item.quadrant].tint,
          border: `1px solid ${accent}33`,
          borderRadius: 8,
          padding: '5px 10px',
          width: 'fit-content',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: accent }} />
        <Box variant="strong" fontSize="body-s">
          {quad.title}
        </Box>
        <Box color="text-body-secondary" fontSize="body-s">
          · {quad.action}
        </Box>
      </span>

      <ColumnLayout columns={3} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">{levelStrings.priority}</Box>
          <Badge color={priorityBadgeColor(item.priority)}>{localizePriority(item.priority)}</Badge>
        </div>
        <div>
          <Box variant="awsui-key-label">{levelStrings.criticality}</Box>
          <Badge color={levelBadgeColor(item.criticality)}>{localizeLevel(item.criticality)}</Badge>
        </div>
        <div>
          <Box variant="awsui-key-label">{levelStrings.complexity}</Box>
          <Badge color={levelBadgeColor(item.complexity)}>{localizeLevel(item.complexity)}</Badge>
        </div>
      </ColumnLayout>

      {reasonBlock(strings.whyNotApplied, item.reasonNotApplied)}
      {reasonBlock(strings.recommendation, item.recommendations)}

      <Button iconName="gen-ai" onClick={() => onAskAssistant(item)}>
        {strings.askAssistant}
      </Button>

      {reasonBlock(levelStrings.priorityReason, item.priorityReason)}
      {reasonBlock(levelStrings.criticalityReason, item.criticalityReason)}
      {reasonBlock(levelStrings.complexityReason, item.complexityReason)}
    </SpaceBetween>
  );
};

export default PrioritiesView;
