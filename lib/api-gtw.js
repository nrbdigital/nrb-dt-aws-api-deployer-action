const AWS = require('aws-sdk');
const config = require('./config');

module.exports = class ApiGateway {
  constructor() {
    this.gtw = new AWS.APIGateway();
    this.waf = new AWS.WAFV2();
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


  async exportApi(id, options = {}) {
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

  async createBasePathMapping(restApiId, basePath, domainName, stage = 'default') {
    const params = {
      restApiId,
      basePath,
      domainName,
      stage
    }
    const data = await this.gtw.createBasePathMapping(params).promise();
    return data;
  }

  async createDeployment(restApiId, description, stageName, stageDescription, options = {}) {
    const params = {
      restApiId,
      description,
      stageName,
      stageDescription
    }

    return await this.gtw.createDeployment(params).promise();
  }

  async getApiByName(name, options = {}) {
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

  async getBasePathMapping(basePath, domainName, options = {}) {
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

  async importApi(id, swagger, options = {}) {
    const params = {
      restApiId: id,
      mode: options.mode || 'overwrite',
      failOnWarnings: options.failOnWarnings || false,
      body: swagger
    }

    return await this.gtw.putRestApi(params).promise();
  }

  async updateWebAcl(restApiId, webAcl, domainName, stageName = 'default') {
    const listWebAclsRequest = {
      Scope: "REGIONAL"
    }

    // Explicitly deny webACL
    if(webAcl === false) {
      return "No WebACL associated to the stage";
    }

    const ListWebACLsResponse = await this.waf.listWebACLs(listWebAclsRequest).promise();

    // Check webACL value
    if(typeof webAcl === 'string' || webAcl instanceof String) {
      let webAclArn = '';
      // If a webACL is defined, find if it exists; else use default webACL associated to domain name in config file
      if(webAcl.length > 0){
        webAclArn = ListWebACLsResponse.WebACLs.find(entry => entry.Name === webAcl ? webAcl : 'standard').ARN || '';   
      } else {
        webAclArn = ListWebACLsResponse.WebACLs.find(entry => entry.Name === config.webAcl[domainName] ? config.webAcl[domainName] : 'standard').ARN || '';        
      }

      if (webAclArn === '')
          throw new Error("webAcl not found");

        const associateWebACLParams = {
          WebACLArn: webAclArn,
          ResourceArn: 'arn:aws:apigateway:eu-west-1::/restapis/' + restApiId + '/stages/' + stageName
        }
        return await this.waf.associateWebACL(associateWebACLParams).promise();
    }
    throw new Error("WebACL format is invalid");
  }

  async updateStage(restApiId, domainName, stageName = 'default') {

    let link = config.stages[domainName]['VPCLINK'];
    let nlb = config.stages[domainName]['VPCNLB'];
    let certificat = config.clientCertificates[domainName];
    let logLevel = "INFO";

    const params = {
      restApiId, 
      stageName, 
      patchOperations: [
        {
          op: 'replace',
          path: '/variables/VPCLINK',
          value: link
        },
        {
          op: 'replace',
          path: '/variables/VPCNLB',
          value: nlb
        },
        {
          op: 'replace',
          path: '/clientCertificateId',
          value: certificat
        },
        {
          op: 'replace',
          path: '/*/*/logging/dataTrace',
          value: "true"
        },
        {
          op: 'replace',
          path: '/*/*/logging/loglevel',
          value: logLevel
        }
      ]
    };
    return await this.gtw.updateStage(params).promise();    
  }
}
