@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js，直接用浏览器打开 index.html 即可（功能完整，但演示数据可能不会跨重启保存）
  start "" "index.html"
  exit /b
)
if not exist "config.json" (
  echo [提示] 还没有 config.json，邮箱验证码将运行在「演示模式」（验证码直接显示在页面上）。
  echo        想真实发到邮箱：双击同目录下的「配置邮箱.cmd」，填好邮箱与授权码后重新运行本脚本。
  echo.
)
start "" "http://pinda.localhost:5173/"
node "server.js"
