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
    const tmpPath = core.getInput('tmp-path') || '/tmp';
    const apiName = core.getInput('api-name') || 'OpenAPI definition';
    const region = core.getInput('aws-region') || 'eu-west-1';
    AWS.config.update({ region }); 

    const apiGtw = new ApiGtw();
    let awsApi = await apiGtw.getApiByName(apiName);
    let awsSwagger = {}
    if (!awsApi) {
      // create the API
      console.log("create the API");
      awsApi = await apiGtw.createApi(apiName, 'TODO Description');
    } else {
      // extract swagger + extension from AWS API GTW
      console.log("Existing API", awsApi);
      const exportedApi = await apiGtw.exportApi(awsApi.id)
      awsSwagger = JSON.parse(exportedApi.body.toString());
      console.log("================== AWS SWAGGER", JSON.stringify(awsSwagger))
    }

    // Merge the AWS Swagger with the local Swagger
    const localSwagger = JSON.parse(fs.readFileSync(swaggerPath));
    const apiMerger = new ApiMerger(localSwagger, awsSwagger);
    const mergedSwagger = apiMerger.mergeSwagger();

    const importedApi = await apiGtw.importApi(awsApi.id, JSON.stringify(mergedSwagger));
    console.log("Imported API", importedApi);
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
