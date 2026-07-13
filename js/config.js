// ============================================================
// CONFIG - GAS URL 동적 관리
// App 모듈(app.js)이 로드되지 않는 페이지(dashboard.html, admin.html 등)에서
// 후방 호환성을 위해 CONFIG.GAS_URL을 동적으로 제공합니다.
// ============================================================

const CONFIG = {
    get GAS_URL() {
        // 1순위: App 모듈이 로드된 경우
        if (typeof App !== 'undefined' && App.getGasUrl) {
            return App.getGasUrl();
        }
        // 2순위: localStorage에서 직접 읽기
        return localStorage.getItem('pc_monitor_gas_url') || '';
    }
};
