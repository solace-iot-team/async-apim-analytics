export type RestDeliveryPoint = {
  restDeliveryPointName: string;
  data: RestDeliveryPoint.Data,
  meta: RestDeliveryPoint.Meta;
}

export namespace RestDeliveryPoint {

  export type Data = {
    restHttpRequestTxByteCount?: number;
    restHttpRequestTxMsgCount?: number;
    restHttpResponseErrorRxMsgCount?: number;
    restHttpResponseRxByteCount?: number;
    restHttpResponseRxMsgCount?: number;
    restHttpResponseSuccessRxMsgCount?: number;
    restHttpResponseTimeoutRxMsgCount?: number;
    up?: boolean;
  }

  export type Meta = {
    organization: string;
    environment: string;
    application: string;
  }
}
