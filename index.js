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
    const apiName = core.getInput('api-name') || 'Party Capability API';
    const region = core.getInput('aws-region') || 'eu-west-1';
    AWS.config.update({ region }); 

  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
