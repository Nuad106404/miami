import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/axios';

interface AuthState {
  user: {
    id: string;
    email: string;
    role: 'admin';
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('adminToken'),
  loading: false,
  error: null,
};

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/admin/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('adminToken', token);
    return { token, user };
  }
);

export const registerAdmin = createAsyncThunk(
  'auth/registerAdmin',
  async (userData: { email: string; password: string; confirmPassword: string }) => {
    const { confirmPassword, ...registerData } = userData;
    const response = await api.post('/api/admin/auth/register', registerData);
    const { token, user } = response.data;
    localStorage.setItem('adminToken', token);
    return { token, user };
  }
);

export const logoutAdmin = createAsyncThunk(
  'auth/logoutAdmin',
  async () => {
    localStorage.removeItem('adminToken');
    return null;
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.token) return null;
    
    try {
      const response = await api.get('/api/admin/auth/me');
      return response.data;
    } catch (error) {
      localStorage.removeItem('adminToken');
      throw error;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Register
      .addCase(registerAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      // Logout
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      })
      // Check Auth Status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
