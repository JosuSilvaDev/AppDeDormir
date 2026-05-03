// ─────────────────────────────────────────────────────────────
//  src/screens/MusicasScreen.tsx
//  TELA DE MÚSICAS
//
//  Estrutura:
//  1. Header         → título da tela
//  2. Barra de busca → filtra músicas por nome
//  3. Chips          → filtra por categoria (Todos, Natureza...)
//  4. Lista          → cards de cada música
//  5. Player         → abre por cima ao clicar numa música
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';

// Pegamos a altura da tela para animar o player
// saindo de baixo (fora da tela) para cima (visível)
const { height: SCREEN_HEIGHT } = Dimensions.get('window');


// ═════════════════════════════════════════
//  DADOS: lista de músicas
//
//  Em produção esses dados virão da API
//  Python. Por enquanto são estáticos.
//
//  Cada música tem:
//  - id       → identificador único
//  - name     → nome da música
//  - category → usada nos filtros
//  - duration → duração em string
//  - totalSec → duração em segundos (para o progresso)
//  - emoji    → ícone visual
//  - bg       → cor de fundo do thumb
//  - desc     → descrição exibida no player
// ═════════════════════════════════════════
const TRACKS = [
  {
    id: 1,
    name: 'Chuva Suave',
    category: 'Natureza',
    duration: '3:45',
    totalSec: 225,
    emoji: '🌧️',
    bg: '#1a2a3a',
    desc: 'Deixe a chuva lavar os pensamentos e trazer paz profunda.',
  },
  {
    id: 2,
    name: 'Piano Relaxante',
    category: 'Instrumental',
    duration: '4:32',
    totalSec: 272,
    emoji: '🎹',
    bg: '#1a1a2e',
    desc: 'Notas suaves que guiam sua mente para o descanso.',
  },
  {
    id: 3,
    name: 'Ondas do Mar',
    category: 'Natureza',
    duration: '5:15',
    totalSec: 315,
    emoji: '🌊',
    bg: '#0a1a2a',
    desc: 'O ritmo eterno do oceano acalma corpo e mente.',
  },
  {
    id: 4,
    name: 'Noite Tranquila',
    category: 'Ambiente',
    duration: '6:02',
    totalSec: 362,
    emoji: '🌙',
    bg: '#0d0d1e',
    desc: 'Silêncio estrelado para uma noite de sono profundo.',
  },
  {
    id: 5,
    name: 'Floresta Serena',
    category: 'Natureza',
    duration: '4:18',
    totalSec: 258,
    emoji: '🌿',
    bg: '#0a1a0a',
    desc: 'Pássaros e vento entre as folhas da floresta.',
  },
  {
    id: 6,
    name: 'Vento na Janela',
    category: 'Ambiente',
    duration: '3:30',
    totalSec: 210,
    emoji: '🍃',
    bg: '#111822',
    desc: 'O sussurro do vento como um abraço suave.',
  },
];

// Categorias para os chips de filtro
const CATEGORIES = ['Todos', 'Natureza', 'Instrumental', 'Ambiente'];

// Tipo TypeScript da música (para evitar erros)
type Track = typeof TRACKS[0];


// ═════════════════════════════════════════
//  COMPONENTE: Player
//
//  Abre por cima da lista com animação
//  de slide vindo de baixo para cima.
//
//  Props:
//  - track   → música atual
//  - onClose → função para fechar o player
//  - onNext  → avança para próxima música
//  - onPrev  → volta para música anterior
// ═════════════════════════════════════════
function Player({
  track,
  onClose,
  onNext,
  onPrev,
}: {
  track: Track;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  // Estado local do player
  const [playing, setPlaying]   = useState(true);
  const [progress, setProgress] = useState(0); // 0 a 1 (0% a 100%)

  // Animação de entrada: começa fora da tela (SCREEN_HEIGHT)
  // e vai até 0 (posição normal)
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Quando o player monta, anima a entrada
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,   // rigidez da mola
      friction: 10,  // amortecimento (menos = mais bounce)
      useNativeDriver: true,
    }).start();
  }, []);

  // Quando a música muda (next/prev), reinicia o progresso
  useEffect(() => {
    setProgress(0);
    setPlaying(true);
  }, [track.id]);

  // Simula progresso da música com setInterval
  // setInterval chama a função a cada 100ms
  // clearInterval cancela quando o componente desmonta
  useEffect(() => {
    if (!playing) return; // pausa → não avança

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          onNext(); // chegou no fim → próxima música
          return 0;
        }
        return prev + (1 / (track.totalSec * 10)); // 100ms por tick
      });
    }, 100);

    // Cleanup: cancela o interval quando parar ou desmontar
    return () => clearInterval(interval);
  }, [playing, track.id]);

  // Fecha o player com animação de saída (slide para baixo)
  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(onClose); // chama onClose quando a animação termina
  };

  // Converte o progresso (0-1) em string de tempo "M:SS"
  const elapsed = Math.floor(progress * track.totalSec);
  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, '0');
  const timeStr = `${minutes}:${seconds}`;

  return (
    // O player fica por cima de tudo (position absolute + zIndex)
    // A animação move ele verticalmente com translateY
    <Animated.View
      style={[
        styles.playerWrap,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >

      {/* ── Cena visual da música ── */}
      {/*
        Fundo escuro com a cor da música.
        Mostra um emoji grande como visual principal.
        Em produção, aqui entraria um vídeo ou animação canvas.
      */}
      <View style={[styles.playerScene, { backgroundColor: track.bg }]}>

        {/* Botão voltar */}
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeBtnText}>‹</Text>
        </TouchableOpacity>

        {/* Visual principal da cena */}
        <Text style={styles.sceneEmoji}>{track.emoji}</Text>
        <Text style={styles.sceneTitle}>{track.name}</Text>
        <Text style={styles.sceneCat}>
          {track.category.toUpperCase()}
        </Text>
      </View>

      {/* ── Corpo do player ── */}
      <View style={styles.playerBody}>

        {/* Descrição da música */}
        <Text style={styles.playerDesc}>{track.desc}</Text>

        {/* ── Barra de progresso ── */}
        <View style={styles.progressWrap}>
          {/*
            A barra tem dois layers:
            1. Fundo cinza (100% de largura)
            2. Fill roxo (% de largura = progresso)
          */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>

          {/* Tempos: atual e total */}
          <View style={styles.progressTimes}>
            <Text style={styles.progressTime}>{timeStr}</Text>
            <Text style={styles.progressTime}>{track.duration}</Text>
          </View>
        </View>

        {/* ── Controles ── */}
        <View style={styles.controls}>

          {/* Anterior */}
          <TouchableOpacity onPress={onPrev}>
            <Text style={styles.ctrlIcon}>⏮</Text>
          </TouchableOpacity>

          {/* Play / Pause — botão principal grande */}
          <TouchableOpacity
            style={styles.playMainBtn}
            onPress={() => setPlaying(p => !p)}
          >
            <Text style={styles.playMainIcon}>
              {playing ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>

          {/* Próxima */}
          <TouchableOpacity onPress={onNext}>
            <Text style={styles.ctrlIcon}>⏭</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Animated.View>
  );
}


// ═════════════════════════════════════════
//  TELA PRINCIPAL: MusicasScreen
// ═════════════════════════════════════════
export default function MusicasScreen() {

  // ── Estados ──────────────────────────────
  // useState(valor_inicial) → retorna [valor, setValor]
  // Quando setValor é chamado, React re-renderiza o componente

  // Categoria selecionada no filtro
  const [category, setCategory] = useState('Todos');

  // Texto da busca
  const [search, setSearch] = useState('');

  // Música que está tocando (null = nenhuma)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // Se o player está visível
  const [showPlayer, setShowPlayer] = useState(false);

  // ── Filtro de músicas ─────────────────────
  // filter() retorna novo array com só os itens que passam na condição
  const filtered = TRACKS.filter(track => {
    const matchCategory =
      category === 'Todos' || track.category === category;
    const matchSearch =
      track.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // ── Handlers ─────────────────────────────
  const openPlayer = (track: Track) => {
    setCurrentTrack(track);
    setShowPlayer(true);
  };

  const closePlayer = () => {
    setShowPlayer(false);
    setCurrentTrack(null);
  };

  // Avança para a próxima música na lista
  const nextTrack = () => {
    if (!currentTrack) return;
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    setCurrentTrack(TRACKS[(idx + 1) % TRACKS.length]);
  };

  // Volta para a música anterior
  const prevTrack = () => {
    if (!currentTrack) return;
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    setCurrentTrack(TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length]);
  };

  // Verifica se uma música está tocando agora
  const isPlaying = (track: Track) =>
    currentTrack?.id === track.id && showPlayer;


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Músicas</Text>
          <Text style={styles.pageSub}>Sons que acalmam a mente</Text>
        </View>
      </View>

      {/* ── Barra de busca ── */}
      {/*
        TextInput é o campo de texto do React Native.
        onChangeText → chamado a cada letra digitada.
        value + onChangeText = "controlled input"
        (React controla o valor, não o DOM)
      */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar música ou categoria"
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={setSearch}
        />
        {/* Botão de limpar busca */}
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Chips de categoria ── */}
      {/*
        ScrollView horizontal permite scroll para o lado.
        Útil quando há mais chips do que cabe na tela.
      */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              category === cat && styles.chipActive,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[
                styles.chipText,
                category === cat && styles.chipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Lista de músicas ── */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {/* Caso não encontre nenhuma música */}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎵</Text>
            <Text style={styles.emptyText}>
              Nenhuma música encontrada
            </Text>
          </View>
        )}

        {/* map() → transforma cada item do array em um componente */}
        {filtered.map(track => (
          <TouchableOpacity
            key={track.id}
            style={[
              styles.trackItem,
              isPlaying(track) && styles.trackItemActive,
            ]}
            onPress={() => openPlayer(track)}
            activeOpacity={0.7}
          >
            {/* Thumb com emoji e cor de fundo */}
            <View
              style={[
                styles.trackThumb,
                { backgroundColor: track.bg },
              ]}
            >
              <Text style={styles.trackEmoji}>{track.emoji}</Text>
            </View>

            {/* Info da música */}
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>{track.name}</Text>
              <Text style={styles.trackMeta}>
                {track.category} · {track.duration}
              </Text>
            </View>

            {/* Botão play/pause */}
            <View
              style={[
                styles.playMini,
                isPlaying(track) && styles.playMiniActive,
              ]}
            >
              <Text style={styles.playMiniIcon}>
                {isPlaying(track) ? '⏸' : '▶'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Player ── */}
      {/*
        Renderização condicional: só monta o Player se
        showPlayer=true e currentTrack não for null.
        O "&&" é o "if" do JSX.
      */}
      {showPlayer && currentTrack && (
        <Player
          track={currentTrack}
          onClose={closePlayer}
          onNext={nextTrack}
          onPrev={prevTrack}
        />
      )}

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

  // ── Busca ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card2,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 0.5,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  clearBtn: {
    fontSize: 14,
    color: colors.text3,
    padding: 4,
  },

  // ── Chips ──
  chipsScroll: { maxHeight: 44 },
  chipsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card2,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text2,
  },
  chipTextActive: { color: 'white' },

  // ── Lista ──
  list: { flex: 1 },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  // Fundo levemente roxo quando tocando
  trackItemActive: {
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  trackThumb: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackEmoji: { fontSize: 26 },
  trackInfo: { flex: 1 },
  trackName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 3,
  },
  trackMeta: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.text3,
  },
  playMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playMiniActive: { backgroundColor: colors.accent2 },
  playMiniIcon: { fontSize: 14, color: 'white' },

  // ── Estado vazio ──
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48, opacity: 0.4 },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text3,
  },

  // ── Player ──
  playerWrap: {
    position: 'absolute',  // por cima de tudo
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    zIndex: 100,           // garante que fica na frente
  },

  // Área da cena visual (fundo colorido com emoji)
  playerScene: {
    height: 290,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,  // abaixo da status bar
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 24,
    color: 'white',
    marginTop: -2,
  },
  sceneEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  sceneTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: 'white',
  },
  sceneCat: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
  },

  // Corpo do player (progresso + controles)
  playerBody: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  playerDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text2,
    lineHeight: 20,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },

  // Barra de progresso
  progressWrap: { marginBottom: spacing.xxl },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.accent3,
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progressTime: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.text3,
  },

  // Controles play/pause/next/prev
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxxl,
  },
  ctrlIcon: {
    fontSize: 30,
    color: colors.text2,
  },
  playMainBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra roxa
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playMainIcon: {
    fontSize: 28,
    color: 'white',
  },
});
