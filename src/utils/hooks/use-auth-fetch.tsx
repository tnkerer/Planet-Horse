import { useWallet } from 'contexts/WalletContext'

export function useAuthFetch() {
  const { signIn } = useWallet()

  return async function authFetch(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    let res = await fetch(input, { credentials: 'include', ...init })
    if (res.status === 401) {
      // session expired → re-do SIWE
      await signIn()
      // retry once
      res = await fetch(input, { credentials: 'include', ...init })
    }
    return res
  }
}