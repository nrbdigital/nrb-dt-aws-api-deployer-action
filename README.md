# AWS API GTW swagger merger

Merge a swagger with extension from AWS API GTW with a standard swagger from a JAVA project

## Inputs

| Name              | Required | Description                                                                            |
| ----------------- | -------- | -------------------------------------------------------------------------------------- |
| `target-env`      | x        | The environement on which the API will be deployed. Allowed values: dev, tst, acc, prd |
| `swagger-path`    | x        | The path of the swagger file generated by JAVA                                         |
| `api-name`        | x        | The name of the API. Example: Client Experience API                                     |
| `api-domain-name` | x        | The domain of the API. Example: api.example.com                                      |
| `api-base-path`   | x        | The base path of the API. Example: client-exp-v1                                        |
| `api-media-types` |          | The media-types of the API. Example: multipart/form-data                                |
| `api-web-acl`     |          | The web-acl of the api (i.e: eth-oi-dev-acl, false)                                |
| `aws-region`      |          | The AWS region on which the API will be deployed. Default: 'eu-west-1'                 |

## Outputs

## Example usage

```yaml
uses: brunofrankinrb/aws-api-gtw-deployer@v1
with:
  target-env: dev
  swagger-path: /tmp/swagger-extension.json
  api-name: "Client Experience API"
  api-domain-name: api.example.com
  api-base-path: client-exp-v1
  api-media-types: |
    multipart/form-data
    application/pdf
  aws-region: eu-west-1
```
#