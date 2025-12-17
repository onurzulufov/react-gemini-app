import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const App = () => {
  const chatRef = useRef(null)

  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const surpriseOptions = [
    'Почему люди видят сны?', 
    'Как появился интернет?', 
    'Как работает искусственный интеллект?'
  ]

  const surprise = () => {
    const randomValue = surpriseOptions[Math.floor(Math.random() * surpriseOptions.length)]
    setValue(randomValue)
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const getResponse = async () => {
    if (!value.trim()) {
      setError('Ошибка! Пожалуйста, задайте вопрос.')
      return
    }

    const userMessage = { role: 'user', parts: [{ text: value.trim() }] }
    setChatHistory(old => [...old, userMessage])
    setValue('')
    setError('')
    setIsLoading(true)

    try {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          history: [...chatHistory, userMessage],
          message: value.trim(),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = await fetch('http://localhost:8000/gemini', options)
      if (!response.ok) {
        throw new Error('Ошибка сети');
      }
      const data = await response.text()
      console.log(data)

      setChatHistory(old => [...old, { role: 'model', parts: [{ text: data }] }])
    } catch (error) {
      console.error(error)
      setError('Что-то пошло не так. Пожалуйста, попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  const clear = () => {
    setValue('')
    setError('')
    setChatHistory([])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      getResponse();
    }
  };

  return (
    <div className="app">
      <section className="search-section">
        <p>
          Что вы хотите узнать?
          <button className="surprise" onClick={surprise} disabled={isLoading || !surpriseOptions.length}>
            Сгенерируем вопрос!
          </button>
        </p>
        <div className="input-container">
          <input 
          value={value}
          placeholder="Задайте любой вопрос..." 
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading} />
          {!error && <button onClick={getResponse} disabled={isLoading || !value.trim()}>
            {isLoading ? 'Думаю...' : 'Спросить!'}
            </button>}
          {error && <button onClick={clear}>Очистить</button>}
        </div>
        {error && <p className='error'>{error}</p>}

<div className="search-result" ref={chatRef}>
  {chatHistory.map((chatItem, index) => (
    <div
      key={index}
      className={`message ${chatItem.role === 'user' ? 'user-message' : 'model-message'}`}
    >
      <strong>{chatItem.role === 'user' ? 'Вы' : 'Gemini'}:</strong>
      <ReactMarkdown>{chatItem.parts[0].text}</ReactMarkdown>
    </div>
  ))}

  {isLoading && (
    <div className="message model-message loading">
      <strong>Gemini:</strong> <span>Печатает...</span>
    </div>
  )}
</div>

      </section>
    </div>
  )
}

export default App
