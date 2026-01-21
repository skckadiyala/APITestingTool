import * as yaml from 'js-yaml';
import archiver from 'archiver';

import { prisma } from '../config/prisma';

export class ExportService {
  /**
   * Export collection as Postman v2.1 format
   */
  async exportAsPostman(collectionId: string): Promise<any> {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        childFolders: {
          include: {
            requests: true,
            childFolders: true
          }
        },
        requests: true
      }
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Recursively build folder structure
    const buildFolderStructure = (folder: any): any => {
      const items: any[] = [];

      // Add requests
      if (folder.requests) {
        folder.requests.forEach((request: any) => {
          // Handle URLs with variables (e.g., {{base_url}})
          let urlObj: any = {
            raw: request.url
          };

          // Parse URL manually to handle variables
          let urlToParse = request.url;
          
          // Remove query string for parsing
          const queryStartIndex = urlToParse.indexOf('?');
          if (queryStartIndex !== -1) {
            urlToParse = urlToParse.substring(0, queryStartIndex);
          }

          // Try to parse URL, or manually extract host and path
          try {
            const parsedUrl = new URL(urlToParse);
            urlObj.protocol = parsedUrl.protocol.replace(':', '');
            urlObj.host = parsedUrl.hostname.split('.');
            urlObj.path = parsedUrl.pathname.split('/').filter(Boolean);
          } catch (error) {
            // URL contains variables, manually extract host and path
            // Remove protocol if present
            let urlWithoutProtocol = urlToParse.replace(/^https?:\/\//, '');
            
            // Split by first /
            const firstSlashIndex = urlWithoutProtocol.indexOf('/');
            
            if (firstSlashIndex !== -1) {
              // Extract host part (e.g., {{base_url}})
              const hostPart = urlWithoutProtocol.substring(0, firstSlashIndex);
              urlObj.host = [hostPart];
              
              // Extract path parts (e.g., {{assets_version}}/assets/software/brand-filter)
              const pathPart = urlWithoutProtocol.substring(firstSlashIndex + 1);
              urlObj.path = pathPart.split('/').filter(Boolean);
            } else {
              // No path, just host
              urlObj.host = [urlWithoutProtocol];
              urlObj.path = [];
            }
          }

          // Add query parameters if present
          if (request.params && Array.isArray(request.params) && request.params.length > 0) {
            urlObj.query = request.params.map((p: any) => ({
              key: p.key,
              value: p.value,
              disabled: p.enabled === false
            }));
          }

          // Convert body back to Postman format
          let postmanBody: any = {};
          if (request.body && request.body.type) {
            if (request.body.type === 'raw') {
              postmanBody = {
                mode: 'raw',
                raw: request.body.content || ''
              };
            } else if (request.body.type === 'urlencoded') {
              postmanBody = {
                mode: 'urlencoded',
                urlencoded: request.body.content || []
              };
            } else if (request.body.type === 'formdata') {
              postmanBody = {
                mode: 'formdata',
                formdata: request.body.content || []
              };
            } else if (request.body.type === 'file') {
              postmanBody = {
                mode: 'file',
                file: request.body.content || {}
              };
            } else if (request.body.type === 'graphql') {
              postmanBody = {
                mode: 'graphql',
                graphql: request.body.content || {}
              };
            }
          }

          const postmanRequest: any = {
            name: request.name,
            request: {
              method: request.method,
              header: request.headers || [],
              body: postmanBody,
              url: urlObj,
              auth: request.auth || {}
            },
            event: [],
            response: []
          };

          // Add test script if present
          if (request.testScript) {
            postmanRequest.event.push({
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: request.testScript.split('\n')
              }
            });
          }

          // Add pre-request script if present
          if (request.preRequestScript) {
            postmanRequest.event.push({
              listen: 'prerequest',
              script: {
                type: 'text/javascript',
                exec: request.preRequestScript.split('\n')
              }
            });
          }

          items.push(postmanRequest);
        });
      }

      // Add child folders
      if (folder.childFolders) {
        folder.childFolders.forEach((child: any) => {
          items.push({
            name: child.name,
            item: buildFolderStructure(child)
          });
        });
      }

      return items;
    };

    // Build collection-level event array for scripts
    const collectionEvents: any[] = [];
    
    if (collection.preRequestScript) {
      collectionEvents.push({
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: collection.preRequestScript.split('\n')
        }
      });
    }
    
    if (collection.testScript) {
      collectionEvents.push({
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: collection.testScript.split('\n')
        }
      });
    }

    const postmanCollection: any = {
      info: {
        name: collection.name,
        description: collection.description || '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: buildFolderStructure(collection)
    };

    // Add collection variables if present
    if (collection.variables && Array.isArray(collection.variables) && collection.variables.length > 0) {
      postmanCollection.variable = collection.variables.map((v: any) => ({
        key: v.key,
        value: v.value || '',
        type: v.type || 'default',
        disabled: v.enabled === false
      }));
    }

    // Add collection-level events (scripts) if present
    if (collectionEvents.length > 0) {
      postmanCollection.event = collectionEvents;
    }

    // Add collection-level auth if present
    if (collection.auth && Object.keys(collection.auth).length > 0) {
      postmanCollection.auth = collection.auth;
    }

    return postmanCollection;
  }

  /**
   * Export collection as cURL commands
   */
  async exportAsCurl(collectionId: string): Promise<string> {
    const collection = await this.getCollectionWithRequests(collectionId);
    const curlCommands: string[] = [];

    const processRequests = (item: any) => {
      if (item.requests) {
        item.requests.forEach((request: any) => {
          let curl = `curl -X ${request.method} "${request.url}"`;

          // Add headers
          if (request.headers && Array.isArray(request.headers)) {
            request.headers.forEach((header: any) => {
              if (header.key && header.value) {
                curl += ` \\\n  -H "${header.key}: ${header.value}"`;
              }
            });
          }

          // Add body
          if (request.body && request.body.content) {
            const bodyContent = typeof request.body.content === 'string' 
              ? request.body.content 
              : JSON.stringify(request.body.content);
            curl += ` \\\n  -d '${bodyContent.replace(/'/g, "\\'")}'`;
          }

          curlCommands.push(`# ${request.name}\n${curl}\n`);
        });
      }

      if (item.childFolders) {
        item.childFolders.forEach(processRequests);
      }
    };

    processRequests(collection);
    return curlCommands.join('\n');
  }

  /**
   * Export collection as OpenAPI 3.0 specification
   */
  async exportAsOpenAPI(collectionId: string): Promise<any> {
    const collection = await this.getCollectionWithRequests(collectionId);

    const paths: any = {};
    const components: any = {
      schemas: {},
      securitySchemes: {}
    };

    const processRequests = (item: any) => {
      if (item.requests) {
        item.requests.forEach((request: any) => {
          try {
            const url = new URL(request.url);
            const path = url.pathname;
            const method = request.method.toLowerCase();

            if (!paths[path]) {
              paths[path] = {};
            }

            const operation: any = {
              summary: request.name,
              description: request.description || '',
              parameters: [],
              responses: {
                '200': {
                  description: 'Successful response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            };

            // Add headers as parameters
            if (request.headers && Array.isArray(request.headers)) {
              request.headers.forEach((header: any) => {
                if (header.key && header.key.toLowerCase() !== 'content-type') {
                  operation.parameters.push({
                    name: header.key,
                    in: 'header',
                    schema: { type: 'string' },
                    example: header.value
                  });
                }
              });
            }

            // Add request body
            if (request.body && request.body.content && ['post', 'put', 'patch'].includes(method)) {
              operation.requestBody = {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    },
                    example: typeof request.body.content === 'string' 
                      ? JSON.parse(request.body.content) 
                      : request.body.content
                  }
                }
              };
            }

            paths[path][method] = operation;
          } catch (error) {
            console.error(`Error processing request ${request.name}:`, error);
          }
        });
      }

      if (item.childFolders) {
        item.childFolders.forEach(processRequests);
      }
    };

    processRequests(collection);

    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: collection.name,
        description: collection.description || '',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'https://api.example.com',
          description: 'API Server'
        }
      ],
      paths,
      components
    };

    return openApiSpec;
  }

  /**
   * Export collection as ZIP file
   */
  async exportAsZip(collectionId: string): Promise<Buffer> {
    const [postmanJson, curlCommands, openApiSpec] = await Promise.all([
      this.exportAsPostman(collectionId),
      this.exportAsCurl(collectionId),
      this.exportAsOpenAPI(collectionId)
    ]);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Add files to ZIP
      archive.append(JSON.stringify(postmanJson, null, 2), { name: 'collection.postman.json' });
      archive.append(curlCommands, { name: 'requests.curl.sh' });
      archive.append(JSON.stringify(openApiSpec, null, 2), { name: 'openapi.json' });
      archive.append(yaml.dump(openApiSpec), { name: 'openapi.yaml' });

      archive.finalize();
    });
  }

  /**
   * Helper to get collection with all nested data
   */
  private async getCollectionWithRequests(collectionId: string): Promise<any> {
    const getNestedStructure = async (parentId: string): Promise<any> => {
      const folder = await prisma.collection.findUnique({
        where: { id: parentId },
        include: {
          requests: true
        }
      });

      if (!folder) return null;

      const childFolders = await prisma.collection.findMany({
        where: { parentFolderId: parentId },
        include: {
          requests: true
        }
      });

      const childrenWithNesting = await Promise.all(
        childFolders.map(async (child) => {
          const nested = await getNestedStructure(child.id);
          return {
            ...child,
            childFolders: nested.childFolders || [],
            requests: nested.requests || []
          };
        })
      );

      return {
        ...folder,
        childFolders: childrenWithNesting,
        requests: folder.requests
      };
    };

    return getNestedStructure(collectionId);
  }
}
