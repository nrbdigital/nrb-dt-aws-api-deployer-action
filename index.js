const fs = require('fs');
const core = require('@actions/core');
const wait = require('./wait');
const AWS = require('aws-sdk');
const ApiGtw = require('./lib/api-gtw');
const ApiMerger = require('./lib/api-merger');
const deploy = require('./lib/deploy');
const deployDev = require('./lib/deploy-dev');

async function run() {
  try { 
    const targetEnv = core.getInput('target-env') || 'dev';
    const swaggerPath = core.getInput('swagger-path') || `${process.cwd()}/../test/api-gtw-action-tester/swagger/swagger.json`;
    const apiName = core.getInput('api-name') || 'test1-experience-api-v1';
    const region = core.getInput('aws-region') || 'eu-west-1';
    const basePath = core.getInput('api-base-path') || 'test1-exp-v1';
    const domainName = core.getInput('api-domain-name') || 'api.sandbox.flora.insure';
    AWS.config.update({ region }); 

    const apiGtw = new ApiGtw();
    let importedApi;

    const localSwagger = JSON.parse(fs.readFileSync(swaggerPath));
    
    if (targetEnv === 'dev') {
      importedApi = await deployDev({ localSwagger, apiName });
    } else {
      importedApi = await deploy({ localSwagger, apiName });
    }

    console.log("================== Imported API", JSON.stringify(importedApi, null, 2));

    // Deploy the API on default stage
    const deployedApi = await apiGtw.createDeployment(importedApi.id, "CICD deployment", "default", "Default");
    console.log("================== Deployed API", JSON.stringify(deployedApi, null, 2));

    // associate API to custom domain name + base path
    /* UNCOMMENT LINES BELOW WHEN DOMAIN NAME WILL BE AVAILABLE
    let basePathMapping = await apiGtw.getBasePathMapping(basePath, domainName);
    if (!basePathMapping) {
      basePathMapping = await apiGtw.createBasePathMapping(importedApi.id, basePath, domainName);
    }

    console.log("================== basePathMapping", JSON.stringify(basePathMapping, null, 2));*/
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
