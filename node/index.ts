import { PaymentProviderService } from '@vtex/payment-provider'

import LiquidoPaymentConnector from './connector'

export default new PaymentProviderService({
  connector: LiquidoPaymentConnector,
})
