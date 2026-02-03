"use client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '@/lib/routeProposalTypes';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-pink-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isUser ? (
          // ユーザーメッセージはそのまま表示
          <p className="text-sm whitespace-pre-line">{message.content}</p>
        ) : (
          // AIメッセージはマークダウンでレンダリング
          <div className="text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // 見出し1 (# お待たせ！)
                h1: (props) => (
                  <h1 
                    className="text-xl font-bold mb-3 text-pink-600" 
                    {...props} 
                  />
                ),
                
                // 見出し2 (## 📍 その日は...)
                h2: (props) => (
                  <h2 
                    className="text-lg font-bold mt-4 mb-2 text-pink-500" 
                    {...props} 
                  />
                ),
                
                // 見出し3 (### ⏰ 10:00)
                h3: (props) => (
                  <h3 
                    className="text-base font-semibold mt-3 mb-1 text-gray-800" 
                    {...props} 
                  />
                ),
                
                // 段落
                p: (props) => (
                  <p 
                    className="mb-2 leading-relaxed" 
                    {...props} 
                  />
                ),
                
                // 太字 (**テキスト**)
                strong: (props) => (
                  <strong 
                    className="font-bold text-pink-600" 
                    {...props} 
                  />
                ),
                
                // リスト
                ul: (props) => (
                  <ul 
                    className="list-disc pl-5 mb-2 space-y-1" 
                    {...props} 
                  />
                ),
                
                li: (props) => (
                  <li 
                    className="leading-relaxed" 
                    {...props} 
                  />
                ),
                
                // イタリック (*移動時間*)
                em: (props) => (
                  <em 
                    className="text-gray-600 not-italic" 
                    {...props} 
                  />
                ),
                
                // コードブロック（JSONは非表示）
                code: (props) => {
                  // @ts-expect-error - inline property exists at runtime
                  const isInline = props.inline;
                  
                  if (isInline) {
                    return (
                      <code 
                        className="bg-pink-100 px-1 py-0.5 rounded text-xs" 
                        {...props} 
                      />
                    );
                  }
                  // コードブロック（```json）は非表示
                  return null;
                },
                
                // 水平線 (---)
                hr: (props) => (
                  <hr 
                    className="my-3 border-gray-300" 
                    {...props} 
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}