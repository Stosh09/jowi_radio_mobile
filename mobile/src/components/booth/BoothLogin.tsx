import { KeyRound } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { usePresenterAuth } from '../../context/PresenterAuthContext'
import { haptic } from '../../lib/haptics'
import { colors, space } from '../../theme'
import { Button, Card, Field, Notice, Txt } from '../ui'

export function BoothLogin() {
  const { loginWithPin } = usePresenterAuth()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!pin.trim()) return
    setBusy(true)
    setError(null)
    const result = await loginWithPin(pin.trim())
    setBusy(false)
    if (result.ok) {
      haptic.success()
      setPin('')
    } else {
      haptic.warn()
      setError(result.message ?? 'Incorrect PIN.')
    }
  }

  return (
    <Card tone="gold">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <KeyRound size={22} color={colors.gold} />
        <Txt variant="heading">Presenter sign in</Txt>
      </View>
      <Txt variant="muted" style={{ marginTop: space.sm }}>
        Enter the booth PIN to manage news for air, listener messages and the live poll.
      </Txt>
      <Field
        label="Booth PIN"
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submit}
        placeholder="••••"
      />
      {error ? (
        <View style={{ marginTop: space.md }}>
          <Notice tone="error">{error}</Notice>
        </View>
      ) : null}
      <Button label="Open booth desk" onPress={submit} loading={busy} block style={{ marginTop: space.lg }} />
    </Card>
  )
}
