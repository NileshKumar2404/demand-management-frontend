import { api } from './axiosClient'
import type { ApiResponse, Demand, Department, Priority, DemandStatus } from '../types'

export interface DemandListParams {
  department?: string
  status?: DemandStatus | DemandStatus[]
  priority?: Priority | Priority[]
  search?: string
  overdue?: boolean
  assignedTo?: string
  createdBy?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

interface DemandListData {
  demands: Demand[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DashboardData {
  department: { id: string; name: string }
  counts: {
    total: number
    submitted: number
    assigned: number
    accepted: number
    inProgress: number
    onHold: number
    completed: number
    closed: number
    overdue: number
  }
  priorityCounts: Record<Priority, number>
  sla: {
    completedWithinSla: number
    completedAfterSla: number
    compliancePercentage: number
  }
  averageResolutionMs: number
  recentDemands: Demand[]
}

const normalizeQueryList = (value?: string | string[]) =>
  Array.isArray(value) ? value.join(',') : value

export async function getDemands(params: DemandListParams = {}): Promise<DemandListData> {
  const response = await api.get<ApiResponse<DemandListData>>('/demands', {
    params: {
      ...params,
      status: normalizeQueryList(params.status),
      priority: normalizeQueryList(params.priority),
      overdue: params.overdue ? 'true' : undefined,
    },
  })
  return response.data.data
}

export async function getDemandById(id: string) {
  const response = await api.get<ApiResponse<{ demand: Demand; history: DemandHistoryEntry[] }>>(`/demands/${id}`)
  return response.data.data
}

export interface DemandHistoryEntry {
  _id: string
  demand: string
  action: string
  performedBy: string
  previousStatus?: DemandStatus
  newStatus?: DemandStatus
  reason?: string
  notes?: string
  createdAt: string
}

export async function getDashboard(departmentId: string): Promise<DashboardData> {
  const response = await api.get<ApiResponse<DashboardData>>(`/demands/dashboard/${departmentId}`)
  return response.data.data
}

export interface CreateDemandPayload {
  title: string
  description: string
  department: string
  priority: Priority
  createdBy: string
}

export async function createDemand(payload: CreateDemandPayload): Promise<Demand> {
  const response = await api.post<ApiResponse<Demand>>('/demands', payload)
  return response.data.data
}

export async function assignDemand(id: string, assignedTo: string, performedBy: string) {
  const response = await api.patch<ApiResponse<Demand>>(`/demands/${id}/assign`, { assignedTo, performedBy })
  return response.data.data
}

export async function acceptDemand(id: string, performedBy: string) {
  const response = await api.patch<ApiResponse<Demand>>(`/demands/${id}/accept`, { performedBy })
  return response.data.data
}

export async function startDemand(id: string, performedBy: string) {
  const response = await api.patch<ApiResponse<Demand>>(`/demands/${id}/start`, { performedBy })
  return response.data.data
}

export async function holdDemand(id: string, performedBy: string, reason: string) {
  const response = await api.patch<ApiResponse<Demand>>(`/demands/${id}/hold`, { performedBy, reason })
  return response.data.data
}

export async function completeDemand(
  id: string,
  performedBy: string,
  options?: { delayReason?: string; delayDescription?: string },
) {
  const response = await api.patch<ApiResponse<Demand>>(`/demands/${id}/complete`, {
    performedBy,
    ...options,
  })
  return response.data.data
}

export async function closeDemand(id: string, performedBy: string) {
  const response = await api.patch<ApiResponse<Demand>>(`/demands/${id}/close`, { performedBy })
  return response.data.data
}

export type DemandDepartment = Department
