import apiClient from './apiClient'

interface RegisterData {
  username: string
  email: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

interface AuthResponse {
  user: {
    id: string
    username: string
    email: string
  }
  token: string
}

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/users/register', data)
    return response.data
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/users/login', data)
    return response.data
  },

  getProfile: async () => {
    const response = await apiClient.get('/users/profile')
    return response.data
  },
}
