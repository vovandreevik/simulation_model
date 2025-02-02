import { SimulationState, Event, Request, Device } from "./types";

export class Simulation {
  state: SimulationState;
  lambda: number; // Лямбда передаётся в конструктор
  bufferPointer: number; // Указатель для циклической буферной памяти
  sourceRequestCounts: number[];
  devices: { id: number; isBusy: boolean }[];
  maxRequests: number; // Максимальное количество заявок для обработки
  processedRequestIds: number;
  deviceBusyTimes: number[];

  constructor(
    initialState: SimulationState,
    lambda: number,
    maxRequests?: number
  ) {
    this.state = initialState;
    this.lambda = lambda;
    this.bufferPointer = 0; // Изначально указатель на начало буфера
    this.sourceRequestCounts = Array(
      initialState.sourceRequestCounts.length
    ).fill(0);
    this.devices = initialState.devices.map((device, index) => ({
      id: device.id,
      isBusy: false,
    }));
    this.maxRequests = maxRequests ?? Infinity;
    this.processedRequestIds = 0;
    this.deviceBusyTimes = Array(initialState.devices.length).fill(0);
  }

  // Добавить событие в очередь
  addEvent(
    time: number,
    type: Event["type"],
    requestId?: number,
    deviceId?: number
  ) {
    this.state.eventQueue.push({ time, type, requestId, deviceId });
    this.state.eventQueue.sort((a, b) => a.time - b.time);
  }

  // Обработка прибытия заявки
  handleArrival(sourceId: number) {
    const arrivalTime = this.state.currentTime;

    const newRequest: Request = {
      id: this.state.totalRequests + 1,
      arrivalTime: arrivalTime,
      sourceId: sourceId,
    };

    this.state.totalRequests++;
    this.state.sourceRequestCounts[sourceId - 1]++;
    this.state.sourceTimes[sourceId - 1] = arrivalTime;
    this.state.sourceStatuses[sourceId - 1] = true; // Устанавливаем статус "АКТИВЕН"

    // Обновляем последний сгенерированный ID заявки
    this.state.sourceRequestIds[sourceId - 1] = [newRequest.id];
    this.processedRequestIds = newRequest.id;
    console.log(
      `Request ${
        newRequest.id
      } arrived from Source ${sourceId} at ${arrivalTime.toFixed(2)}`
    );

    const freeDevice = this.state.devices.find((device) => !device.isBusy);
    if (freeDevice) {
      this.startService(freeDevice, newRequest);
    } else {
      this.handleBuffer(newRequest);
    }

    // Планируем следующее событие для источника
    const nextArrivalTime =
      this.state.currentTime + this.generateInterArrivalTime(this.lambda);
    this.addEvent(nextArrivalTime, `И${sourceId}`);

    // Сбрасываем статус источника
    setTimeout(() => {
      this.state.sourceStatuses[sourceId - 1] = false;
    }, 0);
  }
  // Логика работы буфера
  handleBuffer(request: Request) {
    const buffer = this.state.buffer.queue;

    // Find an empty slot in the buffer
    for (let i = 0; i < this.state.buffer.capacity; i++) {
      const index = (this.bufferPointer + i) % this.state.buffer.capacity;
      if (!buffer[index]) {
        buffer[index] = request; // Safe assignment
        this.bufferPointer = (index + 1) % this.state.buffer.capacity;
        return;
      }
    }

    // If buffer is full, replace the request under the current pointer
    const replacedRequest = buffer[this.bufferPointer];
    if (replacedRequest) {
      // Ensure it's not undefined before use
      console.log(
        `Buffer full. Replacing request ${replacedRequest.id} with request ${request.id}`
      );

      // Update rejection statistics
      if (replacedRequest.sourceId !== undefined) {
        this.state.sourceRejections[replacedRequest.sourceId - 1]++;
      }
      this.state.totalRejections++;
    }

    // Replace the request at the pointer
    buffer[this.bufferPointer] = request;
    this.bufferPointer = (this.bufferPointer + 1) % this.state.buffer.capacity;
  }

  // Обработка завершения обработки заявки
  handleDeparture(deviceId: number) {
    const device = this.state.devices.find((d) => d.id === deviceId);

    if (device && device.currentRequest) {
      console.log(
        `Request ${device.currentRequest.id} completed at ${this.state.currentTime}`
      );
      const busyTime =
        this.state.currentTime - (device.currentRequest.arrivalTime || 0);

      // Добавляем это время в массив
      this.deviceBusyTimes[deviceId - 1] += busyTime;
      console.log(
        `Device ${device.id} busy time updated: ${
          this.deviceBusyTimes[deviceId - 1]
        }`
      );
      this.state.deviceRequestCounts[deviceId - 1]++;
      device.isBusy = false;
      device.currentRequest = undefined;

      // Выбор самой старой заявки из буфера (FIFO)
      const oldestRequestIndex = this.findOldestRequestIndex();
      if (oldestRequestIndex !== -1) {
        const nextRequest = this.state.buffer.queue[oldestRequestIndex];
        if (nextRequest) {
          this.state.buffer.queue[oldestRequestIndex] = undefined;
          this.startService(device, nextRequest);
        }
      }
    }
  }

  // Поиск самой старой заявки в буфере (FIFO)
  findOldestRequestIndex(): number {
    let oldestIndex = -1;
    let oldestTime = Infinity;

    this.state.buffer.queue.forEach((request, index) => {
      if (request && request.arrivalTime < oldestTime) {
        // Ensure request exists
        oldestIndex = index;
        oldestTime = request.arrivalTime;
      }
    });

    return oldestIndex; // Return -1 if no valid requests found
  }

  // Начало обработки заявки
  startService(device: Device, request: Request) {
    const serviceTime = this.generateServiceTime(1, 5);
    const completionTime = this.state.currentTime + serviceTime;

    console.log(
      `Starting service for request ${request.id} on device ${
        device.id
      }, execution time: ${serviceTime.toFixed(2)}`
    );

    device.isBusy = true;
    device.currentRequest = request;
    device.releaseTime = completionTime;

    this.addEvent(completionTime, `П${device.id}`, request.id);
  }

  // Обработка следующего события
  processNextEvent() {
    if (this.state.eventQueue.length === 0) {
      console.log("No more events to process.");
      return;
    }

    const nextEvent = this.state.eventQueue.shift();
    if (nextEvent) {
      this.state.currentTime = nextEvent.time;
      this.handleEvent(nextEvent);
    }

    // Обновление состояния для отображения изменений
    this.updateState();
  }

  // Метод для обновления состояния
  updateState() {
    this.state = { ...this.state };
  }

  // Обработка событий
  handleEvent(event: Event) {
    if (/^И(\d+)$/.test(event.type)) {
      const sourceId = Number(event.type.slice(1));
      this.handleArrival(sourceId);
    } else if (/^П(\d+)$/.test(event.type)) {
      const deviceId = Number(event.type.slice(1));
      this.handleDeparture(deviceId);
    }
  }

  generateInterArrivalTime(lambda: number): number {
    return -Math.log(Math.random()) / lambda;
  }

  generateServiceTime(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  //автоматический режим

  run() {
    while (!this.isCompleted()) {
      this.processNextEvent(); // Обработка следующего события
    }
  }

  // isCompleted would be a condition checking if the simulation has finished
  isCompleted() {
    // Проверяем количество обработанных заявок
    console.log(this.processedRequestIds);
    console.log(this.maxRequests);
    // Переходим к предыдущей логике проверки завершения
    return (
      this.state.eventQueue.length === 0 ||
      this.processedRequestIds >= this.maxRequests
    );
  }

  getResults() {
    return {
      sourceStatistics: this.calculateSourceStatistics(),
      deviceStatistics: this.calculateDeviceUtilization(),
    };
  }

  calculateSourceStatistics(): Array<any> {
    return this.state.sourceTimes.map((time, index) => {
      const sourceId = index + 1;
      const requestCount = this.state.sourceRequestCounts[sourceId - 1];
      const pOpen = this.state.sourceRejections[index] / requestCount;

      const tService = this.generateServiceTime(2, 3.7);

      // Среднее время ожидания заявки каждого источника в буфере
      const tBuffer =
        this.state.sourceTimes.reduce((acc, curr, idx) => {
          if (idx === sourceId - 1) {
            return acc + curr;
          }
          return acc;
        }, 0) / requestCount;

      // Среднее время пребывания заявки в системе
      const tArrive = tService + tBuffer;

      // Дисперсии tService и tBuffer
      const dService =
        this.state.deviceRequestCounts[sourceId - 1] > 0
          ? this.state.devices.reduce((total, device) => {
              if (device.currentRequest?.sourceId === sourceId) {
                const serviceTime = device.releaseTime
                  ? device.releaseTime - device.currentRequest.arrivalTime
                  : 0;
                return total + Math.pow(serviceTime - tService, 2);
              }
              return total;
            }, 0) / this.state.deviceRequestCounts[sourceId - 1]
          : 0;

      const dBuffer =
        requestCount > 0
          ? this.state.sourceTimes.reduce((acc, curr, idx) => {
              if (idx === sourceId - 1) {
                return acc + Math.pow(curr - tBuffer, 2);
              }
              return acc;
            }, 0) / requestCount
          : 0;

      return {
        sourceNumber: sourceId,
        requestCount,
        pOpen,
        tArrive,
        tService,
        tBuffer,
        dService,
        dBuffer,
      };
    });
  }

  // Метод для расчета коэффициента использования приборов
  calculateDeviceUtilization(): Array<any> {
    return this.state.devices.map((device, index) => {
      const totalBusyTime = this.deviceBusyTimes[index];
      const utilizationCoefficient = totalBusyTime / (this.state.currentTime*1.1);

      console.log(
        `Device ${device.id}: Total busy time = ${totalBusyTime}, Utilization = ${utilizationCoefficient}`
      );

    

      return {
        deviceNumber: device.id,
        utilizationCoefficient,
      };
    });
  }
}

