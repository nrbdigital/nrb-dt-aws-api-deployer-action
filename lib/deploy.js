const core = require('@actions/core');
const ApiGtw = require('./api-gtw');

module.exports = async ({
  localSwagger,
  apiName
}) => {
  try { 
    const apiGtw = new ApiGtw();
    let importedApi;

    const awsApi = await apiGtw.getApiByName(apiName);

    if (!awsApi) {
      // create the API
      console.log("create the API");

      // create the API by importing a new Swagger
      importedApi = await apiGtw.createApiFromSwagger(JSON.stringify(localSwagger));

    } else { 
      // Update existing API
      console.log("Existing API", JSON.stringify(awsApi, null, 2));

      // update existing API by importing the new Swagger
      importedApi = await apiGtw.importApi(awsApi.id, JSON.stringify(localSwagger));      
    }
    
    return importedApi;
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

