import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { api } from "../lib/api.js";
import "../styles/assistant.css";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm the FIXL Assistant. Ask me how to use the warehouse application, find a feature, or troubleshoot a common issue.",
};


const SUGGESTED_QUESTIONS = [
  "What is FIXL used for?",
  "Why can't I see a feature?",
  "I cannot log in. What should I do?",
  "Where can I view reports?",
  "How do I find inventory?",
  "How do I change stock quantities?",
  "How do I receive new stock?",
  "How do I dispatch stock?",
  "Where can I manage products?",
  "Where can I manage vehicles and drivers?",
  "Where can I check attendance?",
  "Where can I see my assigned tasks?",
  "How do I find shipment information?",
  "What should I do if something goes wrong?",
];


export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isOpen]);

  async function sendMessage(text = message) {
    const question = text.trim();

    if (!question || isSending) return;

    const questionKey = (value) =>
      value.toLowerCase().trim().replace(/\s+/g, " ");

    setAskedQuestions((current) => [
      ...new Set([...current, questionKey(question)]),
    ]);

    setError("");
    setMessage("");
    setShowSuggestions(false);
    setShowAllSuggestions(false);

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: question,
      },
    ]);

    setIsSending(true);

    try {
      const result = await api("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: question }),
      });

      if (!result || typeof result.answer !== "string") {
        throw new Error("The assistant returned an unexpected response.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.answer,
          matched: result.matched,
          category: result.category,
        },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Couldn't reach the assistant. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }



  function startNewChat() {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: crypto.randomUUID(),
      },
    ]);
    setMessage("");
    setError("");
    setShowSuggestions(true);
    setShowAllSuggestions(false);
    setAskedQuestions([]);
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="assistant-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open FIXL Assistant"
          title="FIXL Assistant"
        >
          <MessageCircle size={22} aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <section
          ref={panelRef}
          className="assistant-panel"
          aria-label="FIXL Assistant chat"
          aria-describedby="assistant-description"
        >
          <header className="assistant-header">
            <div className="assistant-brand-icon">
              <Bot size={22} />
            </div>

            <div className="assistant-heading">
              <strong>FIXL Assistant</strong>
              <span>
                <i className="assistant-status-dot" />
                Application help
              </span>
            </div>

            <button
              type="button"
              className="assistant-icon-button"
              onClick={startNewChat}
              aria-label="Start a new chat"
              title="New chat"
            >
              <span aria-hidden="true">↻</span>
            </button>

            <button
              type="button"
              className="assistant-icon-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close FIXL Assistant"
              title="Close chat"
            >
              <X size={19} />
            </button>
          </header>

          <div className="assistant-intro" id="assistant-description">
            Ask about FIXL features, workflows, and common issues. Answers come
            from the application's help guide.
          </div>

          <div
            className="assistant-messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((item) => (
              <div
                key={item.id}
                className={`assistant-message-row ${
                  item.role === "user" ? "is-user" : "is-assistant"
                }`}
              >
                {item.role === "assistant" && (
                  <div className="assistant-message-avatar">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`assistant-message ${
                    item.role === "user"
                      ? "assistant-message-user"
                      : "assistant-message-bot"
                  }`}
                >
                  <span className="assistant-message-label">
                    {item.role === "user" ? "You" : "FIXL Assistant"}
                  </span>
                  <p>{item.text}</p>
                  {item.category && (
                    <span className="assistant-category">
                      {item.category.replaceAll("-", " ")}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div className="assistant-suggestion-section">
              <button
                type="button"
                className="assistant-suggestions-toggle"
                onClick={() => setShowSuggestions((visible) => !visible)}
                aria-expanded={showSuggestions}
              >
                <span>Suggested questions</span>
                <span>{showSuggestions ? "Hide −" : "Show +"}</span>
              </button>

              {showSuggestions && (
                <>
                  <div className="assistant-suggestions">
                    {SUGGESTED_QUESTIONS.filter((question) => {
                      const key = (value) =>
                        value.toLowerCase().trim().replace(/\s+/g, " ");

                      return !askedQuestions.includes(key(question));
                    })
                      .slice(
                        0,
                        showAllSuggestions ? SUGGESTED_QUESTIONS.length : 4,
                      )
                      .map((question) => (
                        <button
                          key={question}
                          type="button"
                          disabled={isSending}
                          onClick={() => sendMessage(question)}
                        >
                          {question}
                        </button>
                      ))}
                  </div>

                  <button
                    type="button"
                    className="assistant-show-more"
                    onClick={() => setShowAllSuggestions((show) => !show)}
                  >
                    {showAllSuggestions
                      ? "Show fewer questions ↑"
                      : "Show more questions ↓"}
                  </button>
                </>
              )}

              {!showSuggestions && messages.length > 1 && (
                <button
                  type="button"
                  className="assistant-more-questions"
                  onClick={() => {
                    setShowSuggestions(true);
                    setShowAllSuggestions(false);
                  }}
                >
                  More questions +
                </button>
              )}
            </div>

            {isSending && (
              <div className="assistant-message-row is-assistant">
                <div className="assistant-message-avatar">
                  <Bot size={16} />
                </div>
                <div className="assistant-message assistant-message-bot assistant-typing">
                  <span className="assistant-spinner" />
                  Finding an answer…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="assistant-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}

          <form className="assistant-composer" onSubmit={handleSubmit}>
            {" "}
            <label className="assistant-sr-only" htmlFor="assistant-message">
              Ask a question about FIXL
            </label>
            <input
              id="assistant-message"
              ref={inputRef}
              type="text"
              className="assistant-text-input"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask a question..."
              maxLength={500}
              disabled={isSending}
              autoComplete="off"
            />
            <button
              type="submit"
              className="assistant-send-button"
              disabled={!message.trim() || isSending}
              aria-label="Send message"
              title="Send message"
            >
              <Send size={18} />
            </button>
            <span className="assistant-input-hint">
              Enter to send · Shift+Enter for a new line
            </span>
          </form>

          <footer className="assistant-footer">
            <span>FIXL / WAREHOUSE</span>
            <span>Help assistant · Not live operational data</span>
          </footer>
        </section>
      )}
    </>
  );
}
