# 웹 서버 시작 가이드

이 앱을 로컬에서 테스트하려면 웹 서버가 필요합니다.

## 방법 1: Python 내장 서버 (추천)

### Python 3가 설치되어 있는 경우:

```bash
cd c:\Users\oseongryu\git\gpsapp
python -m http.server 8000
```

그런 다음 브라우저에서 접속:
```
http://localhost:8000/login.html
```

## 방법 2: VS Code Live Server

1. VS Code에서 "Live Server" 확장 설치
2. `index_new.html` 또는 `login.html` 파일을 우클릭
3. "Open with Live Server" 클릭

## 방법 3: Node.js http-server

```bash
npm install -g http-server
cd c:\Users\oseongryu\git\gpsapp
http-server -p 8000
```

## 중요 사항

### 1. GPS 권한
- GPS 기능을 사용하려면 **HTTPS** 또는 **localhost**에서만 작동합니다.
- 로컬 테스트 시 `localhost:8000`을 사용하세요.

### 2. Supabase 설정
- `config.js` 파일에 Supabase URL과 API 키를 설정하세요.
- `config.example.js`를 복사하여 `config.js`로 만들고 정보를 입력하세요.

### 3. 데이터베이스 설정
- `DATABASE_GUIDE.md`의 SQL을 Supabase 대시보드에서 실행하세요.

## 테스트 계정 생성

1. `login.html`에서 닉네임을 입력하여 계정 생성
2. 메인 화면에서 "+" 버튼을 눌러 추억 생성 테스트
3. 상점 아이콘을 클릭하여 구독/코인 구매 테스트 (Mock 모드)

## 트러블슈팅

### GPS가 작동하지 않는 경우:
- 브라우저 설정에서 위치 권한 확인
- HTTPS 또는 localhost 환경인지 확인
- 브라우저 콘솔(F12)에서 오류 메시지 확인

### Supabase 연결 오류:
- `config.js` 파일이 있는지 확인
- Supabase 프로젝트의 URL과 API 키가 올바른지 확인
- 브라우저 콘솔에서 네트워크 요청 확인
