// ─────────────────────────────────────────────────────────────
//  src/screens/_placeholders.tsx
//  TELAS TEMPORÁRIAS
//
//  Cada tela real será criada nas próximas partes.
//  Por enquanto, todas mostram um emoji e o nome da tela.
//
//  Parte 2 → HomeScreen.tsx    (Tela Home)
//  Parte 3 → MusicasScreen.tsx (Músicas)
//  Parte 4 → SonhosScreen.tsx  (Sonhos)
//  Parte 5 → SonoScreen.tsx    (Monitor de sono)
//  Parte 6 → LojaScreen.tsx    (Loja PRO)
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

// Componente base reutilizado pelas 5 telas
function PlaceholderScreen({
  emoji,
  name,
}: {
  emoji: string;
  name: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.hint}>Em construção 🚧</Text>
      <Text style={styles.hint}>Será criada na próxima parte</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text3,
  },
});

// Exportamos cada tela individualmente
// O arquivo de cada tela (ex: HomeScreen.tsx) importa daqui
export function HomeScreen()    { return <PlaceholderScreen emoji="🌙" name="Início" />; }
export function MusicasScreen() { return <PlaceholderScreen emoji="🎵" name="Músicas" />; }
export function SonhosScreen()  { return <PlaceholderScreen emoji="☁️" name="Sonhos" />; }
export function SonoScreen()    { return <PlaceholderScreen emoji="📊" name="Sono" />; }
export function LojaScreen()    { return <PlaceholderScreen emoji="👑" name="Loja" />; }
