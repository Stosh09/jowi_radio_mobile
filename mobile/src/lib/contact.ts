import * as WebBrowser from 'expo-web-browser'
import { Alert, Linking, Share } from 'react-native'
import { STATION } from '@shared/station'
import { colors } from '../theme'
import { SITE_URL } from './env'

const digits = (value: string) => value.replace(/[^\d+]/g, '')

async function open(url: string, fallback?: string) {
  try {
    await Linking.openURL(url)
  } catch {
    if (fallback) {
      try {
        await Linking.openURL(fallback)
        return
      } catch {
        /* fall through */
      }
    }
    Alert.alert('Could not open', 'No app on this phone can handle that action.')
  }
}

export function callStudio() {
  return open(`tel:${digits(STATION.about.phone)}`)
}

export function smsStudio(body = '') {
  const query = body ? `?body=${encodeURIComponent(body)}` : ''
  return open(`sms:${digits(STATION.about.phone)}${query}`)
}

export function whatsappStudio(text = `Hi ${STATION.name}! `) {
  const encoded = encodeURIComponent(text)
  return open(
    `whatsapp://send?phone=${STATION.about.whatsapp}&text=${encoded}`,
    `https://wa.me/${STATION.about.whatsapp}?text=${encoded}`,
  )
}

export function emailStudio(subject = '', body = '') {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const query = params.toString()
  return open(`mailto:${STATION.about.email}${query ? `?${query}` : ''}`)
}

export function openExternal(url: string) {
  return open(url)
}

/** In-app browser for documents and long pages, styled to the brand. */
export async function openInApp(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: colors.bg,
      controlsColor: colors.gold,
      enableBarCollapsing: true,
    })
  } catch {
    await open(url)
  }
}

export async function shareListening(showTitle?: string) {
  const on = showTitle ? ` — ${showTitle} is on now` : ''
  try {
    await Share.share({
      title: `${STATION.name} — Live`,
      message: `I'm listening to ${STATION.name} live${on}. Tune in: ${SITE_URL}`,
    })
  } catch {
    /* user dismissed */
  }
}
