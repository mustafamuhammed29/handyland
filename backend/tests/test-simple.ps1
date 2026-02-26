# Simple API Test
$base = "http://localhost:5000/api"

Write-Host "🧪 HandyLand API Test" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Test Admin Login
$login = @{email = "admin@handyland.com"; password = "admin123" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$base/auth/admin/login" -Method POST -Body $login -ContentType "application/json"
    Write-Host "✅ Admin Login: SUCCESS" -ForegroundColor Green
    Write-Host "👤 User: $($result.user.name)"  -ForegroundColor White
    Write-Host "🎭 Role: $($result.user.role)" -ForegroundColor White
}
catch {
    Write-Host "❌ Admin Login: FAILED" -ForegroundColor Red
}

Write-Host "`n🎉 Test Complete!" -ForegroundColor Green
