import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    // 토큰 디코딩
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // 토큰 유효성 검사 (7일 만료)
    const now = Date.now()
    const maxAge = 60 * 60 * 24 * 7 * 1000 // 7일 밀리초
    
    if (now - sessionData.loginTime > maxAge) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      role: sessionData.role,
      user: sessionData.user
    })
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return NextResponse.json({ authenticated: false })
  }
}
// %%%%%LAST%%%%%