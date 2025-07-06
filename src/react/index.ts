import { useMemo } from 'react'
import { client, type ApiClientOptions, type EndpointGroup } from '..'

export const createClientHook = <E extends EndpointGroup>(endpoints: E) => {
  const useClient = ({
    baseUrl,
    getToken,
  }: Omit<ApiClientOptions<typeof endpoints>, 'endpoints'>) => {
    return useMemo(
      () =>
        client({
          baseUrl,
          getToken,
          endpoints,
        }),
      [baseUrl, getToken],
    )
  }

  return useClient
}
