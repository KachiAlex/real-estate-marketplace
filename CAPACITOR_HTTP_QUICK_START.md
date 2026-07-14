# Capacitor HTTP Client - Quick Start Guide

## 5-Minute Setup

### Step 1: Initialize in Your App

In your main app file (e.g., `src/index.js` or `src/App.tsx`):

```typescript
import { configureHttpPlugin } from './config/api';

// Initialize HTTP client on app startup
configureHttpPlugin().catch(console.error);
```

### Step 2: Use in Your Services

Create a service file (e.g., `src/services/userService.ts`):

```typescript
import { getHttpClient } from '../config/api';

export const userService = {
  async getUsers() {
    const client = getHttpClient();
    const response = await clie