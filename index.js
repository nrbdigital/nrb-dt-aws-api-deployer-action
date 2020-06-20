const core = require('@actions/core');
const wait = require('./wait');
const AWS = require('aws-sdk');
const ApiGtw = require('./lib/api-gtw')

// most @actions toolkit packages have async methods
async function run() {
  try { 
       
    const swaggerPath = core.getInput('swagger-path') || `${process.cwd()}/swagger/swagger.json`;
    const swaggerExtPath = core.getInput('swagger-with-extension-path') || `${process.cwd()}/swagger/swagger_ext.json`;
    const tmpPath = core.getInput('tmp-path') || '/tmp';
    const apiName = core.getInput('api-name') || 'My First API';
    const region = core.getInput('aws-region') || 'eu-west-1';
    AWS.config.update({ region }); 

    const apiGtw = new ApiGtw();
    let awsApi = await apiGtw.getApiByName(apiName);
    if (!awsApi) {
      // TODO: create the API
      console.log("must create the API");
      awsApi = await apiGtw.createApi(apiName, 'TODO Description');
      console.log("New API", awsApi);
    } else {
      console.log("Existing API", awsApi);
      const awsSwagger = await apiGtw.exportApi(awsApi.id)
      console.log(awsSwagger.body.toString());
    }
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
