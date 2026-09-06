import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { getDepartments } from './api/departmentApi'
import Dashboard from './pages/Dashboard'
import DepartmentSelection from './pages/DepartmentSelection'
import type { Department } from './types'

function DepartmentWorkspace() {
  const { departmentId } = useParams()
  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDepartment = async () => {
      try {
        const departments = await getDepartments()
        const found = departments.find((item) => item._id === departmentId) || null
        setDepartment(found)
        if (found) localStorage.setItem('selectedDepartmentName', found.name)
      } catch {
        setDepartment(null)
      } finally {
        setLoading(false)
      }
    }

    void loadDepartment()
  }, [departmentId])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-mark">D</div>
        <span>Loading workspace...</span>
      </div>
    )
  }

  if (!department) return <Navigate to="/select-department" replace />

  return <AppShell department={department} />
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">D</div>
      <p className="eyebrow">Coming next</p>
      <h2>{title}</h2>
      <p className="muted">This module is part of the frontend build and will be connected to the backend next.</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/select-department" replace />} />
      <Route path="/select-department" element={<DepartmentSelection />} />
      <Route path="/department/:departmentId" element={<DepartmentWorkspace />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="demands" element={<Placeholder title="All Demands" />} />
        <Route path="demands/new" element={<Placeholder title="Create Demand" />} />
        <Route path="notifications" element={<Placeholder title="Notifications" />} />
      </Route>
      <Route path="*" element={<Navigate to="/select-department" replace />} />
    </Routes>
  )
}

export default App
