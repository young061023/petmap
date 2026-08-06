# PetMap 개발 환경 이전 가이드

다른 컴퓨터에서 지금과 똑같은 상태로 작업을 이어가기 위한 절차. (2026-08-06 기준)

## 1. 새 컴퓨터에 필요한 것

- **Node.js v24 이상** (현재 작업 환경: `v24.14.0`, npm `11.9.0`)
- **Git**
- **Xcode (전체 앱, Command Line Tools 아님)** — iOS 실기기/시뮬레이터 빌드용
  - Mac App Store 또는 https://developer.apple.com/download/all (무료 Apple ID 로그인만 필요, 유료 계정 불필요)
  - 설치 후 CocoaPods도 필요: `sudo gem install cocoapods` 또는 `brew install cocoapods`
- **Android Studio + Android SDK** — 안드로이드 기기로 테스트할 경우에만 필요 (아이폰만 쓸 거면 생략 가능)

> 이 프로젝트는 어떤 단계에서도 유료 서비스를 쓰지 않는다는 원칙이 있음. 위 항목은 전부 무료.

## 2. 코드 옮기기

현재 이 프로젝트는 **git 커밋이 하나도 없고 원격 저장소도 없는 상태**. 아래 둘 중 하나로 옮기면 됨.

### 방법 A — GitHub 사용 (권장)

원래 컴퓨터에서:
```bash
git add .
git commit -m "initial scaffold"
```
GitHub에 **private** 저장소 생성 후(무료):
```bash
git remote add origin <저장소 URL>
git push -u origin master
```

새 컴퓨터에서:
```bash
git clone <저장소 URL>
```

### 방법 B — 폴더 통째로 복사 (AirDrop / USB / 클라우드 드라이브)

`node_modules/`, `android/`, `.expo/` 폴더는 **복사하지 말 것** (용량만 크고 새 컴퓨터에서 다시 생성됨). `.env` 파일은 실제 Supabase 키가 채워지면 git에 올라가지 않으므로 **직접 챙겨서 옮겨야** 함 (현재는 플레이스홀더 값이라 안 옮겨도 무방).

## 3. 새 컴퓨터에서 설치 및 실행

```bash
cd petmap
npm install
```

`.env` 파일이 없다면 `.env.example`을 복사해서 만들기:
```bash
cp .env.example .env
```
(Supabase 프로젝트 URL/anon key가 실제로 있다면 여기에 채워 넣기. 없으면 지금 상태 그대로도 앱은 켜짐 — 아직 Supabase 연동 로직 자체가 구현 전이라 값이 placeholder여도 무방.)

실행:
```bash
npm run start      # Expo 개발 서버
npm run web         # 웹 (참고용 — MapLibre 네이티브 모듈 때문에 지도 탭은 웹에서 번들링 실패함, 의도된 제약)
```

## 4. 아이폰 실기기에서 확인하기

MapLibre가 네이티브 모듈이라 **Expo Go 앱으로는 절대 안 뜸**. dev-client를 직접 빌드해서 설치해야 함.

1. 아이폰을 케이블로 Mac에 연결
2. 아이폰에서 개발자 모드 켜기: 설정 > 개인정보 보호 및 보안 > 개발자 모드
3. Mac에서:
   ```bash
   npx expo run:ios --device
   ```
   빌드 중 Xcode가 요구하는 서명(Signing)은 무료 Apple ID로 진행 (Xcode > Settings > Accounts에서 Apple ID 추가 후 프로젝트에서 Team 선택)
4. 아이폰에서 "신뢰할 수 없는 개발자" 경고가 뜨면: 설정 > 일반 > VPN 및 기기 관리 > 개발자 앱 신뢰

> 무료 Apple ID로 서명한 앱은 **7일마다 재설치**해야 계속 실행됨 (유료 개발자 계정이 없어서 생기는 제약이며 비용은 안 듦).

## 5. 안드로이드 실기기에서 확인하기 (선택)

```bash
npm run android
```
USB 디버깅 켠 안드로이드 기기 연결 후 실행하면 됨. iOS보다 별도 서명 절차 없이 간단함.

## 6. 현재 구현 상태 (참고용)

- **지도 탭** (`app/(tabs)/index.tsx`) — 위치 권한 요청, 현재 위치 표시, MapLibre + OpenFreeMap `liberty` 스타일 3D 건물(pitch=60) 렌더링까지 동작. 산책 기록/경로 그리기 등은 미구현.
- **기록/미션/마이페이지 탭** — 전부 `TODO` placeholder만 있는 빈 화면.
- **Supabase 연동** (`src/services/supabase.ts`) — 클라이언트 초기화만 있고 실제 로그인/DB 쿼리 로직 없음.
- **상태관리** (`src/store/useMapStore.ts`, `useUserStore.ts`) — 최소 필드만 있는 스켈레톤.
