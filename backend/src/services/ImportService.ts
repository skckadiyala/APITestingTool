import { v4 as uuidv4 } from 'uuid';
import { URLParser } from '../utils/urlParser';

import { prisma } from '../config/prisma';

interface ImportResult {
  collectionId: string;
  name: string;
  requestsCount: number;
  foldersCount: number;
}

export class ImportService {
  /**
   * Import Postman Collection v2.1 format
   */
  async importPostmanCollection(data: any, workspaceId: string): Promise<ImportResult> {
    if (!data.info || !data.item) {
      throw new Error('Invalid Postman collection format');
    }

    // Extract collection-level scripts
    let collectionTestScript = '';
    let collectionPreRequestScript = '';
    
    if (data.event && Array.isArray(data.event)) {
      data.event.forEach((event: any) => {
        if (event.listen === 'test' && event.script) {
          collectionTestScript = Array.isArray(event.script.exec) 
            ? event.script.exec.join('\n') 
            : event.script.exec || '';
        } else if ((event.listen === 'prerequest' || event.listen === 'pre-request') && event.script) {
          collectionPreRequestScript = Array.isArray(event.script.exec)
            ? event.script.exec.join('\n')
            : event.script.exec || '';
        }
      });
    }

    // Extract collection-level variables
    const collectionVariables = data.variable && Array.isArray(data.variable)
      ? data.variable.map((v: any) => ({
          key: v.key,
          value: v.value || '',
          enabled: v.disabled !== true,
          type: v.type || 'default'
        }))
      : [];

    // Extract collection-level auth
    const collectionAuth = data.auth || {};

    // Create main collection
    const collection = await prisma.collection.create({
      data: {
        id: uuidv4(),
        workspaceId,
        name: data.info.name || 'Imported Collection',
        description: data.info.description || '',
        type: 'COLLECTION',
        variables: collectionVariables,
        preRequestScript: collectionPreRequestScript.trim() || null,
        testScript: collectionTestScript.trim() || null,
        auth: collectionAuth
      }
    });

    let requestsCount = 0;
    let foldersCount = 0;

    // Recursive function to process items
    const processItems = async (items: any[], parentId: string) => {
      for (const item of items) {
        if (item.request) {
          // It's a request - use URLParser utility
          const { url, params } = URLParser.parsePostmanUrl(item.request.url);

          // Convert headers to our format using utility
          const headers = URLParser.convertHeadersFromPostman(item.request.header || []);

          // Convert body to our format {type, content}
          let body: any = {};
          if (item.request.body) {
            const postmanBody = item.request.body;
            
            if (postmanBody.mode === 'raw') {
              const rawContent = postmanBody.raw || '';
              
              // Try to detect if raw content is JSON
              let isJson = false;
              try {
                JSON.parse(rawContent);
                isJson = true;
              } catch {
                // Not valid JSON, keep as raw
              }
              
              // Check if Content-Type header indicates JSON
              const contentTypeHeader = headers.find((h: any) => 
                h.key.toLowerCase() === 'content-type'
              );
              if (contentTypeHeader?.value.toLowerCase().includes('application/json')) {
                isJson = true;
              }
              
              if (isJson) {
                body = {
                  type: 'json',
                  content: rawContent
                };
                
                // Add Content-Type: application/json header if not present
                if (!contentTypeHeader) {
                  headers.push({
                    key: 'Content-Type',
                    value: 'application/json',
                    enabled: true
                  });
                }
              } else {
                body = {
                  type: 'raw',
                  content: rawContent
                };
              }
            } else if (postmanBody.mode === 'urlencoded') {
              body = {
                type: 'x-www-form-urlencoded',
                content: JSON.stringify(postmanBody.urlencoded || [])
              };
            } else if (postmanBody.mode === 'formdata') {
              body = {
                type: 'form-data',
                content: JSON.stringify(postmanBody.formdata || [])
              };
            } else if (postmanBody.mode === 'file') {
              body = {
                type: 'file',
                content: postmanBody.file || {}
              };
            } else if (postmanBody.mode === 'graphql') {
              body = {
                type: 'graphql',
                content: postmanBody.graphql || {}
              };
            } else {
              body = {
                type: 'none',
                content: ''
              };
            }
          }

          // Extract test script and pre-request script from events
          let testScript = '';
          let preRequestScript = '';
          
          console.log('Processing request:', item.name, 'Events:', JSON.stringify(item.event, null, 2));
          
          if (item.event && Array.isArray(item.event)) {
            item.event.forEach((event: any) => {
              if (event.listen === 'test' && event.script) {
                testScript = Array.isArray(event.script.exec) 
                  ? event.script.exec.join('\n') 
                  : event.script.exec || '';
                console.log('Extracted test script:', testScript);
              } else if (event.listen === 'prerequest' && event.script) {
                preRequestScript = Array.isArray(event.script.exec)
                  ? event.script.exec.join('\n')
                  : event.script.exec || '';
                console.log('Extracted pre-request script:', preRequestScript);
              }
            });
          }

          await prisma.request.create({
            data: {
              id: uuidv4(),
              collectionId: parentId,
              name: item.name || 'Untitled Request',
              method: item.request.method || 'GET',
              url,
              params: params.length > 0 ? params : [] as any,
              headers: headers,
              body: body,
              auth: item.request.auth || {},
              testScript: testScript.trim() ? testScript : null,
              preRequestScript: preRequestScript.trim() ? preRequestScript : null
            }
          });
          requestsCount++;
        } else if (item.item) {
          // It's a folder
          const folder = await prisma.collection.create({
            data: {
              id: uuidv4(),
              workspaceId,
              name: item.name || 'Untitled Folder',
              description: item.description || '',
              type: 'FOLDER',
              parentFolderId: parentId
            }
          });
          foldersCount++;

          // Process nested items
          await processItems(item.item, folder.id);
        }
      }
    };

    await processItems(data.item, collection.id);

    return {
      collectionId: collection.id,
      name: collection.name,
      requestsCount,
      foldersCount
    };
  }

  /**
   * Import OpenAPI 3.0 specification
   */
  async importOpenAPI(data: any, workspaceId: string): Promise<ImportResult> {
    if (!data.openapi || !data.paths) {
      throw new Error('Invalid OpenAPI specification');
    }

    // Create main collection
    const collection = await prisma.collection.create({
      data: {
        id: uuidv4(),
        workspaceId,
        name: data.info?.title || 'Imported API',
        description: data.info?.description || '',
        type: 'COLLECTION'
      }
    });

    let requestsCount = 0;
    const baseUrl = data.servers?.[0]?.url || 'https://api.example.com';

    // Process each path
    for (const [path, methods] of Object.entries(data.paths as any)) {
      for (const [method, operationObj] of Object.entries(methods as any)) {
        if (typeof operationObj !== 'object' || !operationObj) continue;

        const operation: any = operationObj;
        const headers: any[] = [];
        let body: any = null;

        // Extract headers from parameters
        if (operation.parameters && Array.isArray(operation.parameters)) {
          operation.parameters.forEach((param: any) => {
            if (param.in === 'header') {
              headers.push({
                key: param.name,
                value: param.example || '',
                enabled: true
              });
            }
          });
        }

        // Extract request body
        if (operation.requestBody?.content?.['application/json']) {
          const jsonContent = operation.requestBody.content['application/json'];
          body = {
            type: 'json',
            content: jsonContent.example || jsonContent.schema || {}
          };
        }

        await prisma.request.create({
          data: {
            id: uuidv4(),
            collectionId: collection.id,
            name: operation.summary || `${method.toUpperCase()} ${path}`,
            method: method.toUpperCase(),
            url: `${baseUrl}${path}`,
            headers,
            body,
            auth: {}
          }
        });
        requestsCount++;
      }
    }

    return {
      collectionId: collection.id,
      name: collection.name,
      requestsCount,
      foldersCount: 0
    };
  }

  /**
   * Import Insomnia collection
   */
  async importInsomniaCollection(data: any, workspaceId: string): Promise<ImportResult> {
    if (!data.resources || !Array.isArray(data.resources)) {
      throw new Error('Invalid Insomnia collection format');
    }

    const workspace = data.resources.find((r: any) => r._type === 'workspace');
    if (!workspace) {
      throw new Error('No workspace found in Insomnia export');
    }

    // Create main collection
    const collection = await prisma.collection.create({
      data: {
        id: uuidv4(),
        workspaceId,
        name: workspace.name || 'Imported Collection',
        description: workspace.description || '',
        type: 'COLLECTION'
      }
    });

    let requestsCount = 0;
    let foldersCount = 0;
    const folderMap = new Map<string, string>(); // Insomnia ID -> Our ID
    folderMap.set(workspace._id, collection.id);

    // First pass: Create folders
    for (const resource of data.resources) {
      if (resource._type === 'request_group') {
        const parentId = folderMap.get(resource.parentId) || collection.id;
        const folder = await prisma.collection.create({
          data: {
            id: uuidv4(),
            workspaceId,
            name: resource.name || 'Untitled Folder',
            description: resource.description || '',
            type: 'FOLDER',
            parentFolderId: parentId
          }
        });
        folderMap.set(resource._id, folder.id);
        foldersCount++;
      }
    }

    // Second pass: Create requests
    for (const resource of data.resources) {
      if (resource._type === 'request') {
        const parentId = folderMap.get(resource.parentId) || collection.id;

        const headers: any[] = [];
        if (resource.headers && Array.isArray(resource.headers)) {
          resource.headers.forEach((header: any) => {
            headers.push({
              key: header.name,
              value: header.value,
              enabled: !header.disabled
            });
          });
        }

        let body: any = null;
        if (resource.body) {
          let bodyType = 'raw';
          let bodyContent = resource.body.text || '';
          
          if (resource.body.mimeType === 'application/json') {
            bodyType = 'json';
          } else if (resource.body.mimeType === 'application/x-www-form-urlencoded') {
            bodyType = 'x-www-form-urlencoded';
            // Convert params array to our format if available
            if (resource.body.params && Array.isArray(resource.body.params)) {
              bodyContent = JSON.stringify(resource.body.params.map((p: any) => ({
                key: p.name,
                value: p.value,
                enabled: true
              })));
            }
          } else if (resource.body.mimeType === 'multipart/form-data') {
            bodyType = 'form-data';
            if (resource.body.params && Array.isArray(resource.body.params)) {
              bodyContent = JSON.stringify(resource.body.params.map((p: any) => ({
                key: p.name,
                value: p.value,
                type: p.fileName ? 'file' : 'text',
                enabled: true
              })));
            }
          }
          
          body = {
            type: bodyType,
            content: bodyContent
          };
        }

        await prisma.request.create({
          data: {
            id: uuidv4(),
            collectionId: parentId,
            name: resource.name || 'Untitled Request',
            method: resource.method || 'GET',
            url: resource.url || '',
            headers,
            body,
            auth: resource.authentication || {}
          }
        });
        requestsCount++;
      }
    }

    return {
      collectionId: collection.id,
      name: collection.name,
      requestsCount,
      foldersCount
    };
  }

  /**
   * Import cURL command(s)
   */
  async importCurl(curlCommands: string, workspaceId: string): Promise<ImportResult> {
    // Split by lines and filter out comments and empty lines
    const lines = curlCommands
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'));

    // Join continuation lines (lines ending with \)
    let currentCommand = '';
    const commands: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.endsWith('\\')) {
        currentCommand += trimmed.slice(0, -1) + ' ';
      } else {
        currentCommand += trimmed;
        if (currentCommand) {
          commands.push(currentCommand);
          currentCommand = '';
        }
      }
    }

    if (currentCommand) {
      commands.push(currentCommand);
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        id: uuidv4(),
        workspaceId,
        name: commands.length === 1 ? 'Imported cURL Request' : 'Imported cURL Requests',
        description: `Imported ${commands.length} request(s) from cURL`,
        type: 'COLLECTION'
      }
    });

    let requestsCount = 0;

    // Parse each cURL command
    for (const cmd of commands) {
      const parsed = this.parseCurlCommand(cmd);
      if (parsed) {
        await prisma.request.create({
          data: {
            id: uuidv4(),
            collectionId: collection.id,
            name: parsed.name,
            method: parsed.method,
            url: parsed.url,
            headers: parsed.headers,
            body: parsed.body,
            auth: {}
          }
        });
        requestsCount++;
      }
    }

    return {
      collectionId: collection.id,
      name: collection.name,
      requestsCount,
      foldersCount: 0
    };
  }

  /**
   * Parse a single cURL command
   */
  private parseCurlCommand(curl: string): any | null {
    try {
      const parts = curl.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
      let method = 'GET';
      let url = '';
      const headers: any[] = [];
      let body: any = null;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].replace(/^['"]|['"]$/g, '');

        if (part === 'curl') continue;

        if (part === '-X' || part === '--request') {
          method = parts[++i].replace(/^['"]|['"]$/g, '');
        } else if (part === '-H' || part === '--header') {
          const header = parts[++i].replace(/^['"]|['"]$/g, '');
          const [key, ...valueParts] = header.split(':');
          headers.push({
            key: key.trim(),
            value: valueParts.join(':').trim(),
            enabled: true
          });
        } else if (part === '-d' || part === '--data' || part === '--data-raw') {
          const data = parts[++i].replace(/^['"]|['"]$/g, '');
          
          // Try to detect if data is JSON
          let isJson = false;
          try {
            JSON.parse(data);
            isJson = true;
          } catch {
            // Not valid JSON
          }
          
          // Check if Content-Type header indicates JSON
          const contentTypeHeader = headers.find((h: any) => 
            h.key.toLowerCase() === 'content-type'
          );
          if (contentTypeHeader?.value.toLowerCase().includes('application/json')) {
            isJson = true;
          }
          
          if (isJson) {
            body = {
              type: 'json',
              content: data
            };
            
            // Add Content-Type: application/json header if not present
            if (!contentTypeHeader) {
              headers.push({
                key: 'Content-Type',
                value: 'application/json',
                enabled: true
              });
            }
          } else {
            body = {
              type: 'raw',
              content: data
            };
          }
        } else if (!part.startsWith('-') && !url) {
          url = part;
        }
      }

      return {
        name: `${method} ${new URL(url).pathname}`,
        method,
        url,
        headers,
        body
      };
    } catch (error) {
      console.error('Error parsing cURL command:', error);
      return null;
    }
  }

  /**
   * Auto-detect format and import
   */
  async autoImport(data: any, workspaceId: string): Promise<ImportResult> {
    // Detect Postman format
    if (data.info && data.info.schema && data.info.schema.includes('postman')) {
      return this.importPostmanCollection(data, workspaceId);
    }

    // Detect OpenAPI format
    if (data.openapi || data.swagger) {
      return this.importOpenAPI(data, workspaceId);
    }

    // Detect Insomnia format
    if (data.resources && data._type === 'export') {
      return this.importInsomniaCollection(data, workspaceId);
    }

    throw new Error('Unknown or unsupported format');
  }
}
