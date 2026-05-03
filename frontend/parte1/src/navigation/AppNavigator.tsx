// ─────────────────────────────────────────────────────────────
//  src/navigation/AppNavigator.tsx
//  NAVEGAÇÃO PRINCIPAL DO APP
//
//  Instale as dependências antes de usar:
//  npx expo install @react-navigation/native
//  npx expo install @react-navigation/bottom-tabs
//  npx expo install react-native-screens react-native-safe-area-context
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// NavigationContainer = envolve todo o app com o contexto de navegação
import { NavigationContainer } from '@react-navigation/native';

// createBottomTabNavigator = cria a barra de abas no fundo da tela
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importamos cada tela (por enquanto são placeholders)
import HomeScreen    from '../screens/HomeScreen';
import MusicasScreen from '../screens/MusicasScreen';
import SonhosScreen  from '../screens/SonhosScreen';
import SonoScreen    from '../screens/SonoScreen';
import LojaScreen    from '../screens/LojaScreen';

// Importamos nosso tema
import { colors, fonts, spacing } from '../theme';

// Criamos o objeto Tab — ele gera o Navigator e o Screen
const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────────────────────
//  COMPONENTE: Ícone customizado de cada aba
//
//  Por que criar um componente separado?
//  Porque cada aba precisa mostrar emoji + label + destaque ativo.
//  Centralizar aqui evita repetir o mesmo código 5 vezes.
//
//  Props:
//  - emoji   → o símbolo visual da aba
//  - label   → texto abaixo do emoji
//  - focused → true se essa aba está ativa no momento
// ─────────────────────────────────────────────────────────────
function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    // Se focused=true, aplica fundo roxo sutil
    <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      {/* Label muda de cor quando ativa */}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL: AppNavigator
//
//  Esse componente vai dentro do <App /> e envolve tudo.
//  Cada Tab.Screen recebe:
//  - name      → identificador único da rota
//  - component → qual tela renderizar
//  - options   → configurações (ícone, label, etc.)
// ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    // NavigationContainer DEVE envolver todo o sistema de navegação
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,      // cada tela tem seu próprio header
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,  // escondemos o label padrão (usamos o nosso)
        }}
      >
        {/* ── ABA 1: INÍCIO ── */}
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" label="Início" focused={focused} />
            ),
          }}
        />

        {/* ── ABA 2: MÚSICAS ── */}
        <Tab.Screen
          name="Musicas"
          component={MusicasScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🎵" label="Músicas" focused={focused} />
            ),
          }}
        />

        {/* ── ABA 3: SONHOS ── */}
        <Tab.Screen
          name="Sonhos"
          component={SonhosScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="☁️" label="Sonhos" focused={focused} />
            ),
          }}
        />

        {/* ── ABA 4: SONO ── */}
        <Tab.Screen
          name="Sono"
          component={SonoScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🌙" label="Sono" focused={focused} />
            ),
          }}
        />

        {/* ── ABA 5: LOJA ── */}
        <Tab.Screen
          name="Loja"
          component={LojaScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🛍️" label="Loja" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS
//
//  No React Native os estilos são objetos JavaScript, não CSS.
//  Usamos StyleSheet.create() para otimização de performance.
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // A barra no fundo da tela
  tabBar: {
    backgroundColor: colors.bg2,
    borderTopColor: colors.border,
    borderTopWidth: 0.5,
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
  },

  // Container de cada ícone
  tabIconWrap: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 14,
  },

  // Fundo roxo quando aba está ativa
  tabIconActive: {
    backgroundColor: 'rgba(108,99,255,0.15)',
  },

  tabEmoji: {
    fontSize: 18,
  },

  // Label cinza por padrão
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.text3,
  },

  // Label roxa quando ativa
  tabLabelActive: {
    color: colors.accent3,
  },
});
