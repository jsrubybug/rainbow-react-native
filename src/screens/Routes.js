import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import React from 'react';
import Animated from 'react-native-reanimated';
import {
  createAppContainer,
  createMaterialTopTabNavigator,
} from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createMaterialTopTabNavigator as newTopTabNavigator } from 'react-navigation-tabs';
import { Navigation } from '../navigation';
import { updateTransitionProps } from '../redux/navigation';
import store from '../redux/store';
import { colors } from '../styles';
import { deviceUtils } from '../utils';
import ExpandedAssetScreenWithData from './ExpandedAssetScreenWithData';
import ImportSeedPhraseSheetWithData from './ImportSeedPhraseSheetWithData';
import ProfileScreenWithData from './ProfileScreenWithData';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import ReceiveModal from './ReceiveModal';
import ExampleScreen from './ExampleScreen';
import WalletConnectConfirmationModal from './WalletConnectConfirmationModal';
import SendSheetWithData from './SendSheetWithData';
import SettingsModal from './SettingsModal';
import TransactionConfirmationScreenWithData from './TransactionConfirmationScreenWithData';
import WalletScreen from './WalletScreen';
import {
  expandedPreset,
  sheetPreset,
  backgroundPreset,
  onTransitionStart as onTransitionStartEffect,
} from '../navigation/transitions/effects';
import restoreKeyboard from './restoreKeyboard';
import ExchangeModal from './ExchangeModal';
import CurrencySelectModal from './CurrencySelectModal';

const onTransitionEnd = () => store.dispatch(updateTransitionProps({ isTransitioning: false }));

const onTransitionStart = () => store.dispatch(updateTransitionProps({ isTransitioning: true }));

const SwipeStack = createMaterialTopTabNavigator({
  ProfileScreen: {
    name: 'ProfileScreen',
    screen: ProfileScreenWithData,
  },
  WalletScreen: {
    name: 'WalletScreen',
    screen: WalletScreen,
  },
  // eslint-disable-next-line sort-keys
  QRScannerScreen: {
    name: 'QRScannerScreen',
    screen: QRScannerScreenWithData,
  },
}, {
  headerMode: 'none',
  initialLayout: deviceUtils.dimensions,
  initialRouteName: 'WalletScreen',
  mode: 'modal',
  springConfig: {
    damping: 16,
    mass: 0.3,
    overshootClamping: false,
    restDisplacementThreshold: 1,
    restSpeedThreshold: 1,
    stiffness: 140,
  },
  swipeDistanceThreshold: 30,
  swipeVelocityThreshold: 10,
  tabBarComponent: null,
});

const ExchangeModalTabPosition = new Animated.Value(0);

const ExchangeModalNavigator = newTopTabNavigator({
  MainExchangeScreen: {
    params: {
      position: ExchangeModalTabPosition,
    },
    screen: ExchangeModal,
  },
  CurrencySelectScreen: {
    params: {
      position: ExchangeModalTabPosition,
    },
    screen: CurrencySelectModal,
  },
}, {
  disableKeyboardHandling: true,
  headerMode: 'none',
  initialLayout: deviceUtils.dimensions,
  keyboardDismissMode: 'none',
  keyboardShouldPersistTaps: 'always',
  mode: 'modal',
  // onSwipeEnd: onTransitionEnd,
  // onSwipeStart: onTransitionStart,
  onTransitionEnd,
  onTransitionStart,
  position: ExchangeModalTabPosition,
  springConfig: {
    damping: 40,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
    stiffness: 300,
  },
  swipeDistanceMinimum: 0,
  swipeVelocityImpact: 1,
  swipeVelocityScale: 1,
  tabBarComponent: null,
  transparentCard: true,
});

// I need it for changing navigationOptions dynamically
// for preventing swipe down to close on CurrencySelectScreen
const EnhancedExchangeModalNavigator = props => <ExchangeModalNavigator {...props} />;//React.memo();
EnhancedExchangeModalNavigator.router = ExchangeModalNavigator.router;
EnhancedExchangeModalNavigator.navigationOptions = ({ navigation }) => ({
  ...navigation.state.params,
  gesturesEnabled: !get(navigation, 'state.params.isGestureBlocked'),
});

const MainNavigator = createStackNavigator({
  ConfirmRequest: {
    navigationOptions: {
      ...expandedPreset,
    },
    screen: TransactionConfirmationScreenWithData,
  },
  ExampleScreen,
  ExchangeModal: {
    navigationOptions: {
      effect: 'expanded',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
    },
    params: {
      isGestureBlocked: false,
    },
    screen: EnhancedExchangeModalNavigator,
  },
  ExpandedAssetScreen: {
    navigationOptions: {
      ...expandedPreset,
    },
    screen: ExpandedAssetScreenWithData,
  },
  ImportSeedPhraseSheet: {
    navigationOptions: {
      ...sheetPreset,
    },
    screen: ImportSeedPhraseSheetWithData,
  },
  ReceiveModal: {
    navigationOptions: {
      ...expandedPreset,
    },
    screen: ReceiveModal,
  },
  SendSheet: {
    navigationOptions: {
      ...sheetPreset,
      onTransitionStart: props => {
        onTransitionStartEffect(props);
        restoreKeyboard();
      },
    },
    screen: SendSheetWithData,
  },
  SettingsModal: {
    navigationOptions: {
      gesturesEnabled: false,
      ...expandedPreset,
    },
    screen: SettingsModal,
    transparentCard: true,

  },
  ExchangeModal2: {
    navigationOptions: {
      effect: 'sheet',
      gestureResponseDistance: {
        vertical: deviceUtils.dimensions.height,
      },
      mode: 'card',
      gesturesEnabled: true,
    },
    mode: 'card',
    screen: ExchangeModal,
  },
  SwipeLayout: {
    navigationOptions: {
      ...backgroundPreset,
    },
    screen: SwipeStack,
  },
  WalletConnectConfirmationModal: {
    navigationOptions: {
      ...expandedPreset,
    },
    screen: WalletConnectConfirmationModal,
  },
}, {
  defaultNavigationOptions: {
    onTransitionEnd,
    onTransitionStart,
  },
  disableKeyboardHandling: true, // XXX not sure about this from rebase
  headerMode: 'none',
  initialRouteName: 'SwipeLayout',
  keyboardDismissMode: 'none', // true?
  mode: 'modal',
});

const AppContainer = createAppContainer(MainNavigator);

// eslint-disable-next-line react/prop-types
const AppContainerWithAnalytics = ({ ref, screenProps }) => (
  <AppContainer
    onNavigationStateChange={(prevState, currentState, action) => {
      const { params, routeName } = Navigation.getActiveRoute(currentState);
      const prevRouteName = Navigation.getActiveRouteName(prevState);

      if (routeName === 'SettingsModal') {
        let subRoute = get(params, 'section.title');
        if (subRoute === 'Settings') subRoute = null;
        return analytics.screen(`${routeName}${subRoute ? `>${subRoute}` : ''}`);
      }

      if (routeName !== prevRouteName) {
        let paramsToTrack = null;

        if (prevRouteName === 'MainExchangeScreen' && routeName === 'WalletScreen') {
          store.dispatch(updateTransitionProps({ blurColor: null }));
        } else if (prevRouteName === 'WalletScreen' && routeName === 'MainExchangeScreen') {
          store.dispatch(updateTransitionProps({ blurColor: colors.alpha(colors.black, 0.9) }));
        }

        if (routeName === 'ExpandedAssetScreen') {
          const { asset, type } = params;
          paramsToTrack = {
            assetContractAddress: asset.address || get(asset, 'asset_contract.address'),
            assetName: asset.name,
            assetSymbol: asset.symbol || get(asset, 'asset_contract.symbol'),
            assetType: type,
          };
        }

        return analytics.screen(routeName, paramsToTrack);
      }
    }}
    ref={ref}
    screenProps={screenProps}
  />
);

export default React.memo(AppContainerWithAnalytics);
