import { Platform } from 'react-native'
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  endConnection
} from 'react-native-iap'
import logger from '../utils/logger'

// App Store product IDs — must match what's configured in App Store Connect
export const IAP_PRODUCT_IDS = {
  monthly: 'travelfit_monthly_subscription',
  annual: 'travelfit_annual_subscription'
}

const productIds = [IAP_PRODUCT_IDS.monthly, IAP_PRODUCT_IDS.annual]

class IAPService {
  constructor() {
    this.purchaseUpdateSubscription = null
    this.purchaseErrorSubscription = null
    this.connected = false
  }

  async initialize() {
    if (Platform.OS !== 'ios') return false

    try {
      await initConnection()
      this.connected = true
      return true
    } catch (error) {
      logger.log('IAP init error:', error)
      this.connected = false
      return false
    }
  }

  async getProducts() {
    if (!this.connected) await this.initialize()

    try {
      const subscriptions = await getSubscriptions({ skus: productIds })
      return subscriptions
    } catch (error) {
      logger.log('IAP getProducts error:', error)
      return []
    }
  }

  async purchase(productId) {
    if (!this.connected) await this.initialize()

    try {
      const purchase = await requestSubscription({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false
      })
      return purchase
    } catch (error) {
      if (error.code === 'E_USER_CANCELLED') {
        return null
      }
      throw error
    }
  }

  async finishPurchase(purchase) {
    try {
      await finishTransaction({ purchase, isConsumable: false })
    } catch (error) {
      logger.log('finishTransaction error:', error)
    }
  }

  async restorePurchases() {
    if (!this.connected) await this.initialize()

    try {
      const purchases = await getAvailablePurchases()
      return purchases
    } catch (error) {
      logger.log('IAP restore error:', error)
      throw error
    }
  }

  listenForPurchases(onSuccess, onError) {
    this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      if (purchase.transactionReceipt) {
        await this.finishPurchase(purchase)
        onSuccess(purchase)
      }
    })

    this.purchaseErrorSubscription = purchaseErrorListener((error) => {
      if (error.code !== 'E_USER_CANCELLED') {
        onError(error)
      }
    })
  }

  removePurchaseListeners() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove()
      this.purchaseUpdateSubscription = null
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove()
      this.purchaseErrorSubscription = null
    }
  }

  async disconnect() {
    this.removePurchaseListeners()
    if (this.connected) {
      await endConnection()
      this.connected = false
    }
  }
}

export const iapService = new IAPService()
