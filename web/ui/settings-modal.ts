// Settings modal for API key configuration

import { getApiKey, setApiKey, clearApiKey, hasApiKey } from '../config/api-config.js';

/**
 * Initialize the settings modal for API key management
 */
export function initSettingsModal(): void {
  // Create modal HTML
  const modal = createModalElement();
  document.body.appendChild(modal);

  // Set up event listeners
  const settingsBtn = document.getElementById('settings-btn');
  const closeBtn = modal.querySelector('.close-btn');
  const saveBtn = modal.querySelector('#save-api-key');
  const clearBtn = modal.querySelector('#clear-api-key');
  const input = modal.querySelector('#api-key-input') as HTMLInputElement;

  if (!settingsBtn) {
    console.warn('Settings button not found - modal will not be accessible');
    return;
  }

  // Open modal
  settingsBtn.onclick = () => {
    // Pre-fill with existing key (masked)
    const existingKey = getApiKey();
    if (existingKey) {
      input.value = maskApiKey(existingKey);
      input.placeholder = 'API key is set';
    } else {
      input.value = '';
      input.placeholder = 'Enter your Google Gemini API key';
    }
    modal.style.display = 'flex';
  };

  // Close modal
  const closeModal = () => {
    modal.style.display = 'none';
    input.value = '';
  };

  closeBtn?.addEventListener('click', closeModal);

  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Save API key
  saveBtn?.addEventListener('click', () => {
    const key = input.value.trim();
    if (!key) {
      alert('Please enter an API key');
      return;
    }

    // Don't save if it's the masked version
    if (key.startsWith('***')) {
      alert('API key already set. Clear it first to set a new one.');
      return;
    }

    try {
      setApiKey(key);
      alert('API key saved successfully!');
      closeModal();
    } catch (error: any) {
      alert(`Failed to save API key: ${error.message}`);
    }
  });

  // Clear API key
  clearBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the API key?')) {
      clearApiKey();
      input.value = '';
      input.placeholder = 'Enter your Google Gemini API key';
      alert('API key cleared');
    }
  });

  // Handle Enter key
  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      (saveBtn as HTMLButtonElement)?.click();
    }
  });
}

/**
 * Create the modal DOM element
 */
function createModalElement(): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.style.display = 'none';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>AI Hint Settings</h3>
        <button class="close-btn" title="Close">&times;</button>
      </div>
      <div class="modal-body">
        <p>To use AI hints, you need a Google Gemini API key.</p>
        <p class="help-text">
          Get your free API key at:
          <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">
            https://ai.google.dev/
          </a>
        </p>
        <div class="input-group">
          <label for="api-key-input">API Key:</label>
          <input
            type="text"
            id="api-key-input"
            placeholder="Enter your Google Gemini API key"
            autocomplete="off"
          />
        </div>
        <div class="modal-status">
          <p id="key-status"></p>
        </div>
      </div>
      <div class="modal-footer">
        <button id="clear-api-key" class="btn-secondary">Clear Key</button>
        <button id="save-api-key" class="btn-primary">Save Key</button>
      </div>
    </div>
  `;

  return modal;
}

/**
 * Mask API key for display (show only first and last few characters)
 */
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '***';
  }
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  return `${start}${'*'.repeat(Math.min(20, key.length - 8))}${end}`;
}

/**
 * Show a prompt to enter API key if not set
 */
export function showApiKeyPromptIfNeeded(): void {
  if (!hasApiKey()) {
    // Show a notice in the preview panel or console
    console.warn('⚠️ No API key configured. AI hints will not work until you set an API key in settings.');

    // Optionally show a one-time popup
    const shown = sessionStorage.getItem('api-key-prompt-shown');
    if (!shown) {
      setTimeout(() => {
        if (confirm('AI hints require a Google Gemini API key. Would you like to configure it now?')) {
          const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
          settingsBtn?.click();
        }
        sessionStorage.setItem('api-key-prompt-shown', 'true');
      }, 1000);
    }
  }
}
