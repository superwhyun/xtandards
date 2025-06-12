import { NextRequest, NextResponse } from 'next/server'
import { migrateAllMeetings, migrateMeetingJsonToDb } from '@/lib/database/migration'

// 전체 마이그레이션
export async function POST(request: NextRequest) {
  try {
    console.log('Starting migration from meeting.json to SQLite...')
    migrateAllMeetings()
    
    return NextResponse.json({ 
      success: true,
      message: 'Migration completed successfully' 
    })
    
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 특정 회의 마이그레이션
export async function PUT(request: NextRequest) {
  try {
    const { acronym, meetingId } = await request.json()
    
    if (!acronym || !meetingId) {
      return NextResponse.json({ 
        success: false,
        error: 'acronym and meetingId are required' 
      }, { status: 400 })
    }
    
    const success = migrateMeetingJsonToDb(acronym, meetingId)
    
    if (success) {
      return NextResponse.json({ 
        success: true,
        message: `Migration completed for ${acronym}/${meetingId}` 
      })
    } else {
      return NextResponse.json({ 
        success: false,
        error: `Migration failed for ${acronym}/${meetingId}` 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// %%%%%LAST%%%%%