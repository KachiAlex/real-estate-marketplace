# Notifications & Alerts API - Phase 4.3 Documentation

## Overview

The Notifications & Alerts API provides comprehensive notification management with multi-channel delivery, user preferences, and intelligent alert systems. Features include email/push/SMS notifications, notification preferences, price alerts, property alerts, and smart notification scheduling.

**Base URL:** `http://localhost:5000/api/alerts-preferences`

---

## API Endpoints

### 1. Get Notification Preferences

#### `GET /api/alerts-preferences/preferences`

Get the current user's notification preferences and settings.

**Authentication:** Bearer token required

**Example Request:**

```bash
curl -X GET http://localhost:5000/api/alerts-preferences/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (JavaScript):**

```javascript
async function getNotificationPreferences(token) {
  const response = await fetch('/api/alerts-preferences/preferences', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

const prefs = await getNotificationPreferences(authToken);
console.log(prefs.data.preferences);
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "preferences": {
      "emailNotifications": true,
      "pushNotifications": true,
      "smsNotifications": false,
      "inAppNotifications": true,
      "email": {
        "enabled": true,
        "frequency": "daily",
        "digest": true,
        "categories": {
          "propertyAlerts": true,
          "priceChanges": true,
          "messages": true,
          "offers": true,
          "escrow": true,
          "marketing": false
        }
      },
      "push": {
        "enabled": true,
        "sound": true,
        "vibration": true,
        "badge": true,
        "categories": {
          "urgent": true,
          "important": true,
          "informational": true
        }
      },
      "sms": {
        "enabled": false,
        "frequency": "never",
        "categories": {
          "urgent": true,
          "offers": true,
          "escrow": true
        }
      },
      "doNotDisturb": {
        "enabled": false,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "UTC",
        "muteAll": false
      },
      "unsubscribeAll": false
    },
    "updatedAt": "2026-03-18T10:30:00Z"
  }
}
```

---

### 2. Update Notification Preferences

#### `PUT /api/alerts-preferences/preferences`

Update the current user's notification preferences.

**Authentication:** Bearer token required

**Request Body:**

```json
{
  "emailNotifications": true,
  "email": {
    "enabled": true,
    "frequency": "weekly",
    "categories": {
      "propertyAlerts": true,
      "priceChanges": false,
      "messages": true,
      "marketing": false
    }
  },
  "push": {
    "enabled": true,
    "sound": false
  },
  "doNotDisturb": {
    "enabled": true,
    "startTime": "21:00",
    "endTime": "09:00"
  }
}
```

**Example Request:**

```bash
curl -X PUT http://localhost:5000/api/alerts-preferences/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": {
      "enabled": true,
      "frequency": "weekly"
    },
    "push": {
      "enabled": false
    }
  }'
```

**Example Request (React):**

```javascript
async function updateNotificationPreferences(token, preferences) {
  const response = await fetch('/api/alerts-preferences/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preferences)
  });
  return response.json();
}

// Usage
await updateNotificationPreferences(token, {
  email: { frequency: 'weekly' },
  push: { enabled: false }
});
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "preferences": { /* updated preferences */ },
    "message": "Notification preferences updated successfully"
  }
}
```

**Preference Frequency Options:**
- `instant` - Immediate notification
- `daily` - Once per day digest
- `weekly` - Once per week digest
- `never` - Disable notifications

---

### 3. Get Active Alerts

#### `GET /api/alerts-preferences/alerts`

Get all active alerts for the current user.

**Authentication:** Bearer token required

**Example Request:**

```bash
curl -X GET http://localhost:5000/api/alerts-preferences/alerts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (JavaScript):**

```javascript
async function getActiveAlerts(token) {
  const response = await fetch('/api/alerts-preferences/alerts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

const alerts = await getActiveAlerts(token);
console.log(alerts.data.alerts);
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "alerts": {
      "priceAlerts": [
        {
          "alertId": "price_5_1710755400000",
          "propertyId": 5,
          "threshold": 5,
          "notificationChannels": ["email", "push"],
          "enabled": true,
          "createdAt": "2026-03-18T10:30:00Z",
          "triggeredCount": 3,
          "lastTriggered": "2026-03-17T15:22:00Z"
        }
      ],
      "propertyAlerts": [
        {
          "alertId": "property_1710755500000_abc123",
          "name": "3-Bedroom Houses in California",
          "criteria": {
            "bedrooms": 3,
            "location": "California",
            "maxPrice": 1000000
          },
          "enabled": true,
          "createdAt": "2026-03-18T09:15:00Z",
          "matchesFound": 12,
          "lastMatch": "2026-03-18T10:10:00Z",
          "frequency": "daily"
        }
      ],
      "keywordAlerts": [
        {
          "alertId": "keyword_1710755600000_def456",
          "keywords": ["waterfront", "ocean view"],
          "frequency": "instant",
          "enabled": true,
          "createdAt": "2026-03-18T09:00:00Z",
          "matchesFound": 5,
          "lastMatch": "2026-03-18T10:25:00Z"
        }
      ]
    },
    "totalAlerts": 3
  }
}
```

---

### 4. Create Price Alert

#### `POST /api/alerts-preferences/alerts/price`

Create an alert for property price changes.

**Authentication:** Bearer token required

**Request Body:**

```json
{
  "propertyId": 5,
  "threshold": 5,
  "notificationChannels": ["email", "push"]
}
```

**Parameters:**
- `propertyId` (required): Property ID to monitor
- `threshold` (optional): Price change percentage (1-100, default: 5)
- `notificationChannels` (optional): Channels to use (email, push, sms)

**Example Request:**

```bash
curl -X POST http://localhost:5000/api/alerts-preferences/alerts/price \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": 5,
    "threshold": 10,
    "notificationChannels": ["email", "push"]
  }'
```

**Example Request (React):**

```javascript
async function createPriceAlert(token, propertyId, threshold) {
  const response = await fetch('/api/alerts-preferences/alerts/price', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      propertyId,
      threshold,
      notificationChannels: ['email', 'push']
    })
  });
  return response.json();
}

// Usage
await createPriceAlert(token, 5, 10);
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "alertId": "price_5_1710755400000",
    "propertyId": 5,
    "threshold": 10,
    "message": "Price alert created successfully"
  }
}
```

---

### 5. Create Property Alert

#### `POST /api/alerts-preferences/alerts/property`

Create an alert for new properties matching search criteria.

**Authentication:** Bearer token required

**Request Body:**

```json
{
  "criteria": {
    "location": "San Francisco",
    "minPrice": 500000,
    "maxPrice": 2000000,
    "minBedrooms": 3,
    "propertyType": "house"
  },
  "alertName": "3-Bedroom Houses in SF"
}
```

**Parameters:**
- `criteria` (required): Search criteria (location, price range, bedrooms, etc.)
- `alertName` (optional): Custom alert name

**Example Request:**

```bash
curl -X POST http://localhost:5000/api/alerts-preferences/alerts/property \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "criteria": {
      "location": "San Francisco",
      "minPrice": 500000,
      "maxPrice": 2000000,
      "minBedrooms": 3
    },
    "alertName": "Luxury Homes in SF"
  }'
```

**Example Request (React):**

```javascript
async function createPropertyAlert(token, criteria, alertName) {
  const response = await fetch('/api/alerts-preferences/alerts/property', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ criteria, alertName })
  });
  return response.json();
}

// Usage
await createPropertyAlert(token, {
  location: 'San Francisco',
  minPrice: 500000,
  minBedrooms: 3
}, 'SF Luxury Homes');
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "alertId": "property_1710755500000_abc123",
    "alertName": "Luxury Homes in SF",
    "criteria": {
      "location": "San Francisco",
      "minPrice": 500000,
      "maxPrice": 2000000,
      "minBedrooms": 3
    },
    "frequency": "daily",
    "message": "Property alert created successfully"
  }
}
```

---

### 6. Create Keyword Alert

#### `POST /api/alerts-preferences/alerts/keyword`

Create an alert for listings containing specific keywords.

**Authentication:** Bearer token required

**Request Body:**

```json
{
  "keywords": ["waterfront", "ocean view", "beachfront"],
  "frequency": "instant"
}
```

**Parameters:**
- `keywords` (required): Array of keywords to monitor
- `frequency` (optional): Alert frequency (instant, daily, weekly, default: daily)

**Example Request:**

```bash
curl -X POST http://localhost:5000/api/alerts-preferences/alerts/keyword \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["waterfront", "ocean view"],
    "frequency": "instant"
  }'
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "alertId": "keyword_1710755600000_def456",
    "keywords": ["waterfront", "ocean view"],
    "frequency": "instant",
    "message": "Keyword alert created successfully"
  }
}
```

---

### 7. Delete Alert

#### `DELETE /api/alerts-preferences/alerts/:alertId`

Delete an alert.

**Authentication:** Bearer token required

**Example Request:**

```bash
curl -X DELETE http://localhost:5000/api/alerts-preferences/alerts/price_5_1710755400000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Alert deleted successfully"
}
```

---

### 8. Toggle Alert

#### `PUT /api/alerts-preferences/alerts/:alertId/toggle`

Enable or disable an alert.

**Authentication:** Bearer token required

**Example Request:**

```bash
curl -X PUT http://localhost:5000/api/alerts-preferences/alerts/price_5_1710755400000/toggle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (React):**

```javascript
async function toggleAlert(token, alertId) {
  const response = await fetch(
    `/api/alerts-preferences/alerts/${alertId}/toggle`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
}

// Usage
await toggleAlert(token, 'price_5_1710755400000');
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "alertId": "price_5_1710755400000",
    "alertType": "price",
    "enabled": false,
    "message": "Alert disabled successfully"
  }
}
```

---

### 9. Get Notification Channels

#### `GET /api/alerts-preferences/notification-channels`

Get available notification channels and their configuration.

**Authentication:** Bearer token required

**Example Request:**

```bash
curl -X GET http://localhost:5000/api/alerts-preferences/notification-channels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "channels": {
      "email": {
        "enabled": true,
        "frequency": "daily",
        "categories": {
          "propertyAlerts": true,
          "priceChanges": true,
          "messages": true,
          "offers": true,
          "escrow": true,
          "marketing": false
        }
      },
      "push": {
        "enabled": true,
        "categories": {
          "urgent": true,
          "important": true,
          "informational": true
        },
        "devicesRegistered": 2
      },
      "sms": {
        "enabled": false,
        "frequency": "never",
        "categories": {
          "urgent": true,
          "offers": true,
          "escrow": true
        }
      },
      "inApp": {
        "enabled": true
      }
    }
  }
}
```

---

### 10. Send Test Notification

#### `POST /api/alerts-preferences/test-notification`

Send a test notification to verify channel configuration.

**Authentication:** Bearer token required

**Request Body:**

```json
{
  "channel": "email"
}
```

**Parameters:**
- `channel` (optional): Channel to test (email, push, sms, default: email)

**Example Request:**

```bash
curl -X POST http://localhost:5000/api/alerts-preferences/test-notification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email"
  }'
```

**Example Request (React):**

```javascript
async function sendTestNotification(token, channel = 'email') {
  const response = await fetch('/api/alerts-preferences/test-notification', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channel })
  });
  return response.json();
}

// Usage
await sendTestNotification(token, 'push');
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "notificationId": "test_email_1710755700000",
    "channel": "email",
    "message": "Test email notification sent successfully",
    "details": {
      "type": "test",
      "timestamp": "2026-03-18T10:35:00Z",
      "channel": "email"
    }
  }
}
```

---

## Notification Preferences Structure

### Default Preferences Template

```javascript
{
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: true,
  inAppNotifications: true,

  email: {
    enabled: true,
    frequency: 'daily', // instant, daily, weekly, never
    digest: true,
    categories: {
      propertyAlerts: true,
      priceChanges: true,
      messages: true,
      offers: true,
      escrow: true,
      marketing: false
    }
  },

  push: {
    enabled: true,
    sound: true,
    vibration: true,
    badge: true,
    categories: {
      urgent: true,
      important: true,
      informational: true
    }
  },

  sms: {
    enabled: true,
    frequency: 'immediate', // immediate, daily, never
    categories: {
      urgent: true,
      offers: true,
      escrow: true
    }
  },

  doNotDisturb: {
    enabled: false,
    startTime: '22:00', // HH:MM format
    endTime: '08:00',
    timezone: 'UTC',
    muteAll: false
  },

  unsubscribeAll: false
}
```

---

## Alert Types

### 1. Price Alerts
Monitor price changes on watched properties.

**Trigger conditions:**
- Price changes by threshold percentage
- New offers received
- Price negotiations

**Channels:** Email, Push, SMS

### 2. Property Alerts
Get notified of new listings matching saved searches.

**Trigger conditions:**
- New property listed
- Price drops in watched range
- New property in target area

**Frequencies:**
- `instant` - Immediate notification
- `daily` - Daily digest
- `weekly` - Weekly digest

### 3. Keyword Alerts
Monitor property descriptions for specific keywords.

**Examples:**
- "waterfront"
- "newly renovated"
- "beachfront"
- "smart home"

**Frequencies:**
- `instant` - Real-time
- `daily` - Once per day
- `weekly` - Once per week

---

## Frontend Integration Examples

### React Component: Notification Settings

```javascript
import { useState, useEffect } from 'react';

function NotificationSettings({ token }) {
  const [preferences, setPreferences] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const response = await fetch('/api/alerts-preferences/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPreferences(data.data.preferences);
    };
    fetchPreferences();
  }, [token]);

  const handleSave = async (updatedPrefs) => {
    const response = await fetch('/api/alerts-preferences/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedPrefs)
    });

    if (response.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (!preferences) return <div>Loading...</div>;

  return (
    <div className="notification-settings">
      <h2>Notification Preferences</h2>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(e) => {
              const updated = { ...preferences };
              updated.emailNotifications = e.target.checked;
              handleSave(updated);
            }}
          />
          Email Notifications
        </label>

        {preferences.emailNotifications && (
          <select
            value={preferences.email.frequency}
            onChange={(e) => {
              const updated = { ...preferences };
              updated.email.frequency = e.target.value;
              handleSave(updated);
            }}
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Digest</option>
            <option value="never">Never</option>
          </select>
        )}
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={preferences.pushNotifications}
            onChange={(e) => {
              const updated = { ...preferences };
              updated.pushNotifications = e.target.checked;
              handleSave(updated);
            }}
          />
          Push Notifications
        </label>
      </div>

      {saved && <div className="success">Preferences saved!</div>}
    </div>
  );
}

export default NotificationSettings;
```

### React Component: Manage Alerts

```javascript
import { useState, useEffect } from 'react';

function ManageAlerts({ token }) {
  const [alerts, setAlerts] = useState(null);
  const [showNewAlert, setShowNewAlert] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch('/api/alerts-preferences/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAlerts(data.data);
    };
    fetchAlerts();
  }, [token]);

  const handleToggleAlert = async (alertId) => {
    const response = await fetch(
      `/api/alerts-preferences/alerts/${alertId}/toggle`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      // Refresh alerts
      const fetchAlerts = async () => {
        const res = await fetch('/api/alerts-preferences/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setAlerts(data.data);
      };
      fetchAlerts();
    }
  };

  if (!alerts) return <div>Loading...</div>;

  return (
    <div className="manage-alerts">
      <h2>My Alerts</h2>

      <div className="alerts-list">
        {alerts.alerts.priceAlerts.map(alert => (
          <div key={alert.alertId} className="alert-item">
            <h4>Price Alert: Property {alert.propertyId}</h4>
            <p>Threshold: {alert.threshold}%</p>
            <p>Triggered: {alert.triggeredCount} times</p>
            <button onClick={() => handleToggleAlert(alert.alertId)}>
              {alert.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}

        {alerts.alerts.propertyAlerts.map(alert => (
          <div key={alert.alertId} className="alert-item">
            <h4>{alert.name}</h4>
            <p>Matches found: {alert.matchesFound}</p>
            <p>Frequency: {alert.frequency}</p>
            <button onClick={() => handleToggleAlert(alert.alertId)}>
              {alert.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => setShowNewAlert(true)}>+ Create New Alert</button>
    </div>
  );
}

export default ManageAlerts;
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid email frequency"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Alert not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to create price alert",
  "error": "Database connection error"
}
```

---

## Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 500 requests per 15 minutes per user
- **Alert creation**: 20 alerts per 24 hours per user

---

## Best Practices

1. **Manage Alert Overload** - Limit to 10-15 active alerts per user
2. **Set Sensible Thresholds** - 5-10% for price alerts to avoid noise
3. **Use Digest Mode** - Set daily/weekly frequency to reduce alert fatigue
4. **Enable DND** - Configure do-not-disturb hours to respect user time zones
5. **Test Before Enabling** - Send test notifications before enabling alerts
6. **Monitor Preferences** - Regularly review and update notification settings
7. **Responsive Design** - Ensure preferences UI works on mobile devices
8. **Clear Messaging** - Communicate why users received a notification

---

## Future Enhancements

1. **SMS Alerts** - SMS notifications for urgent alerts
2. **Webhook Integrations** - Custom webhooks for third-party apps
3. **Smart Alert Grouping** - Automatically group related alerts
4. **AI-Powered Recommendations** - Suggest alerts based on user behavior
5. **Advanced Scheduling** - Cron-like scheduling for alerts
6. **Slack Integration** - Send notifications to Slack channels
7. **Custom Notification Templates** - User-defined notification formats
8. **Alert Analytics** - Track which alerts perform best

---

## Testing

### Test Email Notifications

```bash
curl -X POST http://localhost:5000/api/alerts-preferences/test-notification \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "channel": "email" }'
```

### Create Test Price Alert

```bash
curl -X POST http://localhost:5000/api/alerts-preferences/alerts/price \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "propertyId": 1, "threshold": 5 }'
```

### Get All Alerts

```bash
curl -X GET http://localhost:5000/api/alerts-preferences/alerts \
  -H "Authorization: Bearer USER_TOKEN"
```

---

## Troubleshooting

### Notifications Not Received

**Problem:** User not receiving email notifications
**Solution:** 
- Check if emailNotifications is enabled in preferences
- Verify email frequency is not set to "never"
- Check user's spam/junk folder
- Test with test-notification endpoint

### Too Many Alerts

**Problem:** User receiving too many alerts
**Solution:**
- Raise price alert threshold (e.g., 10% instead of 5%)
- Change property alert frequency to "daily" or "weekly"
- Disable non-essential keyword alerts
- Use do-not-disturb to quiet hours

### Alert Not Triggering

**Problem:** Alert is configured but not triggering
**Solution:**
- Verify alert is enabled
- Check if property has changed since alert creation
- Verify alert criteria matches properties
- Review alert logs for errors

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-18 | Initial release with 10 endpoints |

---

**Last Updated:** March 18, 2026
**Status:** Production Ready ✅
