import { useState, useEffect } from 'react';
import Button from './components/Button';

function copyToClipboard(text: string): boolean {
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.style.position = 'fixed';
	textarea.style.left = '-999999px';
	textarea.style.top = '-999999px';
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();
	const success = document.execCommand('copy');
	textarea.remove();
	return success;
}

const App = () => {
	const [nodeData, setNodeData] = useState<unknown>(null);
	const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data.pluginMessage;
			if (message?.type === 'NODE_DATA') {
				setNodeData(message.data);
				setCopyStatus('idle');
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	const handleCopy = () => {
		if (!nodeData) return;
		const jsonString = JSON.stringify(nodeData, null, 2);
		const success = copyToClipboard(jsonString);
		setCopyStatus(success ? 'success' : 'error');
		if (success) {
			setTimeout(() => setCopyStatus('idle'), 2000);
		}
	};

	const jsonString = nodeData ? JSON.stringify(nodeData, null, 2) : '';

	const styles = {
		container: {
			display: 'flex',
			flexDirection: 'column' as const,
			height: '100%',
			padding: '12px',
			boxSizing: 'border-box' as const,
			gap: '8px',
		},
		header: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
		},
		title: {
			margin: 0,
			fontSize: '13px',
			fontWeight: 600,
			color: 'var(--figma-color-text)',
		},
		codeArea: {
			flex: 1,
			padding: '8px',
			backgroundColor: 'var(--figma-color-bg-secondary)',
			border: '1px solid var(--figma-color-border)',
			borderRadius: '4px',
			overflow: 'auto',
			fontSize: '11px',
			fontFamily: 'monospace',
			whiteSpace: 'pre-wrap' as const,
			wordBreak: 'break-all' as const,
			color: 'var(--figma-color-text)',
		},
		placeholder: {
			color: 'var(--figma-color-text-secondary)',
			fontStyle: 'italic' as const,
		},
		copyButton: {
			minWidth: '60px',
		},
		success: {
			color: 'var(--figma-color-text-success, #18a957)',
		},
		error: {
			color: 'var(--figma-color-text-danger, #f24822)',
		},
	};

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<h3 style={styles.title}>ReactNode Output</h3>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					{copyStatus === 'success' && <span style={styles.success}>Copied!</span>}
					{copyStatus === 'error' && <span style={styles.error}>Failed</span>}
					<Button onClick={handleCopy} style={styles.copyButton}>
						Copy
					</Button>
				</div>
			</div>
			<div style={styles.codeArea}>
				{nodeData ? (
					jsonString
				) : (
					<span style={styles.placeholder}>Select a node in Figma to see its data...</span>
				)}
			</div>
		</div>
	);
};

export default App;
