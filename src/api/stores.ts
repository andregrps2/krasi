import type { Store, StoreDashboard } from '../types';

const API_BASE = 'http://localhost:3001/api';

export const storesApi = {
  async getAll(): Promise<Store[]> {
    const response = await fetch(`${API_BASE}/stores`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async getById(id: string): Promise<Store> {
    const response = await fetch(`${API_BASE}/stores/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async getDashboard(id: string): Promise<StoreDashboard> {
    const response = await fetch(`${API_BASE}/stores/${id}/dashboard`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async create(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    const response = await fetch(`${API_BASE}/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async update(id: string, data: Partial<Store>): Promise<Store> {
    const response = await fetch(`${API_BASE}/stores/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/stores/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
};
