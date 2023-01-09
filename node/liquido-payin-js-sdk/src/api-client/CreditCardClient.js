const {
    Config,
} = require('../util/index');

const PayInClient = require('./PayInClient');

const {
    PayInRequest
} = require('../model/index');

class CreditCardClient extends PayInClient {

    static ENDPOINT = "/v1/payments/charges/card";

    constructor(configData = new Config(), accessToken = null) {
        super(configData, accessToken);
    }

    async createPayIn(creditCardRequest = new PayInRequest()) {
        const url = this.configData.getPayInBaseUrl() + CreditCardClient.ENDPOINT;
        const creditCardResponse = await super.createPayIn(url, creditCardRequest);
        return creditCardResponse;
    }

}

module.exports = CreditCardClient;