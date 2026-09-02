# Operations Guide

## Monitoring

### Uptime Monitoring
- Service: [e.g., UptimeRobot, Pingdom, or Render native]
- URL: `https://handyland.de/api/health`
- Check interval: 5 minutes
- Alert threshold: 2 consecutive failures

### Error Tracking
- Service: [e.g., Sentry, LogRocket]
- Integration: `backend/app.js` error handlers
- Alert threshold: 10 errors per hour

### Performance Monitoring
- Service: [e.g., New Relic, Datadog]
- Metrics tracked:
  - API response time (p95 < 500ms)
  - Database query time (p95 < 100ms)
  - Error rate (< 1%)

### Log Aggregation
- Service: [e.g., Papertrail, Logtail]
- Retention: 30 days
- Search: Real-time

***

## Backup Strategy

### Database Backups
- Provider: Supabase (automatic)
- Frequency: Daily
- Retention: 7 days
- Manual backup command:
  ```bash
  supabase db dump --file backup_$(date +%Y%m%d).sql
  ```

### File Storage Backups
- Provider: Supabase Storage
- Frequency: Weekly
- Retention: 30 days
- Manual backup:
  ```bash
  supabase storage download --recursive backup/
  ```

### Environment Variables Backup
- Location: [Secure password manager, e.g., 1Password]
- Update: After every rotation
- Access: Limited to ops team

***

## Rollback Plan

### When to Rollback
- Critical bug in production
- Security vulnerability discovered
- Performance degradation > 50%
- Data corruption detected

### Rollback Steps

1. **Identify the issue**
   ```bash
   git log --oneline -10
   # Identify last good commit
   ```

2. **Stop deployment (if in progress)**
   - Render Dashboard → Deployments → Cancel

3. **Revert to last known good version**
   ```bash
   git checkout <last-good-commit>
   git push origin main --force
   ```

4. **Trigger redeployment**
   - Render will auto-deploy from reverted commit

5. **Verify rollback**
   ```bash
   curl https://handyland.de/api/health
   # Check all critical endpoints
   ```

6. **Communicate**
   - Notify team
   - Update status page (if applicable)

### Rollback Time Target
- Detection: < 5 minutes
- Decision: < 10 minutes
- Execution: < 15 minutes
- Total: < 30 minutes

***

## Incident Response

### Severity Levels

**P0 - Critical**
- Site down
- Data breach
- Payment failures
- Response time: Immediate (< 15 min)

**P1 - High**
- Major feature broken
- Performance degradation > 50%
- Response time: < 1 hour

**P2 - Medium**
- Minor feature broken
- Non-critical bugs
- Response time: < 24 hours

**P3 - Low**
- Cosmetic issues
- Feature requests
- Response time: Next sprint

### Incident Response Process

1. **Detect**
   - Monitoring alerts
   - User reports
   - Team discovery

2. **Triage**
   - Assess severity
   - Identify affected systems
   - Assign responder

3. **Communicate**
   - Notify team (Slack/Teams)
   - Update status page (if applicable)
   - Set expectations

4. **Diagnose**
   - Check logs
   - Reproduce issue
   - Identify root cause

5. **Fix**
   - Implement fix
   - Test in staging
   - Deploy to production

6. **Verify**
   - Monitor metrics
   - Check user reports
   - Confirm resolution

7. **Document**
   - Write incident report
   - Update runbooks
   - Add monitoring gaps

### Incident Report Template
```markdown
# Incident Report: [Date] - [Brief Description]

## Summary
- Severity: P0/P1/P2/P3
- Duration: X minutes/hours
- Affected systems: [List]

## Timeline
- [Time] - Issue detected
- [Time] - Team notified
- [Time] - Root cause identified
- [Time] - Fix deployed
- [Time] - Issue resolved

## Root Cause
[Description]

## Resolution
[Description]

## Prevention
- [Action 1]
- [Action 2]
- [Action 3]
```

***

## Scaling Strategy

### Current Capacity
- Backend: Render Standard ($7/mo)
- Database: Supabase Pro ($25/mo)
- Frontend: Vercel Pro ($20/mo)
- Expected load: X concurrent users

### Scaling Triggers
- CPU > 80% for 10 minutes
- Memory > 80% for 10 minutes
- Response time p95 > 1s
- Error rate > 5%

### Scaling Actions
1. **Vertical scaling** (first line)
   - Upgrade Render plan
   - Upgrade Supabase plan

2. **Horizontal scaling** (if needed)
   - Add more backend instances
   - Enable database read replicas

3. **Caching** (optimization)
   - Redis for session storage
   - CDN for static assets
   - Database query caching

***

## Maintenance Windows

### Scheduled Maintenance
- Frequency: Monthly (first Sunday, 2-4 AM UTC)
- Duration: 2 hours max
- Notification: 48 hours in advance

### Maintenance Checklist
- [ ] Notify users (email/in-app)
- [ ] Update status page
- [ ] Backup database
- [ ] Deploy updates
- [ ] Run smoke tests
- [ ] Monitor for 1 hour
- [ ] Confirm resolution
- [ ] Close maintenance window

***

## Contact Information

### On-Call Rotation
- Primary: [Name/Email/Phone]
- Secondary: [Name/Email/Phone]
- Escalation: [Name/Email/Phone]

### Emergency Contacts
- DevOps: [Contact]
- Database: [Contact]
- Payment provider: [Contact]
- Hosting: [Contact]
```
