import React from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
    const handleEditorChange = (value: string | undefined) => {
        onChange(value || '');
    };

    const handleEditorDidMount: OnMount = (_editor, _monaco) => {
        // Basic configuration if needed
    };

    return (
        <div className="editor-container" style={{ height: '100%', width: '100%' }}>
            <MonacoEditor
                height="100%"
                defaultLanguage="scheme" // Pie is scheme-like
                theme="vs-dark"
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                }}
            />
        </div>
    );
};

export default Editor;
