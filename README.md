# Xtandaz - 표준문서 관리 시스템

## 🌟 개요

Xtandaz는 표준문서 개발 과정을 드래그 앤 드롭 방식으로 효율적으로 관리하는 웹 애플리케이션입니다. Chair와 Contributor 간의 역할 기반 협업을 지원하며, 완전한 다국어 지원(한국어/영어)을 제공합니다.

## ✨ 주요 기능

### 🔐 역할 기반 인증 시스템
- **Chair**: 모든 기능 접근 가능 (회의 관리, 문서 상태 변경, 시스템 설정)
- **Contributor**: 제한된 기능 (기고서 업로드, 수정본 업로드, 문서 다운로드)
- 서버 기반 세션 관리 (7일 자동 만료)

### 📚 표준문서 관리
- 표준문서별 독립적인 페이지 (`/[acronym]`)
- 회의별 탭 구조로 체계적 관리
- 실시간 드래그 앤 드롭 파일 업로드
- 문서 상태 관리 (Accept/Withdraw/Reject)

### 🗂️ 문서 워크플로우
- **Base Document**: 회의 기준 문서
- **Proposals**: 기고서 및 수정본 관리
- **Output Document**: 회의 결과 문서
- 문서 간 연결 관계 자동 관리

### 🌐 다국어 지원
- 한국어/영어 실시간 전환
- 모든 UI 컴포넌트 완전 번역
- Chair 설정에서 언어 변경 가능
- 서버 저장으로 세션 간 설정 유지

### 📱 반응형 디자인
- 데스크톱/태블릿/모바일 완벽 지원
- 모바일에서 사이드바 적응형 레이아웃
- 터치 친화적 인터페이스

## 🚀 시작하기

### 사전 요구사항
- Node.js 20.18.1 이상
- npm 또는 pnpm

### 설치 및 실행

```bash
# 저장소 클론
git clone [repository-url]
cd Xtandaz

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 초기 설정
1. 브라우저에서 `http://localhost:3000` 접속
2. 역할 선택:
   - **Chair**: 비밀번호 `chair`
   - **Contributor**: 비밀번호 `cont` + 사용자명 입력

## 📖 사용 방법

### Chair 사용자
1. **새 표준문서 등록**: 메인 페이지에서 "+" 카드 클릭
2. **회의 생성**: "회의 생성" 버튼으로 다중 표준문서 회의 생성
3. **문서 관리**: 드래그 앤 드롭으로 파일 업로드 및 상태 변경
4. **언어 설정**: 우측 상단 Settings → Language에서 변경

### Contributor 사용자
1. **기고서 업로드**: 메인 페이지 하단 드롭존 또는 회의 페이지에서 업로드
2. **수정본 관리**: 기고서별 수정본 업로드
3. **문서 다운로드**: 모든 문서 다운로드 가능

## 🗂️ 프로젝트 구조

```
Xtandaz/
├── app/                          # Next.js App Router
│   ├── [acronym]/               # 표준문서 상세 페이지
│   ├── api/                     # API 라우트
│   │   ├── auth/               # 인증 관련 API
│   │   ├── standards/          # 표준문서 API
│   │   └── ...
│   ├── layout.tsx              # 메인 레이아웃
│   └── page.tsx                # 홈페이지
├── components/                  # React 컴포넌트
│   ├── auth/                   # 인증 관련 컴포넌트
│   ├── ui/                     # UI 기본 컴포넌트
│   └── ...
├── contexts/                   # React Context
│   └── LanguageContext.js      # 다국어 컨텍스트
├── hooks/                      # 커스텀 훅
│   ├── useAuth.js             # 인증 훅
│   └── ...
├── lib/                       # 유틸리티 라이브러리
│   ├── languages/             # 다국어 파일
│   │   ├── ko.json           # 한국어
│   │   └── en.json           # 영어
│   └── ...
├── data/                      # 서버 데이터 저장소
│   ├── auth-config.json       # 인증 설정
│   └── [acronym]/            # 표준문서별 데이터
└── vibe-spec/                # 프로젝트 명세
    └── spec.yaml             # 기능 명세서
```

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: 서버 기반 세션 (쿠키)
- **Data Storage**: 파일 시스템 기반 JSON
- **Internationalization**: 커스텀 다국어 시스템

## 📋 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/verify` - 세션 확인
- `GET/POST /api/auth/language` - 언어 설정

### 표준문서
- `GET /api/standards` - 표준문서 목록
- `POST /api/standards` - 새 표준문서 생성
- `DELETE /api/standards/delete` - 표준문서 삭제

### 회의 및 문서
- `POST /api/meetings` - 회의 생성
- `POST /api/upload` - 파일 업로드
- `GET /api/download` - 파일 다운로드
- `POST /api/[acronym]/proposal-status` - 문서 상태 변경

## 🔧 설정

### 환경 변수
프로젝트는 환경 변수 없이 실행 가능하며, 모든 설정은 파일 시스템에 저장됩니다.

### Chair 설정 변경
- 비밀번호 변경: Settings → Change Password
- 언어 변경: Settings → Language

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🆘 문제 해결

### 일반적인 문제
1. **포트 충돌**: 다른 포트 사용 `npm run dev -- -p 3001`
2. **빌드 오류**: 캐시 삭제 `rm -rf .next && npm run build`
3. **Node.js 버전**: Node.js 20.18.1 이상 사용 권장

### 다국어 관련
- 새로운 언어 추가: `/lib/languages/` 폴더에 언어 파일 추가
- 번역 누락: `grep -r "한글텍스트" components/ app/`로 검색

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**Xtandaz**로 표준문서 개발 과정을 더욱 효율적으로 관리하세요! 🚀
