import React, { HTMLAttributes } from 'react'
import Image from 'next/image'

import buttonImage from '@/assets/landpage/addmetamask.webp'
import buttonOnHoverImage from '@/assets/landpage/addmetamask2.webp'
import buttonActiveImage from '@/assets/landpage/addmetamask3.png'


import styles from './styles.module.scss'

type Props = HTMLAttributes<HTMLButtonElement>;

const tokenAddress = "0xc630bd2f1df25736177B5126cD4F3bBc3714A3c5";
const tokenSymbol = "PHORSE";
const tokenDecimals = 18;
const tokenImage =
  "https://raw.githubusercontent.com/menezesphill/application_utils/main/logo.png";

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum);
};
  
const handleClick = async () => {
  if (!isMetaMaskInstalled()) {
    alert("MetaMask is not installed!");
    return;
  }
  try {
    // @ts-expect-error
    const wasAdded = await window.ethereum.request({ 
      method: "wallet_watchAsset",
      params: {
        type: "ERC20", 
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        },
      },
    });
  } catch (error) {
    alert(error);
  }
}

const AddMetamaskButton: React.FC<Props> = ({ className, ...props }) => {
  return (
    <button onClick={handleClick} className={`${styles.container} ${className}`} {...props}>
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
