import React, { useState } from "react";
import { Simulation } from "../components/Simulation";
import { SimulationState } from "../components/types";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AutoModePage: React.FC = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState(3);
  const [devices, setDevices] = useState(3);
  const [buffer, setBuffer] = useState(3);
  const [lambda, setLambda] = useState(1);
  const [maxRequests, setMaxRequests] = useState<number | undefined>(100); 
  const [simResults, setSimResults] = useState<any>(null);

  const generateInitialEvents = (numSources: number): any[] => {
    const events = [];
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

  const [sim, setSim] = useState<Simulation | null>(null);

  const handleStartSimulation = () => {
    const newState: SimulationState = {
      ...initialState,
      buffer: { capacity: buffer, queue: [] },
      devices: Array.from({ length: devices }, (_: unknown, i: number) => ({
        id: i + 1,
        isBusy: false,
      })),
      eventQueue: generateInitialEvents(sources),
    };

    // Передаем maxRequests только если оно задано
    const newSim = new Simulation(newState, lambda, maxRequests);
    setSim(newSim); // Обновляем состояние с новым экземпляром симуляции

    newSim.run(); // Запускаем симуляцию

    // Получаем и устанавливаем результаты после завершения симуляции
    setSimResults(newSim.getResults());
  };

   const generateChartsData = () => {
     if (!simResults) return null;

     const { deviceStatistics, sourceStatistics } = simResults;

     const devicesX = deviceStatistics.map((_ : unknown, i: number) => i + 1);
     const utilizationY = deviceStatistics.map(
       (device: any) => device.utilizationCoefficient
     );

     const sourcesX = sourceStatistics.map(
       (source: any) => source.sourceNumber
     );
     const rejectionProbabilityY = sourceStatistics.map(
       (source: any) => source.pOpen
     );

     return {
       utilizationData: {
         labels: devicesX,
         datasets: [
           {
             label: "Коэффициент использования приборов",
             data: utilizationY,
             borderColor: "rgba(75,192,192,1)",
             borderWidth: 2,
           },
         ],
       } ,
       rejectionData: {
         labels: sourcesX,
         datasets: [
           {
             label: "Вероятность отказа",
             data: rejectionProbabilityY,
             borderColor: "rgba(153,102,255,1)",
             borderWidth: 2,
           },
         ],
       },
     };
   };

  return (
    <div>
      <h1>Модель Симуляции (Автоматический режим)</h1>
      <button onClick={() => navigate("/")}>Назад</button>
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
            onChange={(e) => setLambda(Number(e.target.value))}
            min={0.1}
            step={0.1}
          />
        </label>
        <br />
        <label>
          Количество заявок для обработки:
          <input
            type="number"
            value={maxRequests ?? ""}
            onChange={(e) =>
              setMaxRequests(Number(e.target.value) || undefined)
            }
            min={1}
          />
        </label>
        <br />
        <button onClick={handleStartSimulation}>Запустить симуляцию</button>
      </div>

      {simResults && (
        <div>
          <h2>Таблица 1: Источник и заявки</h2>
          <table>
            <thead>
              <tr>
                <th>Номер источника</th>
                <th>Количество заявок</th>
                <th>P отк</th>
                <th>T преб</th>
                <th>T обсл</th>
                <th>T БП</th>
                <th>Д обсл</th>
                <th>Д БП</th>
              </tr>
            </thead>
            <tbody>
              {simResults.sourceStatistics.map((source: any) => (
                <tr key={source.sourceNumber}>
                  <td>{source.sourceNumber}</td>
                  <td>{source.requestCount}</td>
                  <td>{source.pOpen.toFixed(2)}</td>
                  <td>{source.tArrive.toFixed(2)}</td>
                  <td>{source.tService.toFixed(2)}</td>
                  <td>{source.tBuffer.toFixed(2)}</td>
                  <td>{source.dService.toFixed(2)}</td>
                  <td>{source.dBuffer.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Таблица 2: Коэффициент использования приборов</h2>
          <table>
            <thead>
              <tr>
                <th>Номер прибора</th>
                <th>Коэффициент использования</th>
              </tr>
            </thead>
            <tbody>
              {simResults.deviceStatistics.map((device: any) => (
                <tr key={device.deviceNumber}>
                  <td>{device.deviceNumber}</td>
                  <td>{device.utilizationCoefficient.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2>Графики</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", width: "30%"}}></div>
          {generateChartsData() && (
            <>
              <div>
                <h3>Коэффициент использования приборов</h3>
                <Line
                  data={
                    generateChartsData()?.utilizationData || {
                      labels: [],
                      datasets: [],
                    }
                  }
                />
              </div>
              <div>
                <h3>Вероятность отказа по источникам</h3>
                <Line
                  data={
                    generateChartsData()?.rejectionData || {
                      labels: [],
                      datasets: [],
                    }
                  }
                />
              </div>
              
            </>
          )}
          </div>
      )}
    </div>
  );
};

export default AutoModePage;