import { useContextSelector } from 'use-context-selector'
import { MataMaskContext } from '../providers/metamask-provider'

const useInfoUserAccount = () => {
  const walletAddress = useContextSelector(MataMaskContext, state => state.walletAddress)
  const isConnected = walletAddress !== ''

  return { walletAddress, isConnected }
}

export default useInfoUserAccount
