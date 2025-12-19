@echo off
echo ========================================
echo   Memory Lock - 추억 자물쇠 앱 시작
echo ========================================
echo.

REM config.js 파일 확인
if not exist config.js (
    echo [경고] config.js 파일이 없습니다!
    echo.
    echo config.example.js를 config.js로 복사하고
    echo Supabase 정보를 입력해주세요.
    echo.
    
    if exist config.example.js (
        echo config.example.js를 config.js로 복사할까요? (Y/N)
        set /p answer=
        if /i "%answer%"=="Y" (
            copy config.example.js config.js
            echo.
            echo config.js 파일이 생성되었습니다!
            echo 파일을 열어서 Supabase URL과 키를 입력해주세요.
            echo.
            pause
            exit
        )
    )
    pause
    exit
)

echo [정보] Python 서버를 시작합니다...
echo.
echo 브라우저에서 다음 주소로 접속하세요:
echo.
echo    http://localhost:8000/login.html
echo.
echo 종료하려면 Ctrl+C를 누르세요.
echo ========================================
echo.

python -m http.server 8000
