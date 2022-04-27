import { useEffect, useState } from 'react'
import { Horse } from '@/domain/models/Horse'

interface Props {
  loading: boolean
  error: Error
  image: StaticImageData
}

const useImage = (horse: Horse): Props => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [image, setImage] = useState(null)

  useEffect((): void => {
    const fetchImage = async (): Promise<void> => {
      try {
        const response = await import(`@/assets/game/pop-up/start/race/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-race.gif`)
        setImage(response.default)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [horse])

  return {
    loading,
    error,
    image
  }
}

export default useImage
