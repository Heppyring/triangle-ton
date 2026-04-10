import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react'
import { useEffect } from 'react'

function App() {
  const [tonConnectUI] = useTonConnectUI()

  // ==========================
  // 🔥 РЕФЕРАЛКА (ВАЖЛИВО)
  // ==========================
  useEffect(() => {
    // 👉 1. з URL (сайт)
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")

    if (ref) {
      localStorage.setItem("referrer_id", ref)
      console.log("Ref from URL:", ref)
    }

    // 👉 2. з Telegram
    const tg = window.Telegram?.WebApp
    if (tg?.initDataUnsafe?.start_param) {
      localStorage.setItem("referrer_id", tg.initDataUnsafe.start_param)
      console.log("Ref from Telegram:", tg.initDataUnsafe.start_param)
    }
  }, [])

  // ==========================
  // 💸 ОПЛАТА + РЕЄСТРАЦІЯ
  // ==========================
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
    } catch (e) {
      console.log("TX error:", e)
      return
    }

    try {
      const referrer_id = localStorage.getItem("referrer_id")

      await fetch("https://triangle-ton.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: "user_" + Date.now(),
          referrerId: referrer_id
        })
      })

      alert("Реєстрація виконана 🚀")

    } catch (e) {
      console.log("Backend error:", e)
      alert("Помилка при реєстрації")
    }
  }

  // ==========================
  // 🔗 МІЙ РЕФ ЛІНК
  // ==========================
  const myId = "user_demo_123" // 🔥 потім замінимо на реальний user.id
  const myRefLink = `${window.location.origin}?ref=${myId}`

  return (
    <div style={{ padding: 20 }}>
      <TonConnectButton />

      <button onClick={handlePay}>
        Увійти за 1.5 TON
      </button>

      <hr />

      <h3>Моя рефералка:</h3>
      <p>{myRefLink}</p>
    </div>
  )
}

export default App