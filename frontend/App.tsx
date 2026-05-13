// ─────────────────────────────────────────────────────────────
//  App.tsx
//  PONTO DE ENTRADA DO APP
//
//  Este é o primeiro arquivo executado pelo React Native.
//  Responsabilidades:
//  1. Carregar as fontes customizadas
//  2. Manter a splash screen até tudo estar pronto
//  3. Renderizar o sistema de navegação
//
//  Instale os pacotes de fonte:
//  npx expo install @expo-google-fonts/outfit expo-font expo-splash-screen
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Fontes do Google via Expo
// Cada variante é importada separadamente
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

// SplashScreen controla quando a tela de abertura desaparece
import * as SplashScreen from 'expo-splash-screen';

// Nossa navegação com as 5 abas
import AppNavigator from './src/navigation/AppNavigator';

// Cores do tema
import { colors } from './src/theme';

// Mantém a splash screen visível até chamarmos hideAsync()
// Se não chamar isso, a splash desaparece antes das fontes carregarem
SplashScreen.preventAutoHideAsync();

// ─────────────────────────────────────────────────────────────
//  COMPONENTE RAIZ
// ─────────────────────────────────────────────────────────────
export default function App() {

  // useFonts() carrega as fontes de forma assíncrona.
  // Retorna [fontsLoaded, fontError]:
  // - fontsLoaded = true quando as fontes estão prontas
  // - fontError   = erro caso alguma fonte falhe ao carregar
  const [fontsLoaded, fontError] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // useEffect roda quando fontsLoaded ou fontError mudam.
  // Quando um dos dois acontece, escondemos a splash screen.
  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Enquanto as fontes não carregaram E não deu erro,
  // retornamos null — a splash screen ainda está visível.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Tudo pronto! Renderizamos o app.
  return (
    <View style={styles.root}>
      {/*
        StatusBar "light" = ícones brancos (hora, bateria, sinal).
        Combina com nosso fundo escuro.
      */}
      <StatusBar style="light" backgroundColor={colors.bg} />

      {/* Todo o sistema de abas e telas fica aqui */}
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,                        // ocupa toda a tela
    backgroundColor: colors.bg,    // fundo escuro enquanto carrega
  },
});
