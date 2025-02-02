import React from "react";
import { Link } from "react-router-dom";
import "./index.css";

const HomePage: React.FC = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Выберите режим работы</h1>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <Link to="/step-mode">
          <button style={{ padding: "10px 20px", fontSize: "18px" }}>
            Пошаговый режим
          </button>
        </Link>
        <Link to="/auto-mode">
          <button style={{ padding: "10px 20px", fontSize: "18px" }}>
            Автоматический режим
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
