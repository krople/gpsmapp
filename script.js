let supabaseClient = null;
let currentPosition = null;
let map = null;
let markers = [];
let infoWindows = [];

// Google Maps 초기화
function initMap() {
    // 기본 위치는 서울
    const center = { lat: 37.5665, lng: 126.9780 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: center,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
            }
        ]
    });
    
    // Supabase 설정 및 위치 로드는 지도 초기화 후에
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG?.url && SUPABASE_CONFIG?.anonKey) {
        initSupabase();
        loadAndDisplayLocations();
    }
}

// 페이지 로드 시 Google Maps가 자동으로 initMap 호출
window.initMap = initMap;

// Supabase 클라이언트 초기화
function initSupabase() {
    // config.js에서 설정을 불러오기
    const url = SUPABASE_CONFIG?.url || '';
    const key = SUPABASE_CONFIG?.anonKey || '';

    if (!url || !key) {
        console.error('config.js에 Supabase 설정이 필요합니다.');
        return false;
    }

    try {
        supabaseClient = supabase.createClient(url, key);
        return true;
    } catch (error) {
        console.error('Supabase 초기화 실패:', error.message);
        return false;
    }
}

// 저장된 설정 로드
function loadSettings() {
    // config.js에서 Supabase 설정 확인
    if (SUPABASE_CONFIG?.url && SUPABASE_CONFIG?.anonKey) {
        if (initSupabase()) {
            // 저장된 위치 로드 및 지도에 표시
            loadAndDisplayLocations();
        }
    } else {
        console.warn('config.js에 Supabase 설정이 필요합니다.');
    }
}

// 저장된 위치들을 로드하고 지도에 표시
async function loadAndDisplayLocations() {
    if (!initSupabase()) {
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('locations')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) {
            console.error('위치 로드 실패:', error);
            return;
        }

        if (data && data.length > 0) {
            displayLocationsOnMap(data);
        }
    } catch (error) {
        console.error('위치 로드 오류:', error);
    }
}

// 지도에 위치들을 마커로 표시
function displayLocationsOnMap(locations) {
    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    infoWindows.forEach(infoWindow => infoWindow.close());
    infoWindows = [];

    if (!locations || locations.length === 0) {
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    // 각 위치에 마커 추가
    locations.forEach((loc, index) => {
        const isFirst = index === 0;
        const position = { lat: loc.latitude, lng: loc.longitude };
        
        // 마커 생성
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: isFirst ? '최근 위치' : `위치 #${locations.length - index}`,
            label: {
                text: isFirst ? '📍' : String(locations.length - index),
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: isFirst ? '#28a745' : '#667eea',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3
            }
        });

        // 정보 창 내용
        const date = new Date(loc.timestamp);
        const dateStr = date.toLocaleString('ko-KR');
        const mapUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="min-width: 200px; padding: 10px;">
                    <strong style="color: ${isFirst ? '#28a745' : '#667eea'}; font-size: 16px;">
                        ${isFirst ? '📍 최근 위치' : `#${locations.length - index} 위치`}
                    </strong><br>
                    <small style="color: #666;">${dateStr}</small><br>
                    <div style="margin: 8px 0; font-size: 12px; line-height: 1.5;">
                        <strong>위도:</strong> ${loc.latitude.toFixed(6)}<br>
                        <strong>경도:</strong> ${loc.longitude.toFixed(6)}<br>
                        <strong>정확도:</strong> ${loc.accuracy ? Math.round(loc.accuracy) + 'm' : '정보 없음'}
                    </div>
                    <a href="${mapUrl}" target="_blank" style="
                        display: inline-block;
                        padding: 5px 10px;
                        background: #17a2b8;
                        color: white;
                        text-decoration: none;
                        border-radius: 3px;
                        font-size: 12px;
                        margin-top: 5px;
                    ">🗺️ 상세보기</a>
                </div>
            `
        });

        marker.addListener('click', () => {
            // 다른 정보창 닫기
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });

        markers.push(marker);
        infoWindows.push(infoWindow);
        bounds.extend(position);
    });

    // 모든 마커가 보이도록 지도 조정
    if (markers.length > 0) {
        map.fitBounds(bounds);
        
        // 마커가 하나만 있으면 적절한 줌 레벨로
        if (markers.length === 1) {
            google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
                map.setZoom(Math.min(15, map.getZoom()));
            });
        }
    }
}



// Google Maps가 로드되면 자동으로 initMap이 호출됨

function getLocation() {
    // 브라우저가 Geolocation을 지원하는지 확인
    if (!navigator.geolocation) {
        showError('이 브라우저는 위치 정보를 지원하지 않습니다.');
        return;
    }

    // UI 초기화
    hideError();
    hideInfo();
    showLoading();
    disableButton();

    // 위치 정보 요청
    navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function successCallback(position) {
    hideLoading();
    enableButton();

    currentPosition = position;
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const altitude = position.coords.altitude;
    const speed = position.coords.speed;

    // 정보 표시
    document.getElementById('latitude').textContent = lat.toFixed(6);
    document.getElementById('longitude').textContent = lon.toFixed(6);
    document.getElementById('accuracy').textContent = accuracy ? `약 ${Math.round(accuracy)}m` : '정보 없음';
    document.getElementById('altitude').textContent = altitude ? `${Math.round(altitude)}m` : '정보 없음';
    document.getElementById('speed').textContent = speed ? `${speed.toFixed(2)} m/s` : '정보 없음';

    // 지도 링크 설정 (Google Maps)
    const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    document.getElementById('mapLink').href = mapUrl;

    // 저장 버튼 활성화
    document.getElementById('saveLocationBtn').disabled = false;

    // 현재 위치를 지도에 임시 마커로 표시
    if (map) {
        const position = { lat: lat, lng: lon };
        
        // 이전 임시 마커 제거
        if (window.tempLocationMarker) {
            window.tempLocationMarker.setMap(null);
        }
        if (window.tempLocationCircle) {
            window.tempLocationCircle.setMap(null);
        }
        
        // 정확도 원 추가
        window.tempLocationCircle = new google.maps.Circle({
            strokeColor: '#007bff',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#007bff',
            fillOpacity: 0.2,
            map: map,
            center: position,
            radius: accuracy || 50
        });
        
        // 임시 마커 추가 (파란색)
        window.tempLocationMarker = new google.maps.Marker({
            position: position,
            map: map,
            title: '현재 위치 (미저장)',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#007bff',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3
            },
            label: {
                text: '📍',
                color: 'white',
                fontSize: '12px'
            }
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="min-width: 150px; padding: 8px;">
                    <strong style="color: #007bff;">📍 현재 위치</strong><br>
                    <small style="color: #999;">아직 저장되지 않음</small>
                </div>
            `
        });
        
        window.tempLocationMarker.addListener('click', () => {
            infoWindow.open(map, window.tempLocationMarker);
        });
        
        // 지도 중심을 현재 위치로 이동
        map.setCenter(position);
        map.setZoom(15);
        
        // 정보창 자동 열기
        infoWindow.open(map, window.tempLocationMarker);
    }

    showInfo();
}

async function saveLocation() {
    if (!currentPosition) {
        showError('먼저 위치 정보를 가져와주세요.');
        return;
    }

    if (!initSupabase()) {
        return;
    }

    hideError();
    hideSuccess();
    showLoading();
    disableButton();
    document.getElementById('saveLocationBtn').disabled = true;

    try {
        const { data, error } = await supabaseClient
            .from('locations')
            .insert([
                {
                    latitude: currentPosition.coords.latitude,
                    longitude: currentPosition.coords.longitude,
                    accuracy: currentPosition.coords.accuracy,
                    altitude: currentPosition.coords.altitude,
                    speed: currentPosition.coords.speed,
                    timestamp: new Date().toISOString()
                }
            ]);

        hideLoading();
        enableButton();

        if (error) {
            throw error;
        }

        showSuccess('위치 정보가 성공적으로 저장되었습니다! 🎉');
        document.getElementById('saveLocationBtn').disabled = false;
        
        // 저장 후 지도 새로고침
        loadAndDisplayLocations();
    } catch (error) {
        hideLoading();
        enableButton();
        document.getElementById('saveLocationBtn').disabled = false;
        showError('저장 실패: ' + error.message);
    }
}

async function loadHistory() {
    if (!initSupabase()) {
        return;
    }

    hideError();
    hideSuccess();
    showLoading();

    try {
        const { data, error } = await supabaseClient
            .from('locations')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(20);

        hideLoading();

        if (error) {
            throw error;
        }

        displayHistory(data);
    } catch (error) {
        hideLoading();
        showError('기록 로드 실패: ' + error.message);
    }
}

function displayHistory(locations) {
    const historyList = document.getElementById('historyList');
    
    if (!locations || locations.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #666;">저장된 기록이 없습니다.</p>';
    } else {
        historyList.innerHTML = locations.map(loc => {
            const date = new Date(loc.timestamp);
            const dateStr = date.toLocaleString('ko-KR');
            const mapUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
            
            return `
                <div class="history-item">
                    <div class="time">⏰ ${dateStr}</div>
                    <div class="coords">
                        📍 위도: ${loc.latitude.toFixed(6)}, 경도: ${loc.longitude.toFixed(6)}<br>
                        🎯 정확도: ${loc.accuracy ? Math.round(loc.accuracy) + 'm' : '정보 없음'}
                        ${loc.altitude ? ', 고도: ' + Math.round(loc.altitude) + 'm' : ''}
                    </div>
                    <a href="${mapUrl}" target="_blank" style="color: #17a2b8; text-decoration: none; font-size: 12px;">🗺️ 지도에서 보기</a>
                </div>
            `;
        }).join('');
    }

    document.getElementById('historyBox').classList.add('show');
}

function errorCallback(error) {
    hideLoading();
    enableButton();

    let errorMessage = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
        case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
            break;
        default:
            errorMessage = '알 수 없는 오류가 발생했습니다.';
    }

    showError(errorMessage);
}

function showError(message) {
    const errorBox = document.getElementById('error');
    errorBox.textContent = message;
    errorBox.classList.add('show');
}

function hideError() {
    document.getElementById('error').classList.remove('show');
}

function showSuccess(message) {
    const successBox = document.getElementById('success');
    successBox.textContent = message;
    successBox.classList.add('show');
}

function hideSuccess() {
    document.getElementById('success').classList.remove('show');
}

function showInfo() {
    document.getElementById('infoBox').classList.add('show');
}

function hideInfo() {
    document.getElementById('infoBox').classList.remove('show');
}

function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function disableButton() {
    document.getElementById('getLocationBtn').disabled = true;
}

function enableButton() {
    document.getElementById('getLocationBtn').disabled = false;
}
