# SSL Certificate Checker Script

$domains = @("zhengyun.online", "www.zhengyun.online")
$logFile = "$PSScriptRoot\ssl-check.log"

# Create log directory if it doesn't exist
if (!(Test-Path "$PSScriptRoot")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot" -Force
}

# Write log header
"`n===== SSL Certificate Check - $(Get-Date) =====" | Out-File -Append -FilePath $logFile

foreach ($domain in $domains) {
    try {
        Write-Host "Checking domain: $domain"
        "Checking domain: $domain" | Out-File -Append -FilePath $logFile
        
        # Create web request
        $request = [System.Net.WebRequest]::Create("https://$domain")
        $request.Timeout = 10000
        
        try {
            $response = $request.GetResponse()
            $response.Close()
        } catch {
            # Ignore errors
        }
        
        # Get certificate
        $servicePoint = [System.Net.ServicePointManager]::FindServicePoint("https://$domain")
        $cert = $servicePoint.Certificate
        
        if ($cert) {
            $expDate = $cert.GetExpirationDateString()
            $currentDate = Get-Date
            $expDateTime = [DateTime]::Parse($expDate)
            $daysLeft = ($expDateTime - $currentDate).Days
            
            Write-Host "Expiration date: $expDate"
            Write-Host "Days left: $daysLeft days"
            
            "Expiration date: $expDate" | Out-File -Append -FilePath $logFile
            "Days left: $daysLeft days" | Out-File -Append -FilePath $logFile
            
            if ($daysLeft -le 30) {
                $warning = "WARNING: Certificate will expire in $daysLeft days!"
                Write-Host $warning -ForegroundColor Yellow
                $warning | Out-File -Append -FilePath $logFile
            }
        } else {
            Write-Host "Cannot get certificate information" -ForegroundColor Red
            "Cannot get certificate information" | Out-File -Append -FilePath $logFile
        }
    } catch {
        Write-Host "Check failed: $($_.Exception.Message)" -ForegroundColor Red
        "Check failed: $($_.Exception.Message)" | Out-File -Append -FilePath $logFile
    }
    Write-Host "---"
    "---" | Out-File -Append -FilePath $logFile
}

Write-Host "Check completed, log saved to: $logFile"
"Check completed" | Out-File -Append -FilePath $logFile
