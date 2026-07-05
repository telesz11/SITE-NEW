# deploy.ps1
# Script para fazer o upload do Cabelo Forte para o seu GitHub

$repoUrl = "https://github.com/telesz11/SITE-NEW.git"

Clear-Host
Write-Host "=================================================" -ForegroundColor Green
Write-Host "Preparando Upload para o GitHub..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 1. Localiza o executavel do Git
$gitPath = "git"
if (Test-Path "C:\Program Files\Git\cmd\git.exe") {
    $gitPath = "C:\Program Files\Git\cmd\git.exe"
}
elseif (Get-Command git -ErrorAction SilentlyContinue) {
    $gitPath = "git"
}
else {
    Write-Host "Git nao encontrado no seu sistema!" -ForegroundColor Red
    Write-Host "Por favor, instale o Git e tente novamente." -ForegroundColor Yellow
    exit
}

# 2. Inicializa o repositorio Git local se nao existir
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositorio Git local..." -ForegroundColor Cyan
    & $gitPath init
    & $gitPath branch -M main
}

# Configura dados basicos do Git caso nao estejam configurados (evita erro de commit)
$gitEmail = & $gitPath config user.email
if (-not $gitEmail) {
    & $gitPath config --global user.email "contato@cabeloforte.com"
}
$gitName = & $gitPath config user.name
if (-not $gitName) {
    & $gitPath config --global user.name "Cabelo Forte Deployer"
}

# 3. Adiciona o repositorio remoto (origin)
$currentRemote = & $gitPath remote get-url origin 2>$null
if (-not $currentRemote) {
    Write-Host "Conectando ao repositorio remoto: $repoUrl" -ForegroundColor Cyan
    & $gitPath remote add origin $repoUrl
} else {
    if ($currentRemote -ne $repoUrl) {
        Write-Host "Atualizando repositorio remoto para: $repoUrl" -ForegroundColor Cyan
        & $gitPath remote set-url origin $repoUrl
    }
}

# 4. Cria arquivo .gitignore para nao enviar arquivos desnecessarios
if (-not (Test-Path ".gitignore")) {
    Write-Host "Criando arquivo .gitignore..." -ForegroundColor Cyan
    "db.json`n.system_generated/`n*.log`nnode_modules/" | Out-File -FilePath .gitignore -Encoding utf8
}

# 5. Adiciona os arquivos e cria o Commit
Write-Host "Preparando arquivos..." -ForegroundColor Cyan
& $gitPath add .
Write-Host "Criando commit..." -ForegroundColor Cyan
& $gitPath commit -m "Upload Cabelo Forte Landing Page" 2>$null

# 6. Faz o Push para o GitHub
Write-Host "Enviando arquivos para o GitHub..." -ForegroundColor Green
Write-Host "Atencao: Se for a primeira vez, abrira uma janela no seu navegador para fazer o login no seu GitHub." -ForegroundColor Yellow

& $gitPath push -u origin main --force

Write-Host "=================================================" -ForegroundColor Green
Write-Host "Concluido com sucesso!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
