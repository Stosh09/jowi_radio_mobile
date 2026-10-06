import { Tabs } from 'expo-router'
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs'
import { CalendarDays, Menu, MessageCircle, Radio, Users } from 'lucide-react-native'
import { View } from 'react-native'
import { MiniPlayer } from '../../components/MiniPlayer'
import { haptic } from '../../lib/haptics'
import { colors, fonts } from '../../theme'

function TabBarWithPlayer(props: BottomTabBarProps) {
  const onListen = props.state.routes[props.state.index]?.name === 'index'
  return (
    <View style={{ backgroundColor: colors.bg }}>
      {onListen ? null : <MiniPlayer />}
      <BottomTabBar {...props} />
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBarWithPlayer {...props} />}
      screenListeners={{ tabPress: () => haptic.tap() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Listen', tabBarIcon: ({ color, size }) => <Radio color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Schedule', tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="interact"
        options={{ title: 'Interact', tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="presenters"
        options={{ title: 'Presenters', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
      />
    </Tabs>
  )
}
