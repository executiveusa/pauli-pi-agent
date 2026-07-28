/**
 * Yogi Mode UI Component
 * Token-heavy reasoning mode with warning modal and loading screen
 * React component for web interface
 */

import React, { useState } from 'react';
import './yogi-mode-ui.css';

export interface YogiModeUIProps {
	onYogiModeToggle: (enabled: boolean) => void;
	currentMode: 'normal' | 'caveman' | 'yogi';
	monthlyCostSavings: number;
}

export const YogiModeWarningModal: React.FC<{
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	costPerRun: number;
	costMultiplier: number; // 2.5x vs normal
}> = ({ isOpen, onConfirm, onCancel, costPerRun, costMultiplier }) => {
	if (!isOpen) return null;

	return (
		<div className="yogi-modal-overlay">
			<div className="yogi-modal">
				<div className="yogi-modal-header">
					<span className="yogi-icon">🧘</span>
					<h2>Yogi Mode Warning</h2>
				</div>

				<div className="yogi-modal-content">
					<p className="warning-text">
						<strong>⚠️ Yogi mode is very token heavy, are you sure that you need to enter yogi mode?</strong>
					</p>

					<div className="cost-breakdown">
						<div className="cost-item">
							<span className="label">Cost per run:</span>
							<span className="cost-value">${costPerRun.toFixed(2)}</span>
						</div>
						<div className="cost-item">
							<span className="label">Token usage:</span>
							<span className="cost-value">{costMultiplier}x normal</span>
						</div>
						<div className="cost-item warn">
							<span className="label">Monthly impact:</span>
							<span className="cost-value">${(costPerRun * 120 * costMultiplier).toFixed(2)}</span>
						</div>
					</div>

					<div className="yogi-benefits">
						<h4>🎯 Yogi Mode Benefits:</h4>
						<ul>
							<li>Extended reasoning and analysis</li>
							<li>Detailed explanations with full context</li>
							<li>Multi-step problem solving</li>
							<li>Better edge case handling</li>
							<li>Complete source code exploration</li>
						</ul>
					</div>
				</div>

				<div className="yogi-modal-actions">
					<button className="btn-cancel" onClick={onCancel}>
						❌ No, stay in Caveman Mode
					</button>
					<button className="btn-confirm" onClick={onConfirm}>
						✅ Yes, enter Yogi Mode
					</button>
				</div>
			</div>
		</div>
	);
};

export const YogiModeLoadingScreen: React.FC<{
	isLoading: boolean;
}> = ({ isLoading }) => {
	if (!isLoading) return null;

	return (
		<div className="yogi-loading-overlay">
			<div className="yogi-loading-container">
				<div className="yogi-meditation-animation">
					<div className="meditation-circle"></div>
					<div className="meditation-dot"></div>
				</div>

				<h2 className="yogi-loading-text">🧘 Entering Yogi Mode</h2>
				<p className="yogi-loading-subtext">Deep reasoning activated...</p>

				<div className="yogi-loading-bar">
					<div className="yogi-progress"></div>
				</div>

				<div className="yogi-features-loading">
					<div className="feature-item">
						<span className="feature-icon">🧠</span>
						<span>Extended Reasoning</span>
					</div>
					<div className="feature-item">
						<span className="feature-icon">🔍</span>
						<span>Deep Analysis</span>
					</div>
					<div className="feature-item">
						<span className="feature-icon">📊</span>
						<span>Context Exploration</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export const YogiModeToggle: React.FC<YogiModeUIProps> = ({
	onYogiModeToggle,
	currentMode,
	monthlyCostSavings,
}) => {
	const [isYogiMode, setIsYogiMode] = useState(currentMode === 'yogi');
	const [warningOpen, setWarningOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [previousMode, setPreviousMode] = useState<'normal' | 'caveman' | 'yogi'>(currentMode);

	const costPerRunNormal = 0.0332; // ~$0.03 per run
	const costPerRunYogi = costPerRunNormal * 2.5; // 2.5x cost

	const handleToggleClick = () => {
		if (!isYogiMode) {
			// Attempting to enable Yogi Mode - show warning
			setPreviousMode(currentMode);
			setWarningOpen(true);
		} else {
			// Disabling Yogi Mode - switch back immediately
			setIsYogiMode(false);
			setIsLoading(false);
			onYogiModeToggle(false);
		}
	};

	const handleConfirmYogi = async () => {
		setWarningOpen(false);
		setIsLoading(true);
		setIsYogiMode(true);

		// Simulate loading with animation
		await new Promise((resolve) => setTimeout(resolve, 2500));

		setIsLoading(false);
		onYogiModeToggle(true);
	};

	const handleCancelYogi = () => {
		setWarningOpen(false);
		// Stay in previous mode
	};

	return (
		<div className="yogi-mode-container">
			<YogiModeWarningModal
				isOpen={warningOpen}
				onConfirm={handleConfirmYogi}
				onCancel={handleCancelYogi}
				costPerRun={costPerRunYogi}
				costMultiplier={2.5}
			/>

			<YogiModeLoadingScreen isLoading={isLoading} />

			<div className="yogi-toggle-wrapper">
				<div className="yogi-mode-info">
					<div className="mode-status">
						<span className="mode-badge" data-mode={isYogiMode ? 'yogi' : 'caveman'}>
							{isYogiMode ? '🧘 YOGI MODE' : '🦴 CAVEMAN MODE'}
						</span>
						{isYogiMode && <span className="mode-indicator pulse">● Active</span>}
					</div>

					<div className="mode-details">
						<p className="mode-description">
							{isYogiMode
								? 'Deep reasoning mode - 2.5x token usage for extended analysis'
								: '65% token savings - terse, efficient responses'}
						</p>

						<div className="cost-info">
							<span className="cost-label">
								{isYogiMode ? '💸 Yogi' : '💚 Caveman'}:
							</span>
							<span className="cost-amount">
								${isYogiMode ? costPerRunYogi.toFixed(4) : 0.0116}/run
							</span>
							<span className="monthly-note">
								≈ ${isYogiMode ? (costPerRunYogi * 120).toFixed(2) : (monthlyCostSavings).toFixed(2)}/month
							</span>
						</div>
					</div>
				</div>

				<label className="yogi-switch">
					<input
						type="checkbox"
						checked={isYogiMode}
						onChange={handleToggleClick}
						disabled={isLoading}
						className="switch-input"
					/>
					<div className="switch-slider"></div>
				</label>
			</div>

			{/* Quick Reference */}
			<div className="yogi-quick-ref">
				<div className="ref-card caveman-ref">
					<h4>🦴 Caveman Mode</h4>
					<ul>
						<li>✓ 65% output reduction</li>
						<li>✓ 95% code token savings</li>
						<li>✓ Terse, accurate responses</li>
						<li>✓ $0.0116/run</li>
					</ul>
				</div>

				<div className="ref-card yogi-ref">
					<h4>🧘 Yogi Mode</h4>
					<ul>
						<li>✓ Extended reasoning</li>
						<li>✓ Detailed explanations</li>
						<li>✓ Full context exploration</li>
						<li>✓ $0.0291/run (2.5x)</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default YogiModeToggle;
