const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');
const ApiGtw = require('./api-gtw');

class ApiMerger {
  constructor(localSwagger, awsSwagger) {
    this.localSwagger = localSwagger;
    this.awsSwagger = awsSwagger;
  }

  mergeSwagger() {
    try {
      console.log("============ SWAGGER (no extension) ====================================================");
      console.log("BEFORE", JSON.stringify(this.localSwagger));
      for(var [key, value, jsonpath] of traverse(this.awsSwagger)) {
        if (key.startsWith('x-amazon')) {
          // We found an extension. Now find the parent object that owns this extension
          const parent = jsonpath.slice(0, -1);
    
          // We know the parent object and therefore its path in the Swagger object
          // Let's find if this parent object also exists in the Swagger file from JAVA
          // If it's the case, then add the extension to it
          const originalObj = get(this.localSwagger, parent);
          if (originalObj && !originalObj[key]) {
            originalObj[key] = value;
          }
        }
      }
      console.log("============ SWAGGER (MERGED) ====================================================");
      const mergedJson = JSON.stringify(this.localSwagger);
      console.log("MERGED", mergedJson);
      return this.localSwagger;

    
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
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
    if (!obj) return null;
  }
  return obj;
}
