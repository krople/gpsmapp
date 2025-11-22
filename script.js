let supabaseClient = null;
let currentPosition = null;
let map = null;
let markers = [];

// Leaflet 지도 초기화
function initMap() {
    // 기본 위치는 서울
    map = L.map('map').setView([37.5665, 126.9780], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // 지도 크기 조정
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    console.log('페이지 로드 완료, 지도 초기화 시작');
    
    // 지도 먼저 초기화
    try {
        initMap();
        console.log('지도 초기화 성공');
    } catch (error) {
        console.error('지도 초기화 실패:', error);
    }
    
    // Supabase 설정 확인 및 로드
    try {
        loadSettings();
    } catch (error) {
        console.error('설정 로드 실패:', error);
    }
});

// Supabase 클라이언트 초기화
function initSupabase() {
    // config.js가 로드되지 않았을 수 있으므로 안전하게 체크
    if (typeof SUPABASE_CONFIG === 'undefined') {
        console.warn('config.js 파일이 로드되지 않았거나 SUPABASE_CONFIG가 정의되지 않았습니다.');
        return false;
    }
    
    // config.js에서 설정을 불러오기
    const url = SUPABASE_CONFIG?.url || '';
    const key = SUPABASE_CONFIG?.anonKey || '';

    if (!url || !key) {
        console.error('config.js에 Supabase 설정이 필요합니다.');
        return false;
    }

    try {
        supabaseClient = supabase.createClient(url, key);
        console.log('Supabase 초기화 성공');
        return true;
    } catch (error) {
        console.error('Supabase 초기화 실패:', error.message);
        return false;
    }
}

// 저장된 설정 로드
function loadSettings() {
    // config.js가 정의되지 않았을 경우 안전하게 처리
    if (typeof SUPABASE_CONFIG === 'undefined') {
        console.warn('config.js 파일을 찾을 수 없습니다. Supabase 기능이 비활성화됩니다.');
        console.log('config.js 파일을 생성하고 Supabase 설정을 추가하세요.');
        return;
    }
    
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
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    if (!locations || locations.length === 0) {
        return;
    }

    const bounds = [];

    // 각 위치에 마커 추가
    locations.forEach((loc, index) => {
        const isFirst = index === 0;
        const position = [loc.latitude, loc.longitude];
        
        // 마커 생성
        const marker = L.marker(position, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: ${isFirst ? '#28a745' : '#667eea'};
                    color: white;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">${isFirst ? '📍' : (locations.length - index)}</div>`,
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            })
        }).addTo(map);

        // 팝업 내용
        const date = new Date(loc.timestamp);
        const dateStr = date.toLocaleString('ko-KR');
        const mapUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
        
        marker.bindPopup(`
            <div style="min-width: 200px;">
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
                ">🗺️ Google Maps</a>
            </div>
        `);

        // 마커에 데이터 저장
        marker.locationData = { lat: loc.latitude, lng: loc.longitude };
        
        markers.push(marker);
        bounds.push(position);
    });

    // 모든 마커가 보이도록 지도 조정
    if (bounds.length > 0) {
        map.fitBounds(bounds);
    }
}

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
        // 이전 임시 마커 제거
        if (window.tempLocationMarker) {
            map.removeLayer(window.tempLocationMarker);
        }
        if (window.tempLocationCircle) {
            map.removeLayer(window.tempLocationCircle);
        }
        
        // 정확도 원 추가
        window.tempLocationCircle = L.circle([lat, lon], {
            color: '#007bff',
            fillColor: '#007bff',
            fillOpacity: 0.2,
            radius: accuracy || 50
        }).addTo(map);
        
        // 임시 마커 추가 (파란색)
        window.tempLocationMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: #007bff;
                    color: white;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">📍</div>`,
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            })
        }).addTo(map);
        
        window.tempLocationMarker.bindPopup(`
            <div style="min-width: 150px;">
                <strong style="color: #007bff;">📍 현재 위치</strong><br>
                <small style="color: #999;">아직 저장되지 않음</small>
            </div>
        `).openPopup();
        
        // 지도 중심을 현재 위치로 이동
        map.setView([lat, lon], 15);
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
        historyList.innerHTML = locations.map((loc, index) => {
            const date = new Date(loc.timestamp);
            const dateStr = date.toLocaleString('ko-KR');
            
            return `
                <div class="history-item" data-lat="${loc.latitude}" data-lng="${loc.longitude}">
                    <div class="time">⏰ ${dateStr}</div>
                    <div class="coords">
                        📍 위도: ${loc.latitude.toFixed(6)}, 경도: ${loc.longitude.toFixed(6)}<br>
                        🎯 정확도: ${loc.accuracy ? Math.round(loc.accuracy) + 'm' : '정보 없음'}
                        ${loc.altitude ? ', 고도: ' + Math.round(loc.altitude) + 'm' : ''}
                    </div>
                    <button onclick="showLocationOnMap(${loc.latitude}, ${loc.longitude})" 
                            style="
                                background: #17a2b8;
                                color: white;
                                border: none;
                                padding: 5px 12px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-top: 8px;
                            ">
                        🗺️ 지도에서 보기
                    </button>
                </div>
            `;
        }).join('');
    }

    document.getElementById('historyBox').classList.add('show');
}

// 특정 위치를 지도에서 보여주는 함수
function showLocationOnMap(lat, lng) {
    if (!map) {
        console.error('지도가 초기화되지 않았습니다.');
        return;
    }
    
    console.log('지도로 이동:', lat, lng);
    
    // 지도 중심을 해당 위치로 이동하고 확대
    map.setView([lat, lng], 16);
    
    // 해당 위치의 마커를 찾아서 팝업 열기
    let found = false;
    markers.forEach(marker => {
        const markerData = marker.locationData;
        if (markerData && Math.abs(markerData.lat - lat) < 0.000001 && Math.abs(markerData.lng - lng) < 0.000001) {
            marker.openPopup();
            found = true;
        }
    });
    
    if (!found) {
        console.warn('해당 위치의 마커를 찾을 수 없습니다.');
    }
    
    // 페이지 상단(지도)으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
