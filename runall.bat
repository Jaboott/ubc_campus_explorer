@echo off

REM Check if the first argument is "test"
if "%1"=="test" (
    echo Running yarn prettier:fix, yarn build, and yarn test...
    yarn prettier:fix && yarn build && yarn test
) else (
    echo Running yarn prettier:fix and yarn build...
    yarn prettier:fix && yarn build
)

REM Check if all commands were successful
if %errorlevel% neq 0 (
    echo One or more tasks failed.
    exit /b %errorlevel%
) else (
    echo All tasks completed successfully.
)
