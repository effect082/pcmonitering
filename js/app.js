// ============================================================
// App 모듈 - GAS URL 관리, API 호출, 유틸리티
// 모든 페이지에서 공통으로 사용되는 핵심 모듈
// ============================================================

const App = (() => {
    // ---- 상수 ----
    const STORAGE_KEY_GAS_URL = 'pc_monitor_gas_url';
    const STORAGE_KEY_ORG_NAME = 'pc_monitor_org_name';
    const DEFAULT_ORG_NAME = 'PC ON/OFF 모니터링';

    // ---- GAS URL 관리 ----

    /**
     * 현재 설정된 GAS URL을 반환합니다.
     * 우선순위: URL 파라미터 > localStorage
     */
    function getGasUrl() {
        // 1. URL 파라미터에서 gas_url 확인 (최초 설정 시 사용)
        const urlParams = new URLSearchParams(window.location.search);
        const paramUrl = urlParams.get('gas_url');
        if (paramUrl) {
            // URL 파라미터로 전달된 GAS URL을 localStorage에 저장
            localStorage.setItem(STORAGE_KEY_GAS_URL, paramUrl);
            return paramUrl;
        }

        // 2. localStorage에서 읽기
        return localStorage.getItem(STORAGE_KEY_GAS_URL) || '';
    }

    /**
     * GAS URL을 설정합니다.
     */
    function setGasUrl(url) {
        if (url) {
            localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
        } else {
            localStorage.removeItem(STORAGE_KEY_GAS_URL);
        }
    }

    // ---- 기관명 관리 ----

    function getOrgName() {
        return localStorage.getItem(STORAGE_KEY_ORG_NAME) || DEFAULT_ORG_NAME;
    }

    function setOrgName(name) {
        if (name) {
            localStorage.setItem(STORAGE_KEY_ORG_NAME, name.trim());
        } else {
            localStorage.removeItem(STORAGE_KEY_ORG_NAME);
        }
    }

    // ---- API 호출 ----

    /**
     * GAS 서버에 API 요청을 보냅니다.
     * @param {Object} params - action 포함 파라미터 객체
     * @param {string} method - 'GET' 또는 'POST' (기본: 'GET')
     * @returns {Object|null} 응답 JSON 또는 null
     */
    async function apiCall(params, method = 'GET') {
        const gasUrl = getGasUrl();
        if (!gasUrl) {
            console.warn('[App] GAS URL이 설정되지 않았습니다.');
            return null;
        }

        try {
            let response;

            if (method === 'POST') {
                const body = Object.entries(params)
                    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                    .join('&');

                response = await fetch(gasUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body
                });
            } else {
                const queryString = Object.entries(params)
                    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                    .join('&');
                const url = `${gasUrl}?${queryString}&t=${Date.now()}`;
                response = await fetch(url);
            }

            const result = await response.json();

            // GAS 응답 형식 통합 (status/success 모두 지원)
            if (result.status === 'success') {
                result.success = true;
            }

            return result;
        } catch (e) {
            console.error('[App] API 호출 오류:', e);
            return null;
        }
    }

    // ---- UI 유틸리티 ----

    function showMessage(text, className) {
        const el = document.getElementById('statusMessage');
        if (!el) return;
        el.textContent = text;
        el.className = 'text-center mt-4 ' + (className || '');
    }

    function logout() {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('isAdmin');
        window.location.href = 'index.html';
    }

    // ---- 초기화 ----

    function initApp() {
        // URL 파라미터에서 GAS URL 자동 설정
        const gasUrl = getGasUrl(); // 이 호출로 파라미터 → localStorage 저장됨

        // 기관명 표시
        const orgNameDisplay = document.getElementById('orgNameDisplay');
        if (orgNameDisplay) {
            orgNameDisplay.textContent = getOrgName();
        }

        // 서버에서 기관 설정 동기화 (GAS URL이 있을 때만)
        if (gasUrl) {
            syncOrgSettings();
        }
    }

    /**
     * 서버에서 기관 설정(기관명 등)을 가져와 로컬에 동기화합니다.
     */
    async function syncOrgSettings() {
        try {
            const result = await apiCall({ action: 'getOrgSettings' });
            if (result && result.success && result.orgName) {
                setOrgName(result.orgName);
                const orgNameDisplay = document.getElementById('orgNameDisplay');
                if (orgNameDisplay) {
                    orgNameDisplay.textContent = result.orgName;
                }
            }
        } catch (e) {
            // 서버 미연동 상태에서는 무시
        }
    }

    // ---- 공개 API ----
    return {
        getGasUrl,
        setGasUrl,
        getOrgName,
        setOrgName,
        apiCall,
        showMessage,
        logout,
        initApp,
        syncOrgSettings,
        STORAGE_KEY_GAS_URL,
        STORAGE_KEY_ORG_NAME
    };
})();
