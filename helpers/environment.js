const environments = {};

environments.staging = {
    port: 3000,
    envName: 'staging',
    secretKey: 'a2sdjk&sfw2@hsh&sjw',
    maxChecks: 5
};

environments.production = {
    port: 7000,
    envName: 'production'
};

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV : 'staging';

const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] :
environments.staging;

module.exports = environmentToExport;