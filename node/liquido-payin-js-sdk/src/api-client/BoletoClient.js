const {
    Config,
} = require('../util/index');

const PayInClient = require('./PayInClient');

const {
    PayInRequest
} = require('../model/index');

class BoletoClient extends PayInClient {

    static ENDPOINT = "/v1/payments/charges/boleto";

    constructor(configData = new Config(), accessToken = null) {
        super(configData, accessToken);
    }

    async createPayIn(boletoRequest = new PayInRequest()) {
        const url = this.configData.getPayInBaseUrl() + BoletoClient.ENDPOINT;
        const boletoResponse = await super.createPayIn(url, boletoRequest);
        return boletoResponse;
    }

}

module.exports = BoletoClient;