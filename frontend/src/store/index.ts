import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import clanReducer from './slices/clanSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clan: clanReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
