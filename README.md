# PC ON/OFF 모니터링 시스템

Windows PC의 부팅 시간과 종료 시간을 자동으로 기록·관리하는 근태 보조 시스템입니다.  
기관 단위로 쉽게 설치하고 운영할 수 있습니다.

---

## 📋 시스템 구성

| 구성 요소 | 설명 |
|-----------|------|
| **웹 프론트엔드** | GitHub Pages로 호스팅되는 로그인/대시보드/관리자 페이지 |
| **백엔드 (GAS)** | Google Apps Script + Google Sheets (데이터 저장소) |
| **데스크톱 앱** | Electron 기반 Windows 앱 (PC ON/OFF 자동 감지) |

---

## 🚀 기관 설치 가이드 (5단계)

### Step 1. GitHub 저장소 준비

1. 이 저장소를 **Fork** 합니다 (또는 ZIP 다운로드 후 자체 저장소에 업로드)
2. Fork한 저장소의 **Settings → Pages**로 이동
3. **Source**: `Deploy from a branch`  
4. **Branch**: `main`, 폴더: `/ (root)` 선택 후 **Save**
5. 몇 분 후 `https://아이디.github.io/저장소명/` 주소가 활성화됩니다

### Step 2. Google Apps Script (백엔드) 설정

1. [Google Drive](https://drive.google.com)에서 **새 Google 스프레드시트** 생성
2. 상단 메뉴 → **확장 프로그램 → Apps Script** 클릭
3. 이 저장소의 `backend/Code.gs` 내용을 복사하여 Apps Script 에디터에 붙여넣기
4. **배포 → 새 배포** 클릭
5. 유형 선택 톱니바퀴 → **웹 앱** 선택
6. **액세스 권한이 있는 사용자**: `모든 사용자` 선택 ⚠️ (매우 중요!)
7. **배포** 클릭 → 나타나는 **웹 앱 URL** 복사

### Step 3. 관리자 초기 설정

1. GitHub Pages 주소로 접속 (예: `https://아이디.github.io/저장소명/`)
2. **관리자 로그인** 탭 클릭
3. 초기 비밀번호 `1234` 입력 후 로그인
4. **서버 설정** 탭에서:
   - Step 2에서 복사한 **GAS 웹앱 URL** 붙여넣기 → **저장** → **연동 테스트**
   - **기관명** 입력 (예: "○○복지관") → **저장**
   - 필요 시 **직인 이미지** 업로드
5. **비밀번호 변경** 버튼으로 관리자 비밀번호 변경 (보안 필수!)

### Step 4. 직원 배포

관리자 대시보드의 **서버 설정** 탭 하단에서:

- **배포 링크 복사**: 직원에게 URL 공유 (클릭 시 자동으로 기관 서버 연동)
- **QR 코드**: 모바일/태블릿에서 스캔하여 접속 가능

직원은 해당 링크로 접속 → **직원 등록** → **로그인**하면 바로 사용 가능합니다.

### Step 5. (선택) 데스크톱 앱 설치

PC 전원 ON/OFF를 자동으로 감지하려면 데스크톱 앱을 설치합니다:

1. GitHub 저장소의 **Actions** 탭에서 최신 빌드의 **Setup 파일** 다운로드
2. 각 직원 PC에 설치
3. 앱 실행 후 **자신의 이름** 입력 → **저장**
4. 이후 PC 부팅/종료 시 자동으로 출퇴근 시간이 기록됩니다

> 💡 데스크톱 앱은 시스템 트레이에서 백그라운드 실행되며, Windows 시작 시 자동 실행됩니다.

---

## 🔑 계정 정보

| 구분 | 아이디 | 초기 비밀번호 |
|------|--------|---------------|
| 관리자 | admin | 1234 |
| 직원 | (직접 등록) | 숫자 4자리 |

> ⚠️ **관리자 비밀번호는 반드시 변경하세요!**

---

## 📁 프로젝트 구조

```
pcmonitering/
├── index.html          # 로그인 페이지
├── employee.html       # 직원 근태 확인
├── dashboard.html      # 직원 대시보드 (PC ON/OFF 기록)
├── admin.html          # 관리자 대시보드
├── js/
│   ├── app.js          # 핵심 앱 모듈 (GAS URL 관리, API)
│   ├── config.js       # 설정 (동적 GAS URL)
│   ├── crypto.js       # SHA-256 해시 (비밀번호 암호화)
│   └── main.js         # 대시보드 로직 (출퇴근 기록)
├── css/
│   └── style.css       # 글로벌 스타일
├── backend/
│   └── Code.gs         # Google Apps Script 백엔드
├── desktop-app/        # Electron 데스크톱 앱
│   ├── main.js         # 메인 프로세스 (PC ON/OFF 감지)
│   ├── renderer.js     # 렌더러 프로세스
│   ├── index.html      # 앱 설정 UI
│   └── package.json    # 빌드 설정
└── .github/
    └── workflows/
        └── build-electron.yml  # GitHub Actions 빌드
```

---

## 🔧 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript (Vanilla)
- **백엔드**: Google Apps Script + Google Sheets
- **데스크톱 앱**: Electron
- **배포**: GitHub Pages + GitHub Actions
- **PC 모니터링**: Windows Event Log (wevtutil), PowerShell, Heartbeat

---

## 📝 상세 설정 가이드

기관 IT 담당자를 위한 상세 설정 가이드는 [SETUP_GUIDE.md](SETUP_GUIDE.md)를 참고하세요.
