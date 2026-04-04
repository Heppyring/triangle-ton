import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react'

function App() {
  const [tonConnectUI] = useTonConnectUI()

  const handlePay = async () => {
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: "UQAIIOBPuw8SvrV2KvrQkszeVVwZgRCkxQs4xxzXEedY-O3O",
          amount: "1500000000" // 1.5 TON
        }
      ]
    }

    try {
      await tonConnectUI.sendTransaction(transaction)

      // 👉 ПІСЛЯ ОПЛАТИ ВИКЛИКАЄМО BACKEND
      await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: "user_" + Date.now()
        })
      })

      alert("Успішно оплачено і зареєстровано 🚀")

    } catch (e) {
      console.log(e)
      alert("Помилка оплати")
    }
  }

  return (
    <div>
      <TonConnectButton />

      <button onClick={handlePay}>
        Активувати за 1.5 TON
      </button>
    </div>
  )
}

export default App
