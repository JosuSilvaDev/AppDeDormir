// ─────────────────────────────────────────────────────────────
//  src/screens/HomeScreen.tsx
//  TELA HOME — tela inicial do app
//
//  Estrutura da tela (de cima para baixo):
//  1. Hero    → céu estrelado com lua e montanhas
//  2. Header  → saudação + avatar
//  3. Card    → resumo do sono com anel de progresso
//  4. Ações   → botões rápidos (Músicas, Sonhos, Sono)
//  5. Dica    → card com dica do dia
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,    // ← sistema de animações do React Native
  StatusBar,
} from 'react-native';

// SafeAreaView → evita que o conteúdo fique atrás da câmera/notch
import { SafeAreaView } from 'react-native-safe-area-context';

// useNavigation → hook para navegar entre telas programaticamente
import { useNavigation } from '@react-navigation/native';

// SVG → para desenhar o anel de progresso circular
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { colors, fonts, spacing, radius } from '../theme';


// ═════════════════════════════════════════
//  COMPONENTE: SleepRing
//  Anel circular de progresso do sono.
//
//  Como funciona:
//  - Dois círculos empilhados:
//    1. Círculo cinza (trilha de fundo)
//    2. Círculo roxo (progresso real)
//  - strokeDasharray controla quanto do círculo
//    é preenchido. Passamos a % dormida.
//
//  Props:
//  - percentage → 0 a 100 (ex: 85 = 85% da meta)
//  - size       → tamanho em pixels (padrão: 72)
// ═════════════════════════════════════════
function SleepRing({
  percentage,
  size = 72,
}: {
  percentage: number;
  size?: number;
}) {
  // Raio do círculo (descontamos o stroke para não cortar)
  const r = (size - 10) / 2;

  // Circunferência total do círculo: 2 * π * r
  const circumference = 2 * Math.PI * r;

  // Quanto da circunferência preenchemos (baseado na %)
  const strokeDash = (percentage / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      {/* Gradiente roxo para o arco de progresso */}
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%"   stopColor={colors.accent3} />
          <Stop offset="100%" stopColor={colors.accent}  />
        </LinearGradient>
      </Defs>

      {/* Trilha de fundo — círculo completo cinza */}
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(108,99,255,0.15)"
        strokeWidth={6}
      />

      {/*
        Arco de progresso — círculo roxo parcial
        strokeDasharray="X Y":
        - X = parte preenchida
        - Y = parte vazia
        rotation="-90" → começa do topo (não da direita)
      */}
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="url(#grad)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`}
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}


// ═════════════════════════════════════════
//  COMPONENTE: Star (Estrela piscante)
//
//  Cada estrela tem sua própria animação
//  de fade in/out em loop infinito.
//
//  Animated.Value → valor que pode ser
//  animado sem re-renderizar o componente.
//
//  Props:
//  - x, y → posição no céu
//  - size  → tamanho da estrela em px
// ═════════════════════════════════════════
function Star({ x, y, size }: { x: number; y: number; size: number }) {
  // useRef guarda o Animated.Value entre renders
  // sem causar re-renderização quando muda
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Animated.loop → repete a animação infinitamente
    // Animated.sequence → executa as animações em ordem
    Animated.loop(
      Animated.sequence([
        // Fade out: de 0.6 para 0.1 em tempo aleatório
        Animated.timing(opacity, {
          toValue: 0.1 + Math.random() * 0.2,
          duration: 1500 + Math.random() * 2000,
          useNativeDriver: true, // roda na thread nativa (mais rápido)
        }),
        // Fade in: de volta para brilhante
        Animated.timing(opacity, {
          toValue: 0.5 + Math.random() * 0.5,
          duration: 1500 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    ).start(); // .start() inicia a animação
  }, []);

  return (
    // Animated.View → View que aceita valores animados
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'white',
        opacity, // conecta o Animated.Value ao estilo
      }}
    />
  );
}


// ═════════════════════════════════════════
//  COMPONENTE: QuickAction (Ação rápida)
//
//  Botão com animação de escala ao toque.
//  Quando o usuário pressiona, o botão
//  encolhe levemente (0.95) e volta (1.0).
//
//  Props:
//  - emoji    → ícone visual
//  - label    → nome principal
//  - sublabel → descrição menor
//  - onPress  → função ao tocar
// ═════════════════════════════════════════
function QuickAction({
  emoji,
  label,
  sublabel,
  onPress,
}: {
  emoji: string;
  label: string;
  sublabel: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

  return (
    // transform: [{ scale }] → aplica a escala animada
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        style={styles.qaBtn}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1} // desativa o fade padrão (usamos nossa animação)
      >
        <Text style={styles.qaEmoji}>{emoji}</Text>
        <Text style={styles.qaLabel}>{label}</Text>
        <Text style={styles.qaSub}>{sublabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}


// ═════════════════════════════════════════
//  TELA PRINCIPAL: HomeScreen
// ═════════════════════════════════════════
export default function HomeScreen() {
  // useNavigation → permite navegar para outras telas
  // O "any" é para evitar erros de TypeScript por enquanto
  const navigation = useNavigation<any>();

  // Animação de entrada: os cards aparecem com fade + slide
  const fadeAnim  = useRef(new Animated.Value(0)).current;  // começa invisível
  const slideAnim = useRef(new Animated.Value(30)).current; // começa 30px abaixo

  useEffect(() => {
    // Animated.parallel → roda as duas animações ao mesmo tempo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,       // vai para opacidade total
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,       // sobe para a posição original
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Posições fixas das estrelas no céu
  // (x, y em pixels, size = tamanho da estrela)
  const stars = [
    { x: 28,  y: 32,  size: 2   },
    { x: 75,  y: 16,  size: 2.5 },
    { x: 138, y: 42,  size: 1.5 },
    { x: 195, y: 14,  size: 2   },
    { x: 255, y: 30,  size: 2.5 },
    { x: 318, y: 48,  size: 1.5 },
    { x: 48,  y: 68,  size: 1.5 },
    { x: 158, y: 58,  size: 2   },
    { x: 288, y: 70,  size: 2   },
    { x: 108, y: 24,  size: 1.5 },
    { x: 342, y: 22,  size: 1.5 },
    { x: 228, y: 60,  size: 1.5 },
    { x: 352, y: 62,  size: 1   },
    { x: 18,  y: 55,  size: 1   },
  ];

  // Estilo reutilizado para os cards animados
  const animStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return (
    // edges={['top']} → só protege o topo (nav bar cuida do fundo)
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >

        {/* ══ 1. HERO — céu estrelado ══════════════ */}
        <View style={styles.hero}>
          {/* Renderiza cada estrela */}
          {stars.map((s, i) => (
            <Star key={i} x={s.x} y={s.y} size={s.size} />
          ))}

          {/* Lua: círculo amarelo + sombra por cima = crescente */}
          <View style={styles.moonWrap}>
            <View style={styles.moon} />
            <View style={styles.moonShadow} />
          </View>

          {/* Montanhas: 3 formas ovais posicionadas absolutamente */}
          <View style={styles.mountains}>
            <View style={[styles.mountain, styles.mt1]} />
            <View style={[styles.mountain, styles.mt2]} />
            <View style={[styles.mountain, styles.mt3]} />
          </View>
        </View>


        {/* ══ 2. HEADER — saudação ═════════════════ */}
        <Animated.View style={[styles.header, animStyle]}>
          <View>
            <Text style={styles.greeting}>Boa noite, Josue! 🌙</Text>
            <Text style={styles.greetingSub}>Vamos cuidar do seu sono?</Text>
          </View>
          {/* Avatar com inicial do nome */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>J</Text>
          </View>
        </Animated.View>


        {/* ══ 3. CARD — resumo do sono ═════════════ */}
        <Animated.View style={[styles.card, animStyle]}>
          <Text style={styles.cardTitle}>RESUMO DE HOJE</Text>

          {/* Anel + horas lado a lado */}
          <View style={styles.sleepRow}>
            <SleepRing percentage={85} size={72} />
            <View>
              <Text style={styles.sleepHours}>7h 32min</Text>
              <Text style={styles.sleepLabel}>Dormido</Text>
            </View>
          </View>

          {/* Linha divisória */}
          <View style={styles.divider} />

          {/* Qualidade do sono com badge verde */}
          <View style={styles.qualityRow}>
            <Text style={styles.qualityLabel}>Qualidade do sono</Text>
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>Boa 😊</Text>
            </View>
          </View>
        </Animated.View>


        {/* ══ 4. AÇÕES RÁPIDAS ═════════════════════ */}
        <Animated.View style={animStyle}>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>

          {/* 3 botões em linha */}
          <View style={styles.qaRow}>
            <QuickAction
              emoji="🎵"
              label="Músicas"
              sublabel="Sons relaxantes"
              onPress={() => navigation.navigate('Musicas')}
            />
            <QuickAction
              emoji="☁️"
              label="Sonhos"
              sublabel="Diário de sonhos"
              onPress={() => navigation.navigate('Sonhos')}
            />
            <QuickAction
              emoji="🌙"
              label="Sono"
              sublabel="Monitoramento"
              onPress={() => navigation.navigate('Sono')}
            />
          </View>
        </Animated.View>


        {/* ══ 5. DICA DO DIA ═══════════════════════ */}
        <Animated.View style={[styles.tipCard, animStyle]}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipInfo}>
            <Text style={styles.tipTitle}>Dica de hoje</Text>
            <Text style={styles.tipText}>
              Tente dormir e acordar no mesmo horário todos os dias
              para regular seu relógio biológico.
            </Text>
          </View>
        </Animated.View>

        {/* Espaço extra no final para não ficar colado na nav bar */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


// ═════════════════════════════════════════
//  ESTILOS
//
//  No React Native não existe CSS.
//  Os estilos são objetos JavaScript.
//  Diferenças importantes do CSS:
//  - camelCase: backgroundColor (não background-color)
//  - números sem unidade: fontSize: 16 (não "16px")
//  - flex é o padrão: flex:1 = ocupa todo espaço disponível
// ═════════════════════════════════════════
const styles = StyleSheet.create({

  // ── Estrutura base ──
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },

  // ── Hero / Céu ──
  hero: {
    height: 210,
    backgroundColor: '#0d1035',
    overflow: 'hidden',   // corta tudo que sair dessa View
    position: 'relative',
  },
  moonWrap: {
    position: 'absolute',
    top: 22,
    right: 62,
  },
  moon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffd54f',
    // Sombra/brilho da lua
    shadowColor: '#ffd54f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  // Círculo escuro por cima da lua → cria efeito de crescente
  moonShadow: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0e1040',
  },
  mountains: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  mountain: {
    position: 'absolute',
    bottom: 0,
  },
  mt1: {
    left: -20,
    width: 180,
    height: 72,
    backgroundColor: '#0e1242',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
  },
  mt2: {
    left: 90,
    width: 210,
    height: 92,
    backgroundColor: '#0b0e28',
    borderTopLeftRadius: 105,
    borderTopRightRadius: 105,
  },
  mt3: {
    right: -20,
    width: 180,
    height: 66,
    backgroundColor: '#0e1242',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
  },

  // ── Header / Saudação ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 3,
  },
  greetingSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: 'white',
  },

  // ── Card resumo do sono ──
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.text3,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  sleepHours: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 3,
  },
  sleepLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text2,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text2,
  },
  qualityBadge: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  qualityText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.green,
  },

  // ── Ações rápidas ──
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  qaRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  qaBtn: {
    backgroundColor: colors.card2,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  qaEmoji: {
    fontSize: 26,
    marginBottom: 2,
  },
  qaLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  qaSub: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.text3,
  },

  // ── Dica do dia ──
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.borderAccent,
  },
  tipEmoji: {
    fontSize: 22,
    marginTop: 2,
  },
  tipInfo: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  tipText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text2,
    lineHeight: 19,
  },
});
