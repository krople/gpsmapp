# ⚡ 설치 및 실행 가이드

## 📦 다운로드 후 바로 사용하기

### Step 1: 파일 다운로드
```bash
git clone [repository-url]
cd gpsapp
```

또는 ZIP 다운로드 후 압축 해제

---

### Step 2: Supabase 설정 (최초 1회만)

#### 2-1. Supabase 프로젝트 생성
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름 입력 (예: memory-lock)
4. 비밀번호 설정
5. Region 선택 (한국은 Northeast Asia 추천)
6. "Create new project" 클릭

#### 2-2. 데이터베이스 테이블 생성
1. 왼쪽 메뉴 **SQL Editor** 클릭
2. "+ New query" 클릭
3. 아래 SQL 전체 복사 → 붙여넣기 → "Run" 클릭

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

#### 2-3. API 키 복사
1. 왼쪽 메뉴 **Settings** (톱니바퀴 아이콘) 클릭
2. **API** 메뉴 클릭
3. 아래 두 값 복사:
   - **Project URL** (예: https://xxxxx.supabase.co)
   - **anon public** 키 (긴 문자열)

#### 2-4. config.js 파일 생성

**Windows (명령 프롬프트):**
```cmd
copy config.example.js config.js
notepad config.js
```

**Windows (PowerShell):**
```powershell
Copy-Item config.example.js config.js
notepad config.js
```

**Mac/Linux:**
```bash
cp config.example.js config.js
nano config.js
# 또는
open config.js
```

**config.js 파일 내용 수정:**
```javascript
const SUPABASE_CONFIG = {
    url: 'https://여기에-복사한-URL.supabase.co',
    anonKey: '여기에-복사한-anon-키-전체-붙여넣기'
};
```

저장 후 닫기

---

### Step 3: 앱 실행

#### 방법 A: 자동 실행 스크립트 (가장 쉬움) ⭐

**Windows:**
```cmd
start.bat
```
또는 `start.bat` 파일을 더블클릭

**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

스크립트가 자동으로:
- config.js 확인
- Python 서버 시작
- 브라우저 접속 안내

#### 방법 B: 수동 실행

**Python 서버:**
```bash
python -m http.server 8000
```

그리고 브라우저에서:
```
http://localhost:8000/login.html
```

**VS Code Live Server:**
1. VS Code에서 `login.html` 파일 우클릭
2. "Open with Live Server" 클릭

---

### Step 4: 사용 시작

1. 브라우저에서 앱 접속
2. 닉네임 입력 (최초 1회)
3. 메인 화면에서 **+** 버튼으로 추억 생성
4. 즐기기! 🎉

---

## 🔧 문제 해결

### 1. "config.js를 찾을 수 없습니다"
```bash
# config.example.js를 config.js로 복사
copy config.example.js config.js  # Windows
cp config.example.js config.js    # Mac/Linux
```

### 2. "Supabase 연결 실패"
- config.js의 URL과 키가 정확한지 확인
- 따옴표 안에 올바르게 입력되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 3. "Python을 찾을 수 없습니다"
- Python 설치: https://www.python.org/downloads/
- 또는 VS Code Live Server 사용

### 4. CORS 에러
- 파일을 직접 열지 말고 HTTP 서버 사용
- `file://` 대신 `http://localhost:8000` 사용

### 5. 한글이 깨져보임 (PowerShell)
- 정상입니다. 브라우저에서는 제대로 보입니다.
- 또는 `start.bat`을 더블클릭하여 실행

---

## ✅ 체크리스트

실행 전 확인:
- [ ] Supabase 프로젝트 생성 완료
- [ ] SQL 테이블 생성 완료
- [ ] config.js 파일 생성 및 키 입력 완료
- [ ] Python 설치 확인 (또는 Live Server 준비)

---

## 📱 다음 단계

앱 사용법:
1. **홈 (🏠)**: 친구 목록 및 추억 히스토리
2. **지도 (🗺️)**: 저장된 추억을 지도에서 확인
3. **상점 (🛒)**: 프리미엄 구독 및 코인 구매

---

**문제가 계속되면 `DATABASE_GUIDE.md`를 참고하세요!**
