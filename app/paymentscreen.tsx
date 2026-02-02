import { useLocalization } from '@/src/contexts/LocalizationContext';
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useSettings } from '../src/contexts/SettingsContext';
import { useTheme } from '../src/hooks/useTheme';
import {
  useIAP,
  type Purchase,
  getAvailablePurchases,
  requestSubscription,
  type ProductPurchase,
} from 'react-native-iap';

// Subscription product ID from your App Store/Play Store configuration
const SUBSCRIPTION_PRODUCT_IDS = Platform.select({
  ios: ['thinkly_premium_monthly'],
  android: ['thinkly_premium_monthly'],
  default: ['thinkly_premium_monthly']
});

// Connection timeout
const CONNECTION_TIMEOUT_MS = 15000; // 15 seconds

// Error categories for better logging and handling
enum IAPErrorCategory {
  NETWORK = 'NETWORK_ERROR',
  CONNECTION = 'CONNECTION_ERROR',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PURCHASE_FAILED = 'PURCHASE_FAILED',
  PURCHASE_CANCELLED = 'PURCHASE_CANCELLED',
  RECEIPT_VALIDATION = 'RECEIPT_VALIDATION_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

interface IAPErrorDetail {
  category: IAPErrorCategory;
  code?: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

// Helper to safely get product ID from any product object
function getProductId(item: any): string {
  return item?.productId || item?.id || item?.sku || '';
}

// Helper to safely get product price from any product object
function getProductPrice(item: any): string {
  return item?.localizedPrice || item?.displayPrice || item?.price || '';
}

// Helper to safely get product title from any product object
function getProductTitle(item: any): string {
  return item?.title || item?.name || '';
}

// Helper to safely get product description from any product object
function getProductDescription(item: any): string {
  return item?.description || '';
}

// Categorize and log IAP errors with detailed information
function categorizeIAPError(error: any): IAPErrorDetail {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || error?.responseCode || '';
  const debugMessage = error?.debugMessage || '';

  console.error('[IAP] Error Details:', {
    message: errorMessage,
    code: errorCode,
    debugMessage,
    fullError: JSON.stringify(error, null, 2),
    timestamp: new Date().toISOString(),
    platform: Platform.OS
  });

  // Network errors - Enhanced detection
  if (
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('internet') ||
    errorMessage.toLowerCase().includes('connection') ||
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.toLowerCase().includes('timed out') ||
    errorMessage.toLowerCase().includes('no connection') ||
    errorMessage.toLowerCase().includes('offline') ||
    errorCode === 'E_NETWORK_ERROR' ||
    errorCode === '2' ||
    errorCode === 'BILLING_UNAVAILABLE' ||
    debugMessage.toLowerCase().includes('network')
  ) {
    return {
      category: IAPErrorCategory.NETWORK,
      code: errorCode,
      message: errorMessage,
      userMessage: 'Network error. Please check your internet connection and try again.',
      retryable: true
    };
  }

  // Connection/Service errors - Enhanced detection
  if (
    errorMessage.toLowerCase().includes('billing') ||
    errorMessage.toLowerCase().includes('service unavailable') ||
    errorMessage.toLowerCase().includes('service error') ||
    errorMessage.toLowerCase().includes('not available') ||
    errorMessage.toLowerCase().includes('initialization') ||
    errorCode === 'E_SERVICE_ERROR' ||
    errorCode === 'E_IAP_NOT_AVAILABLE' ||
    errorCode === 'SERVICE_UNAVAILABLE' ||
    errorCode === '3' ||
    errorCode === 'BILLING_SERVICE_DISCONNECTED'
  ) {
    return {
      category: IAPErrorCategory.CONNECTION,
      code: errorCode,
      message: errorMessage,
      userMessage: 'Store service is temporarily unavailable. Please try again in a few moments.',
      retryable: true
    };
  }

  // Timeout errors
  if (
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.toLowerCase().includes('timed out') ||
    errorCode === 'E_TIMEOUT'
  ) {
    return {
      category: IAPErrorCategory.TIMEOUT,
      code: errorCode,
      message: errorMessage,
      userMessage: 'Request timed out. Please try again.',
      retryable: true
    };
  }

  // Product not found - Enhanced detection
  if (
    errorMessage.toLowerCase().includes('product') ||
    errorMessage.toLowerCase().includes('sku') ||
    errorMessage.toLowerCase().includes('item unavailable') ||
    errorMessage.toLowerCase().includes('invalid product') ||
    errorCode === 'E_UNKNOWN' ||
    errorCode === 'E_ITEM_UNAVAILABLE' ||
    errorCode === 'ITEM_UNAVAILABLE' ||
    errorCode === '4'
  ) {
    return {
      category: IAPErrorCategory.PRODUCT_NOT_FOUND,
      code: errorCode,
      message: errorMessage,
      userMessage: 'Product not available. Please contact support if this persists.',
      retryable: false
    };
  }

  // User cancelled - Enhanced detection
  if (
    errorMessage.toLowerCase().includes('user') ||
    errorMessage.toLowerCase().includes('cancel') ||
    errorMessage.toLowerCase().includes('cancelled') ||
    errorCode === 'E_USER_CANCELLED' ||
    errorCode === 'USER_CANCELED' ||
    errorCode === '1'
  ) {
    return {
      category: IAPErrorCategory.PURCHASE_CANCELLED,
      code: errorCode,
      message: errorMessage,
      userMessage: 'Purchase was cancelled.',
      retryable: false
    };
  }

  // Purchase failed - Enhanced detection
  if (
    errorMessage.toLowerCase().includes('purchase') ||
    errorMessage.toLowerCase().includes('payment') ||
    errorMessage.toLowerCase().includes('already owned') ||
    errorMessage.toLowerCase().includes('duplicate') ||
    errorCode === 'E_ALREADY_OWNED' ||
    errorCode === 'ITEM_ALREADY_OWNED' ||
    errorCode === 'E_DEFERRED_PAYMENT' ||
    errorCode === '5' ||
    errorCode === '7'
  ) {
    return {
      category: IAPErrorCategory.PURCHASE_FAILED,
      code: errorCode,
      message: errorMessage,
      userMessage: errorCode === 'E_ALREADY_OWNED' || errorCode === 'ITEM_ALREADY_OWNED'
        ? 'You already own this subscription. Please restore your purchase.' 
        : 'Purchase failed. Please try again or contact support.',
      retryable: errorCode !== 'E_ALREADY_OWNED' && errorCode !== 'ITEM_ALREADY_OWNED'
    };
  }

  // Receipt validation - Enhanced detection
  if (
    errorMessage.toLowerCase().includes('receipt') ||
    errorMessage.toLowerCase().includes('validation') ||
    errorMessage.toLowerCase().includes('verify') ||
    errorCode === 'E_RECEIPT_FAILED' ||
    errorCode === 'E_RECEIPT_FINISHED_FAILED'
  ) {
    return {
      category: IAPErrorCategory.RECEIPT_VALIDATION,
      code: errorCode,
      message: errorMessage,
      userMessage: 'Unable to validate purchase. Please contact support with your transaction ID.',
      retryable: false
    };
  }

  // Unknown error
  return {
    category: IAPErrorCategory.UNKNOWN,
    code: errorCode,
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again later.',
    retryable: true
  };
}

export default function PaymentScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const themeColors = useTheme();
  const themedStyles = styles(themeColors);
  const { theme } = useSettings();

  const [initializing, setInitializing] = useState(true);
  const [connectionError, setConnectionError] = useState<IAPErrorDetail | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [connectionReady, setConnectionReady] = useState(false);
  
  const isMounted = useRef(true);
  const connectionAttempted = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize useIAP with purchase callbacks
  const {
    connected,
    products,
    subscriptions,
    getSubscriptions,
    currentPurchase,
    finishTransaction,
  } = useIAP();

  // Handle purchase updates
  useEffect(() => {
    const handlePurchase = async (purchase: ProductPurchase | undefined) => {
      if (!purchase) return;

      const purchaseProductId = getProductId(purchase);

      console.log('[IAP] ========================================');
      console.log('[IAP] PURCHASE UPDATE RECEIVED');
      console.log('[IAP] Product ID:', purchaseProductId);
      console.log('[IAP] Transaction ID:', purchase.transactionId);
      console.log('[IAP] Transaction Date:', purchase.transactionDate);
      console.log('[IAP] Transaction Receipt:', purchase.transactionReceipt ? 'Present (length: ' + purchase.transactionReceipt.length + ')' : 'Missing');
      console.log('[IAP] Platform:', Platform.OS);
      console.log('[IAP] Timestamp:', new Date().toISOString());
      console.log('[IAP] Full Purchase Object:', JSON.stringify(purchase, null, 2));
      console.log('[IAP] ========================================');

      try {
        // Here you would typically validate the receipt with your backend
        // For now, we'll just finish the transaction
        
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          // TODO: Send receipt to your backend for validation
          console.log('[IAP] Receipt validation would happen here');
          
          // Finish the transaction
          await finishTransaction({ purchase, isConsumable: false });
          
          console.log('[IAP] Transaction finished successfully');
          
          if (isMounted.current) {
            setIsPurchasing(false);
            setPurchasingProductId(null);
            Alert.alert(
              t?.success || 'Success', 
              t?.yourPlanActivated || 'Your premium plan is now active!\n\nTransaction ID: ' + purchase.transactionId
            );
            
            // Navigate back after successful purchase
            setTimeout(() => {
              if (router.canGoBack()) {
                router.back();
              }
            }, 1500);
          }
        }
      } catch (error) {
        console.error('[IAP] Error finishing transaction:', error);
        const errorDetail = categorizeIAPError(error);
        
        if (isMounted.current) {
          setIsPurchasing(false);
          setPurchasingProductId(null);
          Alert.alert('Error', errorDetail.userMessage);
        }
      }
    };

    handlePurchase(currentPurchase);
  }, [currentPurchase, finishTransaction, router, t]);

  // Log device and app configuration
  const logDeviceInfo = async () => {
    try {
      const [
        appId,
        appVersion,
        buildNumber,
        deviceId,
        systemVersion,
        brand,
        model,
        isEmulator
      ] = await Promise.all([
        DeviceInfo.getBundleId(),
        DeviceInfo.getVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.isEmulator()
      ]);

      console.log('[IAP] ========================================');
      console.log('[IAP] DEVICE & APP CONFIGURATION');
      console.log('[IAP] ========================================');
      console.log('[IAP] App Package ID:', appId);
      console.log('[IAP] App Version:', appVersion);
      console.log('[IAP] Build Number:', buildNumber);
      console.log('[IAP] Device ID:', deviceId);
      console.log('[IAP] Platform:', Platform.OS);
      console.log('[IAP] OS Version:', systemVersion);
      console.log('[IAP] Device Brand:', brand);
      console.log('[IAP] Device Model:', model);
      console.log('[IAP] Is Emulator:', isEmulator);
      console.log('[IAP] Expected Package:', 'com.anonymous.thinkly');
      console.log('[IAP] Package Match:', appId === 'com.anonymous.thinkly');
      console.log('[IAP] ========================================');

      if (Platform.OS === 'android' && isEmulator) {
        console.warn('[IAP] ⚠ Running on Android emulator - IAP may not work correctly');
        console.warn('[IAP] ⚠ Testing IAP requires:');
        console.warn('[IAP]   1. Real Android device OR emulator with Google Play Services');
        console.warn('[IAP]   2. Google account signed into Play Store');
        console.warn('[IAP]   3. App uploaded to Play Console (at least internal testing track)');
        console.warn('[IAP]   4. Tester email added to internal testing list');
      }

      if (appId !== 'com.anonymous.thinkly') {
        console.error('[IAP] ❌ PACKAGE NAME MISMATCH');
        console.error('[IAP] Expected: com.anonymous.thinkly');
        console.error('[IAP] Actual:', appId);
        console.error('[IAP] This will prevent IAP from working!');
        console.error('[IAP] Products must be configured for the actual package name in Play Console');
      }

      // Check for previous purchases
      try {
        console.log('[IAP] Checking for previous purchases...');
        const purchases = await getAvailablePurchases();
        console.log('[IAP] Previous purchases count:', purchases?.length || 0);
        if (purchases && purchases.length > 0) {
          purchases.forEach((purchase, index) => {
            console.log(`[IAP] Previous Purchase ${index + 1}:`, {
              productId: purchase.productId,
              transactionId: purchase.transactionId,
              transactionDate: purchase.transactionDate
            });
          });
        }
      } catch (purchaseError: any) {
        console.warn('[IAP] Could not fetch previous purchases:', purchaseError.message);
      }
    } catch (error: any) {
      console.error('[IAP] Error logging device info:', error.message);
    }
  };

  // Initialize IAP connection monitoring
  useEffect(() => {
    isMounted.current = true;
    
    const initializeIAP = async () => {
      if (connectionAttempted.current) {
        console.log('[IAP] Connection already attempted, skipping re-initialization');
        return;
      }

      connectionAttempted.current = true;

      // Log device configuration first
      await logDeviceInfo();

      // Set connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      connectionTimeoutRef.current = setTimeout(() => {
        if (!connected && isMounted.current) {
          console.error('[IAP] ========================================');
          console.error('[IAP] CONNECTION TIMEOUT');
          console.error('[IAP] ========================================');
          console.error('[IAP] Timeout after:', CONNECTION_TIMEOUT_MS + 'ms');
          console.error('[IAP] Connection state:', connected ? 'connected' : 'not connected');
          console.error('[IAP] Connection ready:', connectionReady ? 'yes' : 'no');
          console.error('[IAP] Possible causes:');
          console.error('[IAP]   1. No internet connection');
          console.error('[IAP]   2. Google Play Services not installed/updated');
          console.error('[IAP]   3. Google Play Store not signed in');
          console.error('[IAP]   4. Play Billing library initialization failed');
          console.error('[IAP]   5. Running on emulator without Google Play Services');
          console.error('[IAP] ========================================');

          const timeoutError: IAPErrorDetail = {
            category: IAPErrorCategory.TIMEOUT,
            message: 'Connection timeout',
            userMessage: 'Connection to store timed out. Please ensure Google Play Services is installed and you are signed into the Play Store.',
            retryable: true
          };
          setConnectionError(timeoutError);
          setConnectionReady(false);
          setInitializing(false);
        }
      }, CONNECTION_TIMEOUT_MS);

      console.log('[IAP] ========================================');
      console.log('[IAP] STARTING IAP INITIALIZATION');
      console.log('[IAP] ========================================');
      console.log('[IAP] Platform:', Platform.OS);
      console.log('[IAP] Product IDs:', SUBSCRIPTION_PRODUCT_IDS);
      console.log('[IAP] react-native-iap version: 12.12.0');
      console.log('[IAP] Using useIAP hook (auto-connects)');
      console.log('[IAP] Timestamp:', new Date().toISOString());
      console.log('[IAP] ========================================');
      console.log('[IAP] Waiting for connection state to become true...');
      console.log('[IAP] This typically takes 1-3 seconds');
      console.log('[IAP] Max wait time:', CONNECTION_TIMEOUT_MS / 1000, 'seconds');
      console.log('[IAP] ========================================');
    };

    initializeIAP();

    return () => {
      isMounted.current = false;
      console.log('[IAP] ========================================');
      console.log('[IAP] COMPONENT UNMOUNTING - CLEANUP STARTING');
      console.log('[IAP] ========================================');

      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
        console.log('[IAP] ✓ Connection timeout cleared');
      }

      console.log('[IAP] ========================================');
      console.log('[IAP] CLEANUP COMPLETE');
      console.log('[IAP] Note: useIAP hook handles endConnection automatically');
      console.log('[IAP] ========================================');
    };
  }, []);

  // Monitor connection state changes
  useEffect(() => {
    console.log('[IAP] ========================================');
    console.log('[IAP] CONNECTION STATE CHANGED');
    console.log('[IAP] Connected:', connected);
    console.log('[IAP] Timestamp:', new Date().toISOString());
    console.log('[IAP] ========================================');

    if (connected && !connectionReady) {
      console.log('[IAP] ✓ Connection established successfully');
      setConnectionReady(true);
      setConnectionError(null);
      
      // Clear timeout since connection succeeded
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    }
  }, [connected, connectionReady]);

  // Load subscription products with retry mechanism
  const loadProducts = useCallback(async (attempt: number = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    try {
      console.log('[IAP] ========================================');
      console.log('[IAP] FETCHING SUBSCRIPTIONS');
      console.log('[IAP] Attempt:', attempt + 1, '/', MAX_RETRIES);
      console.log('[IAP] Connected:', connected);
      console.log('[IAP] Connection Ready:', connectionReady);
      console.log('[IAP] Product IDs:', SUBSCRIPTION_PRODUCT_IDS);
      console.log('[IAP] Platform:', Platform.OS);
      console.log('[IAP] Timestamp:', new Date().toISOString());
      console.log('[IAP] ========================================');

      // Wait for connection to be ready
      if (!connected || !connectionReady) {
        throw new Error('IAP not connected. Connection status: ' + (connected ? 'connected' : 'not connected') + ', Ready: ' + (connectionReady ? 'yes' : 'no'));
      }

      setConnectionError(null);
      
      console.log('[IAP] Calling getSubscriptions with SKUs:', SUBSCRIPTION_PRODUCT_IDS);
      
      // KEY FIX: Use getSubscriptions instead of fetchProducts
      await getSubscriptions({ skus: SUBSCRIPTION_PRODUCT_IDS });

      console.log('[IAP] ========================================');
      console.log('[IAP] GET SUBSCRIPTIONS CALL COMPLETED');
      console.log('[IAP] Waiting for subscriptions to update...');
      console.log('[IAP] ========================================');

      if (isMounted.current) {
        // Wait a bit for subscriptions to populate
        setTimeout(() => {
          setInitializing(false);
          setRetryCount(0);
        }, 1000);
      }
    } catch (err: any) {
      const errorDetail = categorizeIAPError(err);
      console.log('[IAP] ========================================');
      console.error('[IAP] FETCH SUBSCRIPTIONS FAILED');
      console.error('[IAP] Attempt:', attempt + 1, '/', MAX_RETRIES);
      console.error('[IAP] Error Category:', errorDetail.category);
      console.error('[IAP] Error Code:', errorDetail.code);
      console.error('[IAP] Error Message:', errorDetail.message);
      console.error('[IAP] User Message:', errorDetail.userMessage);
      console.error('[IAP] Retryable:', errorDetail.retryable);
      console.error('[IAP] Raw Error:', JSON.stringify(err, null, 2));
      console.log('[IAP] ========================================');

      if (isMounted.current) {
        setConnectionError(errorDetail);

        // Retry for retryable errors
        if (errorDetail.retryable && attempt < MAX_RETRIES - 1) {
          const delay = RETRY_DELAY * (attempt + 1); // Exponential backoff
          console.log('[IAP] Scheduling subscription fetch retry in ' + (delay / 1000) + ' seconds...');
          setRetryCount(attempt + 1);
          setTimeout(() => {
            if (isMounted.current) {
              console.log('[IAP] Executing scheduled subscription fetch retry...');
              loadProducts(attempt + 1);
            }
          }, delay);
        } else {
          console.error('[IAP] Max retries reached or error not retryable. Stopping subscription fetch attempts.');
          setInitializing(false);
        }
      }
    }
  }, [connected, connectionReady, getSubscriptions]);

  // Load products when connected and ready
  useEffect(() => {
    if (connected && connectionReady && initializing) {
      console.log('[IAP] Connection ready - loading subscriptions...');
      // Add a small delay to ensure connection is fully ready
      setTimeout(() => {
        if (isMounted.current) {
          loadProducts(0);
        }
      }, 500);
    }
  }, [connected, connectionReady, initializing, loadProducts]);

  // Monitor subscriptions updates
  useEffect(() => {
    const subscriptionCount = subscriptions?.length || 0;

    console.log('[IAP] ========================================');
    console.log('[IAP] SUBSCRIPTIONS UPDATED');
    console.log('[IAP] Subscriptions count:', subscriptionCount);
    console.log('[IAP] Timestamp:', new Date().toISOString());
    
    if (subscriptionCount > 0) {
      subscriptions.forEach((sub: any, index: number) => {
        const subId = getProductId(sub);
        const subTitle = getProductTitle(sub);
        const subDescription = getProductDescription(sub);
        const subPrice = getProductPrice(sub);
        
        console.log('[IAP] Subscription ' + (index + 1) + ':');
        console.log('[IAP]   - ID:', subId);
        console.log('[IAP]   - Title:', subTitle);
        console.log('[IAP]   - Description:', subDescription);
        console.log('[IAP]   - Price:', subPrice);
        console.log('[IAP]   - Currency:', sub.currency || 'N/A');
        console.log('[IAP]   - Full Object:', JSON.stringify(sub, null, 2));
      });
    } else if (!initializing && subscriptionCount === 0) {
      console.warn('[IAP] ⚠ No subscriptions returned from store');
      console.warn('[IAP] This could mean:');
      console.warn('[IAP]   1. Product ID "thinkly_premium_monthly" is not configured in store');
      console.warn('[IAP]   2. Products are not published or approved');
      console.warn('[IAP]   3. App bundle ID does not match the store configuration');
      console.warn('[IAP]   4. Test account not set up correctly');
      
      if (!connectionError) {
        const noProductError: IAPErrorDetail = {
          category: IAPErrorCategory.PRODUCT_NOT_FOUND,
          code: 'NO_PRODUCTS',
          message: 'No subscriptions returned from store',
          userMessage: 'Subscriptions are not available. Please ensure "thinkly_premium_monthly" is properly configured in the store.',
          retryable: true
        };
        setConnectionError(noProductError);
      }
    }
    
    console.log('[IAP] ========================================');
  }, [subscriptions, initializing, connectionError]);

  const hasProducts = useMemo(() => {
    const subscriptionCount = subscriptions?.length || 0;
    const result = subscriptionCount > 0;
    console.log('[IAP] Has products check:', result, '(subscriptions:', subscriptionCount, ')');
    return result;
  }, [subscriptions]);

  const onBuy = async (item: any) => {
    const productId = getProductId(item);

    console.log('[IAP] ========================================');
    console.log('[IAP] BUY BUTTON PRESSED');
    console.log('[IAP] Product ID:', productId);
    console.log('[IAP] Is Purchasing:', isPurchasing);
    console.log('[IAP] Connected:', connected);
    console.log('[IAP] Connection Ready:', connectionReady);
    console.log('[IAP] Timestamp:', new Date().toISOString());
    console.log('[IAP] ========================================');

    // Prevent multiple simultaneous purchases
    if (isPurchasing) {
      console.warn('[IAP] ⚠ Purchase already in progress, ignoring request');
      return;
    }

    // Check connection first
    if (!connected || !connectionReady) {
      const errorDetail: IAPErrorDetail = {
        category: IAPErrorCategory.CONNECTION,
        message: 'IAP not connected or not ready',
        userMessage: 'Store connection not ready. Please wait a moment and try again.',
        retryable: true,
        code: 'NOT_CONNECTED'
      };
      console.error('[IAP] Purchase attempted while not connected/ready:', {
        productId,
        connected,
        connectionReady,
        timestamp: new Date().toISOString()
      });
      Alert.alert(t?.error || 'Error', errorDetail.userMessage);
      return;
    }

    try {
      console.log('[IAP] Step 1: Setting purchase state...');
      setIsPurchasing(true);
      setPurchasingProductId(productId);
      setConnectionError(null);

      console.log('[IAP] Step 2: Requesting subscription purchase from store...');
      console.log('[IAP] Calling requestSubscription with SKU:', productId);

      // KEY FIX: Use requestSubscription for subscriptions
      await requestSubscription({
        sku: productId,
        ...(Platform.OS === 'android' && {
          // Optional: Add offer token for Android if you have multiple offers
          // subscriptionOffers: [{ sku: productId, offerToken: 'your-offer-token' }]
        })
      });

      console.log('[IAP] ========================================');
      console.log('[IAP] REQUEST SUBSCRIPTION COMPLETED');
      console.log('[IAP] Note: Purchase will be handled by currentPurchase effect');
      console.log('[IAP] ========================================');
    } catch (err: any) {
      const errorDetail = categorizeIAPError(err);
      console.log('[IAP] ========================================');
      console.error('[IAP] REQUEST SUBSCRIPTION FAILED');
      console.error('[IAP] Product ID:', productId);
      console.error('[IAP] Error Category:', errorDetail.category);
      console.error('[IAP] Error Code:', errorDetail.code);
      console.error('[IAP] Error Message:', errorDetail.message);
      console.error('[IAP] User Message:', errorDetail.userMessage);
      console.error('[IAP] Retryable:', errorDetail.retryable);
      console.error('[IAP] Raw Error:', JSON.stringify(err, null, 2));
      console.error('[IAP] Timestamp:', new Date().toISOString());
      console.log('[IAP] ========================================');

      if (isMounted.current) {
        setIsPurchasing(false);
        setPurchasingProductId(null);

        // Only show alert if not user cancelled
        if (errorDetail.category !== IAPErrorCategory.PURCHASE_CANCELLED) {
          Alert.alert(
            t?.error || 'Error',
            errorDetail.userMessage + (errorDetail.retryable ? '\n\nPlease try again.' : '\n\nPlease contact support.')
          );
        } else {
          console.log('[IAP] Purchase cancelled by user - no alert shown');
        }
      }
    }
  };

  const handleRetry = () => {
    console.log('[IAP] ========================================');
    console.log('[IAP] MANUAL RETRY TRIGGERED');
    console.log('[IAP] Timestamp:', new Date().toISOString());
    console.log('[IAP] ========================================');

    setRetryCount(0);
    setConnectionError(null);
    setInitializing(true);
    loadProducts(0);
  };

  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.title}>{t?.premiumPlan || 'Premium Plan'}</Text>
      
      {/* Connection status + error banner */}
      <View style={{ marginBottom: ResponsiveSizeWp(16) }}>
        <Text style={[themedStyles.feature, { fontSize: ResponsiveSizeWp(14) }]}>
          Connection: {connected ? '✓ Connected' : '✗ Not Connected'}
          {connectionReady && ' & Ready'}
        </Text>
        {!connected && initializing && (
          <Text style={[themedStyles.feature, { fontSize: ResponsiveSizeWp(12), color: '#666' }]}>
            Connecting to store...
          </Text>
        )}
      </View>

      {connectionError && (
        <View style={{ 
          padding: ResponsiveSizeWp(12), 
          backgroundColor: '#FEE2E2', 
          borderRadius: ResponsiveSizeWp(8), 
          marginVertical: ResponsiveSizeWp(8),
          borderLeftWidth: 4,
          borderLeftColor: '#DC2626'
        }}>
          <Text style={[themedStyles.feature, { color: '#991B1B', fontWeight: 'bold' }]}>
            {connectionError.userMessage}
          </Text>
          {connectionError.code && (
            <Text style={[themedStyles.feature, { color: '#991B1B', fontSize: ResponsiveSizeWp(12), marginTop: ResponsiveSizeWp(4) }]}>
              Error Code: {connectionError.code}
            </Text>
          )}
          {connectionError.retryable && retryCount > 0 && (
            <Text style={[themedStyles.feature, { color: '#991B1B', fontSize: ResponsiveSizeWp(14), marginTop: ResponsiveSizeWp(4) }]}>
              Retry attempt {retryCount}/3
            </Text>
          )}
        </View>
      )}

      {initializing && (
        <View style={themedStyles.button}>
          <Text style={themedStyles.buttonText}>{t?.loading || 'Loading...'}</Text>
          <ActivityIndicator color={'#FFF'} size={'small'} />
        </View>
      )}

      {!initializing && hasProducts && (
        <FlatList
          data={subscriptions}
          keyExtractor={(item: any) => getProductId(item)}
          renderItem={({ item }: { item: any }) => {
            const itemId = getProductId(item);
            const itemTitle = getProductTitle(item);
            const itemDescription = getProductDescription(item);
            const itemPrice = getProductPrice(item);
            
            return (
              <View style={{ marginVertical: ResponsiveSizeWp(8), alignItems: 'center' }}>
                <Text style={themedStyles.price}>
                  {itemTitle} - {itemPrice}
                </Text>
                <Text style={themedStyles.feature}>{itemDescription}</Text>
                <TouchableOpacity
                  style={[
                    themedStyles.button, 
                    (isPurchasing && purchasingProductId === itemId) && { opacity: 0.6 },
                    !connected && { backgroundColor: '#999' }
                  ]}
                  onPress={() => onBuy(item)}
                  disabled={isPurchasing || !connected}
                >
                  {isPurchasing && purchasingProductId === itemId ? (
                    <>
                      <Text style={themedStyles.buttonText}>Processing...</Text>
                      <ActivityIndicator color={'#FFF'} size={'small'} />
                    </>
                  ) : (
                    <Text style={themedStyles.buttonText}>
                      {connected ? (t?.subscribe || 'Subscribe') : 'Not Connected'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {!initializing && !hasProducts && (
        <View style={{ alignItems: 'center', marginTop: ResponsiveSizeWp(12) }}>
          <Text style={[themedStyles.feature, { textAlign: 'center', marginBottom: ResponsiveSizeWp(8) }]}>
            {connectionError?.userMessage || 'No products available.'}
          </Text>
          <Text style={[themedStyles.feature, { fontSize: ResponsiveSizeWp(14), textAlign: 'center', color: '#666' }]}>
            Please ensure "thinkly_premium_monthly" is properly configured in {Platform.OS === 'ios' ? 'App Store Connect' : 'Google Play Console'}.
          </Text>
          {(connectionError?.retryable || !connectionError) && (
            <TouchableOpacity
              style={[themedStyles.button, { marginTop: ResponsiveSizeWp(16) }]}
              onPress={handleRetry}
            >
              <Text style={themedStyles.buttonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ResponsiveSizeWp(24),
  },
  title: {
    fontSize: ResponsiveSizeWp(28),
    fontWeight: 'bold',
    marginBottom: ResponsiveSizeWp(16),
    color: theme.nameTextColor,
  },
  price: {
    fontSize: ResponsiveSizeWp(18),
    fontWeight: '600',
    marginBottom: ResponsiveSizeWp(12),
    color: theme.nameTextColor,
    textAlign: 'center',
  },
  feature: {
    fontSize: ResponsiveSizeWp(16),
    marginBottom: ResponsiveSizeWp(8),
    color: theme.nameTextColor,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: ResponsiveSizeWp(14),
    paddingHorizontal: ResponsiveSizeWp(32),
    borderRadius: ResponsiveSizeWp(8),
    marginTop: ResponsiveSizeWp(12),
    flexDirection: 'row',
    gap: ResponsiveSizeWp(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: ResponsiveSizeWp(18),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});