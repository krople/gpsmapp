// ===== 전역 변수 =====
let supabaseClient = null;
let currentUser = null;
let currentLocation = null;
let friends = [];
let memories = [];
let selectedCreators = [];
let taggedUsers = [];
let uploadedPhotos = [];
let map = null;
let popupMap = null;

// ===== 초기화 =====
window.addEventListener('DOMContentLoaded', () => {
    console.log('앱 초기화 시작');
    initializeApp();
});

async function initializeApp() {
    // 로그인 확인
    currentUser = localStorage.getItem('currentUser');
    const currentUserId = localStorage.getItem('currentUserId');
    
    if (!currentUser || !currentUserId) {
        // 로그인 안 되어 있으면 로그인 페이지로
        window.location.href = 'login.html';
        return;
    }
    
    // Supabase 초기화
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG?.url && SUPABASE_CONFIG?.anonKey) {
        try {
            supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('Supabase 초기화 성공');
            
            // 데이터 로드
            await loadFriends();
            await loadMemories();
        } catch (error) {
            console.error('Supabase 초기화 실패:', error);
        }
    } else {
        console.warn('config.js 파일이 필요합니다.');
    }
    
    // 이벤트 리스너 등록
    registerEventListeners();
    
    // 사용자 이름 표시
    const userDisplay = document.getElementById('currentUserDisplay');
    if (userDisplay) {
        userDisplay.textContent = `👤 ${currentUser}`;
    }
    
    // 메인 화면 표시
    switchScreen('main');
}

// 로그아웃 함수
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserId');
        window.location.href = 'login.html';
    }
}

// ===== 이벤트 리스너 =====
function registerEventListeners() {
    // 네비게이션
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.dataset.screen;
            switchScreen(screen);
        });
    });
    
    // 추억 추가 버튼
    document.getElementById('addMemoryBtn').addEventListener('click', startCreateMemory);
    
    // 뒤로가기
    document.getElementById('backToMain').addEventListener('click', () => switchScreen('main'));
    
    // 지도 보기
    document.getElementById('showMapBtn').addEventListener('click', showPopupMap);
    
    // 제작자 추가
    document.getElementById('addCreatorsBtn').addEventListener('click', showCreatorsModal);
    document.getElementById('confirmCreators').addEventListener('click', confirmCreators);
    
    // 태그 입력
    document.getElementById('tagInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaggedUser();
        }
    });
    
    // 자물쇠 만들기
    document.getElementById('createLockBtn').addEventListener('click', showEditModal);
    
    // 자물쇠 완료
    document.getElementById('completeLockBtn').addEventListener('click', completeMemory);
    
    // 사진 업로드
    document.getElementById('photoUpload').addEventListener('change', handlePhotoUpload);
    
    // 모달 닫기
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });
    
    // 검색
    document.getElementById('userSearch').addEventListener('input', searchUsers);
}

// ===== 화면 전환 =====
function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.screen === screenName) {
            btn.classList.add('active');
        }
    });
    
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        // 지도 화면이면 지도 초기화
        if (screenName === 'map') {
            initMainMap();
        }
    }
}

// ===== 친구 관리 =====
async function loadFriends() {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('friends')
            .select('*')
            .eq('user_id', currentUser);
        
        if (error) throw error;
        
        friends = data || [];
        renderFriendsList();
    } catch (error) {
        console.error('친구 목록 로드 실패:', error);
    }
}

function renderFriendsList() {
    const container = document.getElementById('friendsList');
    
    if (friends.length === 0) {
        container.innerHTML = '<p class="empty-message">아직 친구가 없습니다.</p>';
        return;
    }
    
    container.innerHTML = friends.map(friend => `
        <div class="friend-item">
            <span>👤 ${friend.friend_name}</span>
            <button class="remove-friend" onclick="removeFriend('${friend.friend_name}')">×</button>
        </div>
    `).join('');
}

async function addFriend(friendName) {
    if (!supabaseClient) {
        friends.push({ user_id: currentUser, friend_name: friendName });
        renderFriendsList();
        showToast(`${friendName}님을 친구로 추가했습니다!`);
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('friends')
            .insert([{ user_id: currentUser, friend_name: friendName }]);
        
        if (error) throw error;
        
        await loadFriends();
        showToast(`${friendName}님을 친구로 추가했습니다!`);
    } catch (error) {
        console.error('친구 추가 실패:', error);
        showToast('친구 추가에 실패했습니다.');
    }
}

async function removeFriend(friendName) {
    if (!confirm(`${friendName}님을 친구 목록에서 삭제하시겠습니까?`)) return;
    
    if (!supabaseClient) {
        friends = friends.filter(f => f.friend_name !== friendName);
        renderFriendsList();
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('friends')
            .delete()
            .eq('user_id', currentUser)
            .eq('friend_name', friendName);
        
        if (error) throw error;
        
        await loadFriends();
        showToast(`${friendName}님을 친구 목록에서 삭제했습니다.`);
    } catch (error) {
        console.error('친구 삭제 실패:', error);
    }
}

// ===== 사용자 검색 =====
async function searchUsers(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (query.length < 2) {
        resultsContainer.classList.remove('show');
        return;
    }
    
    if (!supabaseClient) {
        resultsContainer.innerHTML = `
            <div class="search-result-item">
                <span>${query}</span>
                <button class="add-friend-btn" onclick="addFriend('${query}')">추가</button>
            </div>
        `;
        resultsContainer.classList.add('show');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('app_users')
            .select('username')
            .ilike('username', `%${query}%`)
            .limit(5);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            resultsContainer.innerHTML = data.map(user => `
                <div class="search-result-item">
                    <span>👤 ${user.username}</span>
                    <button class="add-friend-btn" onclick="addFriend('${user.username}')">추가</button>
                </div>
            `).join('');
            resultsContainer.classList.add('show');
        } else {
            resultsContainer.innerHTML = '<div class="search-result-item">검색 결과가 없습니다.</div>';
            resultsContainer.classList.add('show');
        }
    } catch (error) {
        console.error('사용자 검색 실패:', error);
    }
}

// ===== 추억 관리 =====
async function loadMemories() {
    if (!supabaseClient) {
        renderMemoryHistory();
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('memories')
            .select('*')
            .eq('user_id', currentUser)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        memories = data || [];
        renderMemoryHistory();
    } catch (error) {
        console.error('추억 로드 실패:', error);
    }
}

function renderMemoryHistory() {
    const container = document.getElementById('memoryHistory');
    
    if (memories.length === 0) {
        container.innerHTML = '<p class="empty-message">아직 저장된 추억이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = memories.map(memory => `
        <div class="memory-item" onclick="showMemoryDetail('${memory.id}')">
            <div class="memory-item-header">
                <span class="memory-name">🔒 ${memory.name}</span>
                <span class="memory-date">${formatDate(memory.created_at)}</span>
            </div>
            <div class="memory-location">📍 ${memory.latitude.toFixed(6)}, ${memory.longitude.toFixed(6)}</div>
            <div class="memory-creators">👥 ${memory.creators ? memory.creators.join(', ') : '나'}</div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// ===== 새 추억 생성 =====
async function startCreateMemory() {
    // GPS 위치 가져오기
    if (!navigator.geolocation) {
        showToast('이 기기는 위치 정보를 지원하지 않습니다.');
        return;
    }
    
    document.getElementById('currentGPS').textContent = '위치 정보를 가져오는 중...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            document.getElementById('currentGPS').textContent = 
                `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
            
            // 초기화
            selectedCreators = [];
            taggedUsers = [];
            uploadedPhotos = [];
            document.getElementById('selectedCreators').innerHTML = '';
            document.getElementById('taggedUsers').innerHTML = '';
            
            switchScreen('sub');
        },
        (error) => {
            showToast('위치 정보를 가져올 수 없습니다.');
            console.error('GPS 오류:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// ===== 팝업 지도 =====
function showPopupMap() {
    if (!currentLocation) {
        showToast('먼저 위치를 가져와주세요.');
        return;
    }
    
    const modal = document.getElementById('mapPopup');
    modal.classList.add('show');
    
    setTimeout(() => {
        if (!popupMap) {
            popupMap = L.map('popupMap').setView([currentLocation.latitude, currentLocation.longitude], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(popupMap);
        } else {
            popupMap.setView([currentLocation.latitude, currentLocation.longitude], 15);
        }
        
        // 마커 추가
        L.marker([currentLocation.latitude, currentLocation.longitude]).addTo(popupMap)
            .bindPopup('📍 현재 위치').openPopup();
        
        popupMap.invalidateSize();
    }, 100);
}

// ===== 제작자 선택 =====
function showCreatorsModal() {
    const modal = document.getElementById('creatorsModal');
    const container = document.getElementById('creatorsSelection');
    
    if (friends.length === 0) {
        container.innerHTML = '<p class="empty-message">친구를 먼저 추가해주세요.</p>';
    } else {
        container.innerHTML = friends.map(friend => `
            <label class="creator-option ${selectedCreators.includes(friend.friend_name) ? 'selected' : ''}">
                <input type="checkbox" class="creator-checkbox" value="${friend.friend_name}" 
                    ${selectedCreators.includes(friend.friend_name) ? 'checked' : ''}
                    onchange="toggleCreator(this)">
                <span>👤 ${friend.friend_name}</span>
            </label>
        `).join('');
    }
    
    modal.classList.add('show');
}

function toggleCreator(checkbox) {
    const name = checkbox.value;
    const option = checkbox.closest('.creator-option');
    
    if (checkbox.checked) {
        if (selectedCreators.length >= 10) {
            checkbox.checked = false;
            showToast('최대 10명까지만 선택할 수 있습니다.');
            return;
        }
        selectedCreators.push(name);
        option.classList.add('selected');
    } else {
        selectedCreators = selectedCreators.filter(c => c !== name);
        option.classList.remove('selected');
    }
}

function confirmCreators() {
    document.getElementById('creatorsModal').classList.remove('show');
    
    const container = document.getElementById('selectedCreators');
    container.innerHTML = selectedCreators.map(name => `
        <div class="selected-item">
            <span>👤 ${name}</span>
            <button class="remove-item" onclick="removeCreator('${name}')">×</button>
        </div>
    `).join('');
    
    showToast(`${selectedCreators.length}명의 제작자를 선택했습니다.`);
}

function removeCreator(name) {
    selectedCreators = selectedCreators.filter(c => c !== name);
    confirmCreators();
}

// ===== 태그 관리 =====
function addTaggedUser() {
    const input = document.getElementById('tagInput');
    const username = input.value.trim();
    
    if (!username) return;
    
    if (taggedUsers.includes(username)) {
        showToast('이미 태그된 사용자입니다.');
        return;
    }
    
    taggedUsers.push(username);
    input.value = '';
    
    renderTaggedUsers();
    showToast(`${username}님을 태그했습니다.`);
}

function renderTaggedUsers() {
    const container = document.getElementById('taggedUsers');
    container.innerHTML = taggedUsers.map(name => `
        <div class="tagged-item">
            <span>🏷️ ${name}</span>
            <button class="remove-item" onclick="removeTag('${name}')">×</button>
        </div>
    `).join('');
}

function removeTag(name) {
    taggedUsers = taggedUsers.filter(t => t !== name);
    renderTaggedUsers();
}

// ===== 편집 모달 =====
function showEditModal() {
    if (!currentLocation) {
        showToast('위치 정보가 필요합니다.');
        return;
    }
    
    document.getElementById('editModal').classList.add('show');
}

// ===== 사진 업로드 =====
function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    const preview = document.getElementById('photoPreview');
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedPhotos.push(e.target.result);
            renderPhotoPreview();
        };
        reader.readAsDataURL(file);
    });
}

function renderPhotoPreview() {
    const container = document.getElementById('photoPreview');
    container.innerHTML = uploadedPhotos.map((photo, index) => `
        <div class="photo-item">
            <img src="${photo}" alt="사진 ${index + 1}">
            <button class="remove-photo" onclick="removePhoto(${index})">×</button>
        </div>
    `).join('');
}

function removePhoto(index) {
    uploadedPhotos.splice(index, 1);
    renderPhotoPreview();
}

// ===== 추억 완성 =====
async function completeMemory() {
    const name = document.getElementById('memoryName').value.trim();
    const description = document.getElementById('memoryDescription').value.trim();
    
    if (!name) {
        showToast('추억의 이름을 입력해주세요.');
        return;
    }
    
    const memoryData = {
        id: Date.now().toString(),
        user_id: currentUser,
        name: name,
        description: description,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        creators: selectedCreators,
        tagged_users: taggedUsers,
        photos: uploadedPhotos,
        created_at: new Date().toISOString()
    };
    
    if (!supabaseClient) {
        memories.unshift(memoryData);
        finishCreation();
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('memories')
            .insert([memoryData]);
        
        if (error) throw error;
        
        await loadMemories();
        finishCreation();
    } catch (error) {
        console.error('추억 저장 실패:', error);
        showToast('추억 저장에 실패했습니다.');
    }
}

function finishCreation() {
    document.getElementById('editModal').classList.remove('show');
    
    // 폼 초기화
    document.getElementById('memoryName').value = '';
    document.getElementById('memoryDescription').value = '';
    document.getElementById('photoUpload').value = '';
    document.getElementById('photoPreview').innerHTML = '';
    
    showToast('✅ 제작이 완료되었습니다!');
    
    setTimeout(() => {
        switchScreen('main');
    }, 1500);
}

// ===== 메인 지도 =====
function initMainMap() {
    const mapContainer = document.getElementById('mainMap');
    
    if (!map) {
        map = L.map('mainMap').setView([37.5665, 126.9780], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
    }
    
    setTimeout(() => {
        map.invalidateSize();
        displayMemoriesOnMap();
    }, 100);
}

function displayMemoriesOnMap() {
    if (!map || memories.length === 0) return;
    
    const bounds = [];
    
    memories.forEach(memory => {
        const marker = L.marker([memory.latitude, memory.longitude], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: #667eea;
                    color: white;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">🔒</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(map);
        
        marker.bindPopup(`
            <div style="min-width: 200px;">
                <strong style="color: #667eea; font-size: 16px;">🔒 ${memory.name}</strong><br>
                <small style="color: #666;">${formatDate(memory.created_at)}</small><br>
                <div style="margin: 8px 0; font-size: 12px;">
                    ${memory.description || ''}
                </div>
            </div>
        `);
        
        bounds.push([memory.latitude, memory.longitude]);
    });
    
    if (bounds.length > 0) {
        map.fitBounds(bounds);
    }
}

// ===== 추억 상세보기 =====
function showMemoryDetail(memoryId) {
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;
    
    // 상세보기 로직 (필요시 추가 구현)
    showToast(`${memory.name} 추억을 확인했습니다.`);
}

// ===== 유틸리티 =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 전역 함수로 export (HTML onclick에서 사용)
window.removeFriend = removeFriend;
window.addFriend = addFriend;
window.toggleCreator = toggleCreator;
window.removeCreator = removeCreator;
window.removeTag = removeTag;
window.removePhoto = removePhoto;
window.showMemoryDetail = showMemoryDetail;
window.logout = logout;
