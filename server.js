
const assert = require('assert');
const Provider = require('oidc-provider');

assert(process.env.ROUTE_URL, 'process.env.ROUTE_URL missing');
assert(process.env.OIDC_PROVIDER_SERVICE_PORT, 'process.env.OIDC_PROVIDER_SERVICE_PORT missing');
assert(process.env.REDIRECT_URIS, 'process.env.REDIRECT_URIS missing');

const oidc = new Provider(process.env.ROUTE_URL, {
  formats: {
    default: 'opaque',
    AccessToken: 'jwt',
  },
  features: {
    claimsParameter: true,
    conformIdTokenClaims: true,
    discovery: true,
    encryption: true,
    introspection: true,
    registration: true,
    request: true,
    revocation: true,
    sessionManagement: true,
  },
});

const keystore = require('./keystore.json');

oidc.initialize({
  keystore,
  clients: [{ client_id: 'foo', token_endpoint_auth_method: ['client_secret_jwt'], redirect_uris: [process.env.REDIRECT_URIS] }],
}).then(() => {
  oidc.listen(process.env.OIDC_PROVIDER_SERVICE_PORT);
});
