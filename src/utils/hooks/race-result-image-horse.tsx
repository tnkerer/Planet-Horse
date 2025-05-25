import { useEffect, useState } from 'react'
import { Horse } from '@/domain/models/Horse'
import { StaticImageData } from 'next/image'

interface Props {
  loadingHorse: boolean
  errorHorse: Error
  imageHorse: StaticImageData
}

const useImage = (result: number): Props => {
  const [loadingHorse, setLoading] = useState(true)
  const [errorHorse, setError] = useState(null)
  const [imageHorse, setImage] = useState(null)

  useEffect((): void => {
    const fetchImage = async (): Promise<void> => {
      try {

        let image = 'feliz'
        if ((result > 3) && (result <= 7)) {
          image = 'normal'
        } else if (result > 7) {
          image = 'triste'
        }

        const response = await import(`@/assets/game/pop-up/start/torcida-${image}.gif`)
        setImage(response.default)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [result])

  return {
    loadingHorse,
    errorHorse,
    imageHorse
  }
}

export default useImage
