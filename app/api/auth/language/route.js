import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUTH_CONFIG_PATH = path.join(process.cwd(), 'data', 'auth-config.json');

function ensureDataDirectory() {
  const dataDir = path.dirname(AUTH_CONFIG_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadAuthConfig() {
  ensureDataDirectory();
  
  if (!fs.existsSync(AUTH_CONFIG_PATH)) {
    const defaultConfig = {
      chairPassword: 'chair',
      contributorPassword: 'cont',
      language: 'ko'
    };
    fs.writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  
  try {
    const configData = fs.readFileSync(AUTH_CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    // 언어 설정이 없으면 기본값 추가
    if (!config.language) {
      config.language = 'ko';
      fs.writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(config, null, 2));
    }
    
    return config;
  } catch (error) {
    console.error('Error reading auth config:', error);
    return {
      chairPassword: 'chair',
      contributorPassword: 'cont',
      language: 'ko'
    };
  }
}

function saveAuthConfig(config) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving auth config:', error);
    return false;
  }
}

// GET: 현재 언어 설정 조회
export async function GET() {
  try {
    const config = loadAuthConfig();
    return NextResponse.json({ language: config.language });
  } catch (error) {
    console.error('Error fetching language:', error);
    return NextResponse.json({ error: 'Failed to fetch language' }, { status: 500 });
  }
}

// POST: 언어 설정 변경
export async function POST(request) {
  try {
    const { language } = await request.json();
    
    if (!language || !['ko', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }
    
    const config = loadAuthConfig();
    config.language = language;
    
    const success = saveAuthConfig(config);
    
    if (success) {
      return NextResponse.json({ message: 'Language updated successfully', language });
    } else {
      return NextResponse.json({ error: 'Failed to save language' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating language:', error);
    return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
  }
}
