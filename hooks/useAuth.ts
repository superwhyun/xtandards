import { useState, useEffect } from 'react'

export type UserRole = 'chair' | 'contributor'

export interface AuthState {
  isAuthenticated: boolean
  role: UserRole | null
  user: string | null
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null
  })
  const [loading, setLoading] = useState(true)

  // 인증 상태 확인
  const verifyAuth = async () => {
    try {
      console.log('API 호출: GET /api/auth/verify')
      const response = await fetch('/api/auth/verify')
      const data = await response.json()
      
      if (data.authenticated) {
        setAuth({
          isAuthenticated: true,
          role: data.role,
          user: data.user
        })
      } else {
        setAuth({
          isAuthenticated: false,
          role: null,
          user: null
        })
      }
    } catch (error) {
      console.error('인증 확인 오류:', error)
      setAuth({
        isAuthenticated: false,
        role: null,
        user: null
      })
    } finally {
      setLoading(false)
    }
  }

  // 로그인
  const login = async (role: UserRole, password: string, username?: string): Promise<boolean> => {
    try {
      console.log('API 호출: POST /api/auth/login')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, password, username })
      })

      const data = await response.json()
      
      if (data.success) {
        setAuth({
          isAuthenticated: true,
          role: data.role,
          user: data.user
        })
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      return false
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      console.log('API 호출: POST /api/auth/logout')
      await fetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('로그아웃 오류:', error)
    } finally {
      setAuth({
        isAuthenticated: false,
        role: null,
        user: null
      })
    }
  }

  // 초기 인증 상태 확인
  useEffect(() => {
    verifyAuth()
  }, [])

  return {
    auth,
    loading,
    login,
    logout,
    verifyAuth
  }
}
// %%%%%LAST%%%%%