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
    const swaggerPath = core.getInput('swagger-path') || `${process.cwd()}/swagger.json`;
    const apiName = core.getInput('api-name') || 'Test githubaction API v1';
    const region = core.getInput('aws-region') || 'eu-west-1';
    const basePath = core.getInput('api-base-path') || 'test1-exp-v1';
    const domainName = core.getInput('api-domain-name') || 'dev.openapi.ethias.be';
    const mediaTypes = core.getInput('api-media-types').split("\n") || [];
    const webAcl = core.getInput('api-web-acl') || ''; // Value received is always a string (then false is in fact 'false')
    const additionalHeaders = core.getInput('api-additional-headers') || '';
    
    AWS.config.update({ region }); 

    const apiGtw = new ApiGtw();
    let importedApi;

    const localSwagger = JSON.parse(fs.readFileSync(swaggerPath));
    
    if (targetEnv === 'dev') {
      importedApi = await deployDev({ localSwagger, apiName, basePath, mediaTypes, additionalHeaders });
    } else {
      importedApi = await deploy({ localSwagger, apiName });
    }

    console.log("================== Imported API", JSON.stringify(importedApi, null, 2));
    
    // Deploy the API on default stage
    const deployedApi = await apiGtw.createDeployment(importedApi.id, "CICD deployment", "default", "Default");
    console.log("================== Deployed API", JSON.stringify(deployedApi, null, 2));

    // Associate a web ACL to the stage
    let webAclUpdated = await apiGtw.updateWebAcl(importedApi.id, webAcl, domainName);
    console.log("================== Web ACL", JSON.stringify(webAclUpdated, null, 2));

    // Add stage variable and enable logs
    let stage = await apiGtw.updateStage(importedApi.id, domainName);
    console.log("================== Stage", JSON.stringify(stage, null, 2));

    // Associate API to custom domain name + base path
    let basePathMapping = await apiGtw.getBasePathMapping(basePath, domainName);
    if (!basePathMapping) {
      basePathMapping = await apiGtw.createBasePathMapping(importedApi.id, basePath, domainName);
    }

    console.log("================== basePathMapping", JSON.stringify(basePathMapping, null, 2));
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()