const axios = require('axios');

const {
    Config,
} = require('../util/index');

class AuthClient {

    constructor(configData = new Config()) {
        this.configData = configData;
    }

    async authenticate() {

        try {
            const response = await axios.post(
                this.configData.getAuthUrl(),
                new URLSearchParams({
                    client_id: this.configData.getClientId(),
                    client_secret: this.configData.getClientSecret(),
                    grant_type: Config.GRANT_TYPE
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });

            const authResponse = response.data;
            return authResponse;
        } catch (error) {
            console.error(error);
            throw "Error while request pay in to Liquido BR API.";
        }
    }

}

module.exports = AuthClient;