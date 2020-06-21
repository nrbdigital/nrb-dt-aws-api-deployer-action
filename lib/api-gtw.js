const AWS = require('aws-sdk');

module.exports = class ApiGateway {
  constructor() {
    this.gtw = new AWS.APIGateway();
  }

  async createApi(name, description) {
    const params = {
      name,
      binaryMediaTypes: ["multipart/form-data"],
      description,
      endpointConfiguration: {
        types: ["REGIONAL"]
      }
    }
    const data = await this.gtw.createRestApi(params).promise();
    return data;
  }

  async createApiFromSwagger(swagger) {
    const params = {
      body: swagger,
      failOnWarnings: false,
      parameters: {
        endpointConfigurationTypes: "REGIONAL"
      }
    }
    const data = await this.gtw.importRestApi(params).promise();
    return data;
  }


  async exportApi(id, options={}) {
    const params = {
      restApiId: id,
      exportType: options.exportApi || 'oas30',
      stageName: options.stageName || 'default',
      accepts: 'application/json',
      parameters: {
        extensions: 'integrations'
      }
    }

    return await this.gtw.getExport(params).promise();
  }

  async createBasePathMapping(restApiId, basePath, domainName, stage='default') {
    const params = {
      restApiId,
      basePath,
      domainName,
      stage
    }
    const data = await this.gtw.createBasePathMapping(params).promise();
    return data;
  }  

  async createDeployment(restApiId, description, stageName, stageDescription, options={}) {
    const params = {
      restApiId,
      description,
      stageName,
      stageDescription
    }

    return await this.gtw.createDeployment(params).promise();
  }  

  async getApiByName(name, options={}) {
    const params = {
      limit: 200,
      position: options.position
    }
    const data = await this.gtw.getRestApis(params).promise();
    const api = data.items.find(api => api.name === name);
    if (api) return api;
    if (data.position) {
      return await this.getApiByName(name, {
        position: data.position
      });
    }    
  }

  async getBasePathMapping(basePath, domainName, options={}) {
    const params = {
      domainName,
      limit: 200,
      position: options.position
    }

    const data = await this.gtw.getBasePathMappings(params).promise();
    const mapping = data.items.find(item => item.basePath === basePath);
    if (mapping) return mapping;
    if (data.position) {
      return await this.getApiByName(basePath, domainName, {
        position: data.position
      });
    }
  }

  async importApi(id, swagger, options={}) {
    const params = {
      restApiId: id,
      mode: options.mode || 'overwrite',
      failOnWarnings: options.failOnWarnings || false,
      body: swagger
    }

    return await this.gtw.putRestApi(params).promise();
  }
}
