const https = require('https');

const token = process.env.RAILWAY_TOKEN || 'rlwy_wksp_ZVaq0fcyC7WIU99Pjo1QQgVY0D9JqWpGlm24qo2p';

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
          const parsed = JSON.parse(data);
          if (parsed.errors) {
            reject(new Error(JSON.stringify(parsed.errors)));
          } else {
            resolve(parsed.data);
          }
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
  console.log('🚀 Step 1: Creating Railway Project "documind-chromadb"...');
  const projectData = await gql(`
    mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        id
        name
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `, {
    input: {
      name: 'documind-chromadb',
      description: 'ChromaDB Vector Database for DocuMind AI',
    }
  });

  const project = projectData.projectCreate;
  console.log(`✓ Project created: ${project.name} (${project.id})`);
  const environmentId = project.environments.edges[0]?.node?.id;
  console.log(`✓ Environment ID: ${environmentId}`);

  console.log('🚀 Step 2: Creating ChromaDB Service from Docker image "chromadb/chroma:latest"...');
  const serviceData = await gql(`
    mutation CreateService($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `, {
    input: {
      projectId: project.id,
      name: 'chromadb',
      source: {
        image: 'chromadb/chroma:latest'
      }
    }
  });

  const service = serviceData.serviceCreate;
  console.log(`✓ Service created: ${service.name} (${service.id})`);

  console.log('🚀 Step 3: Setting environment variables (PORT=8000, ALLOW_RESET=true)...');
  await gql(`
    mutation SetVariables($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: {
      projectId: project.id,
      environmentId: environmentId,
      serviceId: service.id,
      variables: {
        ALLOW_RESET: 'true',
        ANONYMIZED_TELEMETRY: 'false',
        PORT: '8000',
        IS_PERSISTENT: 'TRUE'
      }
    }
  });
  console.log('✓ Environment variables configured');

  console.log('🚀 Step 4: Generating Public Railway Domain for ChromaDB on port 8000...');
  const domainData = await gql(`
    mutation CreateDomain($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        id
        domain
      }
    }
  `, {
    input: {
      environmentId: environmentId,
      serviceId: service.id,
      targetPort: 8000
    }
  });

  const domain = domainData.serviceDomainCreate.domain;
  const chromaUrl = `https://${domain}`;
  console.log(`🎉 ChromaDB Public URL: ${chromaUrl}`);

  console.log('\n--- DEPLOYMENT RESULT ---');
  console.log('PROJECT_ID=' + project.id);
  console.log('SERVICE_ID=' + service.id);
  console.log('CHROMA_URL=' + chromaUrl);
}

main().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
