import axios from 'axios'
import { useEffect, useState } from 'react'
import { backend_server } from './config'

// const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CACHE_TTL_MS = 20000
const makeKeys = (url) => {
  const encoded = encodeURIComponent(url)
  return {
    cacheKey: `cache:${encoded}`,
    statusKey: `cacheStatus:${encoded}`,
  }
}

const useFetch = (API_URL) => {
  const [loading, setLoading] = useState(true)
  const [fetched_data, setFetched_Data] = useState([])
  const [imagePath, setImagePath] = useState('')
  const [cacheStatus, setCacheStatus] = useState(null)

  useEffect(() => {
    let cancelled = false
    const { cacheKey, statusKey } = makeKeys(API_URL)

    const readCache = () => {
      try {
        const raw = localStorage.getItem(cacheKey)
        return raw ? JSON.parse(raw) : null
      } catch (err) {
        return null
      }
    }

    const writeStatus = (status, extra = {}) => {
      setCacheStatus(status)
      try {
        localStorage.setItem(
          statusKey,
          JSON.stringify({ status, at: Date.now(), ...extra })
        )
      } catch (err) {
        /* ignore storage errors */
      }
    }

    const saveCache = (data, fullImagePath) => {
      const expiresAt = Date.now() + CACHE_TTL_MS
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, imagePath: fullImagePath, expiresAt })
        )
        writeStatus('Cache Updated')
      } catch (err) {
        /* ignore storage errors */
      }
    }

    const loadFromCache = (cache) => {
      setFetched_Data(cache.data)
      setImagePath(cache.imagePath || '')
      setLoading(false)
    }

    const fetchData = async () => {
      setLoading(true)
      const cache = readCache()
      const now = Date.now()
      if (cache && cache.expiresAt && cache.expiresAt > now) {
        writeStatus('Cache HIT', { expiresAt: cache.expiresAt })
        loadFromCache(cache)
        return
      }
      if (cache) {
        writeStatus('Cache Expired', { expiredAt: cache.expiresAt })
      } else {
        writeStatus('Cache Miss')
      }

      try {
        const response = await axios.get(API_URL)
        if (cancelled) return
        setFetched_Data(response.data)

        let fullImagePath = ''
        if (response.data?.data?.image) {
          const image = response.data.data.image
          fullImagePath = `${backend_server}/${image}`
          setImagePath(fullImagePath)
        } else {
          setImagePath('')
        }

        saveCache(response.data, fullImagePath)
      } catch (error) {
        writeStatus('Cache Error', { message: error?.message })
        console.log(error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [API_URL])

  return { fetched_data, loading, imagePath, cacheStatus }
}

export default useFetch
