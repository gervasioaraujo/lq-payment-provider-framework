class Config {

    static LIQUIDO_SANDBOX_AUTH_URL = "https://auth-dev.liquido.com/oauth2/token";
    static LIQUIDO_SANDBOX_PAYIN_BASE_URL = "https://api-qa.liquido.com";

    static LIQUIDO_PRODUCTION_AUTH_URL = "https://authsg.liquido.com/oauth2/token";
    static LIQUIDO_PRODUCTION_PAYIN_BASE_URL = "https://api.liquido.com";

    static GRANT_TYPE = "client_credentials";

    constructor(configData = {}, isLiveMode = false) {

        if (configData.hasOwnProperty('clientId')) {
            this.clientId = configData.clientId;
        }

        if (configData.hasOwnProperty('clientSecret')) {
            this.clientSecret = configData.clientSecret;
        }

        if (configData.hasOwnProperty('apiKey')) {
            this.apiKey = configData.apiKey;
        }

        this.isLiveMode = isLiveMode;
    }

    getAuthUrl() {
        if (this.isLiveMode) {
            return Config.LIQUIDO_PRODUCTION_AUTH_URL;
        }
        return Config.LIQUIDO_SANDBOX_AUTH_URL;
    }

    getPayInBaseUrl() {
        if (this.isLiveMode) {
            return Config.LIQUIDO_PRODUCTION_PAYIN_BASE_URL;
        }
        return Config.LIQUIDO_SANDBOX_PAYIN_BASE_URL;
    }

    getClientId() {
        return this.clientId;
    }

    getClientSecret() {
        return this.clientSecret;
    }

    getClientApiKey() {
        return this.apiKey;
    }

}

module.exports = Config;