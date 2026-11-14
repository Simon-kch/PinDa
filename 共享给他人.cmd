@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   PinDa · 临时公网分享
echo   ────────────────────────────────────────────────
echo   这个脚本通过 localhost.run 建立一条公网隧道，
echo   任何设备（不用连同一个 Wi-Fi）都能打开得到的 https 链接。
echo.
echo   前提：先双击「启动本地预览.cmd」把本站跑起来。
echo   保持本窗口开着 —— 关掉窗口或按 Ctrl+C，链接立即失效。
echo.
echo   注意：链接是公开的，知道链接的人都能访问本站（验证码接口带限流：
echo   每 IP 每小时上限、每邮箱每天上限、全站每天上限）。演示结束记得关掉本窗口。
echo.
pause
echo 正在建立隧道…（首次连接需要几十秒，成功后会打印 https 链接）
echo.
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:5173 nokey@localhost.run
echo.
echo 隧道已断开。
pause
