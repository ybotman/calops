import { NextResponse } from 'next/server';

/**
 * App Insights API Proxy
 *
 * Proxies queries to Azure Application Insights API.
 * Keeps the API key server-side only (secure).
 *
 * Endpoints:
 * - GET /api/appinsights?query=errors&timeRange=24h
 * - GET /api/appinsights?query=errorsByEndpoint&timeRange=7d
 * - GET /api/appinsights?query=errorTimeline&timeRange=24h
 */

const APP_ID = process.env.APPINSIGHTS_APP_ID;
const API_KEY = process.env.APPINSIGHTS_API_KEY;
const APP_INSIGHTS_URL = 'https://api.applicationinsights.io/v1/apps';

// Time range mappings - KQL ago() format
const TIME_RANGES = {
  '1h': '1h',
  '6h': '6h',
  '12h': '12h',
  '24h': '24h',
  '3d': '3d',
  '7d': '7d',
  '30d': '30d'
};

// KQL queries for different error views
const QUERIES = {
  // Summary of errors by status code
  errorSummary: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "4" or resultCode startswith "5"
    | summarize count() by resultCode
    | order by count_ desc
  `,

  // Errors grouped by endpoint and status
  errorsByEndpoint: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "4" or resultCode startswith "5"
    | summarize count() by name, resultCode
    | order by count_ desc
    | take 50
  `,

  // Error timeline (hourly buckets)
  errorTimeline: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "4" or resultCode startswith "5"
    | summarize count() by bin(timestamp, 1h), resultCode
    | order by timestamp asc
  `,

  // Recent individual errors with details
  recentErrors: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "4" or resultCode startswith "5"
    | project timestamp, name, resultCode, duration, url, client_City, client_CountryOrRegion, operation_Id
    | order by timestamp desc
    | take 100
  `,

  // Error rate over time (errors vs total)
  errorRate: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | summarize
        total = count(),
        errors = countif(resultCode startswith "4" or resultCode startswith "5")
      by bin(timestamp, 1h)
    | extend errorRate = round(100.0 * errors / total, 2)
    | order by timestamp asc
  `,

  // 401/403 auth errors specifically
  authErrors: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode == "401" or resultCode == "403"
    | project timestamp, name, resultCode, url, client_City, operation_Id
    | order by timestamp desc
    | take 50
  `,

  // 500 server errors with more detail
  serverErrors: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "5"
    | project timestamp, name, resultCode, duration, url, operation_Id
    | order by timestamp desc
    | take 50
  `,

  // Exception traces (for 500 errors)
  exceptions: (timeRange) => `
    exceptions
    | where timestamp > ago(${timeRange})
    | project timestamp, type, message, outerMessage, operation_Id
    | order by timestamp desc
    | take 50
  `
};

async function queryAppInsights(kqlQuery) {
  const url = `${APP_INSIGHTS_URL}/${APP_ID}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ query: kqlQuery })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`App Insights API error: ${response.status} - ${text.substring(0, 200)}`);
  }

  return response.json();
}

// Transform App Insights response to a more usable format
function transformResponse(data) {
  if (!data.tables || data.tables.length === 0) {
    return { rows: [], columns: [] };
  }

  const table = data.tables[0];
  const columns = table.columns.map(c => c.name);
  const rows = table.rows.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  return { rows, columns };
}

export async function GET(request) {
  try {
    // Check configuration
    if (!APP_ID || !API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'App Insights not configured',
          details: {
            hasAppId: !!APP_ID,
            hasApiKey: !!API_KEY
          }
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('query') || 'errorSummary';
    const timeRangeParam = searchParams.get('timeRange') || '24h';

    // Convert time range to KQL format
    const timeRange = TIME_RANGES[timeRangeParam] || 'P1D';

    // Get the query function
    const queryFn = QUERIES[queryType];
    if (!queryFn) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown query type: ${queryType}`,
          availableQueries: Object.keys(QUERIES)
        },
        { status: 400 }
      );
    }

    // Execute query
    const kqlQuery = queryFn(timeRange);
    const rawData = await queryAppInsights(kqlQuery);
    const data = transformResponse(rawData);

    return NextResponse.json({
      success: true,
      queryType,
      timeRange: timeRangeParam,
      ...data
    });

  } catch (error) {
    console.error('App Insights proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to query App Insights',
        message: error.message,
        debug: {
          hasAppId: !!APP_ID,
          hasApiKey: !!API_KEY,
          appIdPrefix: APP_ID ? APP_ID.substring(0, 8) + '...' : null
        }
      },
      { status: 500 }
    );
  }
}
