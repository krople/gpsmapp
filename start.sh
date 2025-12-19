#!/bin/bash

echo "========================================"
echo "  Memory Lock - 추억 자물쇠 앱 시작"
echo "========================================"
echo ""

# config.js 파일 확인
if [ ! -f "config.js" ]; then
    echo "[경고] config.js 파일이 없습니다!"
    echo ""
    echo "config.example.js를 config.js로 복사하고"
    echo "Supabase 정보를 입력해주세요."
    echo ""
    
    if [ -f "config.example.js" ]; then
        read -p "config.example.js를 config.js로 복사할까요? (y/n) " answer
        if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
            cp config.example.js config.js
            echo ""
            echo "config.js 파일이 생성되었습니다!"
            echo "파일을 열어서 Supabase URL과 키를 입력해주세요."
            echo ""
            exit 0
        fi
    fi
    exit 1
fi

echo "[정보] Python 서버를 시작합니다..."
echo ""
echo "브라우저에서 다음 주소로 접속하세요:"
echo ""
echo "   http://localhost:8000/login.html"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."
echo "========================================"
echo ""

# Python 3 확인
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "[오류] Python이 설치되어 있지 않습니다!"
    echo "Python을 설치한 후 다시 시도해주세요."
    exit 1
fi
