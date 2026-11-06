const withTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`)

export const env = {
  apiBaseUrl: withTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api/v1/'),
  authMode: (import.meta.env.VITE_AUTH_MODE === 'mock' ? 'mock' : 'api') as 'api' | 'mock',
}
