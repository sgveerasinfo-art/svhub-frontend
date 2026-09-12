import { useCallback, useEffect, useState } from 'react'
import { getPublicSettings } from '../../api/settings.js'
import CampaignHero from './CampaignHero.jsx'
import NormalHero from './NormalHero.jsx'

const REVALIDATE_MS = 45000

/**
 * Chooses NormalHero vs CampaignHero from public settings.
 * Falls back to NormalHero on any error/invalid config.
 */
function HeroRenderer() {
  const [hero, setHero] = useState({ mode: 'normal', campaign: null, serverNow: null })
  const [ready, setReady] = useState(false)

  const applyHero = useCallback((payload) => {
    const next = payload?.hero
    if (!next || next.mode !== 'campaign' || !next.campaign) {
      setHero({ mode: 'normal', campaign: null, serverNow: next?.serverNow || null, status: next?.status })
      return
    }
    setHero({
      mode: 'campaign',
      campaign: next.campaign,
      serverNow: next.serverNow,
      status: next.status,
    })
  }, [])

  const load = useCallback(
    async (signal) => {
      try {
        const res = await getPublicSettings({ signal })
        applyHero(res?.data)
      } catch (error) {
        if (error?.name === 'AbortError') return
        setHero({ mode: 'normal', campaign: null, serverNow: null })
      } finally {
        setReady(true)
      }
    },
    [applyHero],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)

    const interval = window.setInterval(() => {
      load()
    }, REVALIDATE_MS)

    function onVisibility() {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      controller.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  const handleExpired = useCallback(() => {
    setHero({ mode: 'normal', campaign: null, serverNow: new Date().toISOString() })
    load()
  }, [load])

  // Avoid flashing campaign while settings resolve; show normal hero immediately.
  if (!ready || hero.mode !== 'campaign' || !hero.campaign) {
    return <NormalHero />
  }

  return (
    <CampaignHero campaign={hero.campaign} serverNow={hero.serverNow} onExpired={handleExpired} />
  )
}

export default HeroRenderer
