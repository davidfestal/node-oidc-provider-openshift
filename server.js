
const assert = require('assert');
const Provider = require('oidc-provider');
const getCors = require('@koa/cors');

assert(process.env.ROUTE_URL, 'process.env.ROUTE_URL missing');
assert(process.env.OIDC_PROVIDER_SERVICE_PORT, 'process.env.OIDC_PROVIDER_SERVICE_PORT missing');
assert(process.env.REDIRECT_URIS, 'process.env.REDIRECT_URIS missing');

const oidc = new Provider(process.env.ROUTE_URL, {
  formats: {
    default: 'opaque',
    AccessToken: 'jwt',
    RefreshToken: 'jwt'
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
  scopes: [ 'openid','offline_access' ],
  claims: {
    openid: ['preferred_username', 'email'],
    email: ['email', 'email_verified'],
    phone: ['phone_number', 'phone_number_verified'],
    profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name',
      'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo'],
  },
  async findById(ctx, id) {
    return {
      accountId: id,
      async claims(use, scope) { return { 
        sub: id,
        email: 'developer@developer',
        given_name: 'first name',
        family_name: 'last name',
        preferred_username: 'developer'
      }; },
    };
  }
});

const keystore = require('./keystore.json');

oidc.initialize({
  keystore,
  clients: [{
    token_endpoint_auth_method: 'none', 
    client_id: 'che',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: [process.env.REDIRECT_URIS] 
  }],
}).then(() => {
  const tokenCors = getCors({
    allowedMethods: 'GET,POST', exposeHeaders: 'WWW-Authenticate', allowHeaders: 'Authorization', credentials: true
  });  
  oidc.use(async (ctx, next) => {
  if (ctx.request.path == oidc.pathFor('token')) {
    await tokenCors(ctx, next);
    console.log('ctx.body.accessToken: ', ctx.body.accessToken);
  } else {
    await next();
  }
});
  oidc.listen(process.env.OIDC_PROVIDER_SERVICE_PORT);
},(error) => {
  console.error(error);
});
