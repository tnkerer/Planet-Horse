import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import postItsMom from '@/assets/profile/post its-mom.png'

const MessageFromMom: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.tape}>
        <Image
          src='/assets/utils/tape.webp'
          width={140}
          height={40}
        />
      </div>
      <Image
        src={postItsMom}
        width={330}
        height={379}
      />
    </div>
  )
}

export default MessageFromMom
