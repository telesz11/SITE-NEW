# server.ps1
# Servidor Web local nativo em PowerShell para a Landing Page Cabelo Forte
# Executa sem dependências adicionais (sem necessidade de Node.js ou Python)

$port = 3500
$dbPath = Join-Path $PSScriptRoot "db.json"
$publicDir = Join-Path $PSScriptRoot "public"

# Inicializa o banco de dados JSON se ele não existir
if (-not (Test-Path $dbPath)) {
    $defaultDb = @{
        leads = @()
        sales = @()
        config = @{ productPrice = 37.90 }
    }
    $defaultDb | ConvertTo-Json -Depth 100 | Out-File -FilePath $dbPath -Encoding utf8
}

function Get-Db {
    $content = Get-Content -Path $dbPath -Raw -Encoding utf8
    return ConvertFrom-Json $content
}

function Save-Db($db) {
    $db | ConvertTo-Json -Depth 100 | Out-File -FilePath $dbPath -Encoding utf8
}

# Enviar evento de servidor para a API de Conversões da Meta (CAPI)
function Send-MetaEvent($eventName, $email, $name) {
    $pixelId = [System.Environment]::GetEnvironmentVariable("META_PIXEL_ID")
    if (-not $pixelId) { $pixelId = "3374358562732931" }
    $accessToken = [System.Environment]::GetEnvironmentVariable("META_ACCESS_TOKEN")
    
    if (-not $accessToken) {
        Write-Host "[Meta CAPI] Evento $eventName simulado localmente (Sem META_ACCESS_TOKEN configurado)." -ForegroundColor Yellow
        return
    }
    
    # Hashing SHA-256 para cumprir os requisitos de privacidade da Meta
    $hasher = [System.Security.Cryptography.HashAlgorithm]::Create("SHA256")
    
    $emailClean = $email.Trim().ToLower()
    $emailBytes = [System.Text.Encoding]::UTF8.GetBytes($emailClean)
    $emailHash = [System.BitConverter]::ToString($hasher.ComputeHash($emailBytes)).Replace("-", "").ToLower()
    
    $nameClean = $name.Trim().ToLower()
    $nameBytes = [System.Text.Encoding]::UTF8.GetBytes($nameClean)
    $nameHash = [System.BitConverter]::ToString($hasher.ComputeHash($nameBytes)).Replace("-", "").ToLower()
    
    $unixTime = [Math]::Floor([decimal](Get-Date -UFormat %s))
    
    $bodyObj = @{
        data = @(
            @{
                event_name = $eventName
                event_time = $unixTime
                event_source_url = "http://localhost:3500/"
                action_source = "website"
                user_data = @{
                    em = @($emailHash)
                    fn = @($nameHash)
                }
            }
        )
    }
    
    $json = $bodyObj | ConvertTo-Json -Depth 10
    
    try {
        $url = "https://graph.facebook.com/v17.0/$pixelId/events?access_token=$accessToken"
        $headers = @{ "Content-Type" = "application/json" }
        Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $json
        Write-Host "[Meta CAPI] Evento $eventName enviado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "[Meta CAPI] Erro ao enviar evento: $_" -ForegroundColor Red
    }
}

# Inicia o HttpListener do .NET
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host "🚀 Servidor Cabelo Forte rodando com sucesso!" -ForegroundColor Green
    Write-Host "👉 Landing Page: http://localhost:$port/" -ForegroundColor Cyan
    Write-Host "👉 Painel Admin: http://localhost:$port/admin" -ForegroundColor Cyan
    Write-Host "Dica: Mude o preço no painel admin para ver a mudança!" -ForegroundColor Yellow
    Write-Host "Pressione Ctrl+C nesta janela para parar o servidor." -ForegroundColor Red
    Write-Host "=================================================" -ForegroundColor Green
} catch {
    Write-Error "Falha ao iniciar o servidor na porta $port. Verifique se a porta já não está sendo usada."
    exit
}

# Monitoramento de requisições
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.RawUrl
        
        # Redirecionamento de rotas amigáveis
        if ($urlPath -eq "/" -or $urlPath -eq "") { $urlPath = "/index.html" }
        if ($urlPath -eq "/admin") { $urlPath = "/admin.html" }
        
        $method = $request.HttpMethod
        
        # ==========================================
        # ROTEAMENTO DE APIS
        # ==========================================
        if ($urlPath.StartsWith("/api/")) {
            $response.ContentType = "application/json; charset=utf-8"
            
            # Leitura do corpo da requisição (POST)
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            $db = Get-Db
            
            # Rota: GET /api/price
            if ($urlPath -eq "/api/price" -and $method -eq "GET") {
                $resData = @{ price = $db.config.productPrice }
                $json = $resData | ConvertTo-Json
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            # Rota: POST /api/leads
            elseif ($urlPath -eq "/api/leads" -and $method -eq "POST") {
                $leadReq = ConvertFrom-Json $body
                if (-not $leadReq.name -or -not $leadReq.email) {
                    $response.StatusCode = 400
                    $json = @{ error = "Nome e e-mail são obrigatórios" } | ConvertTo-Json
                } else {
                    $newLead = @{
                        id = "lead_" + (Get-Date -UFormat %s) + "_" + (Get-Random -Minimum 1000 -Maximum 9999)
                        name = $leadReq.name
                        email = $leadReq.email
                        createdAt = (Get-Date).ToString("o")
                    }
                    $db.leads = @($newLead) + $db.leads
                    Save-Db $db
                    
                    # Dispara evento da API de Conversões da Meta
                    Send-MetaEvent -eventName "Lead" -email $leadReq.email -name $leadReq.name
                    
                    $json = @{ message = "Lead capturado com sucesso!"; lead = $newLead } | ConvertTo-Json
                }
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            # Rota: POST /api/checkout
            elseif ($urlPath -eq "/api/checkout" -and $method -eq "POST") {
                $checkoutReq = ConvertFrom-Json $body
                if (-not $checkoutReq.name -or -not $checkoutReq.email -or -not $checkoutReq.phone -or -not $checkoutReq.method) {
                    $response.StatusCode = 400
                    $json = @{ error = "Todos os campos do checkout são obrigatórios" } | ConvertTo-Json
                } else {
                    $price = $db.config.productPrice
                    $user = $checkoutReq.email.Trim().ToLower()
                    $pass = "forte_" + (Get-Random -Minimum 1000 -Maximum 9999)
                    
                    $newSale = @{
                        id = "sale_" + (Get-Date -UFormat %s) + "_" + (Get-Random -Minimum 1000 -Maximum 9999)
                        name = $checkoutReq.name
                        email = $checkoutReq.email
                        phone = $checkoutReq.phone
                        method = $checkoutReq.method
                        amount = $price
                        status = if ($checkoutReq.method -eq "boleto") { "pendente" } else { "aprovado" }
                        accessUser = $user
                        accessPass = $pass
                        createdAt = (Get-Date).ToString("o")
                    }
                    $db.sales = @($newSale) + $db.sales
                    Save-Db $db
                    $json = @{
                        message = "Compra simulada processada com sucesso!"
                        sale = $newSale
                        access = @{
                            user = $user
                            pass = $pass
                            link = "https://membros.cabeloforte.com/login"
                        }
                    } | ConvertTo-Json -Depth 10
                }
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            # Rota: GET /api/admin/stats
            elseif ($urlPath -eq "/api/admin/stats" -and $method -eq "GET") {
                $sales = $db.sales
                $leads = $db.leads
                
                $totalRevenue = 0
                if ($sales) {
                    foreach ($sale in $sales) {
                        if ($sale.status -eq "aprovado") {
                            $totalRevenue += [double]$sale.amount
                        }
                    }
                }
                
                $resData = @{
                    totalRevenue = $totalRevenue
                    salesCount = if ($sales) { $sales.Count } else { 0 }
                    leadsCount = if ($leads) { $leads.Count } else { 0 }
                    productPrice = $db.config.productPrice
                    sales = $sales
                    leads = $leads
                }
                $json = $resData | ConvertTo-Json -Depth 10
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            # Rota: POST /api/admin/config
            elseif ($urlPath -eq "/api/admin/config" -and $method -eq "POST") {
                $configReq = ConvertFrom-Json $body
                $newPrice = [double]$configReq.productPrice
                if ($newPrice -le 0) {
                    $response.StatusCode = 400
                    $json = @{ error = "Preço inválido" } | ConvertTo-Json
                } else {
                    $db.config.productPrice = $newPrice
                    Save-Db $db
                    $json = @{ message = "Configuração atualizada com sucesso!"; config = $db.config } | ConvertTo-Json
                }
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            else {
                $response.StatusCode = 404
                $json = @{ error = "Rota não encontrada" } | ConvertTo-Json
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }
        # ==========================================
        # ROTEAMENTO DE ARQUIVOS ESTÁTICOS
        # ==========================================
        else {
            $filePath = Join-Path $publicDir $urlPath.Replace("/", "\")
            if (Test-Path $filePath -PathType Leaf) {
                # Identifica tipo de conteúdo pelo sufixo
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css" { "text/css; charset=utf-8" }
                    ".js" { "application/javascript; charset=utf-8" }
                    ".jpg" { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".png" { "image/png" }
                    ".webp" { "image/webp" }
                    ".svg" { "image/svg+xml" }
                    default { "application/octet-stream" }
                }
                $response.ContentType = $contentType
                
                # Envia o arquivo
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $response.ContentType = "text/plain; charset=utf-8"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("Arquivo não encontrado.")
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }
        $response.Close()
    } catch {
        # Ignora erros de encerramento prematuro de conexão do cliente
    }
}
