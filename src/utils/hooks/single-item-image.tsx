import { useEffect, useState } from 'react'
import { Items } from '@/domain/models/Item'
import { StaticImageData } from 'next/image'

interface Props {
  loading: boolean
  error: Error
  image: StaticImageData
}

const useImage = (item: Items): Props => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [image, setImage] = useState(null)

  useEffect((): void => {
    const fetchImage = async (): Promise<void> => {
      try {
        const response = await import(`@/assets/game/Items/baus/bau-${item.src}.gif`)
        setImage(response.default)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [item])

  return {
    loading,
    error,
    image
  }
}

export default useImage
