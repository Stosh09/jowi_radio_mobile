import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Camera, FileText, ImagePlus, Paperclip, RotateCcw, Sparkles, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { estimateReadTime, type NewsCategory, type NewsItem, type NewsStatus } from '@shared/news'
import { useNews } from '../../context/NewsContext'
import {
  ATTACHMENT_MIME_TYPES,
  extractAttachmentText,
  validateAttachment,
  type PickedAttachment,
} from '../../lib/attachments'
import { haptic } from '../../lib/haptics'
import { colors, radius, space } from '../../theme'
import { Button, Field, IconButton, Notice, Segmented, Txt } from '../ui'

const CATEGORIES: NewsCategory[] = ['Breaking', 'Community', 'Sports', 'Weather', 'Bulletin']
const STATUSES: { value: NewsStatus; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

type Note = { tone: 'info' | 'warn' | 'error' | 'success'; text: string }

export function BulletinForm({
  visible,
  item,
  onClose,
}: {
  visible: boolean
  item: NewsItem | null
  onClose: () => void
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      {visible ? <BulletinFormBody key={item?.id ?? 'new'} item={item} onClose={onClose} /> : null}
    </Modal>
  )
}

function BulletinFormBody({ item, onClose }: { item: NewsItem | null; onClose: () => void }) {
  const { createBulletin, updateBulletin } = useNews()
  const [headline, setHeadline] = useState(item?.headline ?? '')
  const [summary, setSummary] = useState(item?.summary ?? '')
  const [body, setBody] = useState(item?.body ?? '')
  const [category, setCategory] = useState<NewsCategory>(item?.category ?? 'Bulletin')
  const [status, setStatus] = useState<NewsStatus>(item?.status ?? 'live')
  const [file, setFile] = useState<PickedAttachment | null>(null)
  const [keepExisting, setKeepExisting] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<Note | null>(null)

  const existingName = keepExisting ? item?.attachmentName : null

  const applyExtract = async (picked: PickedAttachment) => {
    setExtracting(true)
    setNote({ tone: 'info', text: 'Reading the attachment…' })
    const res = await extractAttachmentText(picked)
    setExtracting(false)
    if (!res.ok) {
      haptic.warn()
      setNote({ tone: 'warn', text: res.message })
      return
    }
    const fill = () => {
      setBody(res.text)
      if (res.headline) setHeadline((h) => h.trim() || res.headline || h)
      if (res.summary) setSummary((s) => s.trim() || res.summary || s)
      haptic.success()
      setNote({
        tone: res.warning ? 'warn' : 'success',
        text: res.warning ?? (res.engine === 'local' ? 'Text pulled from the file. Edit for air.' : 'Extracted. Edit for air.'),
      })
    }
    if (body.trim() && body.trim() !== res.text) {
      Alert.alert('Replace on-air body?', 'The attachment text will replace what you have typed.', [
        { text: 'Keep mine', style: 'cancel', onPress: () => setNote({ tone: 'info', text: 'Kept your text. Attachment will still be saved.' }) },
        { text: 'Replace', onPress: fill },
      ])
    } else {
      fill()
    }
  }

  const accept = (picked: PickedAttachment) => {
    const problem = validateAttachment(picked)
    if (problem) {
      haptic.warn()
      setNote({ tone: 'error', text: problem })
      return
    }
    setFile(picked)
    void applyExtract(picked)
  }

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ATTACHMENT_MIME_TYPES, copyToCacheDirectory: true })
    if (res.canceled || !res.assets?.[0]) return
    const a = res.assets[0]
    accept({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/octet-stream', size: a.size ?? null })
  }

  const pickImage = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) {
        setNote({ tone: 'warn', text: 'Camera permission is off. Enable it in phone settings to snap a press release.' })
        return
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 0.9 }
    const res =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
    if (res.canceled || !res.assets?.[0]) return
    const a = res.assets[0]
    const mimeType = a.mimeType ?? 'image/jpeg'
    accept({
      uri: a.uri,
      name: a.fileName ?? `bulletin-${Date.now()}.${mimeType.split('/')[1] ?? 'jpg'}`,
      mimeType,
      size: a.fileSize ?? null,
      width: a.width,
      height: a.height,
    })
  }

  const removeFile = () => {
    setFile(null)
    if (item?.attachmentPath) setKeepExisting(false)
    setNote(null)
  }

  const save = async () => {
    if (!headline.trim() || !body.trim()) {
      haptic.warn()
      setNote({ tone: 'error', text: 'Headline and on-air body are required.' })
      return
    }
    setSaving(true)
    const input = {
      headline,
      summary,
      body,
      category,
      status,
      file,
      clearAttachment: Boolean(item?.attachmentPath) && !keepExisting && !file,
    }
    const res = item ? await updateBulletin(item.id, input) : await createBulletin(input)
    setSaving(false)
    if (res.ok) {
      haptic.success()
      onClose()
    } else {
      haptic.warn()
      setNote({ tone: 'error', text: res.error ?? 'Save failed.' })
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Txt variant="heading" style={{ flex: 1 }}>
            {item ? 'Edit bulletin' : 'New bulletin'}
          </Txt>
          <IconButton icon={X} label="Close" onPress={onClose} />
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Txt variant="eyebrow">Source (optional)</Txt>
            <Txt variant="small" style={{ marginTop: 4 }}>
              Snap a press release or attach a PDF, Word or text file — JOWI pulls out the copy for you.
            </Txt>
            <View style={styles.pickRow}>
              <Button compact label="Camera" icon={Camera} variant="outline" onPress={() => void pickImage('camera')} disabled={extracting} />
              <Button compact label="Photo" icon={ImagePlus} variant="outline" onPress={() => void pickImage('library')} disabled={extracting} />
              <Button compact label="Document" icon={FileText} variant="outline" onPress={() => void pickDocument()} disabled={extracting} />
            </View>

            {file || existingName ? (
              <View style={styles.fileRow}>
                <Paperclip size={16} color={colors.gold} />
                <Txt variant="small" style={{ flex: 1, color: colors.white }} numberOfLines={1}>
                  {file?.name ?? existingName}
                </Txt>
                {file ? (
                  <IconButton icon={RotateCcw} label="Re-extract text" size={16} onPress={() => void applyExtract(file)} />
                ) : null}
                <IconButton icon={X} label="Remove attachment" size={16} onPress={removeFile} />
              </View>
            ) : null}

            {note ? (
              <View style={{ marginTop: space.md }}>
                <Notice tone={note.tone}>{note.text}</Notice>
              </View>
            ) : null}

            <Field label="Headline" value={headline} onChangeText={setHeadline} placeholder="Short, clear headline" maxLength={160} />
            <Field label="Summary" value={summary} onChangeText={setSummary} placeholder="One line for the board" maxLength={280} />
            <Field
              label="On-air body"
              value={body}
              onChangeText={setBody}
              multiline
              style={{ minHeight: 200 }}
              placeholder="What the presenter reads on air"
              hint={body.trim() ? `Estimated read: ${estimateReadTime(body)}` : undefined}
            />

            <Txt variant="eyebrow" style={{ marginTop: space.lg, marginBottom: space.sm }}>
              Category
            </Txt>
            <Segmented value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            {category === 'Breaking' ? (
              <Txt variant="small" style={{ marginTop: 6 }}>
                Breaking bulletins jump to the top of the board.
              </Txt>
            ) : null}

            <Txt variant="eyebrow" style={{ marginTop: space.lg, marginBottom: space.sm }}>
              Status
            </Txt>
            <Segmented value={status} onChange={setStatus} options={STATUSES} />
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.footer}>
          <Button label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
          <Button
            label={item ? 'Save changes' : status === 'live' ? 'Publish' : 'Save'}
            icon={extracting ? undefined : Sparkles}
            onPress={() => void save()}
            loading={saving}
            disabled={extracting}
            style={{ flex: 2 }}
          />
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  content: { padding: space.lg, paddingBottom: space.xxl },
  pickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: space.md,
    paddingLeft: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.goldSoft,
  },
  footer: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
})
