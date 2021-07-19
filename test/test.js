const fs = require('fs');
const core = require('@actions/core');
const wait = require('../wait');
const AWS = require('aws-sdk');
const ApiGtw = require('../lib/api-gtw');
const ApiMerger = require('../lib/api-merger');

// most @actions toolkit packages have async methods
async function run() {
  try { 
    const swaggerPath = core.getInput('swagger-path') || `${process.cwd()}/swagger/proxy-cap-v1.json`;
    const swaggerExtPath = core.getInput('swagger-with-extension-path') || `${process.cwd()}/swagger/proxy-cap-v1-ext.json`;
    const tmpPath = core.getInput('tmp-path') || '/tmp';
    const apiName = core.getInput('api-name') || 'Proxy Cap OpenAPI definition';
    const region = core.getInput('aws-region') || 'eu-west-1';
    const basePath = core.getInput('api-base-path') || 'proxy-cap-v1';
    AWS.config.update({ region }); 

    // // Merge the AWS Swagger with the local Swagger
    let localSwagger = JSON.parse(fs.readFileSync(swaggerPath));
    localSwagger = handleProxy(localSwagger);
    const awsSwagger = {}
    // const awsSwagger = JSON.parse(fs.readFileSync(swaggerExtPath));
    const apiMerger = new ApiMerger();

    const mergedAwsSwagger = apiMerger.mergeExtensions(localSwagger, 'Test githubaction API v1', 'proxy-cap-v1', [], '');

    // const apiGtw = new ApiGtw();
    
    // await apiGtw.createBasePathMapping('4e71czqpbl', 'esignature-v1', 'dev.openapi.ethias.be');  
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

function handleProxy(localSwagger) {
  if (localSwagger.paths) {
    Object.keys(localSwagger.paths).forEach(path => {
      if (path.endsWith('/**')) {
        localSwagger.paths[path.replace('/**', '/{proxy+}')] =
          localSwagger.paths[path];
        delete localSwagger.paths[path];
      }
    });
  }
  return localSwagger;
}

run()
