import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ardisa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ardisa_token');
      localStorage.removeItem('ardisa_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

export const authAPI = {
  login:          (creds) => API.post('/auth/login', creds),
  me:             ()      => API.get('/auth/me'),
  changePassword: (data)  => API.put('/auth/change-password', data),
};

export const employeeAPI = {
  getAll:  (params) => API.get('/employees', { params }),
  getOne:  (id)     => API.get(`/employees/${id}`),
  create:  (data)   => API.post('/employees', data),
  update:  (id, d)  => API.put(`/employees/${id}`, d),
  remove:  (id)     => API.delete(`/employees/${id}`),
};

export const evaluationAPI = {
  getAll:     (params) => API.get('/evaluations', { params }),
  getOne:     (id)     => API.get(`/evaluations/${id}`),
  create:     (data)   => API.post('/evaluations', data),
  update:     (id, d)  => API.put(`/evaluations/${id}`, d),
  getNineBox: (params) => API.get('/evaluations/ninebox-matrix', { params }),
};

export const factorAPI = {
  getAll: (params) => API.get('/factors', { params }),
};

export const dashboardAPI = {
  getStats: (params) => API.get('/dashboard/stats', { params }),
};

export const reportAPI = {
  getByArea:     (params) => API.get('/reports/by-area', { params }),
  getByQuadrant: (params) => API.get('/reports/by-quadrant', { params }),
  exportExcel:   (params) => API.get('/reports/export-excel', {
    params,
    responseType: 'blob',
    transformResponse: [(data) => data],
  }),
};

export const areaAPI = {
  getAll: () => API.get('/areas'),
};

export const userAPI = {
  getAll:  ()      => API.get('/users'),
  create:  (data)  => API.post('/users', data),
  update:  (id, d) => API.put(`/users/${id}`, d),
  remove:  (id)    => API.delete(`/users/${id}`),
};

export default API;
