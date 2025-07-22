# Geocoding Setup Guide

## Quick Start

1. **Copy the environment file template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Go to "APIs & Services" → "Library"
   - Search for and enable "Geocoding API"
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

3. **Add the API key to your .env.local file:**
   ```
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

4. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Testing

Once configured, you can test the geocoding feature:

1. Go to Venue Management
2. Click "Add Venue" 
3. Enter an address (e.g., "1600 Amphitheatre Parkway, Mountain View, CA")
4. Click "Geocode from Address"
5. The latitude and longitude fields will be populated automatically

## Free Tier Limits

Google provides $200/month in free credits, which covers:
- Approximately 40,000 geocoding requests per month
- This is typically sufficient for most applications

## Security Notes

- Never commit your API key to version control
- The API key is only used server-side (in the API route)
- Consider restricting your API key to specific domains in the Google Cloud Console

## Alternative: Using Without API Key

If you don't have a Google Maps API key yet, you can still use the venue management by manually entering latitude and longitude coordinates. You can find coordinates using:
- Google Maps (right-click → "What's here?")
- Various online geocoding tools
- GPS coordinates from mobile devices