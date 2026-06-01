import React, { useState, useRef, useEffect } from 'react';
import './KnowledgeChatbot.css';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

interface KnowledgeChatbotProps {
	userId: string;
	onSendMessage: (message: string) => Promise<string>;
}

export const KnowledgeChatbot: React.FC<KnowledgeChatbotProps> = ({
	userId,
	onSendMessage,
}) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!input.trim()) return;

		const userMessage = input.trim();
		setInput('');
		setMessages((prev) => [
			...prev,
			{
				role: 'user',
				content: userMessage,
				timestamp: new Date(),
			},
		]);

		setIsLoading(true);

		try {
			const response = await onSendMessage(userMessage);
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: response,
					timestamp: new Date(),
				},
			]);
		} catch (error) {
			console.error('Error sending message:', error);
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: 'Sorry, I encountered an error processing your message.',
					timestamp: new Date(),
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="knowledge-chatbot">
			<div className="chatbot-header">
				<h2>Knowledge Assistant</h2>
				<p className="subtitle">Ask questions about your imported knowledge</p>
			</div>

			<div className="messages-container">
				{messages.length === 0 ? (
					<div className="empty-state">
						<div className="empty-icon">💡</div>
						<h3>Start a Conversation</h3>
						<p>Ask me about your imported ChatGPT conversations, Claude chats, Notion pages, or personal documents.</p>
						<div className="example-prompts">
							<button
								className="example-btn"
								onClick={() => setInput('What are my recent projects?')}
							>
								What are my recent projects?
							</button>
							<button
								className="example-btn"
								onClick={() => setInput('Summarize my last conversation')}
							>
								Summarize my last conversation
							</button>
							<button
								className="example-btn"
								onClick={() =>
									setInput('Find notes about architecture decisions')
								}
							>
								Find notes about architecture decisions
							</button>
						</div>
					</div>
				) : (
					<div className="messages-list">
						{messages.map((message, index) => (
							<div
								key={index}
								className={`message ${message.role}`}
							>
								<div className="message-avatar">
									{message.role === 'user' ? '👤' : '🤖'}
								</div>
								<div className="message-content">
									<div className="message-text">{message.content}</div>
									<div className="message-time">
										{message.timestamp.toLocaleTimeString()}
									</div>
								</div>
							</div>
						))}
						{isLoading && (
							<div className="message assistant loading">
								<div className="message-avatar">🤖</div>
								<div className="message-content">
									<div className="typing-indicator">
										<span></span>
										<span></span>
										<span></span>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			<form
				className="message-input-form"
				onSubmit={handleSendMessage}
			>
				<input
					type="text"
					placeholder="Ask me anything about your knowledge..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					disabled={isLoading}
					className="message-input"
				/>
				<button
					type="submit"
					disabled={!input.trim() || isLoading}
					className="send-btn"
				>
					{isLoading ? '...' : '→'}
				</button>
			</form>
		</div>
	);
};
