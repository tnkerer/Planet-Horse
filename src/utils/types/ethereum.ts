export interface RequestArguments {
  method: string
  params?: unknown[] | object
}

export interface ConnectInfo {
  chainId: string
}

export interface ProviderMessage {
  type: string
  data: unknown
}

export interface ProviderRpcError extends Error {
  message: string
  code: number
  data?: unknown
}

export type HandlerConnectInfo = (connectInfo: ConnectInfo) => void
export type HandlerDisconnect = (error: ProviderRpcError) => void
export type HandlerAccountsChanged = (accounts: string[]) => void
export type HandlerChainChanged = (chainId: string) => void
export type HandlerMessage = (message: ProviderMessage) => void

export type Ethereum = {
  isConnected: () => boolean
  request: <Response>(args: RequestArguments) => Promise<Response>
  on: <FuncT extends Function>(event: string, handler: FuncT) => void
  removeListener: (event: string, handler: Function) => void
}
