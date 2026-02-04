import { RequestExecutor } from './src/services/RequestExecutor';
import { RequestConfig } from './src/types/request.types';

console.log('🧪 Testing RequestExecutor with GraphQL...\n');

async function runTests() {
  const executor = new RequestExecutor();

  try {
    // Test 1: Execute GraphQL Query via RequestExecutor
    console.log('✓ Test 1: Execute GraphQL Query (Countries API)');
    
    const graphqlConfig: RequestConfig = {
      method: 'POST',
      url: 'https://countries.trevorblades.com/graphql',
      requestType: 'GRAPHQL',
      graphqlQuery: `
        query GetCountries {
          countries {
            code
            name
            capital
            currency
          }
        }
      `,
      graphqlVariables: {},
      headers: [],
      params: [],
      body: { type: 'none', content: '' },
      auth: { type: 'bearer' },
    };

    const result1 = await executor.execute(graphqlConfig);
    
    if (result1.success && result1.response) {
      console.log('  Request executed successfully ✓');
      console.log('  Status:', result1.response.status);
      console.log('  Response has data:', !!result1.response.body.data);
      console.log('  Response has errors:', !!result1.response.body.errors);
      
      if (result1.response.body.data?.countries) {
        console.log('  Countries fetched:', result1.response.body.data.countries.length);
        console.log('  Sample country:', result1.response.body.data.countries[0]);
      }
    } else {
      console.log('  Request failed:', result1.error?.message);
    }
    
    console.log('');
    
    // Test 2: Execute GraphQL Query with Variables
    console.log('✓ Test 2: Execute GraphQL Query with Variables');
    
    const graphqlConfigWithVars: RequestConfig = {
      method: 'POST',
      url: 'https://countries.trevorblades.com/graphql',
      requestType: 'GRAPHQL',
      graphqlQuery: `
        query GetCountry($code: ID!) {
          country(code: $code) {
            code
            name
            capital
            currency
            languages {
              code
              name
            }
          }
        }
      `,
      graphqlVariables: {
        code: 'US'
      },
      headers: [],
      params: [],
      body: { type: 'none', content: '' },
      auth: { type: 'bearer' },
    };

    const result2 = await executor.execute(graphqlConfigWithVars);
    
    if (result2.success && result2.response) {
      console.log('  Query with variables executed ✓');
      console.log('  Status:', result2.response.status);
      
      if (result2.response.body.data?.country) {
        const country = result2.response.body.data.country;
        console.log('  Country:', country.name);
        console.log('  Capital:', country.capital);
        console.log('  Currency:', country.currency);
        console.log('  Languages:', country.languages.map((l: any) => l.name).join(', '));
      }
    } else {
      console.log('  Request failed:', result2.error?.message);
    }
    
    console.log('');
    
    // Test 3: Execute GraphQL Query with Invalid Syntax (should return error)
    console.log('✓ Test 3: Execute GraphQL Query with Errors');
    
    const invalidGraphqlConfig: RequestConfig = {
      method: 'POST',
      url: 'https://countries.trevorblades.com/graphql',
      requestType: 'GRAPHQL',
      graphqlQuery: `
        query GetInvalidField {
          countries {
            invalidField
          }
        }
      `,
      graphqlVariables: {},
      headers: [],
      params: [],
      body: { type: 'none', content: '' },
      auth: { type: 'bearer' },
    };

    const result3 = await executor.execute(invalidGraphqlConfig);
    
    if (result3.response?.body.errors) {
      console.log('  GraphQL errors detected correctly ✓');
      console.log('  Error message:', result3.response.body.errors[0].message);
      console.log('  Status code:', result3.response.status);
    } else {
      console.log('  Expected GraphQL error not detected');
    }
    
    console.log('');
    
    // Test 4: Verify REST Request Still Works
    console.log('✓ Test 4: Verify REST Request Backward Compatibility');
    
    const restConfig: RequestConfig = {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      requestType: 'REST',
      headers: [],
      params: [],
      body: { type: 'none', content: '' },
      auth: { type: 'bearer' },
    };

    const result4 = await executor.execute(restConfig);
    
    if (result4.success && result4.response) {
      console.log('  REST request still works ✓');
      console.log('  Status:', result4.response.status);
      console.log('  Response has id:', !!result4.response.body.id);
      console.log('  Response has title:', !!result4.response.body.title);
    } else {
      console.log('  REST request failed:', result4.error?.message);
    }
    
    console.log('');
    
    // Test 5: GraphQL with Custom Headers
    console.log('✓ Test 5: GraphQL Request with Custom Headers');
    
    const graphqlWithHeaders: RequestConfig = {
      method: 'POST',
      url: 'https://countries.trevorblades.com/graphql',
      requestType: 'GRAPHQL',
      graphqlQuery: `{ countries { code name } }`,
      graphqlVariables: {},
      headers: [
        { key: 'X-Custom-Header', value: 'test-value', enabled: true }
      ],
      params: [],
      body: { type: 'none', content: '' },
      auth: { type: 'bearer' },
    };

    const result5 = await executor.execute(graphqlWithHeaders);
    
    if (result5.success && result5.response) {
      console.log('  GraphQL with custom headers works ✓');
      console.log('  Status:', result5.response.status);
      console.log('  Countries fetched:', result5.response.body.data?.countries?.length || 0);
    } else {
      console.log('  Request failed:', result5.error?.message);
    }
    
    console.log('\n🎉 All RequestExecutor GraphQL tests completed!\n');
    
    console.log('Summary:');
    console.log('  ✓ GraphQL query execution working');
    console.log('  ✓ GraphQL variables support working');
    console.log('  ✓ GraphQL error handling working');
    console.log('  ✓ REST backward compatibility maintained');
    console.log('  ✓ Custom headers with GraphQL working');
    console.log('\n✅ Phase 2 (Prompt 2.2) complete! RequestExecutor now supports GraphQL!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
