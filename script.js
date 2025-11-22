let supabaseClient = null;
let currentPosition = null;

// Supabase 클라이언트 초기화
function initSupabase() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();

    if (!url || !key) {
        showError('Supabase URL과 Key를 모두 입력해주세요.');
        return false;
    }

    try {
        supabaseClient = supabase.createClient(url, key);
        return true;
    } catch (error) {
        showError('Supabase 초기화 실패: ' + error.message);
        return false;
    }
}

// 저장된 설정 로드
function loadSettings() {
    const savedUrl = localStorage.getItem('supabaseUrl');
    const savedKey = localStorage.getItem('supabaseKey');
    
    if (savedUrl) document.getElementById('supabaseUrl').value = savedUrl;
    if (savedKey) document.getElementById('supabaseKey').value = savedKey;
    
    if (savedUrl && savedKey) {
        initSupabase();
    }
}

// 설정 저장
function saveSettings() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();
    
    localStorage.setItem('supabaseUrl', url);
    localStorage.setItem('supabaseKey', key);
}

// 페이지 로드 시 설정 불러오기
window.addEventListener('load', loadSettings);

// 설정 변경 시 자동 저장
document.getElementById('supabaseUrl').addEventListener('change', saveSettings);
document.getElementById('supabaseKey').addEventListener('change', saveSettings);

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
