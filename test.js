const fs = require('fs');
const core = require('@actions/core');
const wait = require('./wait');
const AWS = require('aws-sdk');
const ApiGtw = require('./lib/api-gtw');
const ApiMerger = require('./lib/api-merger');

// most @actions toolkit packages have async methods
async function run() {
  try { 
       
    const swaggerPath = core.getInput('swagger-path') || `${process.cwd()}/../test/api-gtw-action-tester/swagger/swagger.json`;
    const swaggerExtPath = core.getInput('swagger-with-extension-path') || `${process.cwd()}/../test/api-gtw-action-tester/swagger/swagger_ext.json`;
    const tmpPath = core.getInput('tmp-path') || '/tmp';
    const apiName = core.getInput('api-name') || 'OpenAPI definition';
    const region = core.getInput('aws-region') || 'eu-west-1';
    const basePath = core.getInput('api-base-path') || 'test1-exp-v1';
    AWS.config.update({ region }); 

    // // Merge the AWS Swagger with the local Swagger
    // const localSwagger = JSON.parse(fs.readFileSync(swaggerPath));
    // const awsSwagger = JSON.parse(fs.readFileSync(swaggerExtPath));
    // const apiMerger = new ApiMerger(localSwagger, awsSwagger);
    // const mergedSwagger = apiMerger.mergeSwagger();

    const apiGtw = new ApiGtw();
    
    await apiGtw.createBasePathMapping('dcy4n0kfnb', 'test-basepath', 'api.sandbox.flora.insure');  
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
