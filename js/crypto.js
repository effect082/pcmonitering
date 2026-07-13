// SHA-256 해시 함수 (비밀번호 암호화용)
// 브라우저 Web Crypto API 사용
window.sha256 = async function(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
