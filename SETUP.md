# GPS 위치 저장 웹사이트 설정 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 계정 생성
1. [Supabase](https://supabase.com) 접속
2. 계정 생성 및 로그인
3. "New Project" 클릭하여 새 프로젝트 생성

### 1.2 데이터베이스 테이블 생성
Supabase Dashboard에서 SQL Editor를 열고 아래 SQL을 실행하세요:

```sql
-- locations 테이블 생성
CREATE TABLE locations (
  id BIGSERIAL PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_locations_timestamp ON locations(timestamp DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 정책 설정
CREATE POLICY "Enable read access for all users" ON locations
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능하도록 정책 설정
CREATE POLICY "Enable insert access for all users" ON locations
  FOR INSERT
  WITH CHECK (true);
```

### 1.3 API 키 확인
1. Supabase Dashboard에서 Settings > API 메뉴로 이동
2. 다음 정보를 복사:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGc...` (긴 문자열)

## 2. 웹사이트 사용 방법

### 2.1 Supabase 설정 입력
1. `index.html`을 브라우저에서 열기
2. 페이지 상단의 "Supabase 설정" 섹션에 정보 입력:
   - **Supabase URL**: 위에서 복사한 Project URL
   - **Supabase Anon Key**: 위에서 복사한 anon public key
3. 입력한 정보는 자동으로 브라우저에 저장됩니다

### 2.2 위치 정보 저장
1. "위치 정보 가져오기" 버튼 클릭
2. 브라우저에서 위치 권한 허용
3. 위치 정보가 표시되면 "위치 저장하기" 버튼 클릭
4. 성공 메시지 확인

### 2.3 저장 기록 확인
- "저장 기록 보기" 버튼을 클릭하면 최근 20개의 저장된 위치를 확인할 수 있습니다
- 각 기록에서 "지도에서 보기"를 클릭하면 Google Maps로 이동합니다

## 3. 주의사항

### 보안
- **anon public key**는 클라이언트에서 사용하기 위한 공개 키입니다
- 민감한 작업을 위해서는 Supabase의 RLS(Row Level Security) 정책을 추가로 설정하세요
- 프로덕션 환경에서는 더 엄격한 보안 정책을 적용하는 것을 권장합니다

### HTTPS 요구사항
- Geolocation API는 HTTPS 환경 또는 localhost에서만 작동합니다
- 배포 시 HTTPS를 사용하는 호스팅 서비스를 선택하세요

### 권장 호스팅 서비스
- **Vercel**: 무료, 자동 HTTPS, 간단한 배포
- **Netlify**: 무료, 자동 HTTPS, 드래그 앤 드롭 배포
- **GitHub Pages**: 무료, HTTPS 지원
- **Cloudflare Pages**: 무료, 글로벌 CDN

## 4. 배포하기

### Vercel로 배포 (권장)
1. [Vercel](https://vercel.com) 계정 생성
2. GitHub 리포지토리 연결 또는 파일 직접 업로드
3. 자동으로 배포되고 HTTPS URL 제공

### GitHub Pages로 배포
1. GitHub 리포지토리 생성
2. `index.html` 파일 푸시
3. Settings > Pages에서 GitHub Pages 활성화
4. 제공된 HTTPS URL로 접속

## 5. 트러블슈팅

### "위치 정보 접근이 거부되었습니다"
- 브라우저 설정에서 위치 권한 허용
- HTTPS 환경인지 확인

### "저장 실패: relation 'locations' does not exist"
- Supabase에서 테이블 생성 SQL을 실행했는지 확인
- 테이블 이름이 정확히 `locations`인지 확인

### "저장 실패: new row violates row-level security policy"
- RLS 정책이 올바르게 설정되었는지 확인
- INSERT 정책이 활성화되어 있는지 확인

### 설정이 사라짐
- 브라우저의 쿠키/로컬 스토리지를 삭제하지 않았는지 확인
- 시크릿 모드에서는 설정이 저장되지 않습니다

## 6. 고급 기능 추가 아이디어

### 사용자 인증
- Supabase Auth를 이용한 로그인 기능
- 사용자별 위치 기록 관리

### 실시간 추적
- Geolocation API의 `watchPosition` 사용
- 실시간으로 위치 업데이트

### 데이터 시각화
- 지도에 여러 위치 마커 표시
- 이동 경로 그리기

### 통계 정보
- 총 이동 거리 계산
- 방문한 장소 분석
