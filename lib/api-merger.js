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
      for(var [key, value, jsonpath] of traverse(awsSwagger)) {
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


  mergeMockExtensions(localSwagger, basePath) {
    try {
      const swagger = localSwagger;
      console.log("============ SWAGGER (no extension) ====================================================");
      console.log(JSON.stringify(swagger));
      
      if (swagger.paths) {
        Object.keys(swagger.paths).forEach(path => {
          Object.keys(swagger.paths[path]).forEach(operation => {
            if (!swagger.paths[path][operation]['x-amazon-apigateway-integration']) {
              swagger.paths[path][operation]['x-amazon-apigateway-integration'] = {
                "uri": "http://${stageVariables.VPCNLB}/" + basePath + path,
                "responses": {
                  "default": {
                    "statusCode": "200"
                  }
                },
                "requestTemplates": {
                  "application/json": "{\"statusCode\": 200}"
                },
                "passthroughBehavior": "when_no_match",
                "connectionType": "VPC_LINK",
                "connectionId": "${stageVariables.VPCLINK}",
                "httpMethod": operation,
                "type": "http_proxy"
              }
            }
          })
        })
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
