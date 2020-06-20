const AWS = require('aws-sdk');

module.exports = class ApiGateway {
  constructor() {
    this.gtw = new AWS.APIGateway();
  }

  async getApiByName(name, options={}) {
    const params = {
      limit: 100,
      position: options.position
    }
    const data = await this.gtw.getRestApis(params).promise();
    const api = data.items.find(api => api.name === name);
    if (api) return api;
    if (data.position) {
      return this.getApiByName(name, {
        position: data.position
      });
    }    
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

  async exportApi(id, options={}) {
    const params = {
      restApiId: id,
      exportType: options.exportApi || 'oas30',
      stageName: options.stageName || 'dev',
      accepts: 'application/json',
      parameters: {
        extensions: 'integrations'
      }
    }

    return await this.gtw.getExport(params).promise();
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
