export type User = { id: number; username: string; perfil: string }

type LoginResponse = { token: string; tipo: 'Bearer'; expiraEm: string; usuario: User }

function getApiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '')
  if (!value) throw new Error('Configure EXPO_PUBLIC_API_URL no arquivo mobile/.env para conectar ao servidor.')
  return value
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const url = `${getApiBaseUrl()}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  let response: Response
  try {
    response = await fetch(url, { ...options, headers, signal: controller.signal })
  } catch {
    if (controller.signal.aborted) {
      throw new Error('A conexão com o servidor expirou. Confira o backend e o endereço da API.')
    }
    throw new Error('Não foi possível conectar ao servidor. Confira o endereço da API e sua conexão.')
  } finally {
    clearTimeout(timeout)
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) as Record<string, unknown> : null
  if (!response.ok) {
    const message = payload && typeof payload.erro === 'string' ? payload.erro : 'O servidor não conseguiu concluir a solicitação.'
    throw new Error(message)
  }
  return payload as T
}

export function loginRequest(username: string, senha: string) {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, senha }) })
}

export function apiRequest<T>(path: string, token: string, options: RequestInit = {}) {
  return request<T>(path, options, token)
}
