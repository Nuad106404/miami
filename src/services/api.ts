import axios from 'axios';
import type { CustomerInfo } from '../types/booking';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://miamibeachchaam.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export interface BookingData {
  _id?: string;
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  bookingDetails: {
    checkIn: Date | string;
    checkOut: Date | string;
    rooms: number;
    totalPrice: number;
  };
  paymentMethod: 'bank_transfer' | 'promptpay';
  specialRequests?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface BookingResponse {
  status: 'success' | 'error';
  data?: BookingData;
  message?: string;
  errors?: Array<{
    msg: string;
    path: string;
  }>;
}

// Villa API functions
export const villaApi = {
  // Fetch villa details
  async getVillaDetails() {
    const response = await api.get('/api/admin/villa');
    return response.data;
  },

  // Update villa details
  async updateVillaDetails(data: any) {
    const response = await api.patch('/api/admin/villa', data);
    return response.data;
  },

  // Upload PromptPay QR
  uploadQRCode: async (file: File) => {
    const formData = new FormData();
    formData.append('qrImage', file);

    const response = await api.post('/api/admin/villa/promptpay-qr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete PromptPay QR
  deleteQRCode: async () => {
    const response = await api.delete('/api/admin/villa/promptpay-qr');
    return response.data;
  },

  // Upload background image
  uploadBackgroundImage: async (file: File) => {
    const formData = new FormData();
    formData.append('backgroundImage', file);

    const response = await api.patch('/api/admin/villa/background', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete background image
  deleteBackgroundImage: async () => {
    const response = await api.delete('/api/admin/villa/background');
    return response.data;
  },

  // Upload slide images
  uploadSlideImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('slideImages', file);
    });

    const response = await api.post('/api/admin/villa/slides', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete slide image
  deleteSlideImage: async (index: number) => {
    const response = await api.delete(`/api/admin/villa/slides/${index}`);
    return response.data;
  },

  // Room management
  addRoom: async (name: { th: string; en: string }, description: { th: string; en: string }, images: File[]) => {
    const formData = new FormData();
    formData.append('name', JSON.stringify(name));
    formData.append('description', JSON.stringify(description));
    images.forEach(file => {
      formData.append('roomImages', file);
    });

    const response = await api.post('/api/admin/villa/rooms', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateRoom: async (index: number, name: { th: string; en: string }, description: { th: string; en: string }, images?: File[]) => {
    const formData = new FormData();
    formData.append('name', JSON.stringify(name));
    formData.append('description', JSON.stringify(description));
    if (images) {
      images.forEach(file => {
        formData.append('roomImages', file);
      });
    }

    const response = await api.patch(`/api/admin/villa/rooms/${index}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteRoom: async (index: number) => {
    const response = await api.delete(`/api/admin/villa/rooms/${index}`);
    return response.data;
  },

  // Villa rooms
  getVillaRooms: async () => {
    const response = await api.get('/api/villa/rooms');
    return response.data;
  },
};

// Booking API functions
export const bookingApi = {
  createBooking: async (bookingData: BookingData): Promise<BookingResponse> => {
    try {
      // Remove customerInfo from initial booking creation
      const { customerInfo, ...bookingDataWithoutCustomer } = bookingData;
      
      console.log('API: Creating booking with data:', JSON.stringify(bookingDataWithoutCustomer, null, 2));
      const response = await api.post('/api/booking', bookingDataWithoutCustomer);
      console.log('API: Received response:', JSON.stringify(response.data, null, 2));
      
      if (response.data?.status === 'success') {
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to create booking');
    } catch (error) {
      console.error('API: Error creating booking:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('API: Error details:', JSON.stringify(error.response.data, null, 2));
        throw new Error(error.response.data.message || 'Failed to create booking');
      }
      throw error;
    }
  },

  updateBooking: async (id: string, data: Partial<BookingData>) => {
    try {
      console.log('API: Updating booking with data:', JSON.stringify(data, null, 2));
      const response = await api.patch(`/api/booking/${id}`, data);
      
      if (response.data?.status === 'success') {
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to update booking');
    } catch (error) {
      console.error('API: Error updating booking:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to update booking';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  getBooking: async (id: string) => {
    try {
      const response = await api.get(`/api/booking/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch booking');
      }
      throw error;
    }
  },

  getAllBookings: async () => {
    try {
      const response = await api.get('/api/booking/all');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
      }
      throw error;
    }
  },

  updateBookingStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/api/booking/${id}`, { status });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update booking status');
      }
      throw error;
    }
  },

  deleteBooking: async (id: string) => {
    const response = await api.delete(`/api/booking/${id}`);
    return response.data;
  },

  // Update payment details
  async updatePaymentDetails(id: string, paymentMethod: 'bank_transfer' | 'promptpay', paymentSlipUrl?: string) {
    try {
      const response = await api.patch(`/api/booking/${id}`, {
        paymentMethod,
        paymentSlipUrl,
        status: paymentSlipUrl ? 'in_review' : 'pending_payment'
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw error;
    }
  },

  // Upload payment slip
  async uploadPaymentSlip(file: File) {
    const formData = new FormData();
    formData.append('slip', file);

    try {
      const response = await api.post('/api/upload/slip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw error;
    }
  },

  // Update customer info
  async updateCustomerInfo(id: string, customerInfo: CustomerInfo) {
    try {
      const response = await api.patch(`/api/booking/${id}/customer-info`, {
        customerInfo
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw error;
    }
  },

  // Send booking confirmation email
  async sendConfirmationEmail(id: string) {
    try {
      const response = await api.post(`/api/booking/${id}/send-confirmation`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw error;
    }
  },
};

export default api;
