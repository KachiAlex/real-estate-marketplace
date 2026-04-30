# Phase 4.1: Admin Analytics Dashboard API Documentation

## Overview

The Admin Analytics Dashboard provides comprehensive insights into marketplace performance, user behavior, financial metrics, and dispute resolution. All endpoints are admin-only and require proper authentication and authorization.

## Base URL

```
/api/admin/analytics
```

## Authentication

All endpoints require:
- Valid JWT token in `Authorization` header
- Admin role (verified by `requireAdmin` middleware)

```bash
curl -X GET http://localhost:5000/api/admin/analytics/overview \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

---

## Endpoints

### 1. Dashboard Overview

**Endpoint:** `GET /api/admin/analytics/overview`

**Authentication:** Required (Admin)

**Description:** Get high-level dashboard metrics including user count, active listings, transactions, revenue, and system health.

**Request:**
```bash
curl -X GET http://localhost:5000/api/admin/analytics/overview \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 420,
      "activeUsers": 315,
      "totalProperties": 1250,
      "activeListings": 950,
      "totalTransactions": 3500,
      "completedThisMonth": 287,
      "totalRevenue": 5000000,
      "monthlyRevenue": 425000,
      "averageTransactionValue": 1428.57,
      "pendingDisputes": 12,
      "userGrowthRate": 8.5
    },
    "lastUpdated": "2026-03-18T10:30:00Z",
    "period": "current"
  }
}
```

---

### 2. Transaction Analytics

**Endpoint:** `GET /api/admin/analytics/transactions`

**Authentication:** Required (Admin)

**Query Parameters:**
- `period` (optional) - 'day', 'week', 'month', 'year' (default: 'month')
- `status` (optional) - Filter by transaction status ('completed', 'pending', 'failed')

**Description:** Get detailed transaction analytics including volume, amount, trends, and breakdown by payment method.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/analytics/transactions?period=month&status=completed" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-02-18T00:00:00Z",
      "end": "2026-03-18T23:59:59Z"
    },
    "totalCount": 287,
    "totalAmount": 425000,
    "averageAmount": 1481.52,
    "byStatus": {
      "completed": 287,
      "pending": 5,
      "failed": 2
    },
    "byDay": {
      "2026-03-18": 42500,
      "2026-03-17": 38900,
      "2026-03-16": 45200
    },
    "byPaymentMethod": {
      "card": 215,
      "bank": 67,
      "wallet": 5
    },
    "trends": {
      "increasing": true,
      "percentChange": 12.5
    }
  }
}
```

---

### 3. User Analytics

**Endpoint:** `GET /api/admin/analytics/users`

**Authentication:** Required (Admin)

**Query Parameters:**
- `period` (optional) - 'day', 'week', 'month', 'year' (default: 'month')

**Description:** Get user growth, engagement, and demographic analytics.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/analytics/users?period=month" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-02-18T00:00:00Z",
      "end": "2026-03-18T23:59:59Z"
    },
    "newUsers": 38,
    "activeUsers": 315,
    "totalUsers": 420,
    "byRole": {
      "vendor": 145,
      "buyer": 265,
      "admin": 10
    },
    "byVerificationStatus": {
      "verified": 350,
      "unverified": 50,
      "pending": 20
    },
    "churnRate": 2.1,
    "growthTrend": {
      "direction": "up",
      "percentage": 10.2
    }
  }
}
```

---

### 4. Property Analytics

**Endpoint:** `GET /api/admin/analytics/properties`

**Authentication:** Required (Admin)

**Query Parameters:**
- `period` (optional) - 'day', 'week', 'month', 'year' (default: 'month')

**Description:** Get property listing analytics, market trends, and location insights.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/analytics/properties?period=month" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-02-18T00:00:00Z",
      "end": "2026-03-18T23:59:59Z"
    },
    "newListings": 124,
    "totalListings": 1250,
    "activeListings": 950,
    "soldListings": 125,
    "averageListingPrice": 425000,
    "priceRange": {
      "min": 150000,
      "max": 2500000
    },
    "byPropertyType": {
      "apartment": 425,
      "house": 520,
      "condo": 305
    },
    "byLocation": {
      "New York": 450,
      "Los Angeles": 380,
      "Chicago": 320
    },
    "averageDaysToSell": 45,
    "topLocations": [
      "New York",
      "Los Angeles",
      "Chicago"
    ]
  }
}
```

---

### 5. Revenue Analytics

**Endpoint:** `GET /api/admin/analytics/revenue`

**Authentication:** Required (Admin)

**Query Parameters:**
- `period` (optional) - 'day', 'week', 'month', 'year' (default: 'month')

**Description:** Get financial metrics including platform fees, vendor payouts, and revenue trends.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/analytics/revenue?period=month" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-02-18T00:00:00Z",
      "end": "2026-03-18T23:59:59Z"
    },
    "totalRevenue": 425000,
    "totalTransactions": 287,
    "platformFee": 21250,
    "vendorPayouts": 403750,
    "averageTransactionValue": 1481.52,
    "byPaymentMethod": {
      "card": 215000,
      "bank": 189000,
      "wallet": 21000
    },
    "dailyRevenue": {
      "2026-03-18": 42500,
      "2026-03-17": 38900,
      "2026-03-16": 45200
    },
    "projectedMonthlyRevenue": 640000,
    "topVendors": [
      {
        "vendorId": "v1",
        "name": "Premium Properties Co",
        "revenue": 85000
      },
      {
        "vendorId": "v2",
        "name": "Urban Realty",
        "revenue": 67500
      }
    ]
  }
}
```

---

### 6. Dispute Analytics

**Endpoint:** `GET /api/admin/analytics/disputes`

**Authentication:** Required (Admin)

**Description:** Get dispute resolution metrics and analytics.

**Request:**
```bash
curl -X GET http://localhost:5000/api/admin/analytics/disputes \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalDisputes": 45,
    "openDisputes": 8,
    "pendingDisputes": 12,
    "resolvedDisputes": 25,
    "thisMonthDisputes": 15,
    "resolutionRate": 55.56,
    "averageResolutionTime": 7.5,
    "byReason": {
      "payment_issue": 18,
      "quality_issue": 15,
      "delivery_issue": 12
    },
    "topReasons": {
      "payment_issue": 18,
      "quality_issue": 15,
      "delivery_issue": 12
    }
  }
}
```

---

### 7. Engagement Metrics

**Endpoint:** `GET /api/admin/analytics/engagement`

**Authentication:** Required (Admin)

**Description:** Get user engagement and activity metrics.

**Request:**
```bash
curl -X GET http://localhost:5000/api/admin/analytics/engagement \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "last_week",
    "activeUsers": 250,
    "totalChats": 500,
    "totalMessages": 3500,
    "totalInquiries": 150,
    "averageMessagesPerUser": 14,
    "userEngagementScore": 14.6
  }
}
```

---

### 8. Export Analytics

**Endpoint:** `GET /api/admin/analytics/export`

**Authentication:** Required (Admin)

**Query Parameters:**
- `format` (optional) - 'json', 'csv', 'excel' (default: 'json')
- `dataType` (required) - 'transactions', 'users', 'properties', 'revenue'
- `period` (optional) - 'day', 'week', 'month', 'year' (default: 'month')

**Description:** Export analytics data in various formats for reporting.

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/analytics/export?format=csv&dataType=transactions&period=month" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "format": "csv",
    "dataType": "transactions",
    "period": "month",
    "records": [
      "id,amount,status,date",
      "t1,10000,completed,2026-03-18",
      "t2,15000,completed,2026-03-17"
    ],
    "exportedAt": "2026-03-18T10:30:00Z",
    "recordCount": 287
  }
}
```

**CSV Download:**
Headers set for download:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="analytics-transactions.csv"
```

---

### 9. Custom Date Range Analytics

**Endpoint:** `POST /api/admin/analytics/custom-range`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "startDate": "2026-03-01T00:00:00Z",
  "endDate": "2026-03-18T23:59:59Z",
  "metricsToInclude": ["transactions", "revenue", "users"]
}
```

**Description:** Get custom analytics for a specific date range.

**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/analytics/custom-range \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-01T00:00:00Z",
    "endDate": "2026-03-18T23:59:59Z",
    "metricsToInclude": ["transactions", "revenue", "users"]
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "start": "2026-03-01T00:00:00Z",
      "end": "2026-03-18T23:59:59Z"
    },
    "metrics": ["transactions", "revenue", "users"],
    "data": {
      "transactions": 287,
      "revenue": 425000,
      "users": 38,
      "disputes": 3
    }
  }
}
```

---

## Error Responses

### Invalid Period (400)
```json
{
  "success": false,
  "message": "Invalid period. Use: day, week, month, year"
}
```

### Missing Required Parameters (400)
```json
{
  "success": false,
  "message": "startDate and endDate are required"
}
```

### Invalid Date Range (400)
```json
{
  "success": false,
  "message": "startDate must be before endDate"
}
```

### Unauthorized (403)
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to fetch [metric type]"
}
```

---

## Frontend Integration Examples

### React: Dashboard Overview

```javascript
function AdminDashboard() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics/overview', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    .then(r => r.json())
    .then(d => setOverview(d.data.overview))
    .catch(err => console.error(err));
  }, []);

  if (!overview) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="metric">
        <h3>Total Users</h3>
        <p>{overview.totalUsers}</p>
        <span className="growth">↑ {overview.userGrowthRate}%</span>
      </div>
      <div className="metric">
        <h3>Monthly Revenue</h3>
        <p>${overview.monthlyRevenue.toLocaleString()}</p>
      </div>
      <div className="metric">
        <h3>Transactions</h3>
        <p>{overview.completedThisMonth}</p>
      </div>
      <div className="metric">
        <h3>Pending Disputes</h3>
        <p>{overview.pendingDisputes}</p>
      </div>
    </div>
  );
}
```

### React: Transaction Analytics Chart

```javascript
import { Chart } from 'react-chartjs-2';

function TransactionAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics/transactions?period=month', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    .then(r => r.json())
    .then(d => {
      const chartData = {
        labels: Object.keys(d.data.byDay),
        datasets: [{
          label: 'Daily Revenue',
          data: Object.values(d.data.byDay),
          backgroundColor: 'rgba(0, 123, 255, 0.5)'
        }]
      };
      setData(chartData);
    });
  }, []);

  return data ? <Chart type="line" data={data} /> : <div>Loading...</div>;
}
```

### React: Export Data

```javascript
async function exportData(dataType, format) {
  const response = await fetch(
    `/api/admin/analytics/export?dataType=${dataType}&format=${format}`,
    { headers: { 'Authorization': `Bearer ${adminToken}` } }
  );
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dataType}.${format}`;
    a.click();
  }
}
```

---

## Metrics Reference

### Overview Metrics
- **totalUsers** - All registered users
- **activeUsers** - Users active in last 30 days
- **totalProperties** - All property listings
- **activeListings** - Properties for sale
- **totalTransactions** - All completed transactions
- **completedThisMonth** - Transactions this month
- **totalRevenue** - Cumulative platform revenue
- **monthlyRevenue** - Current month revenue
- **averageTransactionValue** - Mean transaction amount
- **pendingDisputes** - Unresolved disputes
- **userGrowthRate** - Month-over-month growth

### Key Performance Indicators (KPIs)

**Revenue KPIs:**
- Monthly Recurring Revenue (MRR)
- Platform Fee Revenue (5% of transactions)
- Average Transaction Value (ATV)
- Revenue Growth Rate

**User KPIs:**
- Monthly Active Users (MAU)
- User Acquisition Cost (UAC)
- Churn Rate
- User Growth Rate

**Property KPIs:**
- Active Listings
- Average Time to Sell
- Price Per Sq Ft
- Market Saturation

**Dispute KPIs:**
- Dispute Rate (disputes / transactions)
- Resolution Rate
- Average Resolution Time
- Dispute Types by Frequency

---

## Rate Limiting

Analytics endpoints have standard rate limits:
- 60 requests per minute for authenticated admins
- 10 export requests per hour

---

## Best Practices

1. **Cache Data** - Results are fresh but can be cached for performance
2. **Schedule Reports** - Use cron jobs to generate daily/weekly reports
3. **Monitor Trends** - Watch growth rates and dispute increases
4. **Export Regularly** - Maintain historical data backups
5. **Set Alerts** - Alert on anomalies (sudden drops in revenue, spike in disputes)

---

## Roadmap

Future analytics enhancements:
- [ ] Real-time dashboards with WebSocket updates
- [ ] Predictive analytics (forecasting revenue, churn)
- [ ] Custom metric creation
- [ ] Scheduled report emailing
- [ ] Data visualization library integration
- [ ] Machine learning insights
- [ ] Geospatial analytics
- [ ] Competitor benchmarking
