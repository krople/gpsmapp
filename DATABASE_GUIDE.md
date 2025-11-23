# Supabase 데이터베이스 스키마 가이드

Memory-Locking App을 위한 Supabase 데이터베이스 구조입니다.

## 테이블 생성 SQL

### 1. app_users 테이블 (사용자 정보)

```sql
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_app_users_username ON app_users(username);

-- Row Level Security (RLS) 활성화
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 조회 가능 (검색 기능)
CREATE POLICY "Anyone can view app_users" ON app_users
    FOR SELECT
    USING (true);

-- 정책: 본인만 수정 가능
CREATE POLICY "Users can update own data" ON app_users
    FOR UPDATE
    USING (auth.uid() = id);
```

### 2. friends 테이블 (친구 관계)

```sql
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    friend_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_name)
);

-- 인덱스
CREATE INDEX idx_friends_user_id ON friends(user_id);

-- RLS 활성화
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- 정책: 본인의 친구만 조회/수정 가능
CREATE POLICY "Users can view own friends" ON friends
    FOR SELECT
    USING (user_id = current_setting('app.current_user', true));

CREATE POLICY "Users can insert own friends" ON friends
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user', true));

CREATE POLICY "Users can delete own friends" ON friends
    FOR DELETE
    USING (user_id = current_setting('app.current_user', true));
```

### 3. memories 테이블 (추억 데이터)

```sql
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    creators TEXT[],
    tagged_users TEXT[],
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_location ON memories(latitude, longitude);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);

-- RLS 활성화
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 정책: 본인의 추억 조회/수정
CREATE POLICY "Users can view own memories" ON memories
    FOR SELECT
    USING (user_id = current_setting('app.current_user', true));

CREATE POLICY "Users can insert own memories" ON memories
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user', true));

CREATE POLICY "Users can update own memories" ON memories
    FOR UPDATE
    USING (user_id = current_setting('app.current_user', true));

CREATE POLICY "Users can delete own memories" ON memories
    FOR DELETE
    USING (user_id = current_setting('app.current_user', true));
```

### 4. locations 테이블 (기존 GPS 로그용, 선택사항)

```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    accuracy FLOAT,
    altitude FLOAT,
    speed FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_timestamp ON locations(timestamp DESC);

-- RLS 활성화
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 정책: 본인의 위치만 조회/추가
CREATE POLICY "Users can view own locations" ON locations
    FOR SELECT
    USING (user_id = current_setting('app.current_user', true));

CREATE POLICY "Users can insert own locations" ON locations
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user', true));
```

## 데이터베이스 설정

### 1. Supabase 대시보드에서 테이블 생성

1. [Supabase 대시보드](https://app.supabase.com) 로그인
2. 프로젝트 선택
3. SQL Editor 메뉴로 이동
4. 위의 SQL 코드를 순서대로 실행

### 2. 실시간 구독 활성화 (선택사항)

```sql
-- memories 테이블에 대한 실시간 알림 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
```

### 3. Storage 버킷 생성 (사진 업로드용)

Supabase Storage에서 버킷 생성:

1. Storage 메뉴 → "New bucket" 클릭
2. Bucket name: `memory-photos`
3. Public: true (공개 접근 허용)
4. 생성 후 정책 설정:

```sql
-- 저장소 정책: 모든 사용자가 업로드 가능
CREATE POLICY "Anyone can upload photos" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'memory-photos');

-- 저장소 정책: 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view photos" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'memory-photos');

-- 저장소 정책: 본인만 삭제 가능
CREATE POLICY "Users can delete own photos" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'memory-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

## 사용 예시

### JavaScript에서 데이터 삽입

```javascript
// 사용자 검색
const { data, error } = await supabaseClient
    .from('app_users')
    .select('username')
    .ilike('username', '%검색어%');

// 친구 추가
const { data, error } = await supabaseClient
    .from('friends')
    .insert([
        { user_id: currentUser, friend_name: 'John' }
    ]);

// 추억 저장
const { data, error } = await supabaseClient
    .from('memories')
    .insert([{
        id: Date.now().toString(),
        user_id: currentUser,
        name: '남산 타워',
        description: '첫 데이트 장소',
        latitude: 37.5512,
        longitude: 126.9882,
        creators: ['Alice', 'Bob'],
        tagged_users: ['Charlie'],
        photos: ['url1', 'url2']
    }]);

// 추억 조회
const { data, error } = await supabaseClient
    .from('memories')
    .select('*')
    .eq('user_id', currentUser)
    .order('created_at', { ascending: false });
```

### 사진 업로드 예시

```javascript
async function uploadPhoto(file) {
    const fileName = `${currentUser}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabaseClient.storage
        .from('memory-photos')
        .upload(fileName, file);
    
    if (error) throw error;
    
    // 공개 URL 가져오기
    const { data: urlData } = supabaseClient.storage
        .from('memory-photos')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}
```

## GPS 기반 알림 구현 (향후 고도화)

GPS 위치 기반 알림은 클라이언트 측에서 구현:

```javascript
function checkNearbyMemories(currentLat, currentLng) {
    memories.forEach(memory => {
        const distance = calculateDistance(
            currentLat, currentLng,
            memory.latitude, memory.longitude
        );
        
        // 100m 이내에 있으면 알림
        if (distance < 0.1) {
            showNotification(`📍 ${memory.name} 근처에 있습니다!`);
        }
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
```

## 보안 고려사항

1. **RLS (Row Level Security)**: 각 테이블에 RLS를 활성화하여 사용자가 본인의 데이터만 조회/수정하도록 제한
2. **인증**: Supabase Auth를 사용하여 회원가입/로그인 구현 (현재는 localStorage 임시 사용)
3. **API 키 보호**: `config.js`를 `.gitignore`에 추가하여 공개 저장소에 업로드 방지
4. **CORS 설정**: Supabase 대시보드에서 허용할 도메인 설정

## 다음 단계

1. Supabase Auth 통합 (이메일/소셜 로그인)
2. 실시간 알림 기능 추가 (친구가 나를 태그할 때)
3. Storage를 사용한 실제 사진 업로드 구현
4. GPS 기반 백그라운드 알림 (Service Worker)
5. 친구 요청/승인 시스템 개선
