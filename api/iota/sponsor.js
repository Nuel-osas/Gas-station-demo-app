// Vercel serverless function to proxy IOTA gas station API requests
// This solves CORS issues in production while maintaining security

export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests for sponsorship
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Validate required fields for IOTA
    const { apiKey, rawTxBytesHex, sender, network } = req.body;
    
    if (!apiKey || !rawTxBytesHex || !sender || !network) {
      return res.status(400).json({ 
        error: 'Missing required fields: apiKey, rawTxBytesHex, sender, network' 
      });
    }

    // Forward request to the IOTA gas station API
    const gasStationResponse = await fetch('https://gas.movevm.tools/api/iota/sponsor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        rawTxBytesHex,
        sender,
        network
      })
    });

    // Get the response data
    const responseData = await gasStationResponse.text();
    
    // Forward the status code and response
    res.status(gasStationResponse.status);
    
    // Try to parse as JSON, fallback to text
    try {
      const jsonData = JSON.parse(responseData);
      res.json(jsonData);
    } catch {
      res.send(responseData);
    }

  } catch (error) {
    console.error('IOTA gas station proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error?.message || 'Unknown error'
    });
  }
}