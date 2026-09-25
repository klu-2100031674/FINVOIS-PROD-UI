import { NavLink } from 'react-router-dom';
import { BarChart3, Users, Database, FileText, Upload } from 'lucide-react';

const links = [
  { to: '/admin/sales/dashboard', icon: BarChart3, label: 'Dashboard'   },
  { to: '/admin/sales/managers',  icon: Users,     label: 'Managers'    },
  { to: '/admin/sales/upload',    icon: Upload,    label: 'Upload'      },
  { to: '/admin/sales/clients',   icon: Database,  label: 'All Clients' },
  { to: '/admin/sales/reports',   icon: FileText,  label: 'Reports'     },
];

const SalesCrmSubNav = () => (
  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto mb-6">
    {links.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
            isActive
              ? 'bg-white text-[#7e22ce] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`
        }
      >
        <Icon size={14} />
        {label}
      </NavLink>
    ))}
  </div>
);

export default SalesCrmSubNav;
