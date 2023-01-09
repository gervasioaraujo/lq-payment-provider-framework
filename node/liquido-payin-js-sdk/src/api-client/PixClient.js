const {
    Config,
} = require('../util/index');

const PayInClient = require('./PayInClient');

const {
    PayInRequest
} = require('../model/index');

class PixClient extends PayInClient {

    static ENDPOINT = "/v1/payments/charges/pix";

    constructor(configData = new Config(), accessToken = null) {
        super(configData, accessToken);
    }

    async createPayIn(pixRequest = new PayInRequest()) {
        const url = this.configData.getPayInBaseUrl() + PixClient.ENDPOINT;
        const pixResponse = await super.createPayIn(url, pixRequest);
        return pixResponse;
    }

}

module.exports = PixClient;