import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'data', 'auth-config.json')

interface AuthConfig {
  chairPassword: string
  contributorPassword: string
  users: { [username: string]: { role: string, lastLogin: string } }
}

function getAuthConfig(): AuthConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('인증 설정 읽기 오류:', error)
  }
  
  // 기본 설정
  return {
    chairPassword: 'chair',
    contributorPassword: 'cont',
    users: {}
  }
}

function saveAuthConfig(config: AuthConfig) {
  try {
    const dataDir = path.dirname(CONFIG_FILE)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('인증 설정 저장 오류:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, password, username } = await request.json()
    
    if (!role || !password) {
      return NextResponse.json(
        { error: '역할과 비밀번호가 필요합니다' },
        { status: 400 }
      )
    }

    const config = getAuthConfig()
    let isValid = false
    
    if (role === 'chair' && password === config.chairPassword) {
      isValid = true
    } else if (role === 'contributor' && password === config.contributorPassword) {
      isValid = true
      if (!username) {
        return NextResponse.json(
          { error: 'Contributor는 사용자명이 필요합니다' },
          { status: 400 }
        )
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: '인증 실패' },
        { status: 401 }
      )
    }

    // 사용자 정보 업데이트
    const userKey = username || role
    config.users[userKey] = {
      role,
      lastLogin: new Date().toISOString()
    }
    saveAuthConfig(config)

    // 세션 토큰 생성 (간단한 base64 인코딩)
    const sessionData = {
      role,
      user: userKey,
      loginTime: Date.now()
    }
    const token = Buffer.from(JSON.stringify(sessionData)).toString('base64')

    // 쿠키에 세션 저장
    const response = NextResponse.json({
      success: true,
      role,
      user: userKey
    })
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    })

    return response
  } catch (error) {
    console.error('로그인 오류:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
// %%%%%LAST%%%%%