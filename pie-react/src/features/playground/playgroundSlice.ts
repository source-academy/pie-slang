import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PlaygroundState {
    editorValue: string;
    output: string[];
    isRunning: boolean;
}

const initialState: PlaygroundState = {
    editorValue: `(claim identity (-> Nat Nat))
(define identity (λ (n) n))`,
    output: [],
    isRunning: false,
};

export const playgroundSlice = createSlice({
    name: 'playground',
    initialState,
    reducers: {
        updateEditorValue: (state, action: PayloadAction<string>) => {
            state.editorValue = action.payload;
        },
        appendOutput: (state, action: PayloadAction<string>) => {
            state.output.push(action.payload);
        },
        clearOutput: (state) => {
            state.output = [];
        },
        setIsRunning: (state, action: PayloadAction<boolean>) => {
            state.isRunning = action.payload;
        },
    },
});

export const { updateEditorValue, appendOutput, clearOutput, setIsRunning } = playgroundSlice.actions;

export default playgroundSlice.reducer;
