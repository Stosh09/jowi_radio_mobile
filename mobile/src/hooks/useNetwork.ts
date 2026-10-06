import { useNetInfo } from '@react-native-community/netinfo'

/** `isOffline` is only true once NetInfo is sure — unknown states count as online. */
export function useNetwork() {
  const info = useNetInfo()
  const isOffline = info.isConnected === false || info.isInternetReachable === false
  return { isOffline, type: info.type, details: info }
}
