// ─────────────────────────────────────────────────────────────
//  src/theme/index.ts
//  TEMA GLOBAL DO APP
//
//  Como usar em qualquer tela:
//  import { colors, fonts, spacing, radius } from '../theme';
//
//  Exemplo:
//  <Text style={{ color: colors.text, fontFamily: fonts.bold }}>
//    Olá!
//  </Text>
// ─────────────────────────────────────────────────────────────

// ── CORES ──────────────────────────────────────────────────
export const colors = {

  // Fundos (do mais escuro ao mais claro)
  bg:    '#0A0B1A',   // fundo principal — quase preto azulado
  bg2:   '#111228',   // fundo da barra de navegação
  card:  '#151627',   // cards principais
  card2: '#1C1D35',   // cards secundários, inputs

  // Roxo — cor principal do app
  accent:  '#6C63FF', // botões, destaques
  accent2: '#5A52E8', // botão pressionado (mais escuro)
  accent3: '#8B83FF', // ícones ativos, textos de destaque

  // Textos
  text:  '#E8E9F5',   // texto principal (quase branco)
  text2: '#9B9DC8',   // texto secundário (cinza-roxo)
  text3: '#6B6D9A',   // texto terciário (placeholders, labels)

  // Bordas
  border:       'rgba(255,255,255,0.06)',   // borda sutil
  borderAccent: 'rgba(108,99,255,0.20)',   // borda com tom roxo

  // Semânticas (feedback visual)
  green:  '#4ADE80',  // qualidade boa, sucesso
  yellow: '#FBBF24',  // alerta, qualidade regular
  red:    '#F87171',  // erro, qualidade ruim

  // Dourado — usado na Loja PRO
  gold:  '#F5C542',
  gold2: '#E6A800',

  // Fases do sono — usadas no gráfico
  sleepAwake: '#F87171',  // acordado
  sleepLight: '#FBBF24',  // sono leve
  sleepDeep:  '#6C63FF',  // sono profundo
  sleepRem:   '#4ADE80',  // REM
};

// ── FONTES ─────────────────────────────────────────────────
// Usamos a fonte "Outfit" do Google — moderna e legível.
// Ela é instalada no App.tsx com o pacote @expo-google-fonts/outfit
export const fonts = {
  light:    'Outfit_300Light',
  regular:  'Outfit_400Regular',
  medium:   'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold:     'Outfit_700Bold',
};

// ── ESPAÇAMENTOS ───────────────────────────────────────────
// Usamos uma escala de 4px para manter tudo consistente.
// xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

// ── BORDAS ARREDONDADAS ────────────────────────────────────
export const radius = {
  sm:   10,
  md:   14,
  lg:   18,
  xl:   22,
  full: 999, // para pílulas e badges completamente arredondados
};

// ── SOMBRA ─────────────────────────────────────────────────
// Spread de sombra padrão para cards com destaque roxo.
// No Android usa "elevation", no iOS usa "shadow*"
export const shadow = {
  card: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
