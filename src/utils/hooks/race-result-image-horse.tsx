import { useEffect, useState } from 'react'
import { Horse } from '@/domain/models/Horse'

interface Props {
  loadingHorse: boolean
  errorHorse: Error
  imageHorse: StaticImageData
  horse: Horse | boolean
}

const useImage = (horse): Props => {
  const [loadingHorse, setLoading] = useState(true)
  const [errorHorse, setError] = useState(null)
  const [imageHorse, setImage] = useState(null)

  useEffect((): void => {
    const fetchImage = async (): Promise<void> => {
      try {
        const response = await import(`@/assets/game/horses/gifs/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-stopped.gif`)
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
    loadingHorse,
    errorHorse,
    imageHorse
  }
}

export default useImage
