# ================================================================
# UNI-PLACE 팀원 로컬 환경 자동 세팅 스크립트
# 사용법: uni-place-frontend 폴더에서 PowerShell로 실행
#   .\setup.ps1
# ================================================================

$ErrorActionPreference = "Stop"
$frontendDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  UNI-PLACE 로컬 환경 자동 세팅 시작" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. npm install ──────────────────────────────────────────────
Write-Host "[1/4] npm 패키지 설치 중..." -ForegroundColor Yellow
Set-Location $frontendDir
npm install
if ($LASTEXITCODE -ne 0) { Write-Host " npm install 실패" -ForegroundColor Red; exit 1 }
Write-Host "   npm install 완료" -ForegroundColor Green
Write-Host ""

# ── 2. @vladmandic/face-api 설치 확인 ──────────────────────────
Write-Host "[2/4] face-api 패키지 확인 중..." -ForegroundColor Yellow
$faceApiPath = Join-Path $frontendDir "node_modules\@vladmandic\face-api"
if (-Not (Test-Path $faceApiPath)) {
    Write-Host "  face-api 패키지 설치 중..." -ForegroundColor Gray
    npm install @vladmandic/face-api
    if ($LASTEXITCODE -ne 0) { Write-Host " face-api 설치 실패" -ForegroundColor Red; exit 1 }
}
Write-Host "   face-api 패키지 확인 완료" -ForegroundColor Green
Write-Host ""

# ── 3. 모델 파일 다운로드 ────────────────────────────────────────
Write-Host "[3/4] 얼굴인식 모델 파일 다운로드 중..." -ForegroundColor Yellow
$modelsDir = Join-Path $frontendDir "public\models"
if (-Not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir | Out-Null
}

$base = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_tiny_model-weights_manifest.json",
    "face_landmark_68_tiny_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

foreach ($f in $files) {
    $outPath = Join-Path $modelsDir $f
    if (Test-Path $outPath) {
        Write-Host "  ⏭️  이미 존재: $f" -ForegroundColor Gray
        continue
    }
    try {
        Invoke-WebRequest "$base/$f" -OutFile $outPath -UseBasicParsing
        Write-Host "   $f" -ForegroundColor Green
    } catch {
        Write-Host "   실패: $f — 인터넷 연결 확인 후 재실행하세요" -ForegroundColor Red
    }
}
Write-Host ""

# ── 4. .env 파일 확인 ───────────────────────────────────────────
Write-Host "[4/4] .env 파일 확인 중..." -ForegroundColor Yellow
$backendEnv = Join-Path (Split-Path $frontendDir) "uni-place-backend\.env"
$aiEnv      = Join-Path (Split-Path $frontendDir) "AI\.env"

if (-Not (Test-Path $backendEnv)) {
    Write-Host "    백엔드 .env 파일이 없습니다: $backendEnv" -ForegroundColor Red
    Write-Host "     팀장에게 .env 파일을 요청하세요." -ForegroundColor Red
} else {
    Write-Host "   백엔드 .env 확인 완료" -ForegroundColor Green
}

if (-Not (Test-Path $aiEnv)) {
    Write-Host "    AI 서버 .env 파일이 없습니다: $aiEnv" -ForegroundColor Red
    Write-Host "     팀장에게 .env 파일을 요청하세요." -ForegroundColor Red
} else {
    Write-Host "   AI .env 확인 완료" -ForegroundColor Green
}
Write-Host ""

# ── 완료 ────────────────────────────────────────────────────────
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   프론트엔드 세팅 완료!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor White
Write-Host "  1. Docker Desktop 실행 → Milvus 시작 확인" -ForegroundColor White
Write-Host "  2. MySQL 실행 확인" -ForegroundColor White
Write-Host "  3. 백엔드 Eclipse에서 실행 (Spring Boot App)" -ForegroundColor White
Write-Host "  4. AI 서버: .venv 활성화 후 uvicorn 실행" -ForegroundColor White
Write-Host "  5. npm start" -ForegroundColor White
Write-Host ""
