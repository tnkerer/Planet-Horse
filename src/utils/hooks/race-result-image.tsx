import { StaticImageData } from 'next/image'
import { useEffect, useState } from 'react'

interface Props {
  loading: boolean
  error: Error
  image: StaticImageData
}

const useImage = (result: number): Props => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [image, setImage] = useState(null)

  useEffect((): void => {
    const fetchImage = async (): Promise<void> => {
      try {
        const response = await import(`@/assets/game/pop-up/start/${result}.gif`)
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
    loading,
    error,
    image
  }
}

export default useImage
