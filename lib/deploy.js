const core = require('@actions/core');
const ApiGtw = require('./api-gtw');
const ApiMerger = require('./api-merger');

module.exports = async ({
  localSwagger,
  apiName,
  basePath,
  mediaTypes,
  additionalHeaders
}) => {
  try {
    localSwagger = handleProxy(localSwagger);
    const apiGtw = new ApiGtw();
    const apiMerger = new ApiMerger();
    let awsSwagger = {}
    let importedApi;

    const awsApi = await apiGtw.getApiByName(apiName);

    if (!awsApi) {
      // create the API
      console.log("create the API");

      // prepare swagger with minimum extension, so we can deploy it on default stage
      const localSwaggerExt = apiMerger.mergeExtensions(localSwagger, apiName, basePath, mediaTypes, additionalHeaders);

      // create the API by importing a new Swagger
      importedApi = await apiGtw.createApiFromSwagger(JSON.stringify(localSwaggerExt));

    } else { 
      // Update existing API
      console.log("Existing API", JSON.stringify(awsApi, null, 2));

      // extract swagger + extension from AWS API GTW
      const exportedApi = await apiGtw.exportApi(awsApi.id)
      awsSwagger = JSON.parse(exportedApi.body.toString());
      console.log("================== AWS SWAGGER", JSON.stringify(awsSwagger, null, 2))
      
      // Merge the AWS Swagger with the local Swagger
      const mergedSwagger = apiMerger.mergeSwagger(localSwagger, awsSwagger);

      // prepare merged swagger with minimum extension, so we can deploy it on default stage
      const mergedSwaggerExt = apiMerger.mergeExtensions(mergedSwagger, apiName, basePath, mediaTypes, additionalHeaders);

      // update existing API by importing the new Swagger
      importedApi = await apiGtw.importApi(awsApi.id, JSON.stringify(mergedSwaggerExt));      
    }

    return importedApi;
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

