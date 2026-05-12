import { NextResponse } from 'next/server';

/**
 * App Insights API Proxy
 *
 * Proxies queries to Azure Application Insights API.
 * Keeps the API key server-side only (secure).
 *
 * Endpoints:
 * - GET /api/appinsights?query=errors&timeRange=24h&env=prod
 * - GET /api/appinsights?query=errorsByEndpoint&timeRange=7d&env=test
 * - GET /api/appinsights?query=errorTimeline&timeRange=24h
 */

// PROD App Insights credentials (default)
const PROD_APP_ID = process.env.APPINSIGHTS_APP_ID;
const PROD_API_KEY = process.env.APPINSIGHTS_API_KEY;

// TEST App Insights credentials
const TEST_APP_ID = process.env.APPINSIGHTS_TEST_APP_ID;
const TEST_API_KEY = process.env.APPINSIGHTS_TEST_API_KEY;

const APP_INSIGHTS_URL = 'https://api.applicationinsights.io/v1/apps';

// Get credentials based on environment
function getCredentials(env) {
  if (env === 'test') {
    return { appId: TEST_APP_ID, apiKey: TEST_API_KEY };
  }
  return { appId: PROD_APP_ID, apiKey: PROD_API_KEY };
}

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

  // Error timeline (hourly buckets) - by status code
  errorTimeline: (timeRange) => {
    // Dynamic bin size based on time range
    const binSize = ['1h', '6h', '12h', '24h'].includes(timeRange) ? '1h' : '4h';
    return `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "4" or resultCode startswith "5"
    | summarize count() by bin(timestamp, ${binSize}), resultCode
    | order by timestamp asc
  `;
  },

  // Error timeline by endpoint
  errorTimelineByEndpoint: (timeRange) => {
    const binSize = ['1h', '6h', '12h', '24h'].includes(timeRange) ? '1h' : '4h';
    return `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "4" or resultCode startswith "5"
    | summarize count() by bin(timestamp, ${binSize}), name
    | order by timestamp asc
  `;
  },

  // Recent individual errors with details
  recentErrors: (timeRange) => `
    requests
    | where timestamp > ago(${timeRange})
    | where resultCode startswith "4" or resultCode startswith "5"
    | project timestamp, name, resultCode, duration, url, client_City, client_CountryOrRegion, client_Browser, client_Type, client_IP, customDimensions, operation_Id
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

async function queryAppInsights(kqlQuery, appId, apiKey) {
  const url = `${APP_INSIGHTS_URL}/${appId}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
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
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('query') || 'errorSummary';
    const timeRangeParam = searchParams.get('timeRange') || '24h';
    const env = searchParams.get('env') || 'prod';

    // Get credentials for the specified environment
    const { appId, apiKey } = getCredentials(env);

    // Check configuration
    if (!appId || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: `App Insights not configured for ${env.toUpperCase()}`,
          details: {
            env,
            hasAppId: !!appId,
            hasApiKey: !!apiKey,
            hint: env === 'test'
              ? 'Set APPINSIGHTS_TEST_APP_ID and APPINSIGHTS_TEST_API_KEY in Vercel'
              : 'Set APPINSIGHTS_APP_ID and APPINSIGHTS_API_KEY in Vercel'
          }
        },
        { status: 500 }
      );
    }

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
    const rawData = await queryAppInsights(kqlQuery, appId, apiKey);
    const data = transformResponse(rawData);

    return NextResponse.json({
      success: true,
      queryType,
      timeRange: timeRangeParam,
      env,
      ...data
    });

  } catch (error) {
    console.error('App Insights proxy error:', error);
    const env = new URL(request.url).searchParams.get('env') || 'prod';
    const { appId, apiKey } = getCredentials(env);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to query App Insights',
        message: error.message,
        debug: {
          env,
          hasAppId: !!appId,
          hasApiKey: !!apiKey,
          appIdPrefix: appId ? appId.substring(0, 8) + '...' : null
        }
      },
      { status: 500 }
    );
  }
}
