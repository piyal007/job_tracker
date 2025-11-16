const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const jobsApi = {
    async fetchAll() {
        const response = await fetch(`${API_URL}/api/jobs`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        return response.json();
    },

    async sync(jobs: any[]) {
        const jobsToSync = jobs.map(({ _id, ...job }: any) => job);
        const response = await fetch(`${API_URL}/api/jobs/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobsToSync)
        });
        if (!response.ok) throw new Error('Failed to sync jobs');
        return response.json();
    }
};

export const portalsApi = {
    async fetchAll() {
        const response = await fetch(`${API_URL}/api/portals`);
        if (!response.ok) throw new Error('Failed to fetch portals');
        return response.json();
    },

    async sync(portals: any[]) {
        const portalsToSync = portals.map(({ _id, ...portal }: any) => portal);
        const response = await fetch(`${API_URL}/api/portals/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(portalsToSync)
        });
        if (!response.ok) throw new Error('Failed to sync portals');
        return response.json();
    }
};
