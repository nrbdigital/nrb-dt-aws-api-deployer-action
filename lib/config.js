module.exports = {

  stages: {
    "dev.openapi.ethias.be": {
      "VPCLINK": "guns5x",
      "VPCNLB": "dev.openapi.ethias.be"
    },
    "tst.openapi.ethias.be": {
      "VPCLINK": "k1g0rl",
      "VPCNLB": "tst.openapi.ethias.be"
    },
    "acc.openapi.ethias.be": {
      "VPCLINK": "23su07",
      "VPCNLB": "acc.openapi.ethias.be"
    },
    "openapi.ethias.be": {
      "VPCLINK": "6p9jke",
      "VPCNLB": "openapi.ethias.be"
    },
    "internal.api.dev.flora.insure": {
      "VPCLINK": "5cl4aw",
      "VPCNLB": "api.dev.flora.insure"
    },
    "internal.api.tst.flora.insure": {
      "VPCLINK": "biu50r",
      "VPCNLB": "api.tst.flora.insure"
    },
    "api.dev.flora.insure": {
      "VPCLINK": "5cl4aw",
      "VPCNLB": "api.dev.flora.insure"
    },
    "api.tst.flora.insure": {
      "VPCLINK": "biu50r",
      "VPCNLB": "api.tst.flora.insure"
    },
    "api.ho-tplink.ho-sbx.nrbdigital.be": {
      "VPCLINK": "lyi4dy",
      "VPCNLB": "kx72qmp5fw.eu-west-1.awsapprunner.com"
    }
  },

  webAcl: {
    "dev.openapi.ethias.be": "eth-oi-dev-acl",
    "tst.openapi.ethias.be": "eth-oi-tst-acl",
    "acc.openapi.ethias.be": "eth-oi-acc-acl",
    "openapi.ethias.be": "eth-oi-prd-acl",
    "internal.api.dev.flora.insure": "flora-dev-api",
    "internal.api.tst.flora.insure": "flora-tst-api",    
    "api.dev.flora.insure": "flora-dev-api",
    "api.tst.flora.insure": "flora-tst-api",
    "api.ho-tplink.ho-sbx.nrbdigital.be": "acl-test-sbx"
  }

};
