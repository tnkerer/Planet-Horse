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
        // const response = await import('@/assets/pre-sale/chests/chest-common.gif')
        // const response2 = await import(`@/assets/game/cavalos/${horse.staty.status}/${horse.profile.type_horse_slug}/${horse.profile.horse_image}.gif`) 
        console.log('teste_')
        const response = await import(`@/assets/game/cavalos/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-${horse.staty.status}.gif`)
        console.log(response)
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
