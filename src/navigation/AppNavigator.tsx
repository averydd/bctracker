import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../theme';

import { HomeScreen } from '../screens/HomeScreen';
import { LogEncounterScreen } from '../screens/LogEncounterScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PartnerDetailScreen } from '../screens/PartnerDetailScreen';
import { PartnersListScreen } from '../screens/PartnersListScreen';
import { PartnerRankingsScreen } from '../screens/PartnerRankingsScreen';
import { EncounterDetailScreen } from '../screens/EncounterDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Log') iconName = 'add-circle';
          else if (route.name === 'Calendar') iconName = 'calendar';
          else if (route.name === 'Stats') iconName = 'stats-chart';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Log" component={LogEncounterScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="PartnerDetail"
          component={PartnerDetailScreen}
          options={{ title: 'Partner' }}
        />
        <Stack.Screen
          name="PartnersList"
          component={PartnersListScreen}
          options={{ title: 'All Partners' }}
        />
        <Stack.Screen
          name="PartnerRankings"
          component={PartnerRankingsScreen}
          options={{ title: 'Partner Rankings' }}
        />
        <Stack.Screen
          name="EncounterDetail"
          component={EncounterDetailScreen}
          options={{ title: 'Encounter' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
