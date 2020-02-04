import produce from 'immer';
import { trackWyreOrder, trackWyreTransfer } from '../handlers/wyre';

// -- Constants ------------------------------------------------------------- //
const WYRE_UPDATE_ORDER_ID = 'wyre/WYRE_UPDATE_ORDER_ID';
const WYRE_UPDATE_ORDER_STATUS = 'wyre/WYRE_UPDATE_ORDER_STATUS';
const WYRE_UPDATE_TRANSFER_HASH = 'wyre/WYRE_UPDATE_TRANSFER_HASH';
const WYRE_UPDATE_TRANSFER_ID = 'wyre/WYRE_UPDATE_TRANSFER_ID';
const WYRE_UPDATE_TRANSFER_STATUS = 'wyre/WYRE_UPDATE_TRANSFER_STATUS';
const WYRE_CLEAR_STATE = 'wyre/WYRE_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
const WYRE_ORDER_STATUS_TYPES = {
  checking: 'RUNNING_CHECKS',
  failed: 'FAILED',
  pending: 'PROCESSING',
  success: 'COMPLETE',
};

const WYRE_TRANSFER_STATUS_TYPES = {
  failed: 'FAILED',
  initiated: 'INITIATED',
  pending: 'PENDING',
  success: 'COMPLETED',
};

const wyreOrderStatus = orderId => async dispatch => {
  try {
    const { orderStatus, transferId } = await trackWyreOrder(orderId);
    /*
    dispatch({
      payload: orderStatus,
      type: WYRE_UPDATE_ORDER_STATUS,
    });
    */
    if (transferId) {
      dispatch({
        payload: transferId,
        type: WYRE_UPDATE_TRANSFER_ID,
      });
      dispatch(wyreTransferStatus(transferId));
    } else {
      if (orderStatus !== WYRE_ORDER_STATUS_TYPES.failed) {
        setTimeout(() => dispatch(wyreOrderStatus(orderId)), 10000);
      }
    }
  } catch (error) {
    setTimeout(() => dispatch(wyreOrderStatus(orderId)), 10000);
  }
};

const wyreTransferStatus = transferId => async dispatch => {
  try {
    const {
      destAmount,
      destCurrency,
      transferHash,
      transferStatus,
    } = await trackWyreTransfer(transferId);
    /*
    dispatch({
      payload: transferStatus,
      type: WYRE_UPDATE_TRANSFER_STATUS,
    });
    */
    if (!transferHash) {
      setTimeout(() => dispatch(wyreTransferStatus(transferId)), 10000);
    } else {
      // TODO JIN poll for txn status and once confirmed, pre-emptively add to balance and confetti
      // update balance for destCurrency with destAmount
      // TODO JIN dispatch
    }
  } catch (error) {
    setTimeout(() => dispatch(wyreTransferStatus(transferId)), 10000);
  }
};

export const wyreAddOrder = orderId => dispatch => {
  dispatch({
    payload: orderId,
    type: WYRE_UPDATE_ORDER_ID,
  });
  dispatch(wyreOrderStatus(orderId));
};

export const wyreClearState = () => dispatch =>
  dispatch({ type: WYRE_CLEAR_STATE });

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_WYRE_STATE = {
  orderId: null,
  orderStatus: null,
  transferHash: null,
  transferId: null,
  transferStatus: null,
};

export default (state = INITIAL_WYRE_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
      case WYRE_UPDATE_ORDER_ID:
        draft.orderId = action.payload;
        break;
      case WYRE_UPDATE_ORDER_STATUS:
        draft.orderStatus = action.payload;
        break;
      case WYRE_UPDATE_TRANSFER_ID:
        draft.transferId = action.payload;
        break;
      case WYRE_UPDATE_TRANSFER_HASH:
        draft.transferHash = action.payload;
        break;
      case WYRE_UPDATE_TRANSFER_STATUS:
        draft.transferStatus = action.payload;
        break;
      case WYRE_CLEAR_STATE:
        return INITIAL_WYRE_STATE;
      default:
        break;
    }
  });
