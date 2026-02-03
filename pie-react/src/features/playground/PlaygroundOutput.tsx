import React from 'react';
import { Card, Pre } from '@blueprintjs/core';

interface OutputProps {
    output: string[];
}

const Output: React.FC<OutputProps> = ({ output }) => {
    return (
        <div className="output-container" style={{ height: '100%', padding: '10px', overflowY: 'auto', backgroundColor: '#202020' }}>
            <Card
                style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#d4d4d4', // VS Code dark theme text color
                    boxShadow: 'none'
                }}
            >
                <h4 style={{ color: '#fff' }}>Output</h4>
                {output.length === 0 ? (
                    <div style={{ color: '#888', fontStyle: 'italic' }}>No output yet. Run the program to see results.</div>
                ) : (
                    output.map((line, index) => (
                        <Pre key={index} style={{ marginBottom: '5px' }}>
                            {line}
                        </Pre>
                    ))
                )}
            </Card>
        </div>
    );
};

export default Output;
