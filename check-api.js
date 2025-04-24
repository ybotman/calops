import axios from 'axios';

async function checkAPIs() {
  console.log('Checking API connectivity...');
  
  try {
    console.log('\nTesting BTC WordPress API:');
    const btcResponse = await axios.get('https://bostontangocalendar.com/wp-json/tribe/events/v1/events?per_page=1')
      .catch(error => {
        console.error(`  ❌ BTC API error: ${error.message}`);
        return { status: 'error' };
      });
    
    if (btcResponse.status !== 'error') {
      console.log(`  ✅ BTC API accessible, status: ${btcResponse.status}`);
      console.log(`  Found ${btcResponse.data?.events?.length || 0} events`);
    }
  } catch (error) {
    console.error(`  ❌ BTC API general error: ${error.message}`);
  }
  
  try {
    console.log('\nTesting TangoTiempo API:');
    const ttResponse = await axios.get('http://localhost:3010/api/events?appId=1&limit=1')
      .catch(error => {
        console.error(`  ❌ TT API error: ${error.message}`);
        return { status: 'error' };
      });
    
    if (ttResponse.status !== 'error') {
      console.log(`  ✅ TT API accessible, status: ${ttResponse.status}`);
      console.log(`  Found ${ttResponse.data?.events?.length || 0} events`);
    }
  } catch (error) {
    console.error(`  ❌ TT API general error: ${error.message}`);
  }
}

checkAPIs();
