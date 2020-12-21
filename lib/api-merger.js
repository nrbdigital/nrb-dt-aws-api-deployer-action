const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');
const ApiGtw = require('./api-gtw');

module.exports = class ApiMerger {

  mergeSwagger(localSwagger, awsSwagger) {
    try {
      console.log("============ SWAGGER (no extension) ====================================================");
      console.log(JSON.stringify(localSwagger));
      for (var [key, value, jsonpath] of traverse(awsSwagger)) {
        if (key.startsWith('x-amazon')) {
          // We found an extension. Now find the parent object that owns this extension
          const parent = jsonpath.slice(0, -1);

          // We know the parent object and therefore its path in the Swagger object
          // Let's find if this parent object also exists in the Swagger file from JAVA
          // If it's the case, then add the extension to it
          const originalObj = get(localSwagger, parent);
          if (originalObj && !originalObj[key]) {
            originalObj[key] = value;
          }
        }
      }
      console.log("============ SWAGGER (MERGED) ====================================================");
      console.log(JSON.stringify(localSwagger));
      return localSwagger;

      // Save the merged JSON in a file
      // const swaggerMergedPath = path.join(this.tmpPath, 'merged-swagger.json');
      // fs.writeFileSync(swaggerMergedPath, mergedJson);
      // core.setOutput("merged-swagger-path", swaggerMergedPath);
    } catch (error) {
      core.setFailed(error.message);
    }
  }


  mergeMockExtensions(localSwagger, basePath, mediaTypes) {
    try {
      const swagger = localSwagger;
      console.log("============ SWAGGER (no extension) ====================================================");
      console.log(JSON.stringify(swagger));

      if (swagger.paths) {
        Object.keys(swagger.paths).forEach(path => {
          Object.keys(swagger.paths[path]).forEach(operation => {
            // Add the integration to the VPC_LINK
            if (!swagger.paths[path][operation]['x-amazon-apigateway-integration']) {

              // Fill the requestParameters attribute if there are some path/query parameters
              let requestParameters = {};
              if(swagger.paths[path][operation].parameters) {
                Object.keys(swagger.paths[path][operation].parameters).forEach(parameter => {
                  let nameParameter = swagger.paths[path][operation].parameters[parameter].name;
                  
                  // Other parameter type exist and can be found here : https://docs.aws.amazon.com/apigateway/latest/developerguide/request-response-data-mappings.html
                  switch (swagger.paths[path][operation].parameters[parameter].in) {
                    case 'query':
                      requestParameters['integration.request.querystring.'+nameParameter] = "method.request.querystring."+nameParameter;
                      break;
                    case 'path':
                      requestParameters['integration.request.path.'+nameParameter] = "method.request.path."+nameParameter;
                      break;
                    case 'header':     
                      requestParameters['integration.request.header.'+nameParameter] = "method.request.header."+nameParameter;             
                      break;
                  }
                });
              }

              swagger.paths[path][operation]['x-amazon-apigateway-integration'] = {
                "uri": "https://${stageVariables.VPCNLB}/" + basePath + path,
                "responses": {
                  "default": {
                    "statusCode": "200"
                  }
                },
                "requestTemplates": {
                  "application/json": "{\"statusCode\": 200}"
                },
                "requestParameters": requestParameters,
                "passthroughBehavior": "when_no_match",
                "connectionType": "VPC_LINK",
                "connectionId": "${stageVariables.VPCLINK}",
                "httpMethod": operation,
                "type": "http_proxy"
              }
            }

            // Add CORS header for each response code (200,300,400,500,...)
            Object.keys(swagger.paths[path][operation].responses).forEach(responseCode => {
              // Add the header field if needed
              if (!swagger.paths[path][operation].responses[responseCode].headers) {
                swagger.paths[path][operation].responses[responseCode].headers = {};
              }

              // Add the CORS header
              swagger.paths[path][operation].responses[responseCode].headers["Access-Control-Allow-Origin"] = {
                "schema": {
                  "type": "string"
                }
              }
            })
          });
          // Add "OPTIONS" operation if needed
          if (!swagger.paths[path].options) {
            // String with all defined operations, i.e. : GET,OPTIONS,PUT
            let formattedOperations = Object.keys(swagger.paths[path]).sort().join(',').toUpperCase();

            swagger.paths[path].options = {
              "responses": {
                "200": {
                  "description": "200 response",
                  "headers": {
                    "Access-Control-Allow-Origin": {
                      "schema": {
                        "type": "string"
                      }
                    },
                    "Access-Control-Allow-Methods": {
                      "schema": {
                        "type": "string"
                      }
                    },
                    "Access-Control-Allow-Headers": {
                      "schema": {
                        "type": "string"
                      }
                    }
                  },
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/Empty"
                      }
                    }
                  }
                }
              },
              "x-amazon-apigateway-integration": {
                "responses": {
                  "default": {
                    "statusCode": "200",
                    "responseParameters": {
                      "method.response.header.Access-Control-Allow-Methods": "'" + formattedOperations + "'",
                      "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                      "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                  }
                },
                "requestTemplates": {
                  "application/json": "{\"statusCode\": 200}"
                },
                "passthroughBehavior": "when_no_match",
                "type": "mock"
              }
            }
          }
        });
      }
      // Add the "Empty" model required by the operation "OPTIONS" for CORS
      if (swagger.components && swagger.components.schemas) {
        if (!swagger.components.schemas['Empty']) {
          swagger.components.schemas['Empty'] = {
            "title": "Empty Schema",
            "type": "object"
          }
        }
      }

      // Add media-types if given in argument
      if (swagger && mediaTypes.length > 0) {
        swagger['x-amazon-apigateway-binary-media-types'] = mediaTypes;
      }

      console.log("============ SWAGGER (MERGED) ====================================================");
      const mergedJson = JSON.stringify(swagger);
      console.log(mergedJson);
      return swagger;

    
      // Save the merged JSON in a file
      // const swaggerMergedPath = path.join(this.tmpPath, 'merged-swagger.json');
      // fs.writeFileSync(swaggerMergedPath, mergedJson);
      // core.setOutput("merged-swagger-path", swaggerMergedPath);
    } catch (error) {
      core.setFailed(error.message);
    }
  }
}

function* traverse(o) {
  const memory = new Set();
  function * innerTraversal (o, jsonpath=[]) {
    if(memory.has(o)) {
      // we've seen this object before don't iterate it
      return;
    }
    // add the new object to our memory.
    memory.add(o);
    for (var i of Object.keys(o)) {
      const itemPath = jsonpath.concat(i);
      yield [i,o[i],itemPath]; 
      if (o[i] !== null && typeof(o[i])=="object") {
        //going one step down in the object tree!!
        yield* innerTraversal(o[i], itemPath);
      }
    }
  }
    
  yield* innerTraversal(o);
}

function get(obj, keys) {
  for (let i = 0; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (!obj) return null;
  }
  return obj;
}
