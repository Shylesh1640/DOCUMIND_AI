const https = require('https');

const token = process.env.RAILWAY_TOKEN || 'rlwy_wksp_ZVaq0fcyC7WIU99Pjo1QQgVY0D9JqWpGlm24qo2p';
const deploymentId = '9b1fef13-0d16-4a25-9e23-ada591b1ac8b';

function gql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const data = await gql(`
    query GetDeployment($id: String!) {
      deployment(id: $id) {
        id
        status
        meta
        canRedeploy
      }
    }
  `, { id: deploymentId });

  console.log('Deployment info:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
