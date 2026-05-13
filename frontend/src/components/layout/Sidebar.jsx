import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  MdDashboard,
  MdUpload,
  MdAutoGraph,
  MdAssessment,
  MdLogout,
  MdPerson,
  MdSettings,
} from "react-icons/md";
import { TbBrain } from "react-icons/tb";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: MdDashboard },
  { to: "/datasets", label: "Datasets", icon: MdUpload },
  { to: "/forecast", label: "Forecast", icon: TbBrain },
  { to: "/reports", label: "Reports", icon: MdAssessment },
  { to: "/profile", label: "Profile", icon: MdSettings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-60 min-h-screen bg-white/80 backdrop-blur-md border-r border-primary-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-primary-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-green-glow">
            <MdAutoGraph className="text-white text-lg" />
          </div>
          <div>
            <span className="font-display font-bold text-primary-900 text-base leading-none">
              ForecastIQ
            </span>
            <p className="text-[10px] text-primary-500 mt-0.5">AI Demand Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon className="text-lg flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-primary-100 pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary-50 mb-2">
          <div className="w-7 h-7 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
            <MdPerson className="text-primary-700 text-sm" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary-900 truncate">
              {user?.full_name || user?.username}
            </p>
            <p className="text-[10px] text-primary-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <MdLogout className="text-lg" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
