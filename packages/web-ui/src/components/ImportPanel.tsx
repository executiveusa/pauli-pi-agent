import React, { useState } from 'react';
import './ImportPanel.css';

interface ImportPanelProps {
	onImport: (type: string, file?: File) => Promise<void>;
	isLoading?: boolean;
}

export const ImportPanel: React.FC<ImportPanelProps> = ({
	onImport,
	isLoading = false,
}) => {
	const [selectedType, setSelectedType] = useState<string | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [notionApiKey, setNotionApiKey] = useState('');

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setFile(event.target.files[0]);
		}
	};

	const handleImport = async () => {
		if (!selectedType) return;

		if ((selectedType === 'import_chatgpt' || selectedType === 'import_claude') && !file) {
			alert('Please select a file to import');
			return;
		}

		if (selectedType === 'sync_notion' && !notionApiKey) {
			alert('Please enter your Notion API key');
			return;
		}

		try {
			await onImport(selectedType, file || undefined);
			setFile(null);
			setSelectedType(null);
			setNotionApiKey('');
		} catch (error) {
			console.error('Import failed:', error);
		}
	};

	return (
		<div className="import-panel">
			<h2>Import Knowledge</h2>

			<div className="import-types">
				{[
					{
						id: 'import_chatgpt',
						name: 'ChatGPT Export',
						description: 'Import conversations from ChatGPT',
					},
					{
						id: 'import_claude',
						name: 'Claude Export',
						description: 'Import conversations from Claude',
					},
					{
						id: 'sync_notion',
						name: 'Notion Sync',
						description: 'Sync pages from your Notion workspace',
					},
					{
						id: 'index_files',
						name: 'Personal Files',
						description: 'Index PDFs, documents, and notes',
					},
				].map((type) => (
					<button
						key={type.id}
						className={`import-type-btn ${selectedType === type.id ? 'active' : ''}`}
						onClick={() => setSelectedType(type.id)}
					>
						<div className="import-type-name">{type.name}</div>
						<div className="import-type-desc">{type.description}</div>
					</button>
				))}
			</div>

			{selectedType && (
				<div className="import-form">
					{(selectedType === 'import_chatgpt' || selectedType === 'import_claude') && (
						<div className="form-group">
							<label>Select {selectedType === 'import_chatgpt' ? 'ChatGPT' : 'Claude'} Export JSON</label>
							<input
								type="file"
								accept=".json"
								onChange={handleFileSelect}
								disabled={isLoading}
							/>
							{file && <p className="file-selected">✓ {file.name}</p>}
						</div>
					)}

					{selectedType === 'sync_notion' && (
						<div className="form-group">
							<label>Notion API Key</label>
							<input
								type="password"
								placeholder="ntn_..."
								value={notionApiKey}
								onChange={(e) => setNotionApiKey(e.target.value)}
								disabled={isLoading}
							/>
							<p className="help-text">
								Get your API key from{' '}
								<a
									href="https://notion.so/my-integrations"
									target="_blank"
									rel="noopener noreferrer"
								>
									Notion settings
								</a>
							</p>
						</div>
					)}

					{selectedType === 'index_files' && (
						<div className="form-group">
							<label>Files to Index</label>
							<input
								type="file"
								multiple
								disabled={isLoading}
							/>
							<p className="help-text">PDF, DOCX, TXT, MD files supported</p>
						</div>
					)}

					<button
						className="import-btn"
						onClick={handleImport}
						disabled={isLoading}
					>
						{isLoading ? 'Importing...' : 'Start Import'}
					</button>
				</div>
			)}
		</div>
	);
};
