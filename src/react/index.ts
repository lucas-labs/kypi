import { useMemo } from 'react'
import { client, type ApiClientOptions, type EndpointGroup } from '..'

export const createClientHook = <E extends EndpointGroup>(endpoints: E) => {
  const useClient = ({
    baseUrl,
    getToken,
    onError,
    kyInstance,
  }: Omit<ApiClientOptions<typeof endpoints>, 'endpoints'>) => {
    return useMemo(
      () =>
        client({
          baseUrl,
          getToken,
          endpoints,
          onError,
          kyInstance,
        }),
      [baseUrl, getToken],
    )
  }

  return useClient
}
