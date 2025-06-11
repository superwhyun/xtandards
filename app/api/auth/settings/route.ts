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

// 비밀번호 조회
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString())
    
    if (sessionData.role !== 'chair') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const config = getAuthConfig()
    return NextResponse.json({
      chairPassword: config.chairPassword,
      contributorPassword: config.contributorPassword
    })
  } catch (error) {
    console.error('설정 조회 오류:', error)
    return NextResponse.json({ error: '설정 조회 실패' }, { status: 500 })
  }
}

// 비밀번호 변경
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString())
    
    if (sessionData.role !== 'chair') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const { chairPassword, contributorPassword } = await request.json()
    
    if (!chairPassword || !contributorPassword) {
      return NextResponse.json({ error: '모든 비밀번호가 필요합니다' }, { status: 400 })
    }

    const config = getAuthConfig()
    config.chairPassword = chairPassword
    config.contributorPassword = contributorPassword
    saveAuthConfig(config)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('설정 변경 오류:', error)
    return NextResponse.json({ error: '설정 변경 실패' }, { status: 500 })
  }
}
// %%%%%LAST%%%%%