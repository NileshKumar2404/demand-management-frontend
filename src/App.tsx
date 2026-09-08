import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { getDepartments } from './api/departmentApi'
import Dashboard from './pages/Dashboard'
import DepartmentSelection from './pages/DepartmentSelection'
import DemandDetails from './pages/DemandDetails'
import Demands from './pages/Demands'
import CreateDemand from './pages/CreateDemand'
import Notifications from './pages/Notifications'
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
        if (found) {
          localStorage.setItem('selectedDepartmentId', found._id)
          localStorage.setItem('selectedDepartmentName', found.name)
        }
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

function DemandDetailsRoute() {
  const navigate = useNavigate()
  const { demandId } = useParams()
  const departmentId = localStorage.getItem('selectedDepartmentId')

  if (!demandId || !departmentId) {
    return <Navigate to="/select-department" replace />
  }

  return <DemandDetails demandId={demandId} departmentId={departmentId} onBack={() => navigate(`/department/${departmentId}/demands`)} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/select-department" replace />} />
      <Route path="/select-department" element={<DepartmentSelection />} />
      <Route path="/department/:departmentId" element={<DepartmentWorkspace />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="demands" element={<Demands />} />
        <Route path="demands/new" element={<CreateDemand />} />
        <Route path="demands/:demandId" element={<DemandDetailsRoute />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/select-department" replace />} />
    </Routes>
  )
}

export default App
