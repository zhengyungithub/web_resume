@echo off

rem 运行 SSL 证书检查脚本
powershell -ExecutionPolicy Bypass -File "%~dp0check-ssl-cert.ps1"

rem 暂停以便查看输出
pause
