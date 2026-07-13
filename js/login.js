// ============================================================
// login.js - index.html 전용 로그인 및 회원가입 로직
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // App 초기화 (기관명 로드, GAS URL 파라미터 처리 등)
    App.initApp();

    // 이미 로그인된 사용자인 경우 대시보드로 이동
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
        window.location.href = 'dashboard.html';
        return;
    }

    // UI 요소
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');

    // 폼 전환
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // 로그인 로직
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const name = document.getElementById('name').value.trim();
        const password = document.getElementById('password').value;
        const statusEl = document.getElementById('loginStatus');

        if (!name || !password) {
            statusEl.textContent = '이름과 비밀번호를 모두 입력하세요.';
            statusEl.style.display = 'block';
            return;
        }

        statusEl.style.display = 'none';
        const btn = document.getElementById('loginBtn');
        btn.disabled = true;
        btn.textContent = '로그인 중...';

        try {
            const hash = await sha256(password);
            const result = await App.apiCall({
                action: 'login',
                name: name,
                password: hash
            });

            if (result && result.status === 'success') {
                // 로그인 성공
                localStorage.setItem('user', JSON.stringify(result.user));
                window.location.href = 'dashboard.html';
            } else if (result) {
                // 로그인 실패
                statusEl.textContent = result.message || '로그인 실패';
                statusEl.style.display = 'block';
            } else {
                statusEl.textContent = '서버 통신 오류 (GAS URL 설정을 확인하세요)';
                statusEl.style.display = 'block';
            }
        } catch (e) {
            statusEl.textContent = '오류 발생: ' + e.message;
            statusEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = '로그인';
        }
    });

    // 회원가입 로직
    document.getElementById('registerBtn').addEventListener('click', async () => {
        const team = document.getElementById('regTeam').value.trim();
        const name = document.getElementById('regName').value.trim();
        const role = document.getElementById('regRole').value.trim();
        const password = document.getElementById('regPassword').value;
        const statusEl = document.getElementById('registerStatus');

        if (!team || !name || !role || !password) {
            statusEl.textContent = '모든 필드를 입력하세요.';
            statusEl.style.display = 'block';
            return;
        }

        if (!/^[0-9]{4}$/.test(password)) {
            statusEl.textContent = '비밀번호는 숫자 4자리여야 합니다.';
            statusEl.style.display = 'block';
            return;
        }

        statusEl.style.display = 'none';
        const btn = document.getElementById('registerBtn');
        btn.disabled = true;
        btn.textContent = '가입 중...';

        try {
            const hash = await sha256(password);
            const result = await App.apiCall({
                action: 'register',
                team: team,
                name: name,
                role: role,
                password: hash
            });

            if (result && result.status === 'success') {
                alert('회원가입이 완료되었습니다. 로그인해주세요.');
                showLoginBtn.click(); // 로그인 폼으로 이동
                
                // 로그인 폼에 이름 자동 입력
                document.getElementById('name').value = name;
                
                // 회원가입 폼 초기화
                document.getElementById('regTeam').value = '';
                document.getElementById('regName').value = '';
                document.getElementById('regRole').value = '';
                document.getElementById('regPassword').value = '';
            } else if (result) {
                statusEl.textContent = result.message || '가입 실패';
                statusEl.style.display = 'block';
            } else {
                statusEl.textContent = '서버 통신 오류 (GAS URL 설정을 확인하세요)';
                statusEl.style.display = 'block';
            }
        } catch (e) {
            statusEl.textContent = '오류 발생: ' + e.message;
            statusEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = '회원가입';
        }
    });

    // 엔터키 지원
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });
    document.getElementById('regPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('registerBtn').click();
    });
});
