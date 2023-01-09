const { v4: uuidv4 } = require('uuid');

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

class LiquidoPayInHelper {

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

    static mapPayInStatusToVtex(
        payInTransferStatus = null
    ) {
        let vtexPaymentStatus = null;
        switch (payInTransferStatus) {
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
        return vtexPaymentStatus;
    }

    static mapCreatePayInResponseToVtex(liquidoPayInResponse = {}) {

        if (liquidoPayInResponse.transferStatusCode != 200) {
            // *** TO DO!
        }

        const vtexPaymentStatus = LiquidoPayInHelper
            .mapPayInStatusToVtex(liquidoPayInResponse.transferStatus);

        let vtexResponse = {
            paymentId: liquidoPayInResponse.idempotencyKey,
            status: vtexPaymentStatus,
            /** Provider's unique identifier for the transaction. */
            tid: `TID-${uuidv4()}`,
        };

        switch (vtexPaymentStatus) {
            case VtexPaymentStatus.APPROVED:
                vtexResponse = {
                    ...vtexResponse,
                    /**
                     * Provider's unique identifier for the authorization.
                     * Should be sent when the payment is authorized.
                     * In other statuses, it should be absent or null.
                     */
                    authorizationId: `AUT-${uuidv4()}`,
                    /** Provider's unique sequential number for the transaction. */
                    nsu: `NSU-${uuidv4()}`,
                };
                break;
            case VtexPaymentStatus.UNDEFINED:
                break;
        }

        switch (liquidoPayInResponse.paymentMethod) {
            case PaymentMethod.CREDIT_CARD:
                // vtexResponse = {
                //     ...vtexResponse,

                //     /** Acquirer name (mostly used for card payments). */
                //     acquirer: "TestPay",
                //     /** Provider's operation/error code to be logged. */
                //     code: "2000",
                //     message: null,

                //     // ???????????
                //     delayToAutoSettle: 21600,
                //     delayToAutoSettleAfterAntifraud: 1800,
                //     delayToCancel: 21600
                // }
                break;
            case PaymentMethod.PIX_STATIC_QR:
            case PaymentMethod.PIX_DYNAMIC_QR:
                // vtexResponse = {
                //     paymentId: liquidoPayInResponse.idempotencyKey,
                //     status: LiquidoPayInHelper.mapPayInStatusToVtex(liquidoPayInResponse.transferStatus),
                //     tid: `TID${uuidv4()}`,
                //     authorizationId: null, // uneeded in PIX
                //     nsu: null, // uneeded in PIX
                //     code: "APP123", // ???????
                //     paymentAppData: {
                //         payload: {
                //             /**
                //              * All the information needed to expose the QR Code in the SmartCheckout.
                //              * Both code and qrCodeBase64Image are mandatory and should always be sent by the provider.
                //              * Check the serialized JSON String on the request example in the end of the documentation.
                //              * By default, the QRCode should have five minutes (300 seconds) expiration time.
                //              * Also, the partner must respect the callback time (20 seconds).
                //              */
                //             code: liquidoPayInResponse.transferDetails.pix.qrCode,
                //             qrCodeBase64Image: Buffer.from(liquidoPayInResponse.transferDetails.pix.qrCode, 'utf8').toString('base64')
                //         }
                //     },
                //     message: "Pay the PIX code by using your App ou Internet Banking.",

                //     // ???????????
                //     delayToAutoSettle: 604800,
                //     delayToAutoSettleAfterAntifraud: 120,
                //     delayToCancel: 300
                // }
                break;
            case PaymentMethod.BOLETO:
                vtexResponse = {
                    ...vtexResponse,
                    paymentUrl: "https://example.org/boleto/gatewayqa/2F023FD5A72A49D48A8633252B7CCBD6/01693EB95BE443AC85874E395CD91565",
                    // authorizationId: `AUT-${uuidv4()}-ASYNC`,
                    // identificationNumber: liquidoPayInResponse.transferDetails.boleto.digitalLine,
                    // identificationNumberFormatted: "23790.50400 41990.313169 57008.109209 3 78300000019900",
                    // barCodeImageType: "i25",
                    // barCodeImageNumber: liquidoPayInResponse.transferDetails.boleto.barcode,
                    // nsu: `NSU-${uuidv4()}-ASYNC`,
                    // acquirer: "TestPay",
                    // code: "2000-ASYNC",
                    // message: null,
                    // delayToAutoSettle: 21600,
                    // delayToAutoSettleAfterAntifraud: 1800,
                    // delayToCancel: 21600
                }
                break;
            default:
                break;
        }

        return vtexResponse;
    }

    static async sendCreatePayInRequestToLiquido(vtexPayInRequest = {}) {

        const liquidoCallbackUrl = "https://teste.com";

        const configData = new Config({
            clientId: '5d64815a0i63n4vuo4haktlb3a', // Client id from custom field
            clientSecret: '1dkbocf1bojiefu2akfmnv5dd9evhmqtc833i62c7q3u8flvbt4o', // App Token from header = vtexAppToken
            apiKey: 'fztXT5QuK755svjly94H6anwAYD1Ap3249jH2djb', // App Key from header = vtexAppKey
            isLiveMode: false, // !vtexRequestPayload.sandBoxMode (?????????????)
        });

        // console.log("**********************")
        // console.log(configData)
        // console.log("**********************")
        // console.log(vtexPayInRequest)

        const payInRequest = LiquidoPayInHelper.mapVtexPayloadToPayInRequest(vtexPayInRequest, liquidoCallbackUrl);
        console.log("Liquido payInRequest:");
        console.log(payInRequest);

        const payInService = new PayInService(configData);
        const payInResponse = await payInService.createPayIn(payInRequest);
        console.log("Liquido payInResponse:");
        console.log(JSON.stringify(payInResponse));

        const vtexCreatePaymentResponse = LiquidoPayInHelper.mapCreatePayInResponseToVtex(payInResponse);

        return vtexCreatePaymentResponse;

        // const vtexResponseObjFromLiquido = {
        //     paymentId: vtexPayInRequest.paymentId,
        //     status: 'undefined',
        //     tid: 'TID-11111111111',
        // };

        // return vtexResponseObjFromLiquido;
    }

    static async sendCancelPayInRequestToLiquido(vtexCancelPayInReq = {}) {

        const configData = new Config({
            clientId: '5d64815a0i63n4vuo4haktlb3a', // Client id from custom field
            clientSecret: '1dkbocf1bojiefu2akfmnv5dd9evhmqtc833i62c7q3u8flvbt4o', // App Token from header = vtexAppToken
            apiKey: 'fztXT5QuK755svjly94H6anwAYD1Ap3249jH2djb', // App Key from header = vtexAppKey
            isLiveMode: false, // !vtexRequestPayload.sandBoxMode (?????????????)
        });

        // console.log("**********************")
        // console.log(configData)
        // console.log("**********************")
        // console.log(vtexPayInRequest)

        const payInService = new PayInService(configData);
        const cancelPayInResponse = await payInService.cancelPayIn(vtexCancelPayInReq.paymentId);

        console.log("Liquido payInResponse:");
        console.log(cancelPayInResponse);

        // *** success response
        const vtexCancelPaymentResponse = LiquidoPayInHelper
            .mapCancelPayInResponseToVtex(vtexCancelPayInReq, cancelPayInResponse);

        console.log("vtexCancelPaymentResponse:");
        console.log(vtexCancelPaymentResponse);

        // *** TO DO: send error responses

        return vtexCancelPaymentResponse;
    }

    static async sendRefundPayInRequestToLiquido(vtexRefundPayInReq = {}) {

        const configData = new Config({
            clientId: '5d64815a0i63n4vuo4haktlb3a', // Client id from custom field
            clientSecret: '1dkbocf1bojiefu2akfmnv5dd9evhmqtc833i62c7q3u8flvbt4o', // App Token from header = vtexAppToken
            apiKey: 'fztXT5QuK755svjly94H6anwAYD1Ap3249jH2djb', // App Key from header = vtexAppKey
            isLiveMode: false, // !vtexRequestPayload.sandBoxMode (?????????????)
        });

        // console.log("**********************")
        // console.log(configData)
        // console.log("**********************")
        // console.log(vtexPayInRequest)

        const refundRequest = new RefundRequest({
            idempotencyKey: uuidv4(), // *************
            referenceId: vtexRefundPayInReq.paymentId,
            currency: Currency.BRL,
            country: Country.BRAZIL,
            amount: vtexRefundPayInReq.value,
            description: "Vtex/Liquido Refund PayIn",
            callbackUrl: "" // *****************
        });

        const payInService = new PayInService(configData);
        const refundPayInResponse = await payInService.refundPayIn(refundRequest);

        console.log("Liquido refundPayInResponse:");
        console.log(refundPayInResponse);

        // *** success response
        const vtexRefundPaymentResponse = LiquidoPayInHelper
            .mapRefundPayInResponseToVtex(vtexRefundPayInReq, refundPayInResponse);

        console.log("vtexRefundPaymentResponse:");
        console.log(vtexRefundPaymentResponse);

        // *** TO DO: send error responses

        return vtexRefundPaymentResponse;
    }

    static mapCancelPayInResponseToVtex(
        vtexCancelRequestPayload = {},
        liquidoCancelPayInResponse = {}
    ) {
        const cancellationId = "CANCEL-11111111111111111"; // *************
        return {
            "paymentId": liquidoCancelPayInResponse.idempotencyKey, // Mandatory
            // "message": "Cancellation should be done manually", // Provider's operation/error message to be logged
            // "code": "cancel-manually", // Provider's operation/error code to be logged (return cancel-manually if you do not support this operation, so we can send a notification to the merchant)
            "cancellationId": cancellationId, // Mandatory - Provider's cancellation identifier (if the operation has failed you MUST return null)
            "requestId": vtexCancelRequestPayload.requestId // Mandatory - The same requestId sent in the request
        }
    }

    static mapRefundPayInResponseToVtex(
        vtexRefundRequestPayload = {},
        liquidoRefundPayInResponse = {}
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

    static mapLiquidoCallbackPayloadToVtex(
        liquidoCallbackPayload = {}
    ) {

        const {
            idempotencyKey,
            transferStatus
        } = liquidoCallbackPayload.data.chargeDetails;

        const vtexPaymentStatus = LiquidoPayInHelper.mapPayInStatusToVtex(transferStatus);

        let vtexCallbackPayload = {
            paymentId: idempotencyKey,
            status: vtexPaymentStatus,
            tid: `TID-1111111111111111111`,
        };

        if (vtexPaymentStatus === VtexPaymentStatus.APPROVED) {
            vtexCallbackPayload = {
                ...vtexCallbackPayload,
                authorizationId: `AUT-111111111111111`,
                nsu: `NSU-111111111111111`,
            }
        }

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
}

module.exports = LiquidoPayInHelper;