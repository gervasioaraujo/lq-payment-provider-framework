class RefundRequest {

    constructor(requestData = {}) {

        if (requestData.hasOwnProperty('idempotencyKey')) {
            this.idempotencyKey = requestData.idempotencyKey;
        }

        if (requestData.hasOwnProperty('referenceId')) {
            this.referenceId = requestData.referenceId;
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

        if (requestData.hasOwnProperty('description')) {
            this.description = requestData.description;
        }

        if (requestData.hasOwnProperty('callbackUrl')) {
            this.callbackUrl = requestData.callbackUrl;
        }
    }

    getIdempotencyKey() {
        return this.idempotencyKey;
    }

    getReferenceId() {
        return this.referenceId;
    }

}

module.exports = RefundRequest;