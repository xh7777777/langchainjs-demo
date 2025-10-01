import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // Adjust the base URL as needed
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendMessage = async (message: string) => {
  const response = await apiClient.post('/chat', { message });
  console.log('API response:', response.data);
  return response.data;
}