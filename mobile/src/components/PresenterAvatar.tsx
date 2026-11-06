import { useState } from 'react'
import { Image, View } from 'react-native'
import { SITE_URL } from '../lib/env'
import { colors } from '../theme'
import { Initials } from './ui'

/**
 * Presenter avatar with photo support. Falls back to the initials circle
 * until a photo exists: drop `public/presenters/<presenter-id>.jpg`
 * (e.g. `mercyline-akinyi-ogweno.jpg`) on the website and it appears on
 * both apps with no code change (the app loads it from SITE_URL).
 */
export function PresenterAvatar({ id, name, size = 52 }: { id: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false)

  return (
    <View style={{ width: size, height: size }}>
      <Initials name={name} size={size} />
      {failed ? null : (
        <Image
          source={{ uri: `${SITE_URL}/presenters/${id}.jpg` }}
          onError={() => setFailed(true)}
          accessible={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: colors.goldLine,
          }}
        />
      )}
    </View>
  )
}
