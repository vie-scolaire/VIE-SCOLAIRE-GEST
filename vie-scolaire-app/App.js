import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AbsencesScreen from './src/screens/AbsencesScreen';
import SanctionsScreen from './src/screens/SanctionsScreen';
import ElevesScreen from './src/screens/ElevesScreen';
import FicheEleveScreen from './src/screens/FicheEleveScreen';
import PlusScreen from './src/screens/PlusScreen';
import JustificatifsScreen from './src/screens/JustificatifsScreen';
import EmploiDuTempsScreen from './src/screens/EmploiDuTempsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import AbsencesParentScreen from './src/screens/parent/AbsencesParentScreen';
import JustifierAbsenceScreen from './src/screens/parent/JustifierAbsenceScreen';
import ConfirmationScreen from './src/screens/parent/ConfirmationScreen';
import EmploiDuTempsParentScreen from './src/screens/parent/EmploiDuTempsParentScreen';
import { colors } from './src/theme/theme';

const Tab = createBottomTabNavigator();
const ParentTab = createBottomTabNavigator();
const ElevesStack = createNativeStackNavigator();
const PlusStack = createNativeStackNavigator();
const AbsencesParentStack = createNativeStackNavigator();

const icons = {
  Accueil: 'home-outline',
  Absences: 'calendar-outline',
  Sanctions: 'hammer-outline',
  Élèves: 'people-outline',
  Plus: 'ellipsis-horizontal-circle-outline',
  'Emploi du temps': 'time-outline',
  Messages: 'chatbubble-outline',
};

function ElevesStackNavigator() {
  return (
    <ElevesStack.Navigator>
      <ElevesStack.Screen name="ListeEleves" component={ElevesScreen} options={{ title: 'Élèves' }} />
      <ElevesStack.Screen
        name="FicheEleve"
        component={FicheEleveScreen}
        options={{ title: 'Fiche élève' }}
      />
    </ElevesStack.Navigator>
  );
}

// Regroupe les fonctionnalités secondaires (Justificatifs, Emploi du temps,
// Messages) derrière un onglet "Plus" pour ne pas surcharger la barre.
function PlusStackNavigator() {
  return (
    <PlusStack.Navigator>
      <PlusStack.Screen name="PlusMenu" component={PlusScreen} options={{ title: 'Plus' }} />
      <PlusStack.Screen
        name="Justificatifs"
        component={JustificatifsScreen}
        options={{ title: 'Justificatifs' }}
      />
      <PlusStack.Screen
        name="EmploiDuTemps"
        component={EmploiDuTempsScreen}
        options={{ title: 'Emploi du temps' }}
      />
      <PlusStack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
    </PlusStack.Navigator>
  );
}

function AbsencesParentStackNavigator() {
  return (
    <AbsencesParentStack.Navigator>
      <AbsencesParentStack.Screen
        name="AbsencesParent"
        component={AbsencesParentScreen}
        options={{ title: 'Absences' }}
      />
      <AbsencesParentStack.Screen
        name="JustifierAbsence"
        component={JustifierAbsenceScreen}
        options={{ title: 'Justifier' }}
      />
      <AbsencesParentStack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ title: 'Confirmation', headerBackVisible: false }}
      />
    </AbsencesParentStack.Navigator>
  );
}

// Navigation affichée aux rôles CPE / surveillant / enseignant
function CpeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: route.name !== 'Élèves' && route.name !== 'Plus',
      })}
    >
      <Tab.Screen name="Accueil" component={DashboardScreen} />
      <Tab.Screen name="Absences" component={AbsencesScreen} />
      <Tab.Screen name="Sanctions" component={SanctionsScreen} />
      <Tab.Screen name="Élèves" component={ElevesStackNavigator} />
      <Tab.Screen name="Plus" component={PlusStackNavigator} />
    </Tab.Navigator>
  );
}

// Navigation affichée au rôle parent
function ParentTabs() {
  return (
    <ParentTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: route.name !== 'Absences',
      })}
    >
      <ParentTab.Screen name="Absences" component={AbsencesParentStackNavigator} />
      <ParentTab.Screen
        name="Emploi du temps"
        component={EmploiDuTempsParentScreen}
        options={{ headerShown: true }}
      />
      <ParentTab.Screen name="Messages" component={MessagesScreen} options={{ headerShown: true }} />
    </ParentTab.Navigator>
  );
}

function RootNavigator() {
  const { utilisateur, chargement } = useAuth();

  if (chargement) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!utilisateur) {
    return <LoginScreen />;
  }

  // Navigation affichée selon le rôle connecté (le parent ne voit pas les
  // écrans CPE, et inversement).
  if (utilisateur.role === 'parent') {
    return <ParentTabs />;
  }

  return <CpeTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
