import { useContextSelector } from 'use-context-selector'
import { MataMaskContext } from '../providers/metamask-provider'

const useConnectToMetamask = () => {
  const connect = useContextSelector(MataMaskContext, state => state.connectToMetaMask)
  return connect
}

export default useConnectToMetamask
