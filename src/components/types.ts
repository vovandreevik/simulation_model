export type Event = {
  time: number;
  type: string;
  requestId?: number;
  deviceId?: number;
};

export type Request = {
  id: number;
  arrivalTime: number;
  sourceId?: number;
};


export type Device = {
  id: number; 
  isBusy: boolean; 
  currentRequest?: Request;
  releaseTime?: number; 
};

export type Buffer = {
  capacity: number;
  queue: (Request | undefined)[];
};

export type SimulationState = {
  currentTime: number;
  eventQueue: Event[];
  buffer: Buffer;
  devices: Device[];
  totalRequests: number;
  totalRejections: number;
  sourceRequestCounts: number[];
  sourceRejections: number[];
  deviceRequestCounts: number[];
  deviceRejections: number[];
  sourceTimes: number[];
  sourceStatuses: boolean[];
  activeDeviceEvents: Set<number>;
  sourceRequestIds: number[][];
}
