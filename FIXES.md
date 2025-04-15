# MUI Integration Fixes for Next.js

When setting up the project, we encountered an issue with MUI integration in Next.js. The error was:

```
Module not found: Can't resolve '@mui/material-nextjs/v14-appRouter'
```

## Fixes Applied

1. **Removed dependency on `@mui/material-nextjs`**:
   - This package wasn't correctly compatible with our Next.js version

2. **Created a custom `ThemeRegistry` component**:
   - Implemented the official emotion cache approach from the MUI Next.js examples
   - This properly handles server-side rendering of MUI styles

3. **Updated Next.js version**:
   - Changed from 14.2.11 to 14.1.0 for better compatibility
   - This version is tested and known to work well with our MUI setup

4. **Simplified layout component**:
   - Removed explicit references to `ThemeProvider` and `CssBaseline` from the root layout
   - Encapsulated all MUI theming in the `ThemeRegistry` component

## Result

These changes ensure proper server-side rendering of Material UI components in our Next.js app, avoiding hydration mismatches and style flickering during page loads.

If you encounter any MUI styling issues, check:
1. The `ThemeRegistry.js` component implementation
2. The root layout's wrapping of the application with the ThemeRegistry
3. The MUI and emotion package versions in package.json

# Audit Log Issue Fix

A problem was identified with the user records in the MongoDB userLogins collection:
- The auditLog field is storing complete copies of previous documents
- This causes documents to grow very large over time
- It may contribute to UI inconsistencies where the number of users shown doesn't match the actual count

## Clearing Existing Audit Logs

A new API endpoint has been added to clear existing audit logs:
```
POST /api/debug/clear-audit-logs
```

This endpoint will:
- Find all users with the specified appId
- Remove all entries from their auditLog arrays
- Return statistics about the operation

You can check the current audit log status with:
```
GET /api/debug/clear-audit-logs
```

## Fix to Prevent Future Issues

The issue is in the pre-save middleware in `/models/userLogins.js`:

```javascript
// Pre-save middleware to log changes
userLoginSchema.pre("save", async function (next) {
  if (!this.isNew) {
    const previousDoc = await this.constructor.findById(this._id).lean();
    if (previousDoc) {
      this.auditLog.push({
        previousData: previousDoc,  // This stores the entire previous document
        ipAddress: this.ipAddress,
        platform: this.platform,
      });
    }
  }
  this.updatedAt = Date.now();
  next();
});
```

This stores the entire previous document in the auditLog, including any previous audit logs, causing recursive storage and document growth.

## Recommended Backend Changes

Update the pre-save hook in `/calendar-be/models/userLogins.js` to:

```javascript
// Pre-save middleware to log changes
userLoginSchema.pre("save", async function (next) {
  if (!this.isNew) {
    const previousDoc = await this.constructor.findById(this._id).lean();
    if (previousDoc) {
      // Create a copy without the auditLog
      const { auditLog, ...previousDataWithoutAuditLog } = previousDoc;
      
      this.auditLog.push({
        previousData: previousDataWithoutAuditLog,  // Store document WITHOUT audit log
        ipAddress: this.ipAddress,
        platform: this.platform,
        changedAt: new Date()
      });
      
      // Limit the size of the audit log (keep only the most recent 5 entries)
      if (this.auditLog.length > 5) {
        this.auditLog = this.auditLog.slice(-5);
      }
    }
  }
  this.updatedAt = Date.now();
  next();
});
```

This change:
1. Removes the auditLog from the stored previous document to prevent recursive storage
2. Limits the audit log to the 5 most recent entries to prevent unbounded growth
3. Adds a changedAt timestamp to each entry for better tracking

## Alternative: Disable Audit Logging

If detailed audit logs are not needed for this application, you can simplify by completely removing the audit log functionality:

```javascript
// Pre-save middleware - simple version without audit log
userLoginSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
```

This will only update the updatedAt timestamp without storing any audit information.