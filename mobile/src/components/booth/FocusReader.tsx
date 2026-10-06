import { useKeepAwake } from 'expo-keep-awake'
import { AArrowDown, AArrowUp, Check, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NewsItem } from '@shared/news'
import { colors, fonts, space } from '../../theme'
import { Button, IconButton, Pill, Txt } from '../ui'

const SIZES = [22, 26, 30, 36, 42]

function ReaderBody({
  item,
  used,
  onToggleUsed,
  onClose,
}: {
  item: NewsItem
  used: boolean
  onToggleUsed: () => void
  onClose: () => void
}) {
  useKeepAwake('booth-focus-reader')
  const [sizeIdx, setSizeIdx] = useState(2)
  const size = SIZES[sizeIdx]

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.toolbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Pill label={item.category} tone={item.category === 'Breaking' ? 'live' : 'gold'} />
          <Txt variant="small">{item.readTime}</Txt>
        </View>
        <IconButton
          icon={AArrowDown}
          label="Smaller text"
          onPress={() => setSizeIdx((i) => Math.max(0, i - 1))}
        />
        <IconButton
          icon={AArrowUp}
          label="Larger text"
          onPress={() => setSizeIdx((i) => Math.min(SIZES.length - 1, i + 1))}
        />
        <IconButton icon={X} label="Close reader" onPress={onClose} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Txt style={[styles.headline, { fontSize: size + 6, lineHeight: (size + 6) * 1.2 }]}>{item.headline}</Txt>
        <Txt style={[styles.body, { fontSize: size, lineHeight: size * 1.45 }]}>{item.body || item.summary}</Txt>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={used ? 'Read this hour' : 'Mark as read on air'}
          icon={Check}
          variant={used ? 'outline' : 'primary'}
          onPress={onToggleUsed}
          block
        />
      </View>
    </SafeAreaView>
  )
}

/** Full-screen teleprompter for reading a bulletin live; keeps the screen awake while open. */
export function FocusReader({
  item,
  used,
  onToggleUsed,
  onClose,
}: {
  item: NewsItem | null
  used: boolean
  onToggleUsed: () => void
  onClose: () => void
}) {
  return (
    <Modal visible={Boolean(item)} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {item ? <ReaderBody item={item} used={used} onToggleUsed={onToggleUsed} onClose={onClose} /> : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  content: { padding: space.xl, paddingBottom: space.xxl * 2 },
  headline: { fontFamily: fonts.display, color: colors.gold, textTransform: 'uppercase' },
  body: { fontFamily: fonts.bodyMedium, color: colors.white, marginTop: space.xl },
  footer: { padding: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
})
