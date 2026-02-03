import { useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { appendOutput, setIsRunning } from './playgroundSlice';

export function usePieRunner() {
    const dispatch = useDispatch();
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Create worker
        console.log('usePieRunner: Creating worker...');

        try {
            const worker = new Worker(new URL('./PieWorker.ts', import.meta.url), {
                type: 'module',
            });
            console.log('usePieRunner: Worker created', worker);

            worker.onmessage = (event) => {
                console.log('usePieRunner: Message from worker', event.data);
                const { type, result, error } = event.data;
                if (type === 'success') {
                    if (result.pretty) {
                        dispatch(appendOutput(result.pretty));
                    } else if (result.summary) {
                        dispatch(appendOutput(result.summary));
                    }
                    if (result.diagnostics && result.diagnostics.length > 0) {
                        result.diagnostics.forEach((d: any) => {
                            const sev = d.severity === 'warning' ? 'WARN' : 'ERR';
                            dispatch(appendOutput(`[${sev}] Line ${d.startLineNumber}: ${d.message}`));
                        });
                    }
                } else {
                    dispatch(appendOutput(`Error: ${error}`));
                }
                dispatch(setIsRunning(false));
            };

            worker.onerror = (err) => {
                console.error('Worker error:', err);
                dispatch(appendOutput('Worker crashed. Check console.'));
                dispatch(setIsRunning(false));
            };

            workerRef.current = worker;
        } catch (e) {
            console.error('Failed to create worker:', e);
            dispatch(appendOutput('Failed to initialize worker.'));
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [dispatch]);

    const runCode = useCallback((code: string) => {
        if (workerRef.current) {
            dispatch(setIsRunning(true));
            workerRef.current.postMessage({ code });
        } else {
            dispatch(appendOutput('Worker not initialized.'));
        }
    }, [dispatch]);

    return { runCode };
}
