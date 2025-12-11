import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import '../../index.css';

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const chatBg = isDarkMode ? 'bg-dark' : 'bg-white';
  const chatText = isDarkMode ? 'text-light' : 'text-dark';
  const borderColor = isDarkMode ? 'border-secondary' : 'border-light';

  return (
    <div 
      className="chatbot-container" 
      style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 1050,
        pointerEvents: 'none',
        isolation: 'isolate'
      }}
    >
      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`chat-window ${chatBg} ${chatText} shadow-lg rounded-4`}
          style={{
            width: '350px',
            height: '500px',
            marginBottom: '80px',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${isDarkMode ? '#444' : '#dee2e6'}`,
            overflow: 'hidden',
            position: 'absolute',
            bottom: '80px',
            right: '0',
            pointerEvents: 'auto'
          }}
        >
          {/* Chat Header */}
          <div 
            className="chat-header p-3 d-flex justify-content-between align-items-center"
            style={{
              backgroundColor: isDarkMode ? '#222' : '#FF6A00',
              color: 'white',
              borderBottom: `1px solid ${isDarkMode ? '#444' : 'rgba(255,255,255,0.2)'}`
            }}
          >
            <div className="d-flex align-items-center">
              <i className="bi bi-chat-dots-fill me-2" style={{ fontSize: '1.2rem' }}></i>
              <h6 className="mb-0 fw-bold">{t("help") || "Тусламж"}</h6>
            </div>
            <button
              onClick={toggleChat}
              className="btn btn-sm text-white border-0"
              style={{ backgroundColor: 'transparent' }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Chat Messages */}
          <div 
            className="chat-messages flex-grow-1 p-3"
            style={{
              overflowY: 'auto',
              backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa'
            }}
          >
            <div className="message bot-message mb-3">
              <div 
                className="message-bubble p-3 rounded-3"
                style={{
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#e9ecef',
                  maxWidth: '80%',
                  display: 'inline-block'
                }}
              >
                <p className="mb-0 small">
                  {language === 'MN' 
                    ? 'Сайн байна уу! Танд тусламж хэрэгтэй юу? Бид танд туслахдаа баяртай байна!' 
                    : 'Hello! Do you need help? We\'re happy to assist you!'}
                </p>
              </div>
            </div>
            
            <div className="message bot-message mb-3">
              <div 
                className="message-bubble p-3 rounded-3"
                style={{
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#e9ecef',
                  maxWidth: '80%',
                  display: 'inline-block'
                }}
              >
                <p className="mb-2 small fw-bold">
                  {language === 'MN' ? 'Бид танд туслах боломжтой:' : 'We can help you with:'}
                </p>
                <ul className="mb-0 small" style={{ paddingLeft: '1.2rem' }}>
                  <li>{language === 'MN' ? 'Бараа хайх' : 'Finding products'}</li>
                  <li>{language === 'MN' ? 'Захиалга хийх' : 'Placing orders'}</li>
                  <li>{language === 'MN' ? 'Төлбөр төлөх' : 'Payment questions'}</li>
                  <li>{language === 'MN' ? 'Хүргэлт' : 'Delivery information'}</li>
                  <li>{language === 'MN' ? 'Бусад асуулт' : 'Other questions'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div 
            className="chat-input p-3 border-top"
            style={{
              backgroundColor: isDarkMode ? '#222' : '#fff',
              borderColor: isDarkMode ? '#444' : '#dee2e6'
            }}
          >
            <div className="input-group">
              <input
                type="text"
                className={`form-control ${chatText}`}
                placeholder={language === 'MN' ? 'Асуултаа бичнэ үү...' : 'Type your question...'}
                style={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  borderColor: isDarkMode ? '#444' : '#dee2e6'
                }}
              />
              <button
                className="btn text-white"
                style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
              >
                <i className="bi bi-send-fill"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className="chat-button btn rounded-circle shadow-lg border-0"
        style={{
          width: '60px',
          height: '60px',
          backgroundColor: '#FF6A00',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'all 0.3s ease',
          position: 'absolute',
          bottom: '0',
          right: '0',
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.backgroundColor = '#E68A1F';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = '#FF6A00';
        }}
      >
        {isOpen ? (
          <i className="bi bi-x-lg"></i>
        ) : (
          <i className="bi bi-chat-dots-fill"></i>
        )}
        {!isOpen && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.6rem', padding: '2px 5px' }}
          >
            !
          </span>
        )}
      </button>
    </div>
  );
};

export default Chatbot;

