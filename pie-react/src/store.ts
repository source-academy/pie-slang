import { configureStore, combineReducers } from '@reduxjs/toolkit';
import playgroundReducer from './features/playground/playgroundSlice';

const workspacesReducer = combineReducers({
    playground: playgroundReducer,
});

export const mainStore = configureStore({
    reducer: {
        workspaces: workspacesReducer,
    },
});

export type RootState = ReturnType<typeof mainStore.getState>;
export type AppDispatch = typeof mainStore.dispatch;
