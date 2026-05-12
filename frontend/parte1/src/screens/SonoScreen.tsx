// ─────────────────────────────────────────────────────────────
//  src/screens/SonoScreen.tsx
//  MONITOR DE SONO
//
//  Estrutura:
//  1. Header    → título + ícone de calendário
//  2. Tabs      → Hoje | 7 dias | 30 dias
//  3. Score     → anel de pontuação do sono
//  4. Stats     → grid com métricas rápidas
//  5. Gráfico   → linha do tempo das fases (SVG)
//  6. Fases     → barras de progresso de cada fase
//  7. Métricas  → movimentos, BPM, respiração
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,   // ← pega largura/altura da tela
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// SVG → para desenhar o gráfico de fases
import Svg, {
  Polyline,   // ← conecta pontos com linhas
  Circle,     // ← pontos no gráfico
  Line,       // ← linhas de grade
  Path,       // ← preenchimento abaixo da linha
  Text as SvgText, // ← texto dentro do SVG (renomeado para não conflitar)
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { colors, fonts, spacing, radius } from '../theme';

// Pegamos a largura da tela para calcular o gráfico
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Largura do gráfico = largura da tela - margens - padding interno
const CHART_W = SCREEN_WIDTH - 32 - 32; // 32 de margin + 32 de padding
const CHART_H = 110;


// ═════════════════════════════════════════
//  DADOS POR PERÍODO
//
//  Cada período (Hoje, 7 dias, 30 dias)
//  tem seus próprios dados de sono.
// ═════════════════════════════════════════
const PERIOD_DATA = {
  'Hoje': {
    hours:  '7h 32min',
    score:  82,
    label:  'Muito Bom ✨',
    desc:   'Você teve uma ótima noite! Continue assim.',
    bedtime: '23:10',
    wakeup:  '07:00',
    phases: [
      { name: 'Acordado', color: colors.sleepAwake, pct: 9,  time: '45min'    },
      { name: 'Leve',     color: colors.sleepLight, pct: 40, time: '3h 20min' },
      { name: 'Profundo', color: colors.sleepDeep,  pct: 33, time: '2h 45min' },
      { name: 'REM',      color: colors.sleepRem,   pct: 18, time: '1h 15min' },
    ],
    // Pontos do gráfico: 0=Acordado, 1=Leve, 2=Profundo, 3=REM
    // Cada número representa o nível de sono naquele horário
    chartPoints: [3, 1, 0, 0, 2, 0, 1, 2, 3],
    metrics: { mov: 23, bpm: 52, resp: 14 },
  },
  '7 dias': {
    hours:  '7h 03min',
    score:  74,
    label:  'Bom 😊',
    desc:   'Boa semana. Pequenos ajustes fazem diferença.',
    bedtime: '23:30',
    wakeup:  '07:10',
    phases: [
      { name: 'Acordado', color: colors.sleepAwake, pct: 12, time: '50min'    },
      { name: 'Leve',     color: colors.sleepLight, pct: 42, time: '3h'       },
      { name: 'Profundo', color: colors.sleepDeep,  pct: 30, time: '2h 10min' },
      { name: 'REM',      color: colors.sleepRem,   pct: 16, time: '1h 08min' },
    ],
    chartPoints: [2, 1, 0, 1, 0, 1, 1, 2, 3],
    metrics: { mov: 31, bpm: 55, resp: 15 },
  },
  '30 dias': {
    hours:  '6h 50min',
    score:  68,
    label:  'Regular 😐',
    desc:   'Tente manter horários mais consistentes.',
    bedtime: '00:10',
    wakeup:  '07:30',
    phases: [
      { name: 'Acordado', color: colors.sleepAwake, pct: 15, time: '1h 02min' },
      { name: 'Leve',     color: colors.sleepLight, pct: 44, time: '3h'       },
      { name: 'Profundo', color: colors.sleepDeep,  pct: 28, time: '1h 54min' },
      { name: 'REM',      color: colors.sleepRem,   pct: 13, time: '53min'    },
    ],
    chartPoints: [3, 2, 1, 0, 1, 0, 2, 1, 3],
    metrics: { mov: 38, bpm: 57, resp: 16 },
  },
};

// Labels do eixo Y do gráfico (de cima para baixo)
const Y_LABELS = ['REM', 'Prof.', 'Leve', 'Acord.'];

// Cores dos pontos do gráfico (por nível)
const POINT_COLORS = [
  colors.sleepAwake,  // nível 0 = Acordado (vermelho)
  colors.sleepLight,  // nível 1 = Leve (amarelo)
  colors.sleepDeep,   // nível 2 = Profundo (roxo)
  colors.sleepRem,    // nível 3 = REM (verde)
];

type PeriodKey = keyof typeof PERIOD_DATA;


// ═════════════════════════════════════════
//  COMPONENTE: SleepChart (Gráfico SVG)
//
//  Recebe um array de pontos (0-3) e
//  desenha a linha do tempo do sono.
//
//  Como funciona o cálculo dos pontos:
//  - O eixo X vai de 0 a CHART_W (largura total)
//  - O eixo Y vai de 0 a CHART_H (altura total)
//  - Nível 3 (REM) fica no topo (y pequeno)
//  - Nível 0 (Acordado) fica embaixo (y grande)
// ═════════════════════════════════════════
function SleepChart({ points }: { points: number[] }) {
  // Margens internas do gráfico
  const PAD_L = 38; // espaço para labels Y
  const PAD_R = 8;
  const PAD_T = 10;
  const PAD_B = 24; // espaço para labels X

  const innerW = CHART_W - PAD_L - PAD_R;
  const innerH = CHART_H - PAD_T - PAD_B;
  const maxVal = 3; // valor máximo (REM)

  // Calcula as coordenadas (x, y) de cada ponto
  // i/(total-1) distribui os pontos igualmente no eixo X
  // (maxVal - v)/maxVal inverte o Y (maior nível = mais alto)
  const coords = points.map((v, i) => ({
    x: PAD_L + (i / (points.length - 1)) * innerW,
    y: PAD_T + ((maxVal - v) / maxVal) * innerH,
  }));

  // String de pontos para o Polyline: "x1,y1 x2,y2 x3,y3..."
  const polylinePoints = coords.map(c => `${c.x},${c.y}`).join(' ');

  // Path para o preenchimento abaixo da linha
  // M = move to (primeiro ponto)
  // L = line to (próximos pontos)
  // Fecha o caminho descendo até a base e voltando
  const fillPath =
    `M${coords[0].x},${coords[0].y} ` +
    coords.slice(1).map(c => `L${c.x},${c.y}`).join(' ') +
    ` L${coords[coords.length - 1].x},${PAD_T + innerH}` +
    ` L${coords[0].x},${PAD_T + innerH} Z`;

  // Labels do eixo X (horários da noite)
  const xLabels = ['23:00', '01:00', '03:00', '05:00', '07:00'];

  return (
    <Svg width={CHART_W} height={CHART_H + 10}>
      <Defs>
        {/* Gradiente do preenchimento: roxo em cima, transparente embaixo */}
        <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={colors.accent} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0}    />
        </LinearGradient>
      </Defs>

      {/* ── Linhas de grade horizontais ── */}
      {[0, 1, 2, 3].map(v => {
        const y = PAD_T + ((maxVal - v) / maxVal) * innerH;
        return (
          <Line
            key={v}
            x1={PAD_L} y1={y}
            x2={PAD_L + innerW} y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* ── Labels do eixo Y ── */}
      {Y_LABELS.map((lbl, i) => {
        const y = PAD_T + (i / (Y_LABELS.length - 1)) * innerH;
        return (
          <SvgText
            key={lbl}
            x={PAD_L - 4} y={y + 4}
            fontSize={8}
            fill={colors.text3}
            textAnchor="end"
          >
            {lbl}
          </SvgText>
        );
      })}

      {/* ── Preenchimento abaixo da linha ── */}
      <Path d={fillPath} fill="url(#fill)" />

      {/* ── Linha principal do gráfico ── */}
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={colors.accent3}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ── Pontos coloridos por fase ── */}
      {coords.map((c, i) => (
        <Circle
          key={i}
          cx={c.x} cy={c.y} r={4}
          fill={POINT_COLORS[points[i]] || colors.accent3}
          stroke={colors.bg}
          strokeWidth={2}
        />
      ))}

      {/* ── Labels do eixo X ── */}
      {xLabels.map((lbl, i) => {
        const x = PAD_L + (i / (xLabels.length - 1)) * innerW;
        return (
          <SvgText
            key={lbl}
            x={x} y={CHART_H + 6}
            fontSize={8}
            fill={colors.text3}
            textAnchor="middle"
          >
            {lbl}
          </SvgText>
        );
      })}
    </Svg>
  );
}


// ═════════════════════════════════════════
//  TELA PRINCIPAL: SonoScreen
// ═════════════════════════════════════════
export default function SonoScreen() {

  const [period, setPeriod] = useState<PeriodKey>('Hoje');
  const d = PERIOD_DATA[period]; // dados do período selecionado

  // Animação do score (anel de pontuação)
  // Quando muda o período, o anel anima suavemente
  const scoreAnim = useRef(new Animated.Value(d.score)).current;

  useEffect(() => {
    Animated.timing(scoreAnim, {
      toValue: d.score,
      duration: 600,
      useNativeDriver: false, // false porque animamos layout (não transform)
    }).start();
  }, [period]);


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Monitor de Sono</Text>
          <Text style={styles.pageSub}>Acompanhe seu descanso</Text>
        </View>
        <Text style={styles.calIcon}>📅</Text>
      </View>

      {/* ── Tabs de período ── */}
      <View style={styles.tabsRow}>
        {(Object.keys(PERIOD_DATA) as PeriodKey[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.tab, period === p && styles.tabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.tabText, period === p && styles.tabTextActive]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ══ SCORE ══════════════════════════════ */}
        <View style={styles.scoreCard}>
          {/* Anel de pontuação */}
          <View style={styles.scoreRing}>
            <Text style={styles.scoreNum}>{d.score}</Text>
            <Text style={styles.scorePts}>pts</Text>
          </View>
          {/* Info do score */}
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>{d.label}</Text>
            <Text style={styles.scoreDesc}>{d.desc}</Text>
          </View>
        </View>

        {/* ══ STATS GRID ═════════════════════════ */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tempo dormido</Text>
            <Text style={styles.statVal}>🕙 {d.hours}</Text>
            <Text style={styles.statSub}>Meta: 8h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Qualidade</Text>
            <Text style={styles.statVal}>😊 Boa</Text>
            <Text style={[styles.statSub, { color: colors.green }]}>
              +12% vs ontem
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Adormeceu</Text>
            <Text style={styles.statVal}>🌙 {d.bedtime}</Text>
            <Text style={styles.statSub}>Latência: 12min</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Acordou</Text>
            <Text style={styles.statVal}>☀️ {d.wakeup}</Text>
            <Text style={styles.statSub}>Profundo: 28%</Text>
          </View>
        </View>

        {/* ══ GRÁFICO ════════════════════════════ */}
        <Text style={styles.sectionLabel}>LINHA DO TEMPO DO SONO</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Fases ao longo da noite</Text>
            <Text style={styles.chartTime}>
              {d.bedtime} → {d.wakeup}
            </Text>
          </View>

          {/* Componente SVG do gráfico */}
          <SleepChart points={d.chartPoints} />

          {/* Legenda */}
          <View style={styles.legend}>
            {[
              { color: colors.sleepAwake, label: 'Acordado' },
              { color: colors.sleepLight, label: 'Leve'     },
              { color: colors.sleepDeep,  label: 'Profundo' },
              { color: colors.sleepRem,   label: 'REM'      },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ FASES ══════════════════════════════ */}
        <View style={styles.phasesCard}>
          <Text style={styles.phasesTitle}>Fases do sono</Text>
          {d.phases.map(phase => (
            <View key={phase.name} style={styles.phaseRow}>
              {/* Ponto colorido da fase */}
              <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />

              {/* Nome da fase */}
              <Text style={styles.phaseName}>{phase.name}</Text>

              {/*
                Barra de progresso:
                - Fundo cinza (100%)
                - Preenchimento colorido (% da fase)
              */}
              <View style={styles.phaseBarBg}>
                <View
                  style={[
                    styles.phaseBarFill,
                    {
                      width: `${phase.pct}%`,
                      backgroundColor: phase.color,
                    },
                  ]}
                />
              </View>

              <Text style={styles.phaseTime}>{phase.time}</Text>
              <Text style={styles.phasePct}>{phase.pct}%</Text>
            </View>
          ))}
        </View>

        {/* ══ MÉTRICAS ═══════════════════════════ */}
        <Text style={styles.sectionLabel}>MÉTRICAS CORPORAIS</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: colors.accent3 }]}>
              {d.metrics.mov}
            </Text>
            <Text style={styles.metricLbl}>Movimentos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: colors.green }]}>
              {d.metrics.bpm}
            </Text>
            <Text style={styles.metricLbl}>BPM médio</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: colors.yellow }]}>
              {d.metrics.resp}
            </Text>
            <Text style={styles.metricLbl}>Resp. rpm</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


// ═════════════════════════════════════════
//  ESTILOS
// ═════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // ── Header ──
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  pageSub: { fontSize: 12, fontFamily: fonts.regular, color: colors.text2, marginTop: 2 },
  calIcon: { fontSize: 22 },

  // ── Tabs ──
  tabsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, backgroundColor: colors.card2, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { fontSize: 11, fontFamily: fonts.medium, color: colors.text3 },
  tabTextActive: { color: 'white' },

  // ── Score ──
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(108,99,255,0.12)', borderRadius: radius.xl, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.borderAccent, gap: spacing.lg },
  scoreRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: colors.accent3, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 24, fontFamily: fonts.bold, color: colors.accent3 },
  scorePts: { fontSize: 9, fontFamily: fonts.regular, color: colors.text3 },
  scoreInfo: { flex: 1 },
  scoreLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  scoreDesc: { fontSize: 12, fontFamily: fonts.regular, color: colors.text2, lineHeight: 18 },

  // ── Stats grid ──
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  statCard: { width: (SCREEN_WIDTH - 48) / 2, backgroundColor: colors.card2, borderRadius: radius.lg, padding: spacing.md, borderWidth: 0.5, borderColor: colors.border },
  statLabel: { fontSize: 10, fontFamily: fonts.regular, color: colors.text3, marginBottom: 4 },
  statVal: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  statSub: { fontSize: 10, fontFamily: fonts.regular, color: colors.text2 },

  // ── Section label ──
  sectionLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.text3, letterSpacing: 0.5, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },

  // ── Gráfico ──
  chartCard: { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.border },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  chartTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  chartTime: { fontSize: 10, fontFamily: fonts.regular, color: colors.text3 },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontFamily: fonts.regular, color: colors.text2 },

  // ── Fases ──
  phasesCard: { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.border },
  phasesTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginBottom: spacing.md },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  phaseDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  phaseName: { fontSize: 12, fontFamily: fonts.medium, color: colors.text, width: 68 },
  phaseBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  phaseBarFill: { height: 6, borderRadius: 3 },
  phaseTime: { fontSize: 11, fontFamily: fonts.regular, color: colors.text2, width: 56, textAlign: 'right' },
  phasePct: { fontSize: 11, fontFamily: fonts.regular, color: colors.text3, width: 28, textAlign: 'right' },

  // ── Métricas ──
  metricsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  metricCard: { flex: 1, backgroundColor: colors.card2, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  metricVal: { fontSize: 24, fontFamily: fonts.bold, marginBottom: 4 },
  metricLbl: { fontSize: 9, fontFamily: fonts.regular, color: colors.text3, textAlign: 'center' },
});
