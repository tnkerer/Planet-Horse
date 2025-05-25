import { StaticImageData } from 'next/image'
import { useEffect, useState } from 'react'

interface Props {
  loading: boolean
  error: Error
  image: StaticImageData
}

const useImage = (fileName: string): Props => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [image, setImage] = useState(null)

  useEffect((): void => {
    const fetchImage = async (): Promise<void> => {
      try {
        const response = await import(`@/assets/pre-sale/chests/chest-${fileName}.gif`) // change relative path to suit your needs
        setImage(response.default)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [fileName])

  return {
    loading,
    error,
    image
  }
}

export default useImage