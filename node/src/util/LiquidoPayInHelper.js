const StringMask = require("string-mask");

const {
    Config,
    Currency,
    Country,
    PaymentFlow,
    PaymentMethod,
    PayInStatus,
    PayInRequest,
    RefundRequest,
    PayInService
} = require('../../liquido-payin-js-sdk');

const VtexPaymentMethod = require('./VtexPaymentMethod');
const VtexPaymentStatus = require('./VtexPaymentStatus');
const QrCodeHelper = require("./QrCodeHelper");

class LiquidoPayInHelper {

    static getLiquidoPayInServiceObj(
        credentialsData = {}
    ) {

        const { clientId, clientSecret, apiKey } = credentialsData;

        const configData = new Config({
            clientId,
            clientSecret,
            apiKey
        }, false); // ********* isLiveMode = false,

        const payInService = new PayInService(configData);

        return payInService;
    }

    static mapVtexPaymentMethodToLiquido(
        vtexPaymentMethod = null
    ) {

        let liquidoPaymentMethod = null;

        switch (vtexPaymentMethod) {
            case VtexPaymentMethod.VISA:
            case VtexPaymentMethod.MASTERCARD:
            case VtexPaymentMethod.AMERICAN_EXPRESS:
            case VtexPaymentMethod.ELO:
            case VtexPaymentMethod.HIPERCARD:
            case VtexPaymentMethod.DINERS:
            case VtexPaymentMethod.JCB:
            case VtexPaymentMethod.DISCOVER:
            case VtexPaymentMethod.AURA:
                liquidoPaymentMethod = PaymentMethod.CREDIT_CARD;
                break;
            case VtexPaymentMethod.PIX:
                liquidoPaymentMethod = PaymentMethod.PIX_STATIC_QR;
                break;
            case VtexPaymentMethod.BANKINVOICE:
            case VtexPaymentMethod.BOLETO_BANCARIO:
                liquidoPaymentMethod = PaymentMethod.BOLETO;
                break;
            default:
                break;
        }

        return liquidoPaymentMethod;
    }

    static mapVtexPayloadToPayInRequest(
        vtexPayload = {},
        callbackUrl = null
    ) {

        const requestJson = {
            idempotencyKey: vtexPayload.paymentId,
            amount: parseInt((vtexPayload.value * 100).toFixed(0)),
            currency: Currency.BRL,
            country: Country.BRAZIL,
            paymentFlow: PaymentFlow.DIRECT,
            description: `Vtex/Liquido-PayIn-Request`,
            callbackUrl,
            payer: {
                name: `${vtexPayload.miniCart.buyer.firstName} ${vtexPayload.miniCart.buyer.lastName}`,
                email: vtexPayload.miniCart.buyer.email,
                document: {
                    documentId: vtexPayload.miniCart.buyer.document,
                    type: "CPF"
                },
                billingAddress: {
                    zipCode: vtexPayload.miniCart.billingAddress.postalCode,
                    state: vtexPayload.miniCart.billingAddress.state,
                    city: vtexPayload.miniCart.billingAddress.city,
                    district: vtexPayload.miniCart.billingAddress.neighborhood,
                    street: vtexPayload.miniCart.billingAddress.street,
                    number: vtexPayload.miniCart.billingAddress.number,
                    // country: vtexPayload.miniCart.billingAddress.country
                    country: Country.BRAZIL
                }
            },
            riskData: {
                ipAddress: vtexPayload.ipAddress ? vtexPayload.ipAddress : ""
            }
        };

        let payInRequest = null;
        const liquidoPaymentMethod = LiquidoPayInHelper
            .mapVtexPaymentMethodToLiquido(vtexPayload.paymentMethod);

        switch (liquidoPaymentMethod) {
            case PaymentMethod.CREDIT_CARD:
                payInRequest = new PayInRequest({
                    ...requestJson,
                    paymentMethod: PaymentMethod.CREDIT_CARD,
                    card: {
                        cardHolderName: vtexPayload.card.holder,
                        cardNumber: vtexPayload.card.number,
                        expirationMonth: vtexPayload.card.expiration.month,
                        expirationYear: vtexPayload.card.expiration.year,
                        cvc: vtexPayload.card.csc
                    },
                    installments: vtexPayload.installments,
                });
                break;
            case PaymentMethod.PIX_STATIC_QR:
                payInRequest = new PayInRequest({
                    ...requestJson,
                    paymentMethod: PaymentMethod.PIX_STATIC_QR,
                });
                break;
            case PaymentMethod.BOLETO:
                const today = new Date();
                today.setDate(today.getDate() + 5);
                const paymentDeadline = today.getTime() / 1000;

                payInRequest = new PayInRequest({
                    ...requestJson,
                    paymentMethod: PaymentMethod.BOLETO,
                    paymentTerm: {
                        paymentDeadline
                    }
                });
                break;
            default:
                break;
        }
        return payInRequest;
    }

    static async sendCreatePayInRequestToLiquido(
        liquidoCredentials = {},
        vtexPayInRequest = {},
        liquidoCallbackUrl = null
    ) {

        const payInService = LiquidoPayInHelper.getLiquidoPayInServiceObj(liquidoCredentials);

        const payInRequest = LiquidoPayInHelper
            .mapVtexPayloadToPayInRequest(vtexPayInRequest, liquidoCallbackUrl);
        // console.log("Liquido payInRequest:");
        // console.log(payInRequest);

        const payInResponse = await payInService.createPayIn(payInRequest);
        // console.log("Liquido payInResponse:");
        // console.log(JSON.stringify(payInResponse));

        const vtexCreatePaymentResponse = await LiquidoPayInHelper
            .mapCreatePayInResponseToVtex(liquidoCredentials, payInResponse);

        // const { paymentId, merchantName, callbackUrl } = vtexPayInRequest;
        // const { status } = vtexCreatePaymentResponse;

        // const data = {
        //     paymentId,
        //     merchantName,
        //     callbackUrl,
        //     status
        // };
        // await VtexPaymentRepository.create(data);

        return vtexCreatePaymentResponse;
    }

    static mapPayInStatusToVtex(
        transferStatusCode = null,
        payInTransferStatus = null
    ) {

        let vtexPaymentStatus = null;

        if (transferStatusCode === 200) {
            switch (payInTransferStatus) {
                // case PayInStatus.IN_PROGRESS:
                case PayInStatus.SETTLED:
                    vtexPaymentStatus = VtexPaymentStatus.APPROVED;
                    break;
                case PayInStatus.FAILED:
                    vtexPaymentStatus = VtexPaymentStatus.DENIED;
                    break;
                default:
                    vtexPaymentStatus = VtexPaymentStatus.UNDEFINED;
                    break;
            }
        } else {
            vtexPaymentStatus = VtexPaymentStatus.DENIED;
        }

        return vtexPaymentStatus;
    }

    static mapLiquidoPayInStatusToVtex(
        transferStatusCode = null,
        idempotencyKey = null,
        transferStatus = null
    ) {
        const vtexPaymentStatus = LiquidoPayInHelper
            .mapPayInStatusToVtex(transferStatusCode, transferStatus);

        let vtexResponse = {
            paymentId: idempotencyKey,
            status: vtexPaymentStatus,
            tid: idempotencyKey,
            authorizationId: null,
            nsu: null,
        };

        if (vtexPaymentStatus === VtexPaymentStatus.APPROVED) {
            vtexResponse = {
                ...vtexResponse,
                authorizationId: idempotencyKey,
                nsu: idempotencyKey,
            }
        }

        return vtexResponse;
    }

    static async mapCreatePayInResponseToVtex(
        liquidoCredentials = {},
        liquidoPayInResponse = {}
    ) {

        const {
            transferStatusCode,
            idempotencyKey,
            transferStatus,
            paymentMethod
        } = liquidoPayInResponse;

        let vtexResponse = LiquidoPayInHelper
            .mapLiquidoPayInStatusToVtex(transferStatusCode, idempotencyKey, transferStatus);

        switch (paymentMethod) {
            // case PaymentMethod.CREDIT_CARD:
            //     break;
            case PaymentMethod.PIX_STATIC_QR:
            case PaymentMethod.PIX_DYNAMIC_QR:

                const pixQrCode = liquidoPayInResponse.transferDetails.pix.qrCode;
                const qrCodeBase64Image = await QrCodeHelper
                    .generateQrCodeBase64ImageFromPixCode(pixQrCode);

                vtexResponse = {
                    ...vtexResponse,
                    paymentAppData: {
                        payload: {
                            /**
                             * All the information needed to expose the QR Code in the SmartCheckout.
                             * Both code and qrCodeBase64Image are mandatory and should always be sent by the provider.
                             * Check the serialized JSON String on the request example in the end of the documentation.
                             * By default, the QRCode should have five minutes (300 seconds) expiration time.
                             * Also, the partner must respect the callback time (20 seconds).
                             */
                            code: liquidoPayInResponse.transferDetails.pix.qrCode,
                            // qrCodeBase64Image: Buffer.from(qrCodeImage, 'utf8').toString('base64'),
                            qrCodeBase64Image: qrCodeBase64Image.replace("data:image/png;base64,", "")
                        }
                    },
                    // message: vtexPaymentStatus == VtexPaymentStatus.UNDEFINED ? "Pay the PIX code by using your App ou Internet Banking." : "",
                    // acquirer: "TestPay",
                }
                break;
            case PaymentMethod.BOLETO:

                const boletoPdfUrl = await LiquidoPayInHelper
                    .sendGetBoletoPdfUrlRequestToLiquido(liquidoCredentials, idempotencyKey);

                const formatter = new StringMask('00000.00000 00000.000000 00000.000000 0 00000000000000');
                const digitalLineFormatted = formatter.apply(liquidoPayInResponse.transferDetails.boleto.digitalLine);

                vtexResponse = {
                    ...vtexResponse,
                    paymentUrl: boletoPdfUrl.path,
                    identificationNumber: liquidoPayInResponse.transferDetails.boleto.digitalLine,
                    identificationNumberFormatted: digitalLineFormatted,
                    // barCodeImageType: "i25",
                    barCodeImageNumber: liquidoPayInResponse.transferDetails.boleto.barcode,
                    // acquirer: "TestPay",
                    // message: null,
                }
                break;
            default:
                break;
        }

        return vtexResponse;
    }

    static async sendGetPayInStatusRequestToLiquido(
        liquidoCredentials = {},
        vtexSettlePayload = {}
    ) {

        const payInService = LiquidoPayInHelper
            .getLiquidoPayInServiceObj(liquidoCredentials);

        const payInStatusResponse = await payInService
            .getPayIn(vtexSettlePayload.paymentId);

        const vtexSettleResponse = LiquidoPayInHelper
            .mapGetPayInResponseToSettleVtex(vtexSettlePayload, payInStatusResponse);

        return vtexSettleResponse;
    }

    static mapGetPayInResponseToSettleVtex(
        vtexSettlePayload = {},
        liquidoPayInStatusResponse = {}
    ) {

        if (
            liquidoPayInStatusResponse.hasOwnProperty('transferStatusCode')
            && liquidoPayInStatusResponse.transferStatusCode == 200
            && liquidoPayInStatusResponse.hasOwnProperty('transferStatus')
            && liquidoPayInStatusResponse.transferStatus == PayInStatus.SETTLED
        ) {
            // *** success response
            const vtexSettleResponse = {
                "paymentId": liquidoPayInStatusResponse.idempotencyKey,
                "settleId": liquidoPayInStatusResponse.idempotencyKey,
                "value": vtexSettlePayload.value,
                "code": null,
                "message": "Successfully settled",
                "requestId": vtexSettlePayload.requestId
            }
            return vtexSettleResponse;
        }

        // *** TO DO: send error responses
        return {};
    }

    static async sendCancelPayInRequestToLiquido(
        liquidoCredentials = {},
        vtexCancelRequestPayload = {}
    ) {

        const payInService = LiquidoPayInHelper.getLiquidoPayInServiceObj(liquidoCredentials);

        const payInStatusResponse = await payInService.getPayIn(vtexCancelRequestPayload.paymentId);

        console.log("Liquido payInStatusResponse:");
        console.log(payInStatusResponse);

        if (
            payInStatusResponse.hasOwnProperty('transferStatusCode')
            && payInStatusResponse.transferStatusCode == 200
            && payInStatusResponse.hasOwnProperty('transferStatus')
            && payInStatusResponse.transferStatus == PayInStatus.IN_PROGRESS
        ) {
            const cancelPayInResponse = await payInService.cancelPayIn(vtexCancelRequestPayload.paymentId);
            console.log("Liquido cancelPayInResponse:");
            console.log(cancelPayInResponse);
            return cancelPayInResponse;
        }

        return payInStatusResponse;

    }

    static mapCancelPayInResponseToVtex(
        vtexCancelRequestPayload = {},
        liquidoCancelPayInResponse = {}
    ) {

        const liquidoResponseHasTransferStatusField =
            liquidoCancelPayInResponse.hasOwnProperty('transferStatusCode')
            && liquidoCancelPayInResponse.transferStatusCode == 200
            && liquidoCancelPayInResponse.hasOwnProperty('transferStatus');

        if (
            liquidoResponseHasTransferStatusField
            && liquidoCancelPayInResponse.transferStatus == PayInStatus.CANCELLED
        ) {
            return {
                "paymentId": liquidoCancelPayInResponse.idempotencyKey,
                "cancellationId": liquidoCancelPayInResponse.idempotencyKey, // Mandatory - Provider's cancellation identifier (if the operation has failed you MUST return null)
                "requestId": vtexCancelRequestPayload.requestId // Mandatory - The same requestId sent in the request
            }
        } else if (
            liquidoResponseHasTransferStatusField
            && liquidoCancelPayInResponse.transferStatus == PayInStatus.SETTLED
        ) {
            return {
                "paymentId": vtexCancelRequestPayload.paymentId,
                "message": "Transaction cannot be cancelled. It's already settled.",
                "code": "cancel-error",
                "requestId": vtexCancelRequestPayload.requestId
            }
        }

        // *** Send error responses
        return {
            "paymentId": vtexCancelRequestPayload.paymentId, // Mandatory
            "message": "Cancellation should be done manually", // Provider's operation/error message to be logged
            "code": "cancel-manually", // Provider's operation/error code to be logged (return cancel-manually if you do not support this operation, so we can send a notification to the merchant)
            "requestId": vtexCancelRequestPayload.requestId // Mandatory - The same requestId sent in the request
        }

    }

    static async sendRefundPayInRequestToLiquido(
        liquidoCredentials = {},
        vtexRefundPayInReq = {},
        liquidoCallbackUrl = null
    ) {

        const payInService = LiquidoPayInHelper.getLiquidoPayInServiceObj(liquidoCredentials);

        const refundRequest = new RefundRequest({
            idempotencyKey: vtexRefundPayInReq.requestId, // *************
            referenceId: vtexRefundPayInReq.paymentId,
            currency: Currency.BRL,
            country: Country.BRAZIL,
            amount: vtexRefundPayInReq.value,
            description: "Vtex/Liquido Refund PayIn",
            callbackUrl: liquidoCallbackUrl
        });

        const refundPayInResponse = await payInService.refundPayIn(refundRequest);

        console.log("Liquido refundPayInResponse:");
        console.log(refundPayInResponse);

        const vtexRefundPaymentResponse = LiquidoPayInHelper
            .mapRefundPayInResponseToVtex(vtexRefundPayInReq, refundPayInResponse);

        return vtexRefundPaymentResponse;
    }

    static mapRefundPayInResponseToVtex(
        vtexRefundRequestPayload = {},
        liquidoRefundPayInResponse = {}
    ) {
        const liquidoResponseHasTransferStatusField =
            liquidoRefundPayInResponse.hasOwnProperty('transferStatusCode')
            && liquidoRefundPayInResponse.transferStatusCode == 200
            && liquidoRefundPayInResponse.hasOwnProperty('transferStatus');

        if (
            liquidoResponseHasTransferStatusField
            && liquidoRefundPayInResponse.transferStatus == PayInStatus.IN_PROGRESS
        ) {
            return {
                "paymentId": liquidoRefundPayInResponse.referenceId,
                "refundId": liquidoRefundPayInResponse.idempotencyKey,
                "value": liquidoRefundPayInResponse.amount / 100,
                "code": null,
                "message": "Sucessfully refunded",
                "requestId": vtexRefundRequestPayload.requestId
            }
        }

        // *** TO DO: send error responses
        return {
            "paymentId": liquidoRefundPayInResponse.referenceId,
            "refundId": null,
            "value": liquidoRefundPayInResponse.amount / 100,
            "code": "",
            "message": "Error when refund the payment",
            "requestId": vtexRefundRequestPayload.requestId
        }
    }

    static async sendGetBoletoPdfUrlRequestToLiquido(
        liquidoCredentials = {},
        idempotencyKey = null
    ) {
        const payInService = LiquidoPayInHelper.getLiquidoPayInServiceObj(liquidoCredentials);

        const boletoPdfUrlResponse = await payInService.getBoletoPdfUrl(idempotencyKey);

        return boletoPdfUrlResponse;
    }

    static mapLiquidoCallbackPayloadToVtex(
        liquidoCallbackPayload = {}
    ) {

        const {
            transferStatusCode,
            idempotencyKey,
            transferStatus
        } = liquidoCallbackPayload.data.chargeDetails;

        const vtexCallbackPayload = LiquidoPayInHelper
            .mapLiquidoPayInStatusToVtex(transferStatusCode, idempotencyKey, transferStatus);

        /**
             * {
                "paymentId": null,
                "status": null,
                "authorizationId": null,
                "paymentUrl": null,
                "nsu": null,
                "tid": null,
                "acquirer": null,
                "code": null,
                "message": null,
                "delayToAutoSettle": null,
                "delayToAutoSettleAfterAntifraud": null,
                "delayToCancel": null
                }
        */

        return vtexCallbackPayload;
    }

    static async getVtexPaymentFromDatabase(paymentId = null) {
        const payment = await VtexPaymentRepository.get(paymentId);
        return payment;
    }

    static async updateVtexPaymentOnDatabase(
        paymentId = null,
        newVtexPaymentStatus = null
    ) {
        await VtexPaymentRepository
            .update(paymentId, { "status": newVtexPaymentStatus });
    }
}

module.exports = LiquidoPayInHelper;