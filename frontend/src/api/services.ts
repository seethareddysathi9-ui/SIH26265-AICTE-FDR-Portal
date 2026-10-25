import api from './client'

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', new URLSearchParams({ username: email, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

export const getMe = () => api.get('/auth/me')

export const register = (data: { email: string; password: string; full_name: string }) =>
  api.post('/auth/register', data)

// Institutions
export const getMyProfile = () => api.get('/institutions/profile')
export const createProfile = (data: any) => api.post('/institutions/profile', data)
export const listInstitutions = () => api.get('/institutions/')

// FDRs
export const getFDRs = (params?: any) => api.get('/fdrs/', { params })
export const getFDR = (id: number) => api.get(`/fdrs/${id}`)
export const createFDR = (data: any) => api.post('/fdrs/', data)
export const updateFDRStatus = (id: number, data: any) => api.patch(`/fdrs/${id}/status`, data)
export const addScrutiny = (id: number, data: any) => api.post(`/fdrs/${id}/scrutiny`, data)
export const getReleaseReadiness = (id: number) => api.get(`/fdrs/${id}/release-readiness`)
export const getDashboardStats = () => api.get('/fdrs/dashboard-stats')

// Documents
export const uploadDocument = (fdrId: number, docType: string, file: File) => {
  const formData = new FormData()
  formData.append('doc_type', docType)
  formData.append('file', file)
  return api.post(`/documents/upload/${fdrId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const getFDRDocuments = (fdrId: number) => api.get(`/documents/${fdrId}`)

// Analytics
export const getAnalyticsOverview = () => api.get('/analytics/overview')
export const getMaturityTimeline = () => api.get('/analytics/maturity-timeline')

// Notifications
export const getNotifications = () => api.get('/notifications/')
export const markNotificationRead = (id: number) => api.patch(`/notifications/${id}/read`)

// Audit
export const getAuditLogs = (params?: any) => api.get('/audit/', { params })
