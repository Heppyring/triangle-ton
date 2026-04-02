import { useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";

function App() {
  const [level, setLevel] = useState(1);
  const [tonConnectUI] = useTonConnectUI();

  const nextLevel = async () => {
    try {
      // 💸 1. Відправка TON
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", // ⚠️ замінимо потім
            amount: "10000000" // 0.01 TON
          }
        ]
      });

      // ⬆ 2. Переходимо на наступний рівень
      setLevel(prev => prev + 1);

    } catch (e) {
      console.log("❌ Transaction cancelled");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Triangle TON</h1>

      <p>Площадка: {level}</p>

      <button onClick={nextLevel}>
        Перейти на наступну площадку
      </button>
    </div>
  );
}

export default App;