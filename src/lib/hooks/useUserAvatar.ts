'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getAvatarSeed, getSafeAvatarSvg } from '@/lib/avatar/avatar-service'

export function useUserAvatar(user: Pick<User, 'id'> | null, loading: boolean) {
  const [avatar, setAvatar] = useState<{ seed: string; svg: string } | null>(null)

  useEffect(() => {
    if (loading) return
    const updateAvatar = window.setTimeout(() => {
      const seed = getAvatarSeed(user)
      setAvatar({ seed, svg: getSafeAvatarSvg(seed) })
    }, 0)
    return () => window.clearTimeout(updateAvatar)
  }, [user, loading])

  return avatar
}
