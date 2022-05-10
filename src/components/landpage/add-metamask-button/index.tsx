import React, { HTMLAttributes } from 'react'
import Image from 'next/image'

import buttonImage from '@/assets/landpage/addmetamask.webp'
import buttonOnHoverImage from '@/assets/landpage/addmetamask2.webp'
import buttonActiveImage from '@/assets/landpage/addmetamask3.png'


import styles from './styles.module.scss'

type Props = HTMLAttributes<HTMLButtonElement>;

const AddMetamaskButton: React.FC<Props> = ({ className, ...props }) => {
  return (
    <button className={`${styles.container} ${className}`} {...props}>
     <span className={styles.button}>
      <Image layout='fill' src={buttonImage} alt="Add Metamask" />
     </span>
     <span className={styles.button_hover}>
      <Image layout='fill' src={buttonOnHoverImage} alt="Add Metamask" />
     </span>
     <span className={styles.button_active}>
      <Image layout='fill' src={buttonActiveImage} alt="Add Metamask" />
     </span>
    </button>
  )
}

export default AddMetamaskButton
