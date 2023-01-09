import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  PaymentProvider,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
} from '@vtex/payment-provider'
import { VBase } from '@vtex/api'

// @ts-ignore
import { LiquidoPayInHelper } from './src/util'

import { randomString } from './utils'
import { executeAuthorization } from './flow'

const authorizationsBucket = 'authorizations'
const persistAuthorizationResponse = async (
  vbase: VBase,
  resp: AuthorizationResponse
) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp)

const getPersistedAuthorizationResponse = async (
  vbase: VBase,
  req: AuthorizationRequest
) =>
  vbase.getJSON<AuthorizationResponse | undefined>(
    authorizationsBucket,
    req.paymentId,
    true
  )

// ********************************
// https://developers.vtex.com/vtex-rest-api/docs/payments-integration-payment-provider-framework
// https://developers.vtex.com/vtex-developer-docs/docs/vtex-io-documentation-10-making-your-app-publicly-available#launching-a-new-version
// https://developers.vtex.com/vtex-developer-docs/docs/vtex-io-documentation-developing-an-app
// https://developers.vtex.com/vtex-rest-api/docs/payments-integration-payment-provider-homologation#logs
// ********************************


const getLiquidoCredentialsObj = (
  apiKey: string,
  appToken: string,
  clientId: string | undefined,
) => {
  return {
    apiKey,
    clientId,
    clientSecret: appToken
  }
}

const getAuthorizationResponseFromLiquido = async (
  liquidoCredentials: object,
  vtexCreatePayInReq: AuthorizationRequest
) => {

  const vtexResponseObjFromLiquido = await LiquidoPayInHelper
    .sendCreatePayInRequestToLiquido(liquidoCredentials, vtexCreatePayInReq)
  const vtexResponseStringJson = JSON.stringify(vtexResponseObjFromLiquido)
  const vtexFinalResponse = JSON.parse(vtexResponseStringJson)

  return vtexFinalResponse
}

const getCancellationResponseFromLiquido = async (
  liquidoCredentials: object,
  vtexCancelPayInReq: CancellationRequest
) => {

  const vtexResponseObjFromLiquido = await LiquidoPayInHelper
    .sendCancelPayInRequestToLiquido(liquidoCredentials, vtexCancelPayInReq)
  const vtexResponseStringJson = JSON.stringify(vtexResponseObjFromLiquido)
  const vtexFinalResponse = JSON.parse(vtexResponseStringJson)

  return vtexFinalResponse
}

const getRefundResponseFromLiquido = async (
  liquidoCredentials: object,
  vtexRefundPayInReq: RefundRequest
) => {
  

  const vtexResponseObjFromLiquido = await LiquidoPayInHelper
    .sendRefundPayInRequestToLiquido(liquidoCredentials, vtexRefundPayInReq)
  const vtexResponseStringJson = JSON.stringify(vtexResponseObjFromLiquido)
  const vtexFinalResponse = JSON.parse(vtexResponseStringJson)

  return vtexFinalResponse
}

const getSettleResponseFromLiquido = async (
  liquidoCredentials: object,
  vtexSettlePayInReq: SettlementRequest
) => {

  const vtexResponseObjFromLiquido = await LiquidoPayInHelper
    .sendGetPayInStatusRequestToLiquido(liquidoCredentials, vtexSettlePayInReq)
  const vtexResponseStringJson = JSON.stringify(vtexResponseObjFromLiquido)
  const vtexFinalResponse = JSON.parse(vtexResponseStringJson)

  return vtexFinalResponse
}

export default class LiquidoPaymentConnector extends PaymentProvider {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.

  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {

    if (this.isTestSuite) {
      const persistedResponse = await getPersistedAuthorizationResponse(
        this.context.clients.vbase,
        authorization
      )

      if (persistedResponse !== undefined && persistedResponse !== null) {
        return persistedResponse
      }

      return executeAuthorization(authorization, response =>
        this.saveAndRetry(authorization, response)
      )
    }

    // ***********************************
    const clientId = authorization.merchantSettings?.find(field => field.name == "Client ID")?.value
    // const isLiveMode = !authorization.sandboxMode
    const credentials: object = getLiquidoCredentialsObj(this.apiKey, this.appToken, clientId)

    console.log(authorization)

    const vtexResponse = await getAuthorizationResponseFromLiquido(
      credentials,
      authorization
    )
    console.log(vtexResponse)

    return vtexResponse
    // ***********************************
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    // *****************************
    const clientId = cancellation.merchantSettings?.find(field => field.name == "Client ID")?.value
    // const isLiveMode = !authorization.sandboxMode
    const credentials: object = getLiquidoCredentialsObj(this.apiKey, this.appToken, clientId)

    const vtexResponse = await getCancellationResponseFromLiquido(credentials, cancellation)
    console.log(vtexResponse)

    return vtexResponse
    // *****************************
  }

  // https://help.vtex.com/pt/tutorial/como-fazer-a-devolucao-de-itens
  public async refund(refund: RefundRequest): Promise<RefundResponse> {

    if (this.isTestSuite) {
      return Refunds.deny(refund)
    }

    // ***********************************
    const clientId = refund.merchantSettings?.find(field => field.name == "Client ID")?.value
    // const isLiveMode = !authorization.sandboxMode
    const credentials: object = getLiquidoCredentialsObj(this.apiKey, this.appToken, clientId)

    const vtexResponse = await getRefundResponseFromLiquido(
      credentials,
      refund
    )
    console.log(vtexResponse)

    return vtexResponse
    // ***********************************
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.deny(settlement)
    }

    // ***********************************
    const clientId = settlement.merchantSettings?.find(field => field.name == "Client ID")?.value
    // const isLiveMode = !authorization.sandboxMode
    const credentials: object = getLiquidoCredentialsObj(this.apiKey, this.appToken, clientId)

    const vtexResponse = await getSettleResponseFromLiquido(
      credentials,
      settlement
    )
    console.log(vtexResponse)

    return vtexResponse
    // ***********************************
  }

  public inbound: undefined
}
