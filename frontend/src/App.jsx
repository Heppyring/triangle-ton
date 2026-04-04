import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react'

function App() {
  const [tonConnectUI] = useTonConnectUI()

  const handlePay = async () => {
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: "UQAIIOBPuw8SvrV2KvrQkszeVVwZgRCkxQs4xxzXEedY-O3O",
          amount: "1500000000"
        }
      ]
    }

    try {
      // 👉 відкриваємо гаманець
      await tonConnectUI.sendTransaction(transaction)
    } catch (e) {
      console.log("TX error:", e)
    }

    try {
      // 👉 ЗАВЖДИ викликаємо backend після повернення
      await fetch("https://triangle-ton.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: "user_" + Date.now()
        })
      })

      alert("Реєстрація виконана 🚀")

    } catch (e) {
      console.log("Backend error:", e)
      alert("Помилка при реєстрації")
    }
  }

  return (
    <div>
      <TonConnectButton />

      <button onClick={handlePay}>
        Увійти за 1.5 TON
      </button>
    </div>
  )
}

export default App