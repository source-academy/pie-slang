import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { updateEditorValue, clearOutput, appendOutput } from '../../features/playground/playgroundSlice';
import Editor from '../../commons/editor/Editor';
import ControlBar from '../../commons/controlBar/ControlBar';
import Output from '../../features/playground/PlaygroundOutput';
import './Playground.scss'; // We'll create this SCSS file

import { usePieRunner } from '../../features/playground/usePieRunner';
import { useResizable } from '../../commons/utils/useResizable';
import classNames from 'classnames';


const Playground: React.FC = () => {
    const dispatch = useDispatch();
    const { editorValue, output, isRunning } = useSelector((state: RootState) => state.workspaces.playground);
    const { runCode } = usePieRunner();
    const { leftWidth, startDragging, isDragging } = useResizable({ initialWidth: 50 });

    const handleEditorChange = (newValue: string) => {
        dispatch(updateEditorValue(newValue));
    };

    const handleRun = () => {
        dispatch(clearOutput());
        runCode(editorValue);
    };

    const handleClear = () => {
        dispatch(clearOutput());
        dispatch(updateEditorValue(''));
    };

    const handleSelectExample = (code: string) => {
        handleEditorChange(code);
        dispatch(clearOutput());
    };

    return (
        <div className="playground-page bp5-dark">
            <ControlBar onRun={handleRun} onClear={handleClear} onSelectExample={handleSelectExample} isRunning={isRunning} />
            <div className={classNames("playground-content", { "is-dragging": isDragging })}>
                <div className="editor-pane" style={{ width: `${leftWidth}%` }}>
                    <Editor value={editorValue} onChange={handleEditorChange} />
                </div>
                <div className="resizer" onMouseDown={startDragging} />
                <div className="output-pane" style={{ width: `${100 - leftWidth}%` }}>
                    <Output output={output} />
                </div>
            </div>
        </div>
    );
};

export default Playground;
