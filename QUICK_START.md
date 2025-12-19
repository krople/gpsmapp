# 🚀 빠른 시작 가이드 (Quick Start)

이 가이드를 따라하면 **5분 안에** 앱을 실행할 수 있습니다!

---

## ⚡ 3단계로 시작하기

### 1️⃣ Supabase 프로젝트 설정 (2분)

1. [Supabase](https://supabase.com)에 가입/로그인
2. **New Project** 클릭
3. 프로젝트 이름, 비밀번호 입력 후 생성
4. 왼쪽 메뉴에서 **SQL Editor** 클릭
5. 아래 SQL 실행:

```sql
-- 사용자 테이블
CREATE TABLE app_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    subscription_plan VARCHAR(20) DEFAULT 'free',
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 친구 테이블
CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    friend_username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 추억 테이블
CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    lock_type VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 위치 테이블
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    creator VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2️⃣ 앱 설정 (1분)

1. **Settings** > **API** 메뉴로 이동
2. **Project URL**과 **anon public** 키 복사
3. `config.js` 파일을 열고 값 입력:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://여기에-프로젝트-URL.supabase.co',
    anonKey: '여기에-anon-키-붙여넣기'
};
```

### 3️⃣ 실행 (30초)

**방법 A: Python 서버 (추천)**
```bash
python -m http.server 8000
```
브라우저에서 http://localhost:8000/login.html 접속

**방법 B: VS Code Live Server**
- VS Code에서 `login.html` 우클릭
- "Open with Live Server" 클릭

**방법 C: 직접 열기**
- `login.html` 파일을 브라우저로 드래그 앤 드롭

---

## ✅ 완료!

이제 앱을 사용할 수 있습니다:
- 닉네임 입력하여 계정 생성
- 메인 화면에서 **+** 버튼으로 추억 생성
- 🗺️ 탭에서 지도에 표시된 추억 확인
- 🛒 탭에서 프리미엄 기능 확인

---

## 🔧 문제 해결

### config.js 파일이 없다고 나올 때
```bash
copy config.example.js config.js
```
그리고 `config.js` 파일에 Supabase 정보 입력

### CORS 에러가 날 때
- `file://`로 열지 말고 HTTP 서버 사용
- Python 서버나 Live Server 사용 권장

### Supabase 연결 실패
- `config.js`의 URL과 키가 정확한지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

---

## 📱 주요 기능

- **추억 자물쇠**: GPS 위치에 추억 저장
- **친구 관리**: 친구 추가 및 태그
- **지도 보기**: 모든 추억을 지도에서 확인
- **프리미엄**: 무제한 추억, 고급 스킨

---

**즐거운 추억 만들기 되세요! 🎉**
