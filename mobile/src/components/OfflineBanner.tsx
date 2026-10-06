import { WifiOff } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetwork } from '../hooks/useNetwork'
import { colors, fonts } from '../theme'

export function OfflineBanner() {
  const { isOffline } = useNetwork()
  const insets = useSafeAreaInsets()
  if (!isOffline) return null
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]} accessibilityLiveRegion="polite">
      <WifiOff size={14} color={colors.black} />
      <Text style={styles.text}>Offline — showing saved schedule & messages</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 6,
    backgroundColor: colors.warn,
  },
  text: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.black },
})
