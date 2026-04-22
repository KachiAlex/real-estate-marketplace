# Firestore → PostgreSQL Migration Plan

## Overview
Migrating entire application from Firebase (Firestore + Auth) to PostgreSQL on Render with JWT-based authentication.

## Firestore Collections to Migrate

### Core Collections:
1. **users** - User accounts & profiles
2. **properties** - Real estate listings
3. **escrowTransactions** - Escrow management
4. **investments** - Investment opportunities
5. **userInvestments** - User investment records
6. **mortgageBanks** - Mortgage bank profiles
7. **mortgageApplications** - Mortgage applications
8. **mortgages** - Active mortgages
9. **blog** - Blog posts
10. **supportInquiries** - Support tickets
11. **verificationApplications** - Property verification
12. **messages** - User messages
13. **notifications** - User notifications
14. **savedProperties** - User favorites
15. **propertyInquiries** - Property inquiry requests
16. **propertyAlerts** - Property alert subscriptions
17. **disputeResolutions** - Dispute records
18. **inspectionRequests** - Property inspections

## Migration Phases

### Phase 1: Database Setup (30 mins)
- [ ] Create PostgreSQL database on Render
- [ ] Design relational schema
- [ ] Install required dependencies (Sequelize/Prisma)

### Phase 2: Backend Changes (4-6 hours)
- [ ] Replace Firestore imports with PostgreSQL
- [ ] Create database models for all collections
- [ ] Implement JWT authentication
- [ ] Update all API routes
- [ ] Data migration scripts

### Phase 3: Frontend Changes (2-3 hours)
- [ ] Replace Firebase Auth with JWT/custom auth
- [ ] Update API calls (already using getApiUrl, minimal changes needed)
- [ ] Test authentication flows

### Phase 4: Testing & Deployment (1-2 hours)
- [ ] Run migration script
- [ ] Test all features
- [ ] Deploy to Render

## Estimated Total Time: 8-12 hours

---

## Next Steps:
1. Create PostgreSQL database
2. Design & generate schema
3. Create Sequelize models
4. Build migration scripts
5. Update authentication system
6. Deploy & test

**Continue? (y/n)**
