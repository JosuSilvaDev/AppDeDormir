e// ─────────────────────────────────────────────────────────────
//  src/screens/SonhosScreen.tsx
//  TELA DE SONHOS
//
//  Estrutura:
//  1. Header     → título da tela
//  2. Tabs       → Registrar | Histórico | Significado
//  3. Registrar  → textarea + emoções + símbolos + salvar
//  4. Histórico  → lista de sonhos anteriores
//  5. Significado → interpretação dos símbolos selecionados
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,       // ← caixa de diálogo nativa do celular
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';


// ═════════════════════════════════════════
//  DADOS ESTÁTICOS
//  Em produção virão da API Python.
// ═════════════════════════════════════════

// Emoções que o usuário pode selecionar ao registrar o sonho
const EMOTIONS = [
  { emoji: '😊', label: 'Feliz'    },
  { emoji: '😲', label: 'Surpreso' },
  { emoji: '😢', label: 'Triste'   },
  { emoji: '😨', label: 'Medo'     },
  { emoji: '😌', label: 'Calmo'    },
  { emoji: '⭐', label: 'Outro'    },
];

// Símbolos rápidos para identificar elementos do sonho
const SYMBOLS = [
  '🕊️ Voar',
  '💧 Água',
  '⬇️ Cair',
  '🏃 Perseguição',
  '🐍 Cobra',
  '🔥 Fogo',
  '💀 Morte',
  '🦷 Dentes',
];

// Sonhos de exemplo para o histórico
const SAMPLE_DREAMS = [
  {
    id: 1,
    date: '24 de Abril',
    title: 'Voando sobre montanhas',
    preview: 'A sensação de liberdade era incrível. O vento batia suave no rosto...',
    emotions: ['Feliz', 'Calmo'],
  },
  {
    id: 2,
    date: '22 de Abril',
    title: 'Cidade futurista com luzes azuis',
    preview: 'Tudo brilhava e havia carros voadores por toda parte...',
    emotions: ['Surpreso'],
  },
  {
    id: 3,
    date: '20 de Abril',
    title: 'Floresta mágica à noite',
    preview: 'Os animais falavam e me guiavam por um caminho de luz...',
    emotions: ['Medo', 'Calmo'],
  },
];

// Significados de cada símbolo
// Chave = símbolo exato, valor = { título, texto explicativo }
const MEANINGS: Record<string, { title: string; text: string; score: number }> = {
  '🕊️ Voar': {
    title: 'Liberdade e ambição',
    text: 'Voar em sonhos representa um desejo profundo de liberdade e expansão. Pode indicar que você está superando obstáculos ou buscando novas perspectivas na vida.',
    score: 78,
  },
  '💧 Água': {
    title: 'Emoções e inconsciente',
    text: 'A água simboliza o mundo emocional. Água calma representa paz interior. Água agitada indica emoções reprimidas ou situações que pedem atenção.',
    score: 65,
  },
  '⬇️ Cair': {
    title: 'Perda de controle',
    text: 'Cair revela insegurança ou ansiedade sobre alguma situação. Pode ser um sinal para reavaliar algo que sente que está escapando do controle.',
    score: 40,
  },
  '🏃 Perseguição': {
    title: 'Fuga e evasão',
    text: 'Ser perseguido indica que você pode estar evitando enfrentar algo no mundo real — um problema, emoção ou decisão pendente.',
    score: 35,
  },
  '🐍 Cobra': {
    title: 'Transformação e sabedoria',
    text: 'A cobra é símbolo dual — pode representar perigo oculto ou renovação e sabedoria. Depende de como você se sentiu no sonho.',
    score: 55,
  },
  '🔥 Fogo': {
    title: 'Paixão e purificação',
    text: 'Fogo simboliza energia intensa, paixão ou transformação. Pode ser criativo (inspiração) ou destrutivo (raiva, conflito interno).',
    score: 60,
  },
  '💀 Morte': {
    title: 'Transformação e renovação',
    text: 'Morte em sonhos raramente é literal. Simboliza fim de ciclos e recomeços. Algo em você ou na sua vida está se transformando.',
    score: 50,
  },
  '🦷 Dentes': {
    title: 'Autoestima e comunicação',
    text: 'Sonhar com dentes caindo reflete preocupações com aparência ou julgamento. Pode indicar medo de se expressar ou ser mal interpretado.',
    score: 45,
  },
};

// Frases de reflexão — exibidas ao final da análise
const AFFIRMATIONS = [
  'Seus sonhos são mensagens do seu eu mais profundo. Preste atenção ao que eles revelam.',
  'O que você sente ao acordar é tão importante quanto o que sonhou.',
  'Cada sonho é um convite para se conhecer melhor.',
  'Seu subconsciente trabalha enquanto você descansa. Confie nele.',
];

// Tipo das abas
type TabType = 'registrar' | 'historico' | 'significado';


// ═════════════════════════════════════════
//  COMPONENTE: TabButton
//  Botão de cada aba interna da tela.
// ═════════════════════════════════════════
function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}


// ═════════════════════════════════════════
//  TELA PRINCIPAL: SonhosScreen
// ═════════════════════════════════════════
export default function SonhosScreen() {

  // ── Estados ──────────────────────────────

  // Qual aba está ativa
  const [activeTab, setActiveTab] = useState<TabType>('registrar');

  // Texto do sonho digitado
  const [dreamText, setDreamText] = useState('');

  // Emoções selecionadas (array de labels)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  // Símbolos selecionados (array de strings exatas)
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  // Resultado da análise de significado
  const [meaning, setMeaning] = useState<typeof MEANINGS[string] | null>(null);

  // Símbolo analisado atualmente
  const [analyzedSymbol, setAnalyzedSymbol] = useState<string>('');


  // ── Handlers ─────────────────────────────

  // Alterna seleção de uma emoção
  // Se já está no array → remove. Se não está → adiciona.
  const toggleEmotion = (label: string) => {
    setSelectedEmotions(prev =>
      prev.includes(label)
        ? prev.filter(e => e !== label)  // remove
        : [...prev, label]               // adiciona (spread cria novo array)
    );
  };

  // Alterna seleção de um símbolo
  const toggleSymbol = (sym: string) => {
    setSelectedSymbols(prev =>
      prev.includes(sym)
        ? prev.filter(s => s !== sym)
        : [...prev, sym]
    );
  };

  // Salva o sonho (por enquanto só mostra Alert)
  const saveDream = () => {
    if (!dreamText.trim()) {
      // Alert.alert(título, mensagem) → caixa de diálogo nativa
      Alert.alert('Atenção', 'Descreva seu sonho antes de salvar.');
      return;
    }
    Alert.alert(
      '✅ Salvo com sucesso!',
      'Seu sonho foi registrado.',
      [
        {
          text: 'Ver histórico',
          onPress: () => setActiveTab('historico'),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
    // Limpa o formulário
    setDreamText('');
    setSelectedEmotions([]);
    setSelectedSymbols([]);
  };

  // Analisa o significado e vai para a aba de resultado
  const analyzeMeaning = (sym: string) => {
    const result = MEANINGS[sym];
    if (result) {
      setMeaning(result);
      setAnalyzedSymbol(sym);
      setActiveTab('significado');
    }
  };

  // Frase de reflexão aleatória
  const affirmation = AFFIRMATIONS[
    Math.floor(Math.random() * AFFIRMATIONS.length)
  ];


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Diário de Sonhos</Text>
        <Text style={styles.pageSub}>Registre, reflita e descubra</Text>
      </View>

      {/* ── Tabs internas ── */}
      <View style={styles.tabsRow}>
        <TabButton
          label="Registrar"
          active={activeTab === 'registrar'}
          onPress={() => setActiveTab('registrar')}
        />
        <TabButton
          label="Histórico"
          active={activeTab === 'historico'}
          onPress={() => setActiveTab('historico')}
        />
        <TabButton
          label="Significado"
          active={activeTab === 'significado'}
          onPress={() => setActiveTab('significado')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══ ABA: REGISTRAR ══════════════════════ */}
        {activeTab === 'registrar' && (
          <View style={styles.section}>

            {/* Campo de texto do sonho */}
            <Text style={styles.sectionLabel}>Como foi seu sonho?</Text>
            <View style={styles.textAreaWrap}>
              <TextInput
                style={styles.textArea}
                placeholder="Escreva todos os detalhes que conseguir lembrar..."
                placeholderTextColor={colors.text3}
                multiline            // permite múltiplas linhas
                value={dreamText}
                onChangeText={setDreamText}
                maxLength={500}
              />
              {/* Contador de caracteres */}
              <Text style={styles.charCount}>
                {dreamText.length}/500
              </Text>
            </View>

            {/* Seleção de emoções */}
            <Text style={styles.sectionLabel}>Como você se sentiu?</Text>
            <View style={styles.emotionsRow}>
              {EMOTIONS.map(e => {
                const isSelected = selectedEmotions.includes(e.label);
                return (
                  <TouchableOpacity
                    key={e.label}
                    style={[
                      styles.emoBtn,
                      isSelected && styles.emoBtnActive,
                    ]}
                    onPress={() => toggleEmotion(e.label)}
                  >
                    <Text style={styles.emoEmoji}>{e.emoji}</Text>
                    <Text style={[
                      styles.emoLabel,
                      isSelected && styles.emoLabelActive,
                    ]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Seleção de símbolos */}
            <Text style={styles.sectionLabel}>Símbolos do sonho</Text>
            <Text style={styles.sectionHint}>
              Toque para selecionar o que apareceu no seu sonho
            </Text>
            <View style={styles.symbolsWrap}>
              {SYMBOLS.map(sym => {
                const isSelected = selectedSymbols.includes(sym);
                return (
                  <TouchableOpacity
                    key={sym}
                    style={[
                      styles.symChip,
                      isSelected && styles.symChipActive,
                    ]}
                    onPress={() => toggleSymbol(sym)}
                  >
                    <Text style={[
                      styles.symText,
                      isSelected && styles.symTextActive,
                    ]}>
                      {sym}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botão salvar */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={saveDream}
            >
              <Text style={styles.primaryBtnText}>📖 Salvar sonho</Text>
            </TouchableOpacity>

            {/* Botão analisar (só aparece se selecionou símbolos) */}
            {selectedSymbols.length > 0 && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => analyzeMeaning(selectedSymbols[0])}
              >
                <Text style={styles.secondaryBtnText}>
                  ✨ Analisar significado
                </Text>
              </TouchableOpacity>
            )}

          </View>
        )}


        {/* ══ ABA: HISTÓRICO ══════════════════════ */}
        {activeTab === 'historico' && (
          <View style={styles.section}>

            {SAMPLE_DREAMS.map(dream => (
              <TouchableOpacity
                key={dream.id}
                style={styles.dreamCard}
                activeOpacity={0.8}
              >
                {/* Data */}
                <Text style={styles.dreamDate}>{dream.date}</Text>

                {/* Título */}
                <Text style={styles.dreamTitle}>{dream.title}</Text>

                {/* Prévia do texto */}
                <Text style={styles.dreamPreview} numberOfLines={2}>
                  {dream.preview}
                </Text>

                {/* Badges de emoções */}
                <View style={styles.dreamEmotions}>
                  {dream.emotions.map(em => (
                    <View key={em} style={styles.emotionBadge}>
                      <Text style={styles.emotionBadgeText}>{em}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}

          </View>
        )}


        {/* ══ ABA: SIGNIFICADO ════════════════════ */}
        {activeTab === 'significado' && (
          <View style={styles.section}>

            {/* Seleção de símbolo para analisar */}
            <Text style={styles.sectionLabel}>
              Selecione um símbolo para analisar
            </Text>
            <View style={styles.symbolsWrap}>
              {SYMBOLS.map(sym => {
                const isSelected = analyzedSymbol === sym;
                return (
                  <TouchableOpacity
                    key={sym}
                    style={[
                      styles.symChip,
                      isSelected && styles.symChipActive,
                    ]}
                    onPress={() => analyzeMeaning(sym)}
                  >
                    <Text style={[
                      styles.symText,
                      isSelected && styles.symTextActive,
                    ]}>
                      {sym}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Resultado da análise */}
            {meaning && (
              <>
                {/* Card principal do significado */}
                <View style={styles.meaningCard}>
                  <Text style={styles.meaningSymbol}>{analyzedSymbol}</Text>
                  <Text style={styles.meaningTitle}>{meaning.title}</Text>
                  <Text style={styles.meaningSubLabel}>
                    Símbolo central do seu sonho
                  </Text>
                  <Text style={styles.meaningText}>{meaning.text}</Text>
                </View>

                {/* Score de energia */}
                <View style={styles.scoresRow}>
                  <View style={styles.scoreCard}>
                    <Text style={[styles.scoreVal, { color: colors.green }]}>
                      {meaning.score}%
                    </Text>
                    <Text style={styles.scoreLbl}>Energia positiva</Text>
                  </View>
                  <View style={styles.scoreCard}>
                    <Text style={[styles.scoreVal, { color: colors.accent3 }]}>
                      {meaning.score > 60 ? 'Alta' : 'Média'}
                    </Text>
                    <Text style={styles.scoreLbl}>Intensidade</Text>
                  </View>
                  <View style={styles.scoreCard}>
                    <Text style={[styles.scoreVal, { color: colors.yellow }]}>
                      {Math.min(meaning.score + 10, 95)}%
                    </Text>
                    <Text style={styles.scoreLbl}>Clareza</Text>
                  </View>
                </View>

                {/* Frase de reflexão */}
                <View style={styles.affirmCard}>
                  <Text style={styles.affirmLabel}>✦ Reflexão para hoje</Text>
                  <Text style={styles.affirmText}>"{affirmation}"</Text>
                </View>
              </>
            )}

            {/* Estado vazio — antes de selecionar um símbolo */}
            {!meaning && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔮</Text>
                <Text style={styles.emptyText}>
                  Selecione um símbolo acima para ver sua interpretação
                </Text>
              </View>
            )}

          </View>
        )}

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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  pageSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text2,
    marginTop: 2,
  },

  // ── Tabs internas ──
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: colors.card2,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text3,
  },
  tabTextActive: { color: 'white' },

  // ── Seção comum ──
  section: { paddingHorizontal: spacing.lg },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text2,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  sectionHint: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.text3,
    marginBottom: spacing.sm,
  },

  // ── Campo de texto do sonho ──
  textAreaWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.borderAccent,
    marginBottom: spacing.md,
  },
  textArea: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text,
    minHeight: 100,
    lineHeight: 21,
    textAlignVertical: 'top', // Android: texto começa no topo
  },
  charCount: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.text3,
    textAlign: 'right',
    marginTop: 6,
  },

  // ── Emoções ──
  emotionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // quebra linha se não couber
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emoBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 60,
  },
  emoBtnActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(108,99,255,0.12)',
  },
  emoEmoji: { fontSize: 28 },
  emoLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.text3,
    marginTop: 4,
  },
  emoLabelActive: { color: colors.accent3 },

  // ── Símbolos ──
  symbolsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  symChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card2,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  symChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  symText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text2,
  },
  symTextActive: { color: 'white' },

  // ── Botões ──
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: 'white',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.borderAccent,
    marginBottom: spacing.md,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.accent3,
  },

  // ── Histórico ──
  dreamCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  dreamDate: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.text3,
    marginBottom: 5,
  },
  dreamTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 6,
  },
  dreamPreview: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text2,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  dreamEmotions: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  emotionBadge: {
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: colors.borderAccent,
  },
  emotionBadgeText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.accent3,
  },

  // ── Significado ──
  meaningCard: {
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 0.5,
    borderColor: colors.borderAccent,
    marginBottom: spacing.md,
  },
  meaningSymbol: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  meaningTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  meaningSubLabel: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.text3,
    marginBottom: spacing.md,
  },
  meaningText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text2,
    lineHeight: 21,
  },

  // ── Scores ──
  scoresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: colors.card2,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  scoreVal: {
    fontSize: 20,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  scoreLbl: {
    fontSize: 9,
    fontFamily: fonts.regular,
    color: colors.text3,
    textAlign: 'center',
  },

  // ── Reflexão ──
  affirmCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: colors.border,
    borderRightColor: colors.border,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  affirmLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  affirmText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // ── Estado vazio ──
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyEmoji: { fontSize: 52, opacity: 0.4 },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
});