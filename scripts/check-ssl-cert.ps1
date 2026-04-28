# SSL 证书检查脚本（使用 PowerShell 内置功能）

$domains = @("zhengyun.online", "www.zhengyun.online")
$email = "your-email@example.com"  # 请替换为你的邮箱
$logFile = "$PSScriptRoot\ssl-cert-check.log"

# 创建日志目录
if (!(Test-Path "$PSScriptRoot")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot" -Force
}

# 写入日志头部
"`n===== SSL 证书检查 - $(Get-Date) =====" | Out-File -Append -FilePath $logFile

foreach ($domain in $domains) {
    try {
        Write-Host "检查域名: $domain"
        "检查域名: $domain" | Out-File -Append -FilePath $logFile
        
        # 使用 PowerShell 的 WebRequest 获取证书信息
        $request = [System.Net.WebRequest]::Create("https://$domain")
        $request.Timeout = 10000  # 10秒超时
        
        try {
            $response = $request.GetResponse()
            $response.Close()
        } catch {
            # 忽略证书错误，继续获取证书信息
        }
        
        # 获取证书
        $servicePoint = [System.Net.ServicePointManager]::FindServicePoint("https://$domain")
        $certificate = $servicePoint.Certificate
        
        if ($certificate) {
            $expirationDate = $certificate.GetExpirationDateString()
            $currentDate = Get-Date
            
            # 解析过期日期
            $expDate = [DateTime]::Parse($expirationDate)
            $daysLeft = ($expDate - $currentDate).Days
            
            Write-Host "到期时间: $expirationDate"
            Write-Host "剩余天数: $daysLeft 天"
            
            "到期时间: $expirationDate" | Out-File -Append -FilePath $logFile
            "剩余天数: $daysLeft 天" | Out-File -Append -FilePath $logFile
            
            if ($daysLeft -le 30) {
                $warningMessage = "⚠️  警告：证书将在 $daysLeft 天后过期！"
                Write-Host $warningMessage -ForegroundColor Yellow
                $warningMessage | Out-File -Append -FilePath $logFile
                
                # 发送邮件提醒
                if ($email -ne "your-email@example.com") {
                    try {
                        $subject = "SSL 证书过期提醒"
                        $body = "SSL 证书即将过期：$domain 将在 $daysLeft 天后过期"
                        # 注意：需要配置 SMTP 服务器信息
                        # Send-MailMessage -From $email -To $email -Subject $subject -Body $body -SmtpServer "smtp.office365.com" -Port 587 -UseSsl -Credential (Get-Credential)
                        Write-Host "邮件提醒已准备发送（需要配置 SMTP 服务器）" -ForegroundColor Green
                        "邮件提醒已准备发送（需要配置 SMTP 服务器）" | Out-File -Append -FilePath $logFile
                    } catch {
                        Write-Host "邮件发送失败: $($_.Exception.Message)" -ForegroundColor Red
                        "邮件发送失败: $($_.Exception.Message)" | Out-File -Append -FilePath $logFile
                    }
                }
            }
        } else {
            Write-Host "无法获取证书信息" -ForegroundColor Red
            "无法获取证书信息" | Out-File -Append -FilePath $logFile
        }
    } catch {
        Write-Host "检查失败: $($_.Exception.Message)" -ForegroundColor Red
        "检查失败: $($_.Exception.Message)" | Out-File -Append -FilePath $logFile
    }
    Write-Host "---"
    "---" | Out-File -Append -FilePath $logFile
}

Write-Host "检查完成，日志已保存到: $logFile"
"检查完成" | Out-File -Append -FilePath $logFile
