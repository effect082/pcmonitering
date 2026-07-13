// ============================================================
// main.js - 대시보드(dashboard.html) 전용 로직
// PC ON/OFF 실시간 모니터링 핵심 기능
// ============================================================

// 현재 시간 포맷 (YYYY-MM-DD HH:mm:ss)
function formatDateTime(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// URL 파라미터 가져오기
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const bootTimeParam = getQueryParam('boot_time');

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // 사용자 정보 표시
    document.getElementById('userNameDisplay').textContent = `${currentUser.team} ${currentUser.name} ${currentUser.role}`;

    // 출근 기록 전송 로직
    let actualBootTime = bootTimeParam || formatDateTime(new Date());
    document.getElementById('currentTime').textContent = `출근(PC 켠 시간): ${actualBootTime}`;
    
    // GAS URL 확인
    const gasUrl = CONFIG.GAS_URL;
    if (gasUrl) {
        try {
            const url = `${gasUrl}?action=recordBoot&name=${encodeURIComponent(currentUser.name)}&bootTime=${encodeURIComponent(actualBootTime)}&t=${Date.now()}`;
            await fetch(url);
        } catch (e) {
            console.error('출근 기록 전송 오류:', e);
        }
    }

    // 퇴근 버튼
    const shutdownBtn = document.getElementById('shutdownBtn');
    if (shutdownBtn) {
        shutdownBtn.addEventListener('click', async () => {
            if (!confirm('PC를 종료하고 퇴근하시겠습니까?')) return;
            
            const offTime = formatDateTime(new Date());
            shutdownBtn.disabled = true;
            shutdownBtn.textContent = '종료 중...';
            
            try {
                if (gasUrl) {
                    const url = `${gasUrl}?action=recordOff&name=${encodeURIComponent(currentUser.name)}&offTime=${encodeURIComponent(offTime)}&t=${Date.now()}`;
                    await fetch(url);
                }
                
                try {
                    const { ipcRenderer } = require('electron');
                    ipcRenderer.send('shutdown-pc', '');
                } catch(err) {
                    alert('PC를 종료할 수 없습니다. (웹 환경에서는 동작하지 않습니다.)');
                    shutdownBtn.disabled = false;
                    shutdownBtn.textContent = '퇴근하기 (종료)';
                }
            } catch (e) {
                console.error(e);
                alert('퇴근 시간 기록 중 오류가 발생했습니다.');
                shutdownBtn.disabled = false;
                shutdownBtn.textContent = '퇴근하기 (종료)';
            }
        });
    }

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            try {
                const { ipcRenderer } = require('electron');
                ipcRenderer.send('save-config', '');
            } catch(err) {}
            window.location.href = 'index.html';
        });
    }

    // ---- 나의 근태 기록 로드 ----
    let allUserLogs = [];

    async function loadUserLogs() {
        const tbody = document.getElementById('userLogTableBody');
        if (!tbody) return;
        if (!gasUrl) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">서버 주소가 설정되지 않았습니다.</td></tr>';
            return;
        }
        
        try {
            const url = `${gasUrl}?action=getStats&t=${Date.now()}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.status === 'success') {
                allUserLogs = result.data.filter(row => row.name === currentUser.name);
                renderUserLogs('all');
            } else {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">불러오기 실패</td></tr>';
            }
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">통신 오류</td></tr>';
        }
    }

    // 시간 포맷 유틸리티 (중복 제거)
    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === '-') return '-';
        try {
            const timeMatch = String(timeStr).match(/(\d{1,2}):(\d{2}):(\d{2})/);
            if (timeMatch) {
                const h = parseInt(timeMatch[1], 10);
                const m = parseInt(timeMatch[2], 10);
                const s = parseInt(timeMatch[3], 10);
                return `${h}시 ${m.toString().padStart(2,'0')}분 ${s.toString().padStart(2,'0')}초`;
            }
            const d = new Date(timeStr);
            if (isNaN(d.getTime())) return timeStr;
            return `${d.getHours()}시 ${d.getMinutes().toString().padStart(2, '0')}분 ${d.getSeconds().toString().padStart(2, '0')}초`;
        } catch(e) { return timeStr; }
    };

    const formatOnlyDate = (timeStr) => {
        if (!timeStr || timeStr === '-') return '-';
        try {
            const d = new Date(timeStr);
            if (isNaN(d.getTime())) return timeStr;
            return d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
        } catch(e) { return timeStr; }
    };

    function renderUserLogs(filterType) {
        const tbody = document.getElementById('userLogTableBody');
        if (!tbody) return;

        const now = new Date();
        const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); startOfMonth.setHours(0,0,0,0);

        // 날짜별 로그 그룹화 (가장 빠른 출근, 가장 늦은 퇴근)
        const groupedLogs = {};
        allUserLogs.forEach(row => {
            const dateKey = formatOnlyDate(row.date);
            if (!dateKey || dateKey === '-') return;
            
            // 부팅 시간 유효성 검사
            let isBootValid = true;
            if (row.bootTime && row.bootTime !== '-') {
                const rowDateMs = new Date(row.date).setHours(0,0,0,0);
                const bootMs = new Date(row.bootTime).getTime();
                if (!isNaN(rowDateMs) && !isNaN(bootMs) && bootMs < rowDateMs - 86400000) {
                    isBootValid = false;
                }
            }
            const safeBootTime = isBootValid ? row.bootTime : '-';
            
            if (!groupedLogs[dateKey]) {
                groupedLogs[dateKey] = { date: row.date, bootTime: safeBootTime, offTime: row.offTime };
            } else {
                const currentBoot = new Date(groupedLogs[dateKey].bootTime).getTime();
                const rowBoot = new Date(safeBootTime).getTime();
                if (!isNaN(rowBoot) && (isNaN(currentBoot) || rowBoot < currentBoot)) {
                    groupedLogs[dateKey].bootTime = safeBootTime;
                }
                const currentOff = new Date(groupedLogs[dateKey].offTime).getTime();
                const rowOff = new Date(row.offTime).getTime();
                if (!isNaN(rowOff) && (isNaN(currentOff) || rowOff > currentOff)) {
                    groupedLogs[dateKey].offTime = row.offTime;
                }
            }
        });

        // 대시보드 메인 출근 시간 갱신
        const todayStr = formatOnlyDate(formatDateTime(new Date()));
        if (groupedLogs[todayStr] && groupedLogs[todayStr].bootTime !== '-') {
            const mainTimeDisplay = document.getElementById('currentTime');
            if (mainTimeDisplay) {
                mainTimeDisplay.textContent = `출근(PC 켠 시간): ${formatTime(groupedLogs[todayStr].bootTime)}`;
            }
        }

        // 필터 적용 및 렌더링
        let html = '';
        Object.values(groupedLogs)
            .sort((a,b) => new Date(b.date) - new Date(a.date))
            .forEach(row => {
                const rowDate = new Date(row.date);
                if (isNaN(rowDate.getTime())) return;
                if (filterType === 'daily' && rowDate < startOfDay) return;
                if (filterType === 'weekly' && rowDate < startOfWeek) return;
                if (filterType === 'monthly' && rowDate < startOfMonth) return;
                
                html += `<tr>
                    <td style="white-space: nowrap;">${formatOnlyDate(row.date)}</td>
                    <td style="white-space: nowrap;">${formatTime(row.bootTime)}</td>
                    <td style="white-space: nowrap;">${formatTime(row.offTime)}</td>
                </tr>`;
            });

        tbody.innerHTML = html || '<tr><td colspan="3" style="text-align:center;">기록이 없습니다.</td></tr>';
    }

    // 필터 이벤트
    const userLogFilter = document.getElementById('userLogFilter');
    if (userLogFilter) {
        userLogFilter.addEventListener('change', (e) => renderUserLogs(e.target.value));
        loadUserLogs();
    }
});
