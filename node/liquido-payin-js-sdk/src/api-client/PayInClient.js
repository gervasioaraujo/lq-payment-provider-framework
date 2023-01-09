const axios = require('axios');

const {
    Config,
} = require('../util/index');
const {
    PayInRequest,
    RefundRequest
} = require('../model/index');

class PayInClient {

    static GET_ENDPOINT = "/v1/payments/charges";
    static CANCEL_ENDPOINT = "/v1/payments/charges/cancel";
    static REFUND_ENDPOINT = "/v1/payments/charges/refund";
    static GET_BOLETO_PDF_URL = "/v1/payments/files/boleto/pdf";

    constructor(configData = new Config(), accessToken = null) {
        this.configData = configData;
        this.accessToken = accessToken;
    }

    async createPayIn(url = null, payInRequest = new PayInRequest()) {

        const jsonPayload = JSON.stringify(payInRequest);

        try {
            const response = await axios.post(
                url,
                jsonPayload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": this.configData.getClientApiKey(),
                        "Authorization": `Bearer ${this.accessToken}`
                    }
                });

            const payInResponse = response.data;
            return payInResponse;
        } catch (error) {
            console.error("Error while request pay in to Liquido BR API.");
            return error.response.data
        }
    }

    async getPayIn(idempotencyKey = null) {

        const url = this.configData.getPayInBaseUrl() + PayInClient.GET_ENDPOINT + `/${idempotencyKey}`;

        try {
            const response = await axios.get(
                url,
                {
                    headers: {
                        "x-api-key": this.configData.getClientApiKey(),
                        "Authorization": `Bearer ${this.accessToken}`
                    }
                });

            const getResponse = response.data;
            return getResponse;
        } catch (error) {
            console.error("Error while request get pay in to Liquido BR API.");
            return error.response.data;
        }
    }

    async cancelPayIn(idempotencyKey = null) {

        const url = this.configData.getPayInBaseUrl() + PayInClient.CANCEL_ENDPOINT + `/${idempotencyKey}`;

        try {
            const response = await axios.post(
                url,
                {},
                {
                    headers: {
                        "x-api-key": this.configData.getClientApiKey(),
                        "Authorization": `Bearer ${this.accessToken}`
                    }
                });

            const cancelResponse = response.data;
            return cancelResponse;
        } catch (error) {
            console.error("Error while request cancel pay in to Liquido BR API.");
            return error.response.data;
        }
    }

    async refundPayIn(refundRequest = new RefundRequest()) {

        const url = this.configData.getPayInBaseUrl() + PayInClient.REFUND_ENDPOINT;
        const jsonPayload = JSON.stringify(refundRequest);

        try {
            const response = await axios.post(
                url,
                jsonPayload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": this.configData.getClientApiKey(),
                        "Authorization": `Bearer ${this.accessToken}`
                    }
                });

            const refundResponse = response.data;
            return refundResponse;
        } catch (error) {
            console.error("Error while request refund pay in to Liquido BR API.");
            return error.response.data;
        }
    }

    async getBoletoPdfUrl(idempotencyKey = null) {

        const url = this.configData.getPayInBaseUrl() + PayInClient.GET_BOLETO_PDF_URL + `/${idempotencyKey}`;

        try {
            const response = await axios.get(
                url,
                {
                    headers: {
                        "x-api-key": this.configData.getClientApiKey(),
                        "Authorization": `Bearer ${this.accessToken}`
                    }
                });

            const getResponse = response.data;
            return getResponse;
        } catch (error) {
            console.error("Error while request get Boleto PDF url to Liquido BR API.");
            return error.response.data;
        }
    }

}

module.exports = PayInClient;