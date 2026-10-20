function getApiBaseUrl() {
  // Endereço do backend configurado em EXPO_PUBLIC_API_URL.
  const value = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || "https://calculadora-de-bordo.onrender.com/"
  if (!value) throw new Error('Configure EXPO_PUBLIC_API_URL no arquivo mobile/.env para conectar ao servidor.')
  return value
}

async function request(path, options = {}, token) {
  // Centraliza as chamadas HTTP, autenticação Bearer, timeout e tratamento de erros.
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const url = `${getApiBaseUrl()}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  let response
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
  let payload = null
  if (text) {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        payload = parsed
      }
    } catch {
      const message = response.ok
        ? 'O servidor retornou uma resposta inválida.'
        : `A API respondeu com HTTP ${response.status}. Reinicie o backend para carregar as rotas atuais.`
      throw new Error(message)
    }
  }
  if (!response.ok) {
    const message = payload && typeof payload.erro === 'string' ? payload.erro : 'O servidor não conseguiu concluir a solicitação.'
    throw new Error(message)
  }
  return payload
}

export function loginRequest(username, senha) {
  // Autentica o usuário e recebe o token de acesso.
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, senha }) })
}

export function registerRequest(nome, username, senha) {
  // Cria uma conta no backend.
  return request(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ nome, username, senha }) }
  )
}

export function apiRequest(path, token, options = {}) {
  // Faz chamadas autenticadas para os demais endpoints da API.
  return request(path, options, token)
}
