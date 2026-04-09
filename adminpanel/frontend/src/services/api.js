import axios from 'axios'
const api = axios.create({ baseURL:'/api/admin', headers:{'Content-Type':'application/json'}, timeout:30000 })
api.interceptors.request.use(cfg=>{ const t=localStorage.getItem('adminToken'); if(t) cfg.headers.Authorization=`Bearer ${t}`; return cfg })
api.interceptors.response.use(r=>r, err=>{ if(err.response?.status===401){localStorage.removeItem('adminToken');localStorage.removeItem('adminUser');window.location.href='/login'} return Promise.reject(err) })
export default api

export const authService={
  login: d=>api.post('/accounts/login',d),
  register: d=>api.post('/accounts/create',d),
  getMe: ()=>api.get('/accounts/me'),
  updateProfile: d=>api.put('/accounts/me/profile',d),
  changePassword: d=>api.put('/accounts/me/password',d),
}
export const adminService={
  getAll: ()=>api.get('/accounts'),
  getById: id=>api.get(`/accounts/${id}`),
  create: d=>api.post('/accounts/create',d),
  update: (id,d)=>api.put(`/accounts/${id}`,d),
  resetPassword: (id,d)=>api.put(`/accounts/${id}/password`,d),
  toggleStatus: id=>api.patch(`/accounts/${id}/toggle-status`),
  delete: id=>api.delete(`/accounts/${id}`),
  getLogs: id=>api.get(`/accounts/${id}/activity`),
}
export const userService={
  getAll: p=>api.get('/users',{params:p}),
  getById: id=>api.get(`/users/${id}`),
  create: d=>api.post('/users',d),
  update: (id,d)=>api.put(`/users/${id}`,d),
  assignRole: (id,d)=>api.put(`/users/${id}/role`,d),
  resetPassword: (id,d)=>api.put(`/users/${id}/password`,d),
  toggleStatus: id=>api.patch(`/users/${id}/toggle-status`),
  delete: id=>api.delete(`/users/${id}`),
  getLogs: id=>api.get(`/users/${id}/activity`),
  getSectors: ()=>api.get('/users/sectors'),
  updateReminder: (id,d)=>api.put(`/users/${id}/reminders`,d),
}
export const taskService={
  getAll: p=>api.get('/tasks',{params:p}),
  getById: id=>api.get(`/tasks/${id}`),
  create: d=>api.post('/tasks',d),
  update: (id,d)=>api.put(`/tasks/${id}`,d),
  review: (id,d)=>api.post(`/tasks/${id}/review`,d),
  reassign: (id,d)=>api.put(`/tasks/${id}/reassign`,d),
  delete: id=>api.delete(`/tasks/${id}`),
  getReport: ()=>api.get('/tasks/report'),
  getPending: ()=>api.get('/tasks/pending-approvals'),
  addComment: (id,d)=>api.post(`/tasks/${id}/comments`,d),
  getComments: id=>api.get(`/tasks/${id}/comments`),
  bulkCreate: d=>api.post('/tasks/bulk',d),
}
export const goalService={
  getAll: p=>api.get('/goals',{params:p}),
  create: d=>api.post('/goals',d),
  update: (id,d)=>api.put(`/goals/${id}`,d),
  delete: id=>api.delete(`/goals/${id}`),
  getReport: ()=>api.get('/goals/report'),
  assignTeam: d=>api.post('/goals/assign-team',d),
  approve: (id,d)=>api.post(`/goals/${id}/approve`,d),
  reject: (id,d)=>api.post(`/goals/${id}/reject`,d),
  addComment: (id,d)=>api.post(`/goals/${id}/comments`,d),
}
export const reportService={
  getAll: p=>api.get('/reports',{params:p}),
  getById: id=>api.get(`/reports/${id}`),
  getPending: ()=>api.get('/reports/pending'),
  getStats: ()=>api.get('/reports/stats'),
  review: (id,d)=>api.post(`/reports/${id}/review`,d),
  addNote: (id,d)=>api.post(`/reports/${id}/notes`,d),
  export: p=>api.get('/reports/export',{params:p}),
}
export const performanceService={
  getLeaderboard: p=>api.get('/performance/leaderboard',{params:p}),
  getOverview: p=>api.get('/performance/overview',{params:p}),
  getTopPerformers: p=>api.get('/performance/top-performers',{params:p}),
  getUserPerf: id=>api.get(`/performance/user/${id}`),
  awardBonus: d=>api.post('/performance/award-bonus',d),
}
export const learningService={
  getCourses: p=>api.get('/learning/courses',{params:p}),
  getCourse: id=>api.get(`/learning/courses/${id}`),
  createCourse: d=>api.post('/learning/courses',d),
  updateCourse: (id,d)=>api.put(`/learning/courses/${id}`,d),
  deleteCourse: id=>api.delete(`/learning/courses/${id}`),
  assign: d=>api.post('/learning/assign',d),
  getProgress: p=>api.get('/learning/progress',{params:p}),
  getStats: ()=>api.get('/learning/stats'),
}
export const postService={
  getAll: p=>api.get('/posts',{params:p}),
  announce: d=>api.post('/posts/announcements',d),
  hide: (id,d)=>api.patch(`/posts/${id}/hide`,d),
  pin: id=>api.patch(`/posts/${id}/pin`),
  delete: id=>api.delete(`/posts/${id}`),
  deleteComment: (pid,cid)=>api.delete(`/posts/${pid}/comments/${cid}`),
  getStats: ()=>api.get('/posts/stats'),
}
export const reminderService={
  getAll: p=>api.get('/reminders',{params:p}),
  create: d=>api.post('/reminders',d),
  bulkCreate: d=>api.post('/reminders/bulk',d),
  update: (id,d)=>api.put(`/reminders/${id}`,d),
  delete: id=>api.delete(`/reminders/${id}`),
  getStats: ()=>api.get('/reminders/stats'),
}
export const roomService={
  getAll: p=>api.get('/rooms',{params:p}),
  getById: id=>api.get(`/rooms/${id}`),
  forceEnd: id=>api.patch(`/rooms/${id}/end`),
  delete: id=>api.delete(`/rooms/${id}`),
  getStats: ()=>api.get('/rooms/stats'),
}
export const projectService={
  getAll: p=>api.get('/projects',{params:p}),
  getById: id=>api.get(`/projects/${id}`),
  create: d=>api.post('/projects',d),
  update: (id,d)=>api.put(`/projects/${id}`,d),
  delete: id=>api.delete(`/projects/${id}`),
  addTask: (id,d)=>api.post(`/projects/${id}/tasks`,d),
  updateTask: (pid,tid,d)=>api.put(`/projects/${pid}/tasks/${tid}`,d),
  getMindmap: id=>api.get(`/projects/${id}/mindmap`),
}