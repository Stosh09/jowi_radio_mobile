import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { PRESENTERS } from '@shared/station'
import { PresenterCard } from '../../components/PresenterCard'
import { Field, Screen, Segmented, Txt } from '../../components/ui'
import { usePreferences } from '../../context/PreferencesContext'
import { useNowPlaying } from '../../hooks/useNowPlaying'
import { space } from '../../theme'

type Filter = 'all' | 'following'

export default function PresentersScreen() {
  const { current } = useNowPlaying()
  const { favorites } = usePreferences()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRESENTERS.filter((p) => filter === 'all' || favorites.presenters.includes(p.id))
      .filter((p) => !q || `${p.name} ${p.show} ${p.role}`.toLowerCase().includes(q))
      .sort((a, b) => Number(current?.hostIds.includes(b.id)) - Number(current?.hostIds.includes(a.id)))
  }, [filter, query, favorites.presenters, current])

  return (
    <Screen>
      <Txt variant="eyebrow">The booth</Txt>
      <Txt variant="display" style={{ marginTop: 6 }}>
        Presenters
      </Txt>
      <Txt variant="muted" style={{ marginTop: 6 }}>
        The voices of JOWI. Follow your favourites to see when they are on air.
      </Txt>

      <View style={{ marginTop: space.md }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All (${PRESENTERS.length})` },
            { value: 'following', label: `Following (${favorites.presenters.length})` },
          ]}
        />
      </View>
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="Name or show" returnKeyType="search" />

      <View style={{ gap: 10, marginTop: space.lg }}>
        {list.length === 0 ? (
          <Txt variant="muted">
            {filter === 'following' ? 'Tap the star on a presenter to follow them.' : 'No presenters match that search.'}
          </Txt>
        ) : (
          list.map((p) => <PresenterCard key={p.id} presenter={p} onAir={current?.hostIds.includes(p.id)} />)
        )}
      </View>
    </Screen>
  )
}
