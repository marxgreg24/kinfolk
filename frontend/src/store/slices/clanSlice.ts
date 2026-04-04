import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Clan } from '@/types/clan'
import type { Member } from '@/types/member'

interface ClanState {
  clan: Clan | null
  members: Member[]
}

const initialState: ClanState = {
  clan: null,
  members: [],
}

const clanSlice = createSlice({
  name: 'clan',
  initialState,
  reducers: {
    setClan(state, action: PayloadAction<Clan | null>) {
      state.clan = action.payload
    },
    setMembers(state, action: PayloadAction<Member[]>) {
      state.members = action.payload
    },
    clearClan(state) {
      state.clan = null
      state.members = []
    },
  },
})

export const { setClan, setMembers, clearClan } = clanSlice.actions
export default clanSlice.reducer
