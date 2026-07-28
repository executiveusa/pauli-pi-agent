/**
 * Integration Connection UI
 * Easy way to connect Agent Mail, Composio, and Latitude
 * Unified dashboard for all third-party service configuration
 */

import React, { useState } from 'react';
import './integration-connect-ui.css';

export interface IntegrationConnectionProps {
	onConnect: (provider: string, config: Record<string, string>) => Promise<void>;
	onTest: (provider: string, apiKey: string) => Promise<boolean>;
	testResults?: Record<string, { success: boolean; message: string }>;
}

export const AgentMailConnector: React.FC<{
	onConnect: (config: Record<string, string>) => Promise<void>;
	onTest: (apiKey: string) => Promise<boolean>;
	testStatus?: { success: boolean; message: string };
}> = ({ onConnect, onTest, testStatus }) => {
	const [apiKey, setApiKey] = useState('');
	const [fromEmail, setFromEmail] = useState('');
	const [replyTo, setReplyTo] = useState('');
	const [maxEmails, setMaxEmails] = useState('100');
	const [autoReply, setAutoReply] = useState(false);
	const [testing, setTesting] = useState(false);
	const [connecting, setConnecting] = useState(false);

	const handleTest = async () => {
		if (!apiKey) {
			alert('Please enter an API key');
			return;
		}
		setTesting(true);
		try {
			await onTest(apiKey);
		} finally {
			setTesting(false);
		}
	};

	const handleConnect = async () => {
		if (!apiKey || !fromEmail) {
			alert('API Key and From Email are required');
			return;
		}
		setConnecting(true);
		try {
			await onConnect({
				AGENTMAIL_API_KEY: apiKey,
				AGENTMAIL_FROM_EMAIL: fromEmail,
				AGENTMAIL_REPLY_TO: replyTo,
				AGENTMAIL_MAX_EMAILS_PER_DAY: maxEmails,
				AGENTMAIL_ENABLE_AUTO_REPLY: String(autoReply),
			});
		} finally {
			setConnecting(false);
		}
	};

	return (
		<div className="integration-card agentmail-card">
			<div className="card-header">
				<span className="provider-icon">📧</span>
				<div className="header-content">
					<h3>Agent Mail</h3>
					<p className="provider-description">Email communication for agents</p>
				</div>
				{testStatus && (
					<span className={`status-badge ${testStatus.success ? 'success' : 'error'}`}>
						{testStatus.success ? '✅ Connected' : '❌ Disconnected'}
					</span>
				)}
			</div>

			<div className="card-content">
				<div className="form-group">
					<label>API Key *</label>
					<input
						type="password"
						placeholder="Paste from https://console.agentmail.to/dashboard/api-keys"
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						disabled={connecting}
					/>
					<small className="help-text">Get from: console.agentmail.to</small>
				</div>

				<div className="form-group">
					<label>From Email *</label>
					<input
						type="email"
						placeholder="agent@yourdomain.com"
						value={fromEmail}
						onChange={(e) => setFromEmail(e.target.value)}
						disabled={connecting}
					/>
				</div>

				<div className="form-group">
					<label>Reply-To Email (Optional)</label>
					<input
						type="email"
						placeholder="support@yourdomain.com"
						value={replyTo}
						onChange={(e) => setReplyTo(e.target.value)}
						disabled={connecting}
					/>
				</div>

				<div className="form-group">
					<label>Max Emails Per Day</label>
					<select value={maxEmails} onChange={(e) => setMaxEmails(e.target.value)} disabled={connecting}>
						<option value="100">100/day (Free)</option>
						<option value="1000">1,000/day (Pro)</option>
						<option value="5000">5,000/day (Enterprise)</option>
					</select>
				</div>

				<div className="form-group checkbox">
					<input
						type="checkbox"
						id="auto-reply"
						checked={autoReply}
						onChange={(e) => setAutoReply(e.target.checked)}
						disabled={connecting}
					/>
					<label htmlFor="auto-reply">Enable auto-reply functionality</label>
				</div>

				{testStatus && (
					<div className={`status-message ${testStatus.success ? 'success' : 'error'}`}>
						{testStatus.message}
					</div>
				)}

				<div className="button-group">
					<button
						className="btn-test"
						onClick={handleTest}
						disabled={testing || connecting || !apiKey}
					>
						{testing ? '🔄 Testing...' : '🧪 Test Connection'}
					</button>
					<button
						className="btn-connect"
						onClick={handleConnect}
						disabled={connecting || !apiKey || !fromEmail}
					>
						{connecting ? '🔗 Connecting...' : '🔗 Connect Agent Mail'}
					</button>
				</div>
			</div>
		</div>
	);
};

export const ComposioConnector: React.FC<{
	onConnect: (config: Record<string, string>) => Promise<void>;
	onTest: (apiKey: string) => Promise<boolean>;
	testStatus?: { success: boolean; message: string };
}> = ({ onConnect, onTest, testStatus }) => {
	const [apiKey, setApiKey] = useState('');
	const [workspaceId, setWorkspaceId] = useState('');
	const [selectedActions, setSelectedActions] = useState<string[]>([
		'github',
		'slack',
		'jira',
		'gmail',
	]);
	const [rateLimit, setRateLimit] = useState('1000');
	const [testing, setTesting] = useState(false);
	const [connecting, setConnecting] = useState(false);

	const availableActions = [
		'github',
		'slack',
		'jira',
		'gmail',
		'notion',
		'asana',
		'trello',
		'salesforce',
		'hubspot',
		'stripe',
	];

	const handleTest = async () => {
		if (!apiKey) {
			alert('Please enter an API key');
			return;
		}
		setTesting(true);
		try {
			await onTest(apiKey);
		} finally {
			setTesting(false);
		}
	};

	const handleConnect = async () => {
		if (!apiKey || !workspaceId) {
			alert('API Key and Workspace ID are required');
			return;
		}
		setConnecting(true);
		try {
			await onConnect({
				COMPOSIO_API_KEY: apiKey,
				COMPOSIO_WORKSPACE_ID: workspaceId,
				COMPOSIO_ENABLED_ACTIONS: selectedActions.join(','),
				COMPOSIO_RATE_LIMIT: rateLimit,
			});
		} finally {
			setConnecting(false);
		}
	};

	const toggleAction = (action: string) => {
		setSelectedActions((prev) =>
			prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
		);
	};

	return (
		<div className="integration-card composio-card">
			<div className="card-header">
				<span className="provider-icon">⚡</span>
				<div className="header-content">
					<h3>Composio</h3>
					<p className="provider-description">100+ app integrations & automation</p>
				</div>
				{testStatus && (
					<span className={`status-badge ${testStatus.success ? 'success' : 'error'}`}>
						{testStatus.success ? '✅ Connected' : '❌ Disconnected'}
					</span>
				)}
			</div>

			<div className="card-content">
				<div className="form-group">
					<label>API Key *</label>
					<input
						type="password"
						placeholder="Paste from dashboard.composio.dev"
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						disabled={connecting}
					/>
					<small className="help-text">Get from: dashboard.composio.dev/executiveusa</small>
				</div>

				<div className="form-group">
					<label>Workspace ID *</label>
					<input
						type="text"
						placeholder="workspace-id-from-composio"
						value={workspaceId}
						onChange={(e) => setWorkspaceId(e.target.value)}
						disabled={connecting}
					/>
				</div>

				<div className="form-group">
					<label>Enabled Actions</label>
					<div className="actions-grid">
						{availableActions.map((action) => (
							<label key={action} className="action-checkbox">
								<input
									type="checkbox"
									checked={selectedActions.includes(action)}
									onChange={() => toggleAction(action)}
									disabled={connecting}
								/>
								<span className="action-label">{action}</span>
							</label>
						))}
					</div>
				</div>

				<div className="form-group">
					<label>Rate Limit (actions/day)</label>
					<select value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} disabled={connecting}>
						<option value="1000">1,000/day (Free)</option>
						<option value="10000">10,000/day (Pro)</option>
						<option value="100000">100,000/day (Enterprise)</option>
					</select>
				</div>

				{testStatus && (
					<div className={`status-message ${testStatus.success ? 'success' : 'error'}`}>
						{testStatus.message}
					</div>
				)}

				<div className="button-group">
					<button
						className="btn-test"
						onClick={handleTest}
						disabled={testing || connecting || !apiKey}
					>
						{testing ? '🔄 Testing...' : '🧪 Test Connection'}
					</button>
					<button
						className="btn-connect"
						onClick={handleConnect}
						disabled={connecting || !apiKey || !workspaceId}
					>
						{connecting ? '🔗 Connecting...' : '🔗 Connect Composio'}
					</button>
				</div>
			</div>
		</div>
	);
};

export const LatitudeConnector: React.FC<{
	onConnect: (config: Record<string, string>) => Promise<void>;
	onTest: (apiKey: string) => Promise<boolean>;
	testStatus?: { success: boolean; message: string };
}> = ({ onConnect, onTest, testStatus }) => {
	const [apiKey, setApiKey] = useState('');
	const [projectId, setProjectId] = useState('');
	const [environment, setEnvironment] = useState('production');
	const [telemetry, setTelemetry] = useState(true);
	const [testing, setTesting] = useState(false);
	const [connecting, setConnecting] = useState(false);

	const handleTest = async () => {
		if (!apiKey) {
			alert('Please enter an API key');
			return;
		}
		setTesting(true);
		try {
			await onTest(apiKey);
		} finally {
			setTesting(false);
		}
	};

	const handleConnect = async () => {
		if (!apiKey || !projectId) {
			alert('API Key and Project ID are required');
			return;
		}
		setConnecting(true);
		try {
			await onConnect({
				LATITUDE_API_KEY: apiKey,
				LATITUDE_PROJECT_ID: projectId,
				LATITUDE_ENVIRONMENT: environment,
				LATITUDE_ENABLE_TELEMETRY: String(telemetry),
			});
		} finally {
			setConnecting(false);
		}
	};

	return (
		<div className="integration-card latitude-card">
			<div className="card-header">
				<span className="provider-icon">🤖</span>
				<div className="header-content">
					<h3>Latitude</h3>
					<p className="provider-description">AI workflow engine & analytics</p>
				</div>
				{testStatus && (
					<span className={`status-badge ${testStatus.success ? 'success' : 'error'}`}>
						{testStatus.success ? '✅ Connected' : '❌ Disconnected'}
					</span>
				)}
			</div>

			<div className="card-content">
				<div className="form-group">
					<label>API Key *</label>
					<input
						type="password"
						placeholder="Paste from console.latitude.so"
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						disabled={connecting}
					/>
					<small className="help-text">Get from: console.latitude.so/projects</small>
				</div>

				<div className="form-group">
					<label>Project ID *</label>
					<input
						type="text"
						placeholder="your-project-id"
						value={projectId}
						onChange={(e) => setProjectId(e.target.value)}
						disabled={connecting}
					/>
				</div>

				<div className="form-group">
					<label>Environment</label>
					<select value={environment} onChange={(e) => setEnvironment(e.target.value)} disabled={connecting}>
						<option value="dev">Development</option>
						<option value="staging">Staging</option>
						<option value="production">Production</option>
					</select>
				</div>

				<div className="form-group checkbox">
					<input
						type="checkbox"
						id="telemetry"
						checked={telemetry}
						onChange={(e) => setTelemetry(e.target.checked)}
						disabled={connecting}
					/>
					<label htmlFor="telemetry">Enable telemetry & analytics</label>
				</div>

				{testStatus && (
					<div className={`status-message ${testStatus.success ? 'success' : 'error'}`}>
						{testStatus.message}
					</div>
				)}

				<div className="button-group">
					<button
						className="btn-test"
						onClick={handleTest}
						disabled={testing || connecting || !apiKey}
					>
						{testing ? '🔄 Testing...' : '🧪 Test Connection'}
					</button>
					<button
						className="btn-connect"
						onClick={handleConnect}
						disabled={connecting || !apiKey || !projectId}
					>
						{connecting ? '🔗 Connecting...' : '🔗 Connect Latitude'}
					</button>
				</div>
			</div>
		</div>
	);
};

export const IntegrationConnectionDashboard: React.FC<IntegrationConnectionProps> = ({
	onConnect,
	onTest,
	testResults,
}) => {
	return (
		<div className="integration-dashboard">
			<div className="dashboard-header">
				<h2>🔗 Integration Dashboard</h2>
				<p className="subtitle">Connect your email, automation, and workflow tools</p>
				<div className="warning-banner">
					<span>⚠️ Note: Currently sharing API keys (will refactor per-agent later)</span>
				</div>
			</div>

			<div className="integrations-grid">
				<AgentMailConnector
					onConnect={(config) => onConnect('agentmail', config)}
					onTest={(apiKey) => onTest('agentmail', apiKey)}
					testStatus={testResults?.agentmail}
				/>

				<ComposioConnector
					onConnect={(config) => onConnect('composio', config)}
					onTest={(apiKey) => onTest('composio', apiKey)}
					testStatus={testResults?.composio}
				/>

				<LatitudeConnector
					onConnect={(config) => onConnect('latitude', config)}
					onTest={(apiKey) => onTest('latitude', apiKey)}
					testStatus={testResults?.latitude}
				/>
			</div>

			<div className="quick-reference">
				<h3>📚 Quick Reference</h3>
				<div className="ref-grid">
					<div className="ref-item">
						<strong>Agent Mail</strong>
						<p>Send/receive emails, auto-reply, threading</p>
						<a href="https://console.agentmail.to/dashboard/api-keys" target="_blank" rel="noreferrer">
							→ Console
						</a>
					</div>

					<div className="ref-item">
						<strong>Composio</strong>
						<p>100+ integrations: Slack, GitHub, Jira, Gmail, etc.</p>
						<a href="https://dashboard.composio.dev" target="_blank" rel="noreferrer">
							→ Console
						</a>
					</div>

					<div className="ref-item">
						<strong>Latitude</strong>
						<p>AI workflows, conversations, analytics</p>
						<a href="https://console.latitude.so" target="_blank" rel="noreferrer">
							→ Console
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default IntegrationConnectionDashboard;
