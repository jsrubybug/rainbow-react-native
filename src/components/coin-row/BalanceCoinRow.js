import { get } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
import { View } from 'react-primitives';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import {
  withCoinRecentlyPinned,
  withEditOptions,
  withOpenBalances,
} from '../../hoc';
import { useCoinListEditedValue } from '../../hooks/useCoinListEdited';
import store from '../../redux/store';
import { ButtonPressAnimation } from '../animations';
import { ChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
import { Column, FlexItem } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinCheckButton from './CoinCheckButton';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { buildAssetUniqueIdentifier } from '@rainbow-me/helpers/assets';
import { colors } from '@rainbow-me/styles';
import { isNewValueForObjectPaths, isNewValueForPath } from '@rainbow-me/utils';

const editTranslateOffset = 32;

const formatPercentageString = percentString =>
  percentString ? percentString.split('-').join('- ') : '-';

const BalanceCoinRowCoinCheckButton = styled(CoinCheckButton).attrs({
  isAbsolute: true,
})`
  top: ${({ top }) => top};
`;

const Content = styled(ButtonPressAnimation)`
  padding-left: ${({ isEditMode }) => (isEditMode ? editTranslateOffset : 0)};
`;

const PercentageText = styled(BottomRowText).attrs({
  align: 'right',
})`
  ${({ isPositive }) => (isPositive ? `color: ${colors.green};` : null)};
`;

const BottomRow = ({ balance, native }) => {
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  return (
    <Fragment>
      <FlexItem flex={1}>
        <BottomRowText>{get(balance, 'display', '')}</BottomRowText>
      </FlexItem>
      <View>
        <PercentageText isPositive={isPositive}>
          {percentageChangeDisplay}
        </PercentageText>
      </View>
    </Fragment>
  );
};

const TopRow = ({ name, native, nativeCurrencySymbol }) => {
  const nativeDisplay = get(native, 'balance.display');

  return (
    <Fragment>
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <View>
        <BalanceText
          color={nativeDisplay ? null : colors.blueGreyLight}
          numberOfLines={1}
        >
          {nativeDisplay || `${nativeCurrencySymbol}0.00`}
        </BalanceText>
      </View>
    </Fragment>
  );
};

const BalanceCoinRow = ({
  containerStyles,
  isFirstCoinRow,
  item,
  onPress,
  pushSelectedCoin,
  recentlyPinnedCount,
  removeSelectedCoin,
  ...props
}) => {
  const [toggle, setToggle] = useState(false);
  const [previousPinned, setPreviousPinned] = useState(0);
  const isCoinListEditedValue = useCoinListEditedValue();
  useEffect(() => {
    const { isCoinListEdited } = store.getState().editOptions;

    if (toggle && (recentlyPinnedCount > previousPinned || !isCoinListEdited)) {
      setPreviousPinned(recentlyPinnedCount);
      setToggle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentlyPinnedCount]);

  const handleEditModePress = useCallback(() => {
    if (toggle) {
      removeSelectedCoin(item.uniqueId);
    } else {
      pushSelectedCoin(item.uniqueId);
    }
    setToggle(!toggle);
  }, [item.uniqueId, pushSelectedCoin, removeSelectedCoin, setToggle, toggle]);

  const handlePress = useCallback(() => {
    const { isCoinListEdited } = store.getState().editOptions;
    if (isCoinListEdited) {
      handleEditModePress();
    } else {
      onPress?.(item, { longFormHeight: ChartExpandedStateSheetHeight });
    }
  }, [handleEditModePress, onPress, item]);

  return (
    <Column flex={1} justify={isFirstCoinRow ? 'end' : 'start'}>
      <Animated.View
        style={{
          paddingLeft: Animated.multiply(
            editTranslateOffset,
            isCoinListEditedValue
          ),
        }}
      >
        <Content
          onPress={handlePress}
          scaleTo={0.96}
          testID={`balance-coin-row-${item.name}`}
        >
          <CoinRow
            bottomRowRender={BottomRow}
            containerStyles={containerStyles}
            onPress={handlePress}
            topRowRender={TopRow}
            {...item}
            {...props}
          />
        </Content>
      </Animated.View>
      <Animated.View
        style={{ opacity: isCoinListEditedValue, position: 'absolute' }}
      >
        <BalanceCoinRowCoinCheckButton
          onPress={handleEditModePress}
          toggle={toggle}
          top={isFirstCoinRow ? -53 : 9}
        />
      </Animated.View>
    </Column>
  );
};

const arePropsEqual = (prev, next) => {
  const itemIdentifier = buildAssetUniqueIdentifier(prev.item);
  const nextItemIdentifier = buildAssetUniqueIdentifier(next.item);

  const isNewItem = itemIdentifier === nextItemIdentifier;

  const isNewRecentlyPinnedCount =
    !isNewValueForPath(prev, next, 'recentlyPinnedCount') &&
    (get(next, 'item.isPinned', true) || get(next, 'item.isHidden', true));

  return (
    isNewItem &&
    isNewRecentlyPinnedCount &&
    !isNewValueForObjectPaths(prev, next, [
      'isCoinListEdited',
      'isFirstCoinRow',
      'item.isHidden',
      'item.isPinned',
      'openSmallBalances',
    ])
  );
};

const MemoizedBalanceCoinRow = React.memo(BalanceCoinRow, arePropsEqual);

export default compose(
  withOpenBalances,
  withEditOptions,
  withCoinRecentlyPinned
)(MemoizedBalanceCoinRow);
