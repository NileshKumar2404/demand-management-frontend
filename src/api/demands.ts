import apiClient from './client'
import type { Demand, DemandStatus, Priority } from '../types'

export interface DemandFilters {
  department?: string
  status?: DemandStatus
  priority?: Priority
  search?: string
  overdue?: boolean
  assignedTo?: string
  createdBy?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export interface DashboardSummary {
  total?: number
  submitted?: number
  assigned?: number
  accepted?: number
  inProgress?: number
  onHold?: number
  completed?: number
  closed?: number
  overdue?: number
  [key: string]: unknown
}

export async function getDemands(filters: DemandFilters = {}) {
  const response = await apiClient.get('/demands', { params: filters })
  return response.data?.data ?? response.data
}

export async function getDemand(id: string): Promise<Demand> {
  const response = await apiClient.get(`/demands/${id}`)
  return response.data?.data ?? response.data
}

export async function createDemand(payload: {
  title: string
  description: string
  department: string
  priority: Priority
  createdBy: string
}) {
  const response = await apiClient.post('/demands', payload)
  return response.data?.data ?? response.data
}

export async function assignDemand(id: string, payload: { assignedTo: string; performedBy: string }) {
  const response = await apiClient.patch(`/demands/${id}/assign`, payload)
  return response.data?.data ?? response.data
}

export async function acceptDemand(id: string, performedBy: string) {
  const response = await apiClient.patch(`/demands/${id}/accept`, { performedBy })
  return response.data?.data ?? response.data
}

export async function startDemand(id: string, performedBy: string) {
  const response = await apiClient.patch(`/demands/${id}/start`, { performedBy })
  return response.data?.data ?? response.data
}

export async function holdDemand(id: string, payload: { reason: string; performedBy: string }) {
  const response = await apiClient.patch(`/demands/${id}/hold`, payload)
  return response.data?.data ?? response.data
}

export async function completeDemand(
  id: string,
  payload: { performedBy: string; delayReason?: string; delayDescription?: string },
) {
  const response = await apiClient.patch(`/demands/${id}/complete`, payload)
  return response.data?.data ?? response.data
}

export async function closeDemand(id: string, performedBy: string) {
  const response = await apiClient.patch(`/demands/${id}/close`, { performedBy })
  return response.data?.data ?? response.data
}

export async function getDashboard(departmentId: string): Promise<DashboardSummary> {
  const response = await apiClient.get(`/demands/dashboard/${departmentId}`)
  return response.data?.data ?? response.data
}

export async function getDemandHistory(id: string) {
  const response = await apiClient.get(`/demands/${id}/history`)
  return response.data?.data ?? response.data
}
