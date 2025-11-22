# Google Maps API 키 설정 가이드

## 1. Google Maps API 키 발급

### 1.1 Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 API 활성화
1. 좌측 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. "Maps JavaScript API" 검색 후 활성화

### 1.3 API 키 생성
1. 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
2. "사용자 인증 정보 만들기" > "API 키" 클릭
3. 생성된 API 키 복사

### 1.4 API 키 제한 설정 (선택사항, 권장)
1. 생성된 API 키 옆의 편집 버튼 클릭
2. "애플리케이션 제한사항" 설정
   - HTTP 리퍼러(웹사이트): 배포할 도메인 추가 (예: `https://yourdomain.com/*`)
3. "API 제한사항" 설정
   - "키 제한" 선택 후 "Maps JavaScript API" 선택

## 2. API 키 적용

### index.html 파일 수정
`index.html` 파일에서 다음 줄을 찾아 `YOUR_GOOGLE_MAPS_API_KEY`를 발급받은 키로 교체:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap" async defer></script>
```

예시:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&callback=initMap" async defer></script>
```

## 3. 무료 사용량

Google Maps Platform은 매달 $200의 무료 크레딧을 제공합니다:
- Maps JavaScript API: 28,000회 로드/월까지 무료
- 개인 프로젝트나 소규모 웹사이트에 충분

## 4. 참고사항

### 보안
- API 키는 공개 저장소에 직접 커밋하지 마세요
- 가능하면 도메인 제한을 설정하세요
- 의심스러운 사용량이 감지되면 즉시 키를 재생성하세요

### 대안 (무료)
API 키 없이 테스트하려면 OpenStreetMap (Leaflet)을 사용할 수도 있습니다.
단, Google Maps가 더 나은 UX와 상세한 지도 정보를 제공합니다.
