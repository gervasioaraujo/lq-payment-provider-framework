const Payer = require('./Payer');
const PaymentTerm = require('./PaymentTerm');
const RiskData = require('./RiskData');
const Card = require('./Card');

class PayInRequest {

    constructor(requestData = {}) {

        if (requestData.hasOwnProperty('idempotencyKey')) {
            this.idempotencyKey = requestData.idempotencyKey;
        }

        if (requestData.hasOwnProperty('amount')) {
            this.amount = requestData.amount;
        }

        if (requestData.hasOwnProperty('currency')) {
            this.currency = requestData.currency;
        }

        if (requestData.hasOwnProperty('country')) {
            this.country = requestData.country;
        }

        if (requestData.hasOwnProperty('paymentMethod')) {
            this.paymentMethod = requestData.paymentMethod;
        }

        if (requestData.hasOwnProperty('paymentFlow')) {
            this.paymentFlow = requestData.paymentFlow;
        }

        if (requestData.hasOwnProperty('callbackUrl')) {
            this.callbackUrl = requestData.callbackUrl;
        }

        if (requestData.hasOwnProperty('description')) {
            this.description = requestData.description;
        }

        if (requestData.hasOwnProperty('payer')) {
            const payerObj = new Payer(requestData.payer);
            this.payer = payerObj;
        }

        if (requestData.hasOwnProperty('paymentTerm')) {
            const paymentTermObj = new PaymentTerm(requestData.paymentTerm);
            this.paymentTerm = paymentTermObj;
        }

        if (requestData.hasOwnProperty('riskData')) {
            const riskDataObj = new RiskData(requestData.riskData);
            this.riskData = riskDataObj;
        }

        if (requestData.hasOwnProperty('card')) {
            const cardObj = new Card(requestData.card);
            this.card = cardObj;
        }

        if (requestData.hasOwnProperty('installments')) {
            this.installments = requestData.installments;
        }
    }

    getIdempotencyKey() {
        return this.idempotencyKey;
    }

    getPaymentMethod() {
        return this.paymentMethod;
    }

}

module.exports = PayInRequest;