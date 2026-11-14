@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js，无法运行配置向导。
  echo 请先安装 Node.js（https://nodejs.org），或手动复制 config.example.json 为 config.json 后再启动网站。
  pause
  exit /b 1
)
node "配置邮箱.js"
echo.
pause
