import React, { useState } from "react";
import { Simulation } from "../components/Simulation";
import { SimulationState, Event } from "../components/types";
import { useNavigate } from "react-router-dom";

const StepModePage: React.FC = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState(3);
  const [devices, setDevices] = useState(3);
  const [buffer, setBuffer] = useState(3);
  const [lambda, setLambda] = useState(1); // Пользовательская лямбда
  const [isSimulationStarted, setSimulationStarted] = useState(false);

  const generateInitialEvents = (numSources: number): Event[] => {
    const events: Event[] = [];
    for (let i = 1; i <= numSources; i++) {
      events.push({ time: 0, type: `И${i}` });
    }
    return events;
  };

  const initialState: SimulationState = {
    currentTime: 0,
    eventQueue: generateInitialEvents(sources),
    buffer: { capacity: buffer, queue: [] },
    devices: Array.from({ length: devices }, (_, i) => ({
      id: i + 1,
      isBusy: false,
    })),
    totalRequests: 0,
    totalRejections: 0,
    sourceRequestCounts: Array(sources).fill(0),
    sourceRejections: Array(sources).fill(0),
    deviceRequestCounts: Array(devices).fill(0),
    deviceRejections: Array(devices).fill(0),
    sourceTimes: Array(sources).fill(0),
    sourceStatuses: Array(sources).fill(false),
    activeDeviceEvents: new Set<number>(),
    sourceRequestIds: Array.from({ length: sources }, () => []),
  };

  const [state, setState] = useState<SimulationState>(initialState);
  const [sim, setSim] = useState(new Simulation(initialState, lambda)); // Передаём лямбду в симуляцию

  const handleStartSimulation = () => {
    const newState: SimulationState = {
      ...initialState,
      buffer: { capacity: buffer, queue: [] },
      devices: Array.from({ length: devices }, (_, i) => ({
        id: i + 1,
        isBusy: false,
      })),
      sourceRequestCounts: Array(sources).fill(0),
      sourceRejections: Array(sources).fill(0),
      deviceRequestCounts: Array(devices).fill(0),
      deviceRejections: Array(devices).fill(0),
      sourceTimes: Array(sources).fill(0),
      eventQueue: generateInitialEvents(sources),
    };

    setState(newState);
    setSim(new Simulation(newState, lambda)); // Передаём обновлённую лямбду
    setSimulationStarted(true);
  };

  const handleNextStep = () => {
    sim.processNextEvent();
    setState({ ...sim.state });
  };

  const handleResetSimulation = () => {
    setState(initialState);
    setSim(new Simulation(initialState, lambda)); // Передаём обновлённую лямбду
    setSimulationStarted(false);
  };

  const handleLambdaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLambda = Number(e.target.value);
    setLambda(newLambda);
    setSim(new Simulation({ ...state }, newLambda)); // Обновляем симуляцию с новой лямбдой
  };

  return (
    <div>
      <h1>Модель Симуляции (Пошаговый режим)</h1>
      <button onClick={() => navigate("/")}>Назад</button>{" "}
      {!isSimulationStarted ? (
        <div>
          <h2>Параметры симуляции</h2>
          <label>
            Количество источников:
            <input
              type="number"
              value={sources}
              onChange={(e) => setSources(Number(e.target.value))}
              min={1}
            />
          </label>
          <br />
          <label>
            Количество приборов:
            <input
              type="number"
              value={devices}
              onChange={(e) => setDevices(Number(e.target.value))}
              min={1}
            />
          </label>
          <br />
          <label>
            Размер буфера:
            <input
              type="number"
              value={buffer}
              onChange={(e) => setBuffer(Number(e.target.value))}
              min={1}
            />
          </label>
          <br />
          <label>
            Лямбда (λ):
            <input
              type="number"
              value={lambda}
              onChange={handleLambdaChange}
              min={0.1}
              step={0.1}
            />
          </label>
          <br />
          <button onClick={handleStartSimulation}>Запустить симуляцию</button>
        </div>
      ) : (
        <>
          <h2>Текущее время: {state.currentTime.toFixed(2)}</h2>
          <button onClick={handleNextStep}>Шаг</button>
          <button onClick={handleResetSimulation}>Сбросить симуляцию</button>
          <h3>Календарь событий</h3>
          <table border={1}>
            <thead>
              <tr>
                <th>Событие</th>
                <th>Время</th>
                <th>Признак</th>
                <th>Число заявок</th>
                <th>Число отказов</th>
                <th>Номер заявки</th>
              </tr>
            </thead>
            <tbody>
              {/* Источники */}
              {state.sourceRequestCounts.map((_, index) => (
                <tr key={`И${index + 1}`}>
                  <td>{`И${index + 1}`}</td>
                  <td>
                    {state.sourceTimes[index] !== 0
                      ? state.sourceTimes[index].toFixed(2)
                      : "-"}
                  </td>
                  <td>
                    {state.sourceStatuses[index] ? "АКТИВЕН" : "В ОЖИДАНИИ"}
                  </td>
                  <td>{state.sourceRequestCounts[index]}</td>
                  <td>{state.sourceRejections[index]}</td>
                  <td>
                    {state.sourceRequestIds[index].length > 0
                      ? state.sourceRequestIds[index][0]
                      : "-"}
                  </td>
                </tr>
              ))}
              {/* Приборы */}
              {state.devices.map((device) => (
                <tr key={`П${device.id}`}>
                  <td>{`П${device.id}`}</td>
                  <td>
                    {device.releaseTime !== undefined
                      ? device.releaseTime.toFixed(2)
                      : "-"}
                  </td>
                  <td>{device.isBusy ? "ЗАНЯТ" : "СВОБОДЕН"}</td>
                  <td>{state.deviceRequestCounts[device.id - 1]}</td>
                  <td>{state.deviceRejections[device.id - 1]}</td>
                  <td>{device.currentRequest?.id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Буфер</h3>
          <table border={1}>
            <thead>
              <tr>
                <th>Позиция</th>
                <th>Время</th>
                <th>Источник</th>
                <th>Заявка</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: state.buffer.capacity }, (_, index) => {
                const request = state.buffer.queue[index];
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{request?.arrivalTime.toFixed(2) ?? "-"}</td>
                    <td>{request?.sourceId ?? "-"}</td>
                    <td>{request?.id ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default StepModePage;
