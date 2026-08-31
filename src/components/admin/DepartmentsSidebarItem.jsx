import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ClipboardList } from 'lucide-react';
import api from '../../api/apiClient';

/**
 * Admin sidebar: per-department links (All Departments temporarily disabled).
 */
export default function DepartmentsSidebarItem({
  sidebarOpen = true,
  onNavigate,
  indentClass = '',
}) {
  const location = useLocation();
  const [open, setOpen] = useState(() =>
    String(location.pathname || '').startsWith('/admin/department-name')
  );
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/govt-forms/departments');
        if (!cancelled) {
          setDepartments(Array.isArray(res.data?.data) ? res.data.data : []);
        }
      } catch {
        if (!cancelled) setDepartments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (String(location.pathname || '').startsWith('/admin/department-name')) {
      setOpen(true);
    }
  }, [location.pathname]);

  const isDeptRoute = String(location.pathname || '').startsWith('/admin/department-name');
  const params = new URLSearchParams(location.search || '');
  const activeDeptId = params.get('departmentId') || '';

  const linkClass = (active) =>
    `flex items-center rounded-lg transition-colors px-2 py-2 ml-2 text-sm ${
      active ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <li className={indentClass}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Departments"
        className={`flex items-center w-full rounded-lg transition-colors px-3 py-2.5 ${
          isDeptRoute
            ? 'bg-purple-50 text-purple-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        } ${!sidebarOpen ? 'justify-center' : ''}`}
      >
        <ClipboardList size={20} className="flex-shrink-0" />
        {sidebarOpen && (
          <>
            <span className="ml-3 flex-1 text-left">Departments</span>
            <ChevronDown
              size={16}
              className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {sidebarOpen && open && (
        <ul className="mt-1 space-y-0.5">
          {/* All Departments link temporarily disabled
          <li>
            <NavLink
              to="/admin/department-name"
              end
              onClick={onNavigate}
              className={() => linkClass(isDeptRoute && !activeDeptId)}
            >
              All Departments
            </NavLink>
          </li>
          */}
          {loading && (
            <li className="px-2 py-1.5 ml-2 text-xs text-gray-400">Loading…</li>
          )}
          {!loading &&
            departments.map((dept) => {
              const id = String(dept._id);
              const active = isDeptRoute && activeDeptId === id;
              return (
                <li key={id}>
                  <NavLink
                    to={`/admin/department-name?departmentId=${encodeURIComponent(id)}`}
                    onClick={onNavigate}
                    className={() => linkClass(active)}
                    title={dept.name}
                  >
                    <span className="truncate">{dept.name || 'Department'}</span>
                  </NavLink>
                </li>
              );
            })}
          {!loading && departments.length === 0 && (
            <li className="px-2 py-1.5 ml-2 text-xs text-gray-400">No departments yet</li>
          )}
        </ul>
      )}
    </li>
  );
}
