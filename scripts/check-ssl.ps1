# SSL 证书检查脚本

$domains = @("zhengyun.online", "www.zhengyun.online")
$logFile = "$PSScriptRoot\ssl-check.log"

# 创建日志目录
if (!(Test-Path "$PSScriptRoot")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot" -Force
}

# 写入日志头部
"`n===== SSL 证书检查 - $(Get-Date) =====" | Out-File -Append -FilePath $logFile -Encoding UTF8

foreach ($domain in $domains) {
    try {
        Write-Host "检查域名: $domain"
        "检查域名: $domain" | Out-File -Append -FilePath $logFile -Encoding UTF8
        
        # 创建 Web 请求
        $request = [System.Net.WebRequest]::Create("https://$domain")
        $request.Timeout = 10000
        
        try {
            $response = $request.GetResponse()
            $response.Close()
        } catch {
            # 忽略错误
        }
        
        # 获取证书
        $servicePoint = [System.Net.ServicePointManager]::FindServicePoint("https://$domain")
        $cert = $servicePoint.Certificate
        
        if ($cert) {
            $expDate = $cert.GetExpirationDateString()
            $currentDate = Get-Date
            $expDateTime = [DateTime]::Parse($expDate)
            $daysLeft = ($expDateTime - $currentDate).Days
            
            Write-Host "到期时间: $expDate"
            Write-Host "剩余天数: $daysLeft 天"
            
            "到期时间: $expDate" | Out-File -Append -FilePath $logFile -Encoding UTF8
            "剩余天数: $daysLeft 天" | Out-File -Append -FilePath $logFile -Encoding UTF8
            
            if ($daysLeft -le 30) {
                $warning = "⚠️  警告：证书将在 $daysLeft 天后过期！"
                Write-Host $warning -ForegroundColor Yellow
                $warning | Out-File -Append -FilePath $logFile -Encoding UTF8
            }
        } else {
            Write-Host "无法获取证书信息" -ForegroundColor Red
            "无法获取证书信息" | Out-File -Append -FilePath $logFile -Encoding UTF8
        }
    } catch {
        Write-Host "检查失败: $($_.Exception.Message)" -ForegroundColor Red
        "检查失败: $($_.Exception.Message)" | Out-File -Append -FilePath $logFile -Encoding UTF8
    }
    Write-Host "---"
    "---" | Out-File -Append -FilePath $logFile -Encoding UTF8
}

Write-Host "检查完成，日志已保存到: $logFile"
"检查完成" | Out-File -Append -FilePath $logFile -Encoding UTF8
