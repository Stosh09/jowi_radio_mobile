import { Stack, useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button, Txt } from '../components/ui'
import { colors, space } from '../theme'

export default function NotFound() {
  const router = useRouter()
  return (
    <>
      <Stack.Screen options={{ title: 'Off the air' }} />
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md }}>
        <Txt variant="title">Dead air</Txt>
        <Txt variant="muted" style={{ textAlign: 'center' }}>
          That page is not on the schedule.
        </Txt>
        <Button label="Back to the radio" onPress={() => router.replace('/')} />
      </View>
    </>
  )
}
