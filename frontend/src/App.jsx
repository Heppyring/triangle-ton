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
      await tonConnectUI.sendTransaction(transaction)

      await fetch("https://triangle-ton.onrender.com/register", {
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
      console.log("TX error:", e)
      alert("Транзакція відправлена, перевір ще раз")
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