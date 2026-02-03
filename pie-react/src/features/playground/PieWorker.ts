/* eslint-disable @typescript-eslint/ban-ts-comment */
import { analyzePieSource } from './PieLogic';

console.log('PieWorker: Worker initialized');

self.onmessage = (event) => {
    console.log('PieWorker: Received message', event.data);
    const { code } = event.data;
    if (code !== undefined) {
        try {
            console.log('PieWorker: Starting analysis');
            const result = analyzePieSource(code);
            console.log('PieWorker: Analysis complete', result);
            self.postMessage({ type: 'success', result });
        } catch (e: any) {
            console.error('PieWorker: Error during analysis', e);
            self.postMessage({ type: 'error', error: e.message });
        }
    }
};

