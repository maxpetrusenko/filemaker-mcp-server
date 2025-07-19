import axios from 'axios';

const config = {
  host: 'https://terrace-fms-nyc.oditech.com',
  database: '22_0211',
  username: 'API',
  password: 'terraceapi'
};

async function testConnection() {
  try {
    console.log('Testing FileMaker connection...');
    console.log('Host:', config.host);
    console.log('Database:', config.database);
    console.log('Username:', config.username);
    
    // Test basic connection
    const authUrl = `${config.host}/fmi/data/v1/databases/${config.database}/sessions`;
    
    console.log('Attempting to connect to:', authUrl);
    
    const response = await axios.post(authUrl, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Connection successful!');
    console.log('Response status:', response.status);
    console.log('Token:', response.data.response.token ? 'Received' : 'Not received');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testConnection(); 