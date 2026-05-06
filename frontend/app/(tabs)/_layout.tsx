import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DARK = '#1A1208';
const TEAL = '#05A8AA';
const RED = '#BC412B';
const INACTIVE = 'rgba(255,255,255,0.4)';

// Routes inside the `profile` stack that are actually about *another* user.
// When the active route is one of these, we want the Friends tab to appear
// highlighted instead of Profile, since the user navigated here from Friends.
const FRIENDS_OWNED_PROFILE_ROUTES = new Set(['user-profile', 'user-posts']);

function useFriendsOwnedRouteActive() {
  const segments = useSegments();
  // Expected shape when in a friend-owned profile route:
  //   ['(tabs)', 'profile', 'user-profile' | 'user-posts']
  for (let i = 0; i < segments.length - 1; i += 1) {
    if (segments[i] === 'profile' && FRIENDS_OWNED_PROFILE_ROUTES.has(segments[i + 1])) {
      return true;
    }
  }
  return false;
}

function CreateTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={accessibilityState}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: RED,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <IconSymbol size={26} name="plus" color="#fff" />
      </View>
    </Pressable>
  );
}

function HomeTabButton(props: BottomTabBarButtonProps) {
  const router = useRouter();
  return (
    <HapticTab
      {...props}
      onPress={(event) => {
        props.onPress?.(event);
        router.navigate('/(tabs)');
      }}
    />
  );
}

function SearchTabButton(props: BottomTabBarButtonProps) {
  const router = useRouter();
  return (
    <HapticTab
      {...props}
      onPress={(event) => {
        props.onPress?.(event);
        router.navigate('/search');
      }}
    />
  );
}

function FriendsTabButton(props: BottomTabBarButtonProps) {
  const router = useRouter();
  return (
    <HapticTab
      {...props}
      onPress={(event) => {
        props.onPress?.(event);
        router.navigate('/browse');
      }}
    />
  );
}

function ProfileTabButton(props: BottomTabBarButtonProps) {
  const router = useRouter();
  return (
    <HapticTab
      {...props}
      onPress={(event) => {
        props.onPress?.(event);
        router.navigate('/profile');
      }}
    />
  );
}

function FriendsTabIcon({ color }: { color: string }) {
  const friendsOwned = useFriendsOwnedRouteActive();
  const effectiveColor = friendsOwned ? TEAL : color;
  return <IconSymbol size={26} name="person.2.fill" color={effectiveColor} />;
}

function ProfileTabIcon({ color }: { color: string }) {
  const friendsOwned = useFriendsOwnedRouteActive();
  const effectiveColor = friendsOwned ? INACTIVE : color;
  return <IconSymbol size={26} name="person.fill" color={effectiveColor} />;
}

function FriendsTabLabel({ children, color }: { children: string; color: string }) {
  const friendsOwned = useFriendsOwnedRouteActive();
  const effectiveColor = friendsOwned ? TEAL : color;
  return <Text style={{ fontSize: 11, fontWeight: '600', color: effectiveColor }}>{children}</Text>;
}

function ProfileTabLabel({ children, color }: { children: string; color: string }) {
  const friendsOwned = useFriendsOwnedRouteActive();
  const effectiveColor = friendsOwned ? INACTIVE : color;
  return <Text style={{ fontSize: 11, fontWeight: '600', color: effectiveColor }}>{children}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: TEAL,
        tabBarInactiveTintColor: INACTIVE,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: DARK,
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarButton: HomeTabButton,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarButton: SearchTabButton,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarButton: CreateTabButton,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Friends',
          tabBarButton: FriendsTabButton,
          tabBarIcon: ({ color }) => <FriendsTabIcon color={color} />,
          tabBarLabel: ({ color, children }) => <FriendsTabLabel color={color}>{children}</FriendsTabLabel>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarButton: ProfileTabButton,
          tabBarIcon: ({ color }) => <ProfileTabIcon color={color} />,
          tabBarLabel: ({ color, children }) => <ProfileTabLabel color={color}>{children}</ProfileTabLabel>,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
