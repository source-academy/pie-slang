import { useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { appendOutput, setIsRunning } from './playgroundSlice';
import { analyzePieSource } from './PieLogic';

export function usePieRunner() {
    const dispatch = useDispatch();
    const workerRef = useRef<Worker | null>(null);
    const workerFailedRef = useRef(false);

    const handleResult = useCallback((result: ReturnType<typeof analyzePieSource>) => {
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
    }, [dispatch]);

    const runInMainThread = useCallback((code: string) => {
        try {
            const result = analyzePieSource(code);
            handleResult(result);
        } catch (e: any) {
            dispatch(appendOutput(`Error: ${e?.message ?? String(e)}`));
        } finally {
            dispatch(setIsRunning(false));
        }
    }, [dispatch, handleResult]);

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
                    handleResult(result);
                } else {
                    dispatch(appendOutput(`Error: ${error}`));
                }
                dispatch(setIsRunning(false));
            };

            worker.onerror = (err) => {
                console.error('Worker error:', err);
                const detail = err instanceof ErrorEvent
                    ? `${err.message || 'Unknown error'}${err.filename ? ` at ${err.filename}:${err.lineno}:${err.colno}` : ''}`
                    : 'Unknown error';
                dispatch(appendOutput(`Worker crashed: ${detail}`));
                dispatch(setIsRunning(false));
                workerFailedRef.current = true;
                worker.terminate();
                workerRef.current = null;
            };

            worker.onmessageerror = (err) => {
                console.error('Worker message error:', err);
                dispatch(appendOutput('Worker message error: Unable to decode response.'));
                dispatch(setIsRunning(false));
                workerFailedRef.current = true;
                worker.terminate();
                workerRef.current = null;
            };

            workerRef.current = worker;
        } catch (e) {
            console.error('Failed to create worker:', e);
            dispatch(appendOutput('Failed to initialize worker.'));
            workerFailedRef.current = true;
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [dispatch]);

    const runCode = useCallback((code: string) => {
        dispatch(setIsRunning(true));
        if (workerRef.current && !workerFailedRef.current) {
            workerRef.current.postMessage({ code });
        } else {
            dispatch(appendOutput('Worker unavailable, running in main thread.'));
            runInMainThread(code);
        }
    }, [dispatch, runInMainThread]);

    return { runCode };
}
