import React from 'react';
import { Button, ButtonGroup, Intent, Alignment, Navbar } from '@blueprintjs/core';
import ExamplePicker from './ExamplePicker';

interface ControlBarProps {
    onRun: () => void;
    onClear: () => void;
    onSelectExample: (code: string) => void;
    isRunning: boolean;
}

const ControlBar: React.FC<ControlBarProps> = ({ onRun, onClear, onSelectExample, isRunning }) => {
    return (
        <Navbar className="control-bar" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid #1e1e1e' }}>
            <Navbar.Group align={Alignment.LEFT}>
                <Navbar.Heading style={{ color: '#fff', fontWeight: 'bold' }}>Pie Playground</Navbar.Heading>
                <Navbar.Divider />
                <ButtonGroup>
                    <Button
                        icon="play"
                        intent={Intent.SUCCESS}
                        text="Run"
                        onClick={onRun}
                        loading={isRunning}
                    />
                    <Button
                        icon="trash"
                        text="Clear"
                        onClick={onClear}
                        disabled={isRunning}
                    />
                    <ExamplePicker onSelect={onSelectExample} disabled={isRunning} />
                </ButtonGroup>
            </Navbar.Group>
        </Navbar>
    );
};

export default ControlBar;
