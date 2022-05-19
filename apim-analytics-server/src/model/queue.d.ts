export type Queue = {
  queueName: string;
  data: Queue.Data;
  meta: Queue.Meta;
}

export namespace Queue {

  export type Data = {
    bindCount?: number;
    clientProfileDeniedDiscardedMsgCount?: number;
    deletedMsgCount?: number;
    destinationGroupErrorDiscardedMsgCount?: number;
    disabledDiscardedMsgCount?: number;
    lowPriorityMsgCongestionDiscardedMsgCount?: number;
    maxMsgSizeExceededDiscardedMsgCount?: number;
    maxMsgSpoolUsageExceededDiscardedMsgCount?: number;
    maxRedeliveryExceededDiscardedMsgCount?: number;
    maxRedeliveryExceededToDmqFailedMsgCount?: number;
    maxRedeliveryExceededToDmqMsgCount?: number;
    maxTtl?: number;
    maxTtlExceededDiscardedMsgCount?: number;
    maxTtlExpiredDiscardedMsgCount?: number;
    maxTtlExpiredToDmqFailedMsgCount?: number;
    maxTtlExpiredToDmqMsgCount?: number;
    msgCount?: number;
    msgSpoolUsage?: number;
    msgSpoolPeakUsage?: number;
    noLocalDeliveryDiscardedMsgCount?: number;
    redeliveredMsgCount?: number;
    spooledMsgCount?: number;
    transportRetransmitMsgCount?: number;
  }

  export type Meta = {
    organization: string;
    environment: string;
    application: string;
  }
}
