import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Fetches the catalogued factions; does not retry when the API is offline. */
export function useFactions() {
  return useQuery({
    queryKey: ['factions'],
    queryFn: async () => {
      const res = await api.factions.$get()
      if (!res.ok) throw new Error('request failed')
      return res.json()
    },
    retry: false,
  })
}
