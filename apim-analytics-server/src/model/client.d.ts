export type Client = {
  clientName: string;
  data: Client.Data,
  meta: Client.Meta;
}

export namespace Client {

  export type Data = {
    dataRxByteCount?: number;
    dataRxMsgCount?: number;
    dataTxByteCount?: number;
    dataTxMsgCount?: number;
    msgSpoolCongestionRxDiscardedMsgCount?: number;
    msgSpoolRxDiscardedMsgCount?: number;
    noSubscriptionMatchRxDiscardedMsgCount?: number;
    publishTopicAclRxDiscardedMsgCount?: number;
    topicParseErrorRxDiscardedMsgCount?: number;
    txDiscardedMsgCount?: number;
    rxDiscardedMsgCount?: number;
    webParseErrorRxDiscardedMsgCount?: number;
    uptime?: number;
  }

  export type Meta = {
    organization: string;
    environment: string;
    application: string;
  }
}
