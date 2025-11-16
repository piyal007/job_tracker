import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const jobsApi = {
    async fetchAll() {
        const { data } = await api.get('/api/jobs');
        return data;
    },

    async sync(jobs: any[]) {
        const jobsToSync = jobs.map(({ _id, ...job }: any) => job);
        const { data } = await api.post('/api/jobs/sync', jobsToSync);
        return data;
    }
};

export const portalsApi = {
    async fetchAll() {
        const { data } = await api.get('/api/portals');
        return data;
    },

    async sync(portals: any[]) {
        const portalsToSync = portals.map(({ _id, ...portal }: any) => portal);
        const { data } = await api.post('/api/portals/sync', portalsToSync);
        return data;
    }
};

export default api;
