export type Priority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

export type DemandStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED'

export interface Department {
  _id: string
  name: string
  code?: string
  isActive?: boolean
}

export interface Demand {
  _id: string
  demandNumber: string
  title: string
  description: string
  department: Department | string
  priority: Priority
  createdBy: string
  assignedTo?: string
  assignedAt?: string
  acceptedAt?: string
  startedAt?: string
  completedAt?: string
  closedAt?: string
  dueDate: string
  status: DemandStatus
  onHoldReason?: string
  delayReason?: string
  delayDescription?: string
  isOverdue: boolean
  createdAt: string
  updatedAt: string
}

export interface Notification {
  _id: string
  title: string
  message: string
  type: string
  demand?: Demand | string
  department?: Department | string
  isRead: boolean
  createdAt: string
}
