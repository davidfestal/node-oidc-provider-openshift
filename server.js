
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
    conformIdTokenClaims: false,
    discovery: true,
    encryption: false,
    introspection: false,
    registration: false,
    request: false,
    revocation: false,
    sessionManagement: false,
  },
});

const keystore = require('./keystore.json');

oidc.initialize({
  keystore,
  clients: [{
    token_endpoint_auth_method: 'none', 
    client_id: 'che',
    grant_types: ['authorization_code', 'implicit'],
    response_types: ['code', 'token', 'id_token'],
    redirect_uris: [process.env.REDIRECT_URIS] 
  }],
}).then(() => {
  oidc.listen(process.env.OIDC_PROVIDER_SERVICE_PORT);
},(error) => {
  console.error(error);
});
