// ─────────────────────────────────────────────────────────────
//  src/screens/LojaScreen.tsx
//  LOJA PRO — planos e assinatura
//
//  Estrutura:
//  1. Header       → título da tela
//  2. Hero banner  → apresentação do PRO com benefícios
//  3. Tabs         → Mensal | Anual | Único
//  4. Plan cards   → planos selecionáveis com radio button
//  5. CTA button   → muda texto/cor conforme o plano
//  6. Features     → o que o PRO desbloqueia
//  7. Code row     → resgate de código/cupom
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';


// ═════════════════════════════════════════
//  TIPOS TYPESCRIPT
//
//  Definir tipos ajuda o editor a detectar
//  erros antes de rodar o código.
// ═════════════════════════════════════════
type BillingType = 'mensal' | 'anual' | 'unico';

type Plan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  desc: string;
  features: string[];
  badge?: string;
  isGold?: boolean;
  saveBadge?: string;
};


// ═════════════════════════════════════════
//  DADOS DOS PLANOS
// ═════════════════════════════════════════
const PLANS: Record<BillingType, Plan[]> = {
  mensal: [
    {
      id: 'basico',
      name: 'Básico',
      price: 'Grátis',
      desc: 'Para começar sua jornada do sono.',
      features: ['5 interpretações por mês', '7 dias de histórico', 'Músicas básicas'],
    },
    {
      id: 'pro',
      name: 'PRO Mensal',
      price: 'R$ 9,90',
      period: '/mês',
      desc: 'Tudo desbloqueado, sem limites.',
      features: ['Interpretações ilimitadas', 'Histórico completo', 'Biblioteca completa', 'Sem anúncios'],
      badge: 'Mais popular',
    },
  ],
  anual: [
    {
      id: 'basico',
      name: 'Básico',
      price: 'Grátis',
      desc: 'Para começar sua jornada do sono.',
      features: ['5 interpretações por mês', '7 dias de histórico', 'Músicas básicas'],
    },
    {
      id: 'pro',
      name: 'PRO Anual',
      price: 'R$ 5,90',
      period: '/mês',
      desc: 'Equivale a R$ 70,80/ano. Economize 40%!',
      features: ['Interpretações ilimitadas', 'Histórico completo', 'Biblioteca completa', 'Sem anúncios'],
      badge: 'Economize 40%',
      saveBadge: '-40%',
    },
  ],
  unico: [
    {
      id: 'pro',
      name: 'PRO Vitalício',
      price: 'R$ 149,90',
      period: ' único',
      desc: 'Pague uma vez e use para sempre.',
      features: ['Interpretações ilimitadas', 'Histórico completo', 'Biblioteca completa', 'Atualizações futuras incluídas'],
      badge: 'Melhor negócio',
      isGold: true,
    },
  ],
};

// Features da seção "O que você desbloqueia"
const FEATURES = [
  { emoji: '🔮', title: 'Interpretações profundas',  desc: 'IA analisa símbolos, emoções e padrões do seu sono com detalhes.' },
  { emoji: '📊', title: 'Histórico ilimitado',        desc: 'Guarde todos os sonhos e dados de sono sem limite de tempo.' },
  { emoji: '🎵', title: 'Biblioteca completa',        desc: '+200 sons exclusivos, playlists guiadas e meditações noturnas.' },
  { emoji: '💬', title: 'Conexões pessoais',          desc: 'Descubra padrões emocionais e como afetam seu dia a dia.' },
];


// ═════════════════════════════════════════
//  COMPONENTE: PlanCard
//
//  Card de cada plano.
//  Demonstra composição de componentes:
//  dividimos a tela em peças menores
//  para o código ficar mais organizado.
//
//  Props:
//  - plan     → dados do plano
//  - selected → se está selecionado
//  - onSelect → chamado ao tocar
// ═════════════════════════════════════════
function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const isGold = !!plan.isGold;

  return (
    /*
      style como array: [estilo_base, estilo_condicional_1, estilo_condicional_2]
      O React Native faz merge dos estilos automaticamente.
      O último estilo sobrescreve os anteriores em caso de conflito.
    */
    <TouchableOpacity
      style={[
        styles.planCard,
        selected && styles.planCardSelected,
        selected && isGold && styles.planCardGold,
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {/* Badge flutuante acima do card */}
      {plan.badge && (
        <View style={[styles.planBadge, isGold && styles.planBadgeGold]}>
          <Text style={[styles.planBadgeText, isGold && { color: '#1a0e00' }]}>
            {plan.badge}
          </Text>
        </View>
      )}

      {/* Linha: nome + preço */}
      <View style={styles.planTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planName, isGold && { color: colors.gold }]}>
            {plan.name}
          </Text>
          <Text style={styles.planDesc}>{plan.desc}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.planPrice, isGold && { color: colors.gold }]}>
            {plan.price}
            {plan.period && (
              <Text style={styles.planPeriod}>{plan.period}</Text>
            )}
          </Text>
          {plan.saveBadge && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>{plan.saveBadge}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Features do plano */}
      <View style={styles.planFeatures}>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.planFeat}>
            <View style={[styles.featDot, isGold && { backgroundColor: colors.gold }]} />
            <Text style={styles.featText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Radio button de seleção */}
      <View style={{ alignItems: 'flex-end', marginTop: spacing.sm }}>
        <View style={[
          styles.radio,
          selected && styles.radioSelected,
          selected && isGold && { borderColor: colors.gold, backgroundColor: colors.gold },
        ]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}


// ═════════════════════════════════════════
//  COMPONENTE: FeatureRow
//  Uma linha da seção de features PRO.
// ═════════════════════════════════════════
function FeatureRow({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
      <View style={styles.proBadge}>
        <Text style={styles.proBadgeText}>PRO</Text>
      </View>
    </View>
  );
}


// ═════════════════════════════════════════
//  TELA PRINCIPAL: LojaScreen
// ═════════════════════════════════════════
export default function LojaScreen() {

  // ── Estados ──────────────────────────────
  const [billing, setBilling]           = useState<BillingType>('mensal');
  const [selectedPlanId, setSelectedPlanId] = useState('pro');

  // Planos do período atual
  const currentPlans = PLANS[billing];

  // Plano selecionado (fallback para o último se não encontrar)
  const selectedPlan =
    currentPlans.find(p => p.id === selectedPlanId) ??
    currentPlans[currentPlans.length - 1];

  // ── useCallback ─────────────────────────
  // Memoiza a função para evitar recriar a cada render.
  // A função só é recriada se [] (nenhuma dependência) mudar.
  const handleSelectPlan = useCallback((id: string) => {
    setSelectedPlanId(id);
  }, []);

  // Ao trocar de billing, reseta para PRO selecionado
  const handleBillingChange = (type: BillingType) => {
    setBilling(type);
    setSelectedPlanId('pro');
  };

  // Texto e estilo do botão variam conforme o plano escolhido
  const cta = (() => {
    if (selectedPlan.id === 'basico') {
      return { text: 'Continuar grátis', hint: 'Sem necessidade de cartão', gold: false };
    }
    if (selectedPlan.isGold) {
      return { text: '👑 Comprar acesso vitalício', hint: 'Pagamento único · Sem mensalidade', gold: true };
    }
    return { text: '👑 Assinar agora', hint: 'Cancele quando quiser · Sem compromisso', gold: false };
  })();

  const handleCTA = () => {
    if (selectedPlan.id === 'basico') {
      Alert.alert('Plano Básico', 'Você já está usando o plano gratuito.');
      return;
    }
    Alert.alert(
      '🎉 Quase lá!',
      `Você será redirecionado para o pagamento do ${selectedPlan.name}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => console.log('→ pagamento') },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Loja</Text>
        <Text style={styles.pageSub}>Desbloqueie sua melhor noite</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ══ HERO BANNER ════════════════════════ */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroCrown}>👑</Text>
          <Text style={styles.heroTitle}>SleepZen PRO</Text>
          <Text style={styles.heroSub}>
            Sua melhor versão começa com noites melhores.
          </Text>
          <View style={{ gap: spacing.sm }}>
            {[
              'Acesso completo a tudo',
              'Interpretações ilimitadas',
              'Conteúdo premium exclusivo',
              'Sem anúncios, só tranquilidade',
            ].map((benefit, i) => (
              <View key={i} style={styles.heroCheck}>
                <View style={styles.checkIcon}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
                <Text style={styles.checkText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ TABS DE COBRANÇA ═══════════════════ */}
        <View style={styles.billingTabs}>
          {(['mensal', 'anual', 'unico'] as BillingType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.billingTab, billing === t && styles.billingTabActive]}
              onPress={() => handleBillingChange(t)}
            >
              <Text style={[styles.billingTabText, billing === t && styles.billingTabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ CARDS DE PLANO ═════════════════════ */}
        <View style={styles.plansWrap}>
          {currentPlans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlanId === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </View>

        {/* ══ BOTÃO CTA ══════════════════════════ */}
        <TouchableOpacity
          style={[styles.ctaBtn, cta.gold && styles.ctaBtnGold]}
          onPress={handleCTA}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaBtnText, cta.gold && styles.ctaBtnTextGold]}>
            {cta.text}
          </Text>
        </TouchableOpacity>
        <Text style={styles.ctaHint}>{cta.hint}</Text>

        {/* ══ DIVISOR ════════════════════════════ */}
        <View style={styles.divider} />

        {/* ══ FEATURES ═══════════════════════════ */}
        <Text style={styles.featuresTitle}>O que você desbloqueia</Text>
        {FEATURES.map((f, i) => (
          <FeatureRow key={i} {...f} />
        ))}

        {/* ══ DIVISOR ════════════════════════════ */}
        <View style={styles.divider} />

        {/* ══ RESGATE DE CÓDIGO ══════════════════ */}
        <View style={styles.codeRow}>
          <View>
            <Text style={styles.codeTitle}>Já tem um código?</Text>
            <Text style={styles.codeSub}>Resgate e desbloqueie seu conteúdo</Text>
          </View>
          <TouchableOpacity
            style={styles.codeBtn}
            onPress={() => Alert.alert('Em breve', 'O resgate de código estará disponível em breve.')}
          >
            <Text style={styles.codeBtnText}>Resgatar</Text>
          </TouchableOpacity>
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
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  pageSub: { fontSize: 12, fontFamily: fonts.regular, color: colors.text2, marginTop: 2 },

  // ── Hero ──
  heroBanner: { marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: '#1a1530', borderRadius: radius.xl, padding: spacing.xl, borderWidth: 0.5, borderColor: 'rgba(245,197,66,0.2)' },
  heroCrown: { fontSize: 40, marginBottom: spacing.sm },
  heroTitle: { fontSize: 24, fontFamily: fonts.bold, color: colors.gold, marginBottom: 4 },
  heroSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.text2, marginBottom: spacing.lg, lineHeight: 20 },
  heroCheck: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(74,222,128,0.15)', alignItems: 'center', justifyContent: 'center' },
  checkIconText: { fontSize: 11, color: colors.green, fontFamily: fonts.bold },
  checkText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text },

  // ── Tabs cobrança ──
  billingTabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  billingTab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, backgroundColor: colors.card2, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  billingTabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  billingTabText: { fontSize: 12, fontFamily: fonts.medium, color: colors.text3 },
  billingTabTextActive: { color: 'white' },

  // ── Plan cards ──
  plansWrap: { paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.md },
  planCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.border, marginTop: 12 },
  planCardSelected: { borderWidth: 2, borderColor: colors.accent, backgroundColor: 'rgba(108,99,255,0.06)' },
  planCardGold: { borderColor: colors.gold, backgroundColor: 'rgba(245,197,66,0.06)' },

  planBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.full },
  planBadgeGold: { backgroundColor: colors.gold2 },
  planBadgeText: { fontSize: 10, fontFamily: fonts.semiBold, color: 'white' },

  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  planName: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: 3 },
  planDesc: { fontSize: 11, fontFamily: fonts.regular, color: colors.text3, maxWidth: 160 },
  planPrice: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  planPeriod: { fontSize: 12, fontFamily: fonts.regular, color: colors.text2 },

  saveBadge: { backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, borderWidth: 0.5, borderColor: 'rgba(74,222,128,0.25)', marginTop: 4 },
  saveBadgeText: { fontSize: 10, fontFamily: fonts.semiBold, color: colors.green },

  planFeatures: { gap: spacing.xs, marginBottom: spacing.sm },
  planFeat: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  featText: { fontSize: 12, fontFamily: fonts.regular, color: colors.text2 },

  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },

  // ── CTA ──
  ctaBtn: { marginHorizontal: spacing.lg, backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  ctaBtnGold: { backgroundColor: colors.gold, shadowColor: colors.gold },
  ctaBtnText: { fontSize: 16, fontFamily: fonts.bold, color: 'white' },
  ctaBtnTextGold: { color: '#1a0e00' },
  ctaHint: { textAlign: 'center', fontSize: 11, fontFamily: fonts.regular, color: colors.text3, marginTop: spacing.sm, marginBottom: spacing.lg },

  // ── Divisor ──
  divider: { height: 0.5, backgroundColor: colors.border, marginHorizontal: spacing.lg, marginVertical: spacing.md },

  // ── Features ──
  featuresTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text2, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card2, borderRadius: radius.lg, padding: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderWidth: 0.5, borderColor: colors.border, gap: spacing.md },
  featureIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(108,99,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  featureDesc: { fontSize: 11, fontFamily: fonts.regular, color: colors.text3, lineHeight: 16 },
  proBadge: { backgroundColor: 'rgba(108,99,255,0.15)', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  proBadgeText: { fontSize: 9, fontFamily: fonts.bold, color: colors.accent3, letterSpacing: 0.5 },

  // ── Código ──
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.lg, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.border },
  codeTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 3 },
  codeSub: { fontSize: 11, fontFamily: fonts.regular, color: colors.text3 },
  codeBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  codeBtnText: { fontSize: 12, fontFamily: fonts.semiBold, color: 'white' },
});
