
const assert = require('assert');
const Provider = require('oidc-provider');
const getCors = require('@koa/cors');

assert(process.env.ROUTE_URL, 'process.env.ROUTE_URL missing');
assert(process.env.OIDC_PROVIDER_SERVICE_PORT, 'process.env.OIDC_PROVIDER_SERVICE_PORT missing');
assert(process.env.REDIRECT_URI_DASHBOARD, 'process.env.REDIRECT_URI_DASHBOARD missing');
assert(process.env.REDIRECT_URI_IDE, 'process.env.REDIRECT_URI_IDE missing');

const oidc = new Provider(process.env.ROUTE_URL, {
  formats: {
    default: 'opaque',
    AccessToken: 'jwt',
    RefreshToken: 'jwt'
  },
  features: {
    alwaysIssueRefresh: true,
    sessionManagement: true,
  },
  claims: {
    address: ['address'],
    email: ['email', 'email_verified'],
    phone: ['phone_number', 'phone_number_verified'],
    profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name',
      'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo'],
  },
  async findById(ctx, id) {
    return {
      accountId: id,
      async claims(use, scope) {
        return { 
          sub: id,
          email: id + '@minishift',
          preferred_username: id,
          given_name: id
        };
      },
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
    redirect_uris: [process.env.REDIRECT_URI_DASHBOARD, process.env.REDIRECT_URI_IDE] 
  }],
}).then(() => {
  const tokenCors = getCors({
    allowedMethods: 'GET,POST', exposeHeaders: 'WWW-Authenticate', allowHeaders: 'Authorization', credentials: true
  });  
  oidc.use(async (ctx, next) => {
  if (ctx.request.path == oidc.pathFor('token')) {
    await tokenCors(ctx, next);
  } else {
    await next();
  }
});
  oidc.listen(process.env.OIDC_PROVIDER_SERVICE_PORT);
},(error) => {
  console.error(error);
});
