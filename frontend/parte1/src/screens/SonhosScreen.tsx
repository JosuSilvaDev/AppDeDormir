// ─────────────────────────────────────────────────────────────
//  src/screens/SonhosScreen.tsx
//  TELA DE SONHOS
//
//  Estrutura:
//  1. Header      → título da tela
//  2. Tabs        → Registrar | Histórico | Significado
//  3. Registrar   → textarea + emoções + símbolos + salvar
//  4. Histórico   → lista de sonhos anteriores
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
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';


// ═════════════════════════════════════════
//  DADOS
// ═════════════════════════════════════════

const EMOTIONS = [
  { emoji: '😊', label: 'Feliz'    },
  { emoji: '😲', label: 'Surpreso' },
  { emoji: '😢', label: 'Triste'   },
  { emoji: '😨', label: 'Medo'     },
  { emoji: '😌', label: 'Calmo'    },
  { emoji: '⭐', label: 'Outro'    },
];

const SYMBOLS = [
  '🕊️ Voar', '💧 Água', '⬇️ Cair',
  '🏃 Perseguição', '🐍 Cobra', '🔥 Fogo',
  '💀 Morte', '🦷 Dentes',
];

const SAMPLE_DREAMS = [
  { id: 1, date: '24 de Abril', title: 'Voando sobre montanhas', preview: 'A sensação de liberdade era incrível. O vento batia suave no rosto...', emotions: ['Feliz', 'Calmo'] },
  { id: 2, date: '22 de Abril', title: 'Cidade futurista com luzes azuis', preview: 'Tudo brilhava e havia carros voadores por toda parte...', emotions: ['Surpreso'] },
  { id: 3, date: '20 de Abril', title: 'Floresta mágica à noite', preview: 'Os animais falavam e me guiavam por um caminho de luz...', emotions: ['Medo', 'Calmo'] },
];

const MEANINGS: Record<string, { title: string; text: string; score: number }> = {
  '🕊️ Voar':       { title: 'Liberdade e ambição',          text: 'Voar em sonhos representa um desejo profundo de liberdade e expansão. Pode indicar que você está superando obstáculos ou buscando novas perspectivas na vida.', score: 78 },
  '💧 Água':        { title: 'Emoções e inconsciente',        text: 'A água simboliza o mundo emocional. Água calma representa paz interior. Água agitada indica emoções reprimidas ou situações que pedem atenção.', score: 65 },
  '⬇️ Cair':        { title: 'Perda de controle',             text: 'Cair revela insegurança ou ansiedade sobre alguma situação. Pode ser um sinal para reavaliar algo que sente que está escapando do controle.', score: 40 },
  '🏃 Perseguição': { title: 'Fuga e evasão',                 text: 'Ser perseguido indica que você pode estar evitando enfrentar algo no mundo real — um problema, emoção ou decisão pendente.', score: 35 },
  '🐍 Cobra':       { title: 'Transformação e sabedoria',     text: 'A cobra é símbolo dual — pode representar perigo oculto ou renovação e sabedoria. Depende de como você se sentiu no sonho.', score: 55 },
  '🔥 Fogo':        { title: 'Paixão e purificação',          text: 'Fogo simboliza energia intensa, paixão ou transformação. Pode ser criativo (inspiração) ou destrutivo (raiva, conflito interno).', score: 60 },
  '💀 Morte':       { title: 'Transformação e renovação',     text: 'Morte em sonhos raramente é literal. Simboliza fim de ciclos e recomeços. Algo em você ou na sua vida está se transformando.', score: 50 },
  '🦷 Dentes':      { title: 'Autoestima e comunicação',      text: 'Sonhar com dentes caindo reflete preocupações com aparência ou julgamento. Pode indicar medo de se expressar ou ser mal interpretado.', score: 45 },
};

const AFFIRMATIONS = [
  'Seus sonhos são mensagens do seu eu mais profundo.',
  'O que você sente ao acordar é tão importante quanto o que sonhou.',
  'Cada sonho é um convite para se conhecer melhor.',
  'Seu subconsciente trabalha enquanto você descansa. Confie nele.',
];

type TabType = 'registrar' | 'historico' | 'significado';


// ═════════════════════════════════════════
//  TELA PRINCIPAL
// ═════════════════════════════════════════
export default function SonhosScreen() {

  // ── Estados ──────────────────────────────
  const [activeTab, setActiveTab]             = useState<TabType>('registrar');
  const [dreamText, setDreamText]             = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedSymbols, setSelectedSymbols]   = useState<string[]>([]);
  const [meaning, setMeaning]                 = useState<typeof MEANINGS[string] | null>(null);
  const [analyzedSymbol, setAnalyzedSymbol]   = useState('');

  // ── Handlers ─────────────────────────────

  // Alterna a seleção de emoção
  // prev.includes(label) → verifica se já está no array
  // prev.filter(...)     → remove o item
  // [...prev, label]     → adiciona o item (spread cria cópia)
  const toggleEmotion = (label: string) => {
    setSelectedEmotions(prev =>
      prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label]
    );
  };

  // Mesmo padrão para símbolos
  const toggleSymbol = (sym: string) => {
    setSelectedSymbols(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  // Salva o sonho
  const saveDream = () => {
    if (!dreamText.trim()) {
      Alert.alert('Atenção', 'Descreva seu sonho antes de salvar.');
      return;
    }
    Alert.alert('✅ Salvo!', 'Seu sonho foi registrado.', [
      { text: 'Ver histórico', onPress: () => setActiveTab('historico') },
      { text: 'OK', style: 'cancel' },
    ]);
    setDreamText('');
    setSelectedEmotions([]);
    setSelectedSymbols([]);
  };

  // Analisa o significado do símbolo
  const analyzeMeaning = (sym: string) => {
    const result = MEANINGS[sym];
    if (result) {
      setMeaning(result);
      setAnalyzedSymbol(sym);
      setActiveTab('significado');
    }
  };

  const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Diário de Sonhos</Text>
        <Text style={styles.pageSub}>Registre, reflita e descubra</Text>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabsRow}>
        {(['registrar', 'historico', 'significado'] as TabType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'registrar' ? 'Registrar' : t === 'historico' ? 'Histórico' : 'Significado'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ══ REGISTRAR ══════════════════════════ */}
        {activeTab === 'registrar' && (
          <View style={styles.section}>

            {/* Campo de texto */}
            <Text style={styles.sectionLabel}>Como foi seu sonho?</Text>
            <View style={styles.textAreaWrap}>
              {/*
                multiline={true}  → permite quebra de linha
                maxLength={500}   → limite de caracteres
                textAlignVertical → no Android, alinha texto ao topo
              */}
              <TextInput
                style={styles.textArea}
                placeholder="Escreva todos os detalhes que conseguir lembrar..."
                placeholderTextColor={colors.text3}
                multiline
                value={dreamText}
                onChangeText={setDreamText}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{dreamText.length}/500</Text>
            </View>

            {/* Emoções */}
            <Text style={styles.sectionLabel}>Como você se sentiu?</Text>
            <View style={styles.emotionsRow}>
              {EMOTIONS.map(e => {
                const sel = selectedEmotions.includes(e.label);
                return (
                  <TouchableOpacity
                    key={e.label}
                    style={[styles.emoBtn, sel && styles.emoBtnActive]}
                    onPress={() => toggleEmotion(e.label)}
                  >
                    <Text style={styles.emoEmoji}>{e.emoji}</Text>
                    <Text style={[styles.emoLabel, sel && styles.emoLabelActive]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Símbolos */}
            <Text style={styles.sectionLabel}>Símbolos do sonho</Text>
            <Text style={styles.sectionHint}>Toque para selecionar o que apareceu no sonho</Text>
            <View style={styles.symbolsWrap}>
              {SYMBOLS.map(sym => {
                const sel = selectedSymbols.includes(sym);
                return (
                  <TouchableOpacity
                    key={sym}
                    style={[styles.symChip, sel && styles.symChipActive]}
                    onPress={() => toggleSymbol(sym)}
                  >
                    <Text style={[styles.symText, sel && styles.symTextActive]}>{sym}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botão salvar */}
            <TouchableOpacity style={styles.primaryBtn} onPress={saveDream}>
              <Text style={styles.primaryBtnText}>📖 Salvar sonho</Text>
            </TouchableOpacity>

            {/* Botão analisar — aparece só se tem símbolo selecionado */}
            {selectedSymbols.length > 0 && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => analyzeMeaning(selectedSymbols[0])}
              >
                <Text style={styles.secondaryBtnText}>✨ Analisar significado</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ══ HISTÓRICO ══════════════════════════ */}
        {activeTab === 'historico' && (
          <View style={styles.section}>
            {SAMPLE_DREAMS.map(dream => (
              <TouchableOpacity key={dream.id} style={styles.dreamCard} activeOpacity={0.8}>
                <Text style={styles.dreamDate}>{dream.date}</Text>
                <Text style={styles.dreamTitle}>{dream.title}</Text>
                {/*
                  numberOfLines={2} → limita a 2 linhas
                  Texto excedente vira "..." automaticamente
                */}
                <Text style={styles.dreamPreview} numberOfLines={2}>
                  {dream.preview}
                </Text>
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

        {/* ══ SIGNIFICADO ════════════════════════ */}
        {activeTab === 'significado' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Selecione um símbolo para analisar</Text>
            <View style={styles.symbolsWrap}>
              {SYMBOLS.map(sym => (
                <TouchableOpacity
                  key={sym}
                  style={[styles.symChip, analyzedSymbol === sym && styles.symChipActive]}
                  onPress={() => analyzeMeaning(sym)}
                >
                  <Text style={[styles.symText, analyzedSymbol === sym && styles.symTextActive]}>
                    {sym}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resultado — ternário: se tem meaning mostra, senão mostra vazio */}
            {meaning ? (
              <>
                <View style={styles.meaningCard}>
                  <Text style={styles.meaningSymbol}>{analyzedSymbol}</Text>
                  <Text style={styles.meaningTitle}>{meaning.title}</Text>
                  <Text style={styles.meaningSubLabel}>Símbolo central do seu sonho</Text>
                  <Text style={styles.meaningText}>{meaning.text}</Text>
                </View>

                <View style={styles.scoresRow}>
                  <View style={styles.scoreCard}>
                    <Text style={[styles.scoreVal, { color: colors.green }]}>{meaning.score}%</Text>
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

                <View style={styles.affirmCard}>
                  <Text style={styles.affirmLabel}>✦ Reflexão para hoje</Text>
                  <Text style={styles.affirmText}>"{randomAffirmation}"</Text>
                </View>
              </>
            ) : (
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
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  pageSub: { fontSize: 12, fontFamily: fonts.regular, color: colors.text2, marginTop: 2 },

  tabsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, backgroundColor: colors.card2, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { fontSize: 11, fontFamily: fonts.medium, color: colors.text3 },
  tabTextActive: { color: 'white' },

  section: { paddingHorizontal: spacing.lg },
  sectionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text2, marginBottom: spacing.xs, marginTop: spacing.md },
  sectionHint: { fontSize: 11, fontFamily: fonts.regular, color: colors.text3, marginBottom: spacing.sm },

  textAreaWrap: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 0.5, borderColor: colors.borderAccent, marginBottom: spacing.md },
  textArea: { fontSize: 13, fontFamily: fonts.regular, color: colors.text, minHeight: 100, lineHeight: 21 },
  charCount: { fontSize: 10, fontFamily: fonts.regular, color: colors.text3, textAlign: 'right', marginTop: 6 },

  emotionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  emoBtn: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, minWidth: 60 },
  emoBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  emoEmoji: { fontSize: 28 },
  emoLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.text3, marginTop: 4 },
  emoLabelActive: { color: colors.accent3 },

  symbolsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  symChip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.card2, borderWidth: 0.5, borderColor: colors.border },
  symChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  symText: { fontSize: 12, fontFamily: fonts.medium, color: colors.text2 },
  symTextActive: { color: 'white' },

  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 17, alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.md },
  primaryBtnText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
  secondaryBtn: { backgroundColor: 'rgba(108,99,255,0.10)', borderRadius: radius.lg, paddingVertical: 17, alignItems: 'center', borderWidth: 0.5, borderColor: colors.borderAccent, marginBottom: spacing.md },
  secondaryBtnText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.accent3 },

  dreamCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 0.5, borderColor: colors.border },
  dreamDate: { fontSize: 10, fontFamily: fonts.regular, color: colors.text3, marginBottom: 5 },
  dreamTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 6 },
  dreamPreview: { fontSize: 12, fontFamily: fonts.regular, color: colors.text2, lineHeight: 18, marginBottom: spacing.sm },
  dreamEmotions: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  emotionBadge: { backgroundColor: 'rgba(108,99,255,0.12)', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 0.5, borderColor: colors.borderAccent },
  emotionBadgeText: { fontSize: 10, fontFamily: fonts.medium, color: colors.accent3 },

  meaningCard: { backgroundColor: 'rgba(108,99,255,0.10)', borderRadius: radius.xl, padding: spacing.xl, borderWidth: 0.5, borderColor: colors.borderAccent, marginBottom: spacing.md },
  meaningSymbol: { fontSize: 38, marginBottom: spacing.sm },
  meaningTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  meaningSubLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.text3, marginBottom: spacing.md },
  meaningText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text2, lineHeight: 21 },

  scoresRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  scoreCard: { flex: 1, backgroundColor: colors.card2, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  scoreVal: { fontSize: 20, fontFamily: fonts.bold, marginBottom: 4 },
  scoreLbl: { fontSize: 9, fontFamily: fonts.regular, color: colors.text3, textAlign: 'center' },

  affirmCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.accent, borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderTopColor: colors.border, borderRightColor: colors.border, borderBottomColor: colors.border, marginBottom: spacing.md },
  affirmLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: colors.accent3, letterSpacing: 0.5, marginBottom: 6 },
  affirmText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text, fontStyle: 'italic', lineHeight: 20 },

  emptyState: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyEmoji: { fontSize: 52, opacity: 0.4 },
  emptyText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text3, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.xl },
});
