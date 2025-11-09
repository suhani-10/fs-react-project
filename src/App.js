import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Moon, Sun, History, Menu } from 'lucide-react';

const API_KEY = process.env.REACT_APP_GROQ_API_KEY;

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedModel] = useState('llama-3.1-8b-instant');

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    const savedHistory = localStorage.getItem('chatHistory');
    const savedTheme = localStorage.getItem('isDarkMode');
    
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedHistory) setChatHistory(JSON.parse(savedHistory));
    if (savedTheme) setIsDarkMode(JSON.parse(savedTheme));
  }, []);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [messages, isDarkMode]);

  // Save to history when messages change and there are messages
  useEffect(() => {
    if (messages.length > 0) {
      const currentChat = {
        id: Date.now(),
        title: messages[0]?.content?.slice(0, 30) + '...' || 'New Chat',
        messages: [...messages],
        timestamp: new Date().toISOString()
      };
      
      // Update or add current chat to history
      setChatHistory(prev => {
        const existingIndex = prev.findIndex(chat => 
          chat.messages.length === messages.length && 
          chat.messages[0]?.content === messages[0]?.content
        );
        
        if (existingIndex >= 0) {
          // Update existing chat
          const updated = [...prev];
          updated[existingIndex] = currentChat;
          localStorage.setItem('chatHistory', JSON.stringify(updated));
          return updated;
        } else {
          // Add new chat
          const updated = [currentChat, ...prev.slice(0, 9)];
          localStorage.setItem('chatHistory', JSON.stringify(updated));
          return updated;
        }
      });
    }
  }, [messages]);

  const saveToHistory = () => {
    // History is now automatically saved, this function is kept for compatibility
  };

  const loadFromHistory = (chat) => {
    setMessages(chat.messages);
    setShowHistory(false);
  };

  const newChat = () => {
    saveToHistory();
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: selectedModel,
          messages: [...messages, userMessage],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.data.choices[0].message.content
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Sorry, an error occurred.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid API key. Please check your Groq API key.';
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else {
          errorMessage = `API Error: ${error.response.data?.error?.message || 'Unknown error'}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const AnimatedHelloSVG = () => {
    const [displayText, setDisplayText] = useState('');
    const fullText = 'hello';

    useEffect(() => {
      let currentIndex = 0;
      let isDeleting = false;
      
      const typeWriter = () => {
        if (!isDeleting && currentIndex <= fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex));
          currentIndex++;
          if (currentIndex > fullText.length) {
            setTimeout(() => { isDeleting = true; }, 1000);
          }
        } else if (isDeleting && currentIndex >= 0) {
          setDisplayText(fullText.slice(0, currentIndex));
          currentIndex--;
          if (currentIndex < 0) {
            isDeleting = false;
            currentIndex = 0;
            setTimeout(() => {}, 500);
          }
        }
      };

      const interval = setInterval(typeWriter, isDeleting ? 100 : 200);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="mb-6">
        <h1 className={`text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`} style={{fontFamily: 'cursive', minHeight: '80px'}}>
          {displayText}<span className="animate-pulse">|</span>
        </h1>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-stone-100'}`}>
      {/* Island Navbar */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className={`flex items-center space-x-4 px-6 py-3 rounded-full shadow-lg backdrop-blur-md ${
          isDarkMode ? 'bg-gray-800/80 text-white' : 'bg-white/80 text-gray-800'
        }`}>
          <button onClick={newChat} className="hover:opacity-70">
            <Menu size={20} />
          </button>
          <h1 className="font-semibold">AI Chatbot</h1>
          <button onClick={() => setShowHistory(!showHistory)} className="hover:opacity-70">
            <History size={20} />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:opacity-70">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {showHistory && (
        <div className={`fixed top-20 right-4 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg z-10 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
          <div className="p-4">
            <h3 className="font-semibold mb-3">Chat History</h3>
            {chatHistory.length === 0 ? (
              <p className="text-sm opacity-60">No chat history yet</p>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadFromHistory(chat)}
                  className={`p-3 mb-2 rounded cursor-pointer hover:opacity-70 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs opacity-60">
                    {new Date(chat.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col pt-20">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatedHelloSVG />
            <h2 className={`text-2xl text-center mb-8 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              How can I help you<br />today?
            </h2>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'
                    : isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className={`flex space-x-3 rounded-full border p-2 ${
            isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className={`flex-1 px-4 py-2 bg-transparent outline-none ${
                isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-800'
              }`}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className={`p-2 rounded-full hover:opacity-80 disabled:opacity-50 ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
