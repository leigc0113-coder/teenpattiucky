@echo off
chcp 65001 > nul
echo ========================================
echo  Teen Patti Lucky Bot - 定时任务调度
echo ========================================
echo.

if "%~1"=="" goto :MENU
if "%~1"=="vip" goto :VIP
if "%~1"=="pool" goto :POOL
if "%~1"=="draw" goto :DRAW
if "%~1"=="cooling" goto :COOLING
if "%~1"=="reset" goto :RESET
if "%~1"=="test" goto :TEST
goto :MENU

:MENU
echo 请选择要执行的任务：
echo.
echo  [1] VIP资格检查       (每天 00:00)
echo  [2] 冷静期释放        (每天 00:00)
echo  [3] 奖池计算          (每天 20:30)
echo  [4] 开奖              (每天 21:00)
echo  [5] VIP过期检查       (每天 23:59)
echo  [6] 运行测试
echo  [0] 退出
echo.
set /p choice="请输入数字 (0-6): "

if "%choice%"=="1" goto :VIP
if "%choice%"=="2" goto :COOLING
if "%choice%"=="3" goto :POOL
if "%choice%"=="4" goto :DRAW
if "%choice%"=="5" goto :RESET
if "%choice%"=="6" goto :TEST
if "%choice%"=="0" goto :EXIT
goto :MENU

:VIP
echo.
echo [VIP资格检查] 正在执行...
node cronJobs.js vip
pause
goto :MENU

:COOLING
echo.
echo [冷静期释放] 正在执行...
node cronJobs.js cooling
pause
goto :MENU

:POOL
echo.
echo [奖池计算] 正在执行...
node cronJobs.js pool
pause
goto :MENU

:DRAW
echo.
echo [开奖] 正在执行...
node cronJobs.js draw
pause
goto :MENU

:RESET
echo.
echo [VIP过期检查] 正在执行...
node cronJobs.js reset-vip
pause
goto :MENU

:TEST
echo.
echo [运行测试] 正在执行...
node test.js
pause
goto :MENU

:EXIT
echo.
echo 再见！
exit /b
