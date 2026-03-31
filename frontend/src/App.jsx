import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";

function App() {
  const address = useTonAddress();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1c",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px"
    }}>
      <h1 style={{ fontSize: "32px" }}>
        🚀 Triangle TON
      </h1>

      <TonConnectButton />

      {address && (
        <div style={{ textAlign: "center" }}>
          <p>Wallet connected:</p>
          <p style={{ fontSize: "12px", opacity: 0.6 }}>
            {address}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;