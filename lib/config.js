module.exports = {

  stages: {
    "dev.openapi.ethias.be": {
      "VPCLINK": "guns5x",
      "VPCNLB": "dev.openapi.ethias.be"
    },
    "tst.openapi.ethias.be": {
      "VPCLINK": "k1g0rl",
      "VPCNLB": "tst.openapi.ethias.be"
    }
  },

  clientCertificates: {
    "dev.openapi.ethias.be": "y53exk",
    "tst.openapi.ethias.be": "zhvjoe"
  },

  webAcl: {
    "dev.openapi.ethias.be": "eth-oi-dev-acl",
    "tst.openapi.ethias.be": "eth-oi-tst-acl"
  }

};
