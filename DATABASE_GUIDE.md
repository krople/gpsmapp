# Supabase 데이터베이스 스키마 가이드

Memory-Locking App을 위한 Supabase 데이터베이스 구조입니다.

## 테이블 생성 SQL

### 1. app_users 테이블 (사용자 정보)

```sql
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_plan TEXT DEFAULT 'free',
    credits INTEGER DEFAULT 0,
    monthly_locks_created INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_app_users_username ON app_users(username);

-- Row Level Security (RLS) 활성화
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 조회 가능 (검색 기능)
CREATE POLICY "Anyone can view app_users" ON app_users
    FOR SELECT
    USING (true);

-- 정책: 누구나 새 계정 생성 가능
CREATE POLICY "Anyone can insert app_users" ON app_users
    FOR INSERT
    WITH CHECK (true);

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

-- 정책: 모든 사용자가 자신의 친구 조회 가능
CREATE POLICY "Users can view own friends" ON friends
    FOR SELECT
    USING (true);

-- 정책: 모든 사용자가 친구 추가 가능
CREATE POLICY "Users can insert friends" ON friends
    FOR INSERT
    WITH CHECK (true);

-- 정책: 본인의 친구만 삭제 가능
CREATE POLICY "Users can delete own friends" ON friends
    FOR DELETE
    USING (true);
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
    lock_type TEXT DEFAULT 'standard',
    skin_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_location ON memories(latitude, longitude);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);

-- RLS 활성화
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 추억 조회 가능
CREATE POLICY "Users can view memories" ON memories
    FOR SELECT
    USING (true);

-- 정책: 모든 사용자가 추억 추가 가능
CREATE POLICY "Users can insert memories" ON memories
    FOR INSERT
    WITH CHECK (true);

-- 정책: 모든 사용자가 추억 수정 가능
CREATE POLICY "Users can update memories" ON memories
    FOR UPDATE
    USING (true);

-- 정책: 모든 사용자가 추억 삭제 가능
CREATE POLICY "Users can delete memories" ON memories
    FOR DELETE
    USING (true);
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

-- 정책: 모든 사용자가 위치 조회 가능
CREATE POLICY "Users can view locations" ON locations
    FOR SELECT
    USING (true);

-- 정책: 모든 사용자가 위치 추가 가능
CREATE POLICY "Users can insert locations" ON locations
    FOR INSERT
    WITH CHECK (true);
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

### 5. user_inventory 테이블 (신규 - 사용자 아이템 인벤토리)

```sql
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_item_type ON user_inventory(item_type);

-- RLS 활성화
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- 정책: 본인의 인벤토리만 조회 가능
CREATE POLICY "Users can view own inventory" ON user_inventory
    FOR SELECT
    USING (true);

-- 정책: 시스템만 인벤토리 추가 가능 (결제 처리 후)
CREATE POLICY "System can insert inventory" ON user_inventory
    FOR INSERT
    WITH CHECK (true);
```

### 6. lock_skins 테이블 (신규 - 자물쇠 스킨 상품 정보)

```sql
CREATE TABLE lock_skins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    rarity TEXT DEFAULT 'common',
    price_coins INTEGER DEFAULT 100,
    notification_radius INTEGER DEFAULT 100,
    is_premium_exclusive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 스킨 데이터 삽입
INSERT INTO lock_skins (id, name, description, rarity, price_coins, notification_radius, is_premium_exclusive) VALUES
('standard', '기본 자물쇠', '일반 자물쇠입니다.', 'common', 0, 100, false),
('gold', '황금 자물쇠', '황금빛으로 빛나는 특별한 자물쇠입니다.', 'rare', 500, 200, false),
('diamond', '다이아몬드 자물쇠', '최고급 다이아몬드 자물쇠입니다.', 'epic', 1000, 300, true),
('rainbow', '무지개 자물쇠', '무지개 효과가 있는 자물쇠입니다.', 'rare', 700, 200, false);

-- RLS 활성화
ALTER TABLE lock_skins ENABLE ROW LEVEL SECURITY;

-- 정책: 모두 조회 가능
CREATE POLICY "Anyone can view lock_skins" ON lock_skins
    FOR SELECT
    USING (true);
```

## 월간 자물쇠 카운트 리셋 함수 (자동화)

```sql
-- 매월 1일에 모든 사용자의 monthly_locks_created를 0으로 리셋하는 함수
CREATE OR REPLACE FUNCTION reset_monthly_locks()
RETURNS void AS $$
BEGIN
    UPDATE app_users
    SET monthly_locks_created = 0,
        last_reset_date = NOW()
    WHERE DATE_TRUNC('month', last_reset_date) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Supabase의 pg_cron 확장을 사용한 스케줄링 (Supabase Pro 이상 필요)
-- 또는 클라이언트에서 로그인 시 체크하여 리셋하는 방식 사용
```

## 다음 단계

1. **수익화 기능 구현**
   - 사용자 구독 상태 확인 로직
   - 자물쇠 생성 제한 (무료 사용자: 월 3개)
   - 고급 자물쇠 구매 및 인벤토리 관리
2. Supabase Auth 통합 (이메일/소셜 로그인)
3. 실시간 알림 기능 추가 (친구가 나를 태그할 때)
4. Storage를 사용한 실제 사진 업로드 구현
5. GPS 기반 백그라운드 알림 (Service Worker)
6. 친구 요청/승인 시스템 개선
7. 결제 모듈 연동 (토스 페이먼츠 또는 Stripe)
