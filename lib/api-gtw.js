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
      accepts: 'application/json'
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

  // Get the most recent API Gateway client certificate of the account
  async getClientCertificateId() {

    const certificates = await this.gtw.getClientCertificates().promise();
    let certificate;

    if (certificates.items) {
      certificate = certificates.items.reduce((prev, current) => {
        if (!prev.expirationDate || !current.expirationDate)
          throw new Error(
            'One of the API Gateway certificate does not have an expiration date'
          );
        return prev.expirationDate > current.expirationDate
          ? prev
          : current;
      });
    }

    const dateTime = new Date();
    const today = new Date(dateTime.toUTCString());

    if (!certificate) {
      throw new Error(
        'API Gateway client certificate could not be found'
      );
    } else if (certificate.expirationDate && certificate.expirationDate <= today) {
      throw new Error(
        'Client Certificate is expired : please contact an API Gateway administrator'
      );
    }
    console.log('Value of today date : ', today);
    console.log(
      'Here is the value of the api gateway clientCertificate id',
      certificate
    );
    console.log('list of certificates', certificates);

    if (!certificate.clientCertificateId) {
      throw new Error(
        'API Gateway client certificate has no id'
      );
    }

    return certificate.clientCertificateId;    
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

    const resourceArn = 'arn:aws:apigateway:eu-west-1::/restapis/' + restApiId + '/stages/' + stageName;

    console.log("Web acl value : ", webAcl);

    // Explicitly deny webACL then remove if necessery
    if (webAcl === 'false') {
      // Get the stage to find if a web acl is already associated
      const stageParams = {
        restApiId: restApiId,
        stageName: stageName
      }
      const data = await this.gtw.getStage(stageParams).promise();

      // If there is a web acl, then disassociated it
      if (data && data.webAclArn && data.webAclArn.length > 0) {
        const disassociateWebACLParams = {
          ResourceArn: resourceArn
        }
        console.log("Web acl disassociated");
        return await this.waf.disassociateWebACL(disassociateWebACLParams).promise();
      }
      return "No Web ACL associated to the stage"
    }

    const ListWebACLsResponse = await this.waf.listWebACLs(listWebAclsRequest).promise();

    // Check webACL value
    if (typeof webAcl === 'string' || webAcl instanceof String) {
      let webAclArn = '';
      // If a webACL is defined, find if it exists; else use default webACL associated to domain name in config file
      if (webAcl.length > 0) {
        webAclArn = ListWebACLsResponse.WebACLs.find(entry => entry.Name === webAcl ? webAcl : 'standard').ARN || '';
      } else {
        webAclArn = ListWebACLsResponse.WebACLs.find(entry => entry.Name === config.webAcl[domainName] ? config.webAcl[domainName] : 'standard').ARN || '';
      }

      if (webAclArn === '')
        throw new Error("webAcl not found");

      const associateWebACLParams = {
        WebACLArn: webAclArn,
        ResourceArn: resourceArn
      }
      return await this.waf.associateWebACL(associateWebACLParams).promise();
    }
    throw new Error("WebACL format is invalid");
  }

  async updateStage(restApiId, domainName, stageName = 'default') {

    let link = config.stages[domainName]['VPCLINK'];
    let nlb = config.stages[domainName]['VPCNLB'];
    let certificat = await this.getClientCertificateId();
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
