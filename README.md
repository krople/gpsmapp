"# 🔒 추억 자물쇠 (Memory Lock)

GPS 위치에 소중한 추억을 저장하는 모바일 웹 앱

---

## 🚀 5분만에 시작하기

### 1. Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `DATABASE_GUIDE.md`의 SQL 실행
3. Settings > API에서 URL과 anon key 복사

### 2. 설정 파일 작성
```bash
# Windows
copy config.example.js config.js

# Mac/Linux
cp config.example.js config.js
```

`config.js` 파일에 Supabase 정보 입력:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

### 3. 실행

**간단 실행 (권장):**
- Windows: `start.bat` 더블클릭
- Mac/Linux: `./start.sh` 실행

**수동 실행:**
```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000/login.html` 접속

---

## ✨ 주요 기능

- 📍 **GPS 기반 추억 저장**: 현재 위치에 추억을 저장
- 👥 **친구 관리**: 친구 추가 및 태그 기능
- 🗺️ **지도 보기**: 저장된 모든 추억을 지도에서 확인
- 🔐 **다양한 자물쇠**: 기본, 황금, 다이아몬드 자물쇠
- 💎 **프리미엄 기능**: 무제한 추억, 고급 스킨, 광고 제거
- 🛒 **상점**: 코인 구매 및 프리미엄 구독

---

## 📁 주요 파일

```
gpsapp/
├── index.html          # 메인 앱 화면
├── login.html          # 로그인 페이지
├── app.js              # 메인 로직
├── app.css             # 스타일
├── config.js           # Supabase 설정 (직접 작성 필요)
├── start.bat           # Windows 실행 스크립트
└── start.sh            # Mac/Linux 실행 스크립트
```

---

## 🔧 문제 해결

**config.js 파일이 없다고 나올 때:**
```bash
copy config.example.js config.js
```
그리고 Supabase 정보 입력

**Python이 없을 때:**
- [Python 다운로드](https://www.python.org/downloads/)
- 또는 VS Code Live Server 사용

**CORS 에러:**
- 파일을 직접 열지 말고 HTTP 서버 사용

---

## 📖 자세한 가이드

- [빠른 시작 가이드](QUICK_START.md)
- [데이터베이스 설정](DATABASE_GUIDE.md)
- [서버 시작 가이드](START_SERVER.md)

---

**즐거운 추억 만들기 되세요! 🎉**
" 
