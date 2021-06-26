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
    "internal.api.dev.flora.insure": {
      "VPCLINK": "5cl4aw",
      "VPCNLB": "api.dev.flora.insure"
      
    }
  },

  clientCertificates: {
    "dev.openapi.ethias.be": "y53exk",
    "tst.openapi.ethias.be": "zhvjoe",
    "internal.api.dev.flora.insure": "5c6i0j"
  },

  webAcl: {
    "dev.openapi.ethias.be": "eth-oi-dev-acl",
    "tst.openapi.ethias.be": "eth-oi-tst-acl",
    "internal.api.dev.flora.insure": "flora-dev-api"
  }

};
