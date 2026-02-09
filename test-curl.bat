@echo off
echo 🧪 Comprehensive API Testing with curl
echo ═══════════════════════════════════════
echo.

set API_BASE=http://localhost:5001/api
set PASSED=0
set FAILED=0

echo 📋 PUBLIC ENDPOINTS
echo ─────────────────────────────────────

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/health > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Health Check - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Health Check - FAIL (Status: %STATUS%)
    set /a FAILED+=1
)

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/status > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Server Status - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Server Status - FAIL (Status: %STATUS%)
    set /a FAILED+=1
)

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/plans > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Get Plans - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Get Plans - FAIL (Status: %STATUS%)
    set /a FAILED+=1
)

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/testimonials > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="200" (
    echo ✅ Get Testimonials - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Get Testimonials - FAIL (Status: %STATUS%)
    set /a FAILED+=1
)

echo.
echo 🔐 AUTHENTICATED ENDPOINTS (Should return 401)
echo ─────────────────────────────────────

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/users/me > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="401" (
    echo ✅ Get Current User (No Auth) - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Get Current User (No Auth) - FAIL (Expected: 401, Got: %STATUS%)
    set /a FAILED+=1
)

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/users > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="401" (
    echo ✅ Get All Users (No Auth) - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Get All Users (No Auth) - FAIL (Expected: 401, Got: %STATUS%)
    set /a FAILED+=1
)

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/mylist > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="401" (
    echo ✅ Get My List (No Auth) - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Get My List (No Auth) - FAIL (Expected: 401, Got: %STATUS%)
    set /a FAILED+=1
)

echo.
echo 🔍 ERROR HANDLING
echo ─────────────────────────────────────

curl -s -o nul -w "%%{http_code}" -X GET %API_BASE%/nonexistent > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="404" (
    echo ✅ Non-existent Route - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Non-existent Route - FAIL (Expected: 404, Got: %STATUS%)
    set /a FAILED+=1
)

curl -s -o nul -w "%%{http_code}" -X POST -H "Content-Type: application/json" -d "not valid json" %API_BASE%/data > temp.txt
set /p STATUS=<temp.txt
if "%STATUS%"=="400" (
    echo ✅ Invalid JSON - PASS (Status: %STATUS%)
    set /a PASSED+=1
) else (
    echo ❌ Invalid JSON - FAIL (Expected: 400, Got: %STATUS%)
    set /a FAILED+=1
)

echo.
echo ═══════════════════════════════════════
echo 📊 TEST RESULTS
echo ═══════════════════════════════════════
set /a TOTAL=%PASSED%+%FAILED%
echo Total Tests:  %TOTAL%
echo Passed:       %PASSED% ✅
echo Failed:       %FAILED% ❌
echo ═══════════════════════════════════════

if %FAILED%==0 (
    echo.
    echo 🎉 All tests passed!
) else (
    echo.
    echo ⚠️  Some tests failed. Review the results above.
)

del temp.txt
