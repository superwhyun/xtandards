#!/bin/sh
# Next.js 프로덕션 빌드 및 6910번 포트로 실행
# 실행 전: chmod +x ./start.sh

npm run build
PORT=6910 npm run start