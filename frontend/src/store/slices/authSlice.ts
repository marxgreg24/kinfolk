import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types/user'

interface AuthState {
  user: User | null
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
      state.isLoading = false
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    clearUser(state) {
      state.user = null
      state.isLoading = false
    },
  },
})

export const { setUser, setLoading, clearUser } = authSlice.actions
export default authSlice.reducer
