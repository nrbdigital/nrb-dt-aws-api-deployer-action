const AWS = require('aws-sdk');

AWS.config.update({region: 'eu-west-1'});

const apigateway = new AWS.APIGateway();

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
}
