import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { cn } from "../../utils/cn";
import {
  LayoutDashboard,
  Stethoscope,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Calendar,
  Users,
  FileText,
  Pill,
  UserCircle,
  LogOut,
  ChevronRight,
  Fingerprint,
  Plus,
  HeadphonesIcon,
  HelpCircle,
  FlaskConical,
  FolderOpen,
} from "lucide-react";

export default function Sidebar({ role, activePanel, onPanelChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const adminSections = [
    {
      label: "Overview",
      items: [
        { id: "overview", icon: LayoutDashboard, text: "Dashboard" },
        { id: "doctors", icon: Stethoscope, text: "Doctors" },
      ],
    },
    {
      label: "Billing",
      items: [
        { id: "receipts", icon: Receipt, text: "Receipts" },
        { id: "billing", icon: CreditCard, text: "Billing" },
      ],
    },
    {
      label: "System",
      items: [
        { id: "reports", icon: BarChart3, text: "Reports" },
        { id: "settings", icon: Settings, text: "Settings" },
      ],
    },
  ];

  const doctorSections = [
    {
      items: [
        { id: "overview", icon: LayoutDashboard, text: "Dashboard" },
        { id: "patients", icon: Users, text: "Patients" },
        { id: "records", icon: FileText, text: "Clinical Records" },
        { id: "schedule", icon: Calendar, text: "Schedules" },
        { id: "prescribe", icon: FlaskConical, text: "Lab Results" },
        { id: "uploads", icon: FolderOpen, text: "Patient Files" },
        { id: "settings", icon: Settings, text: "Settings" },
      ],
    },
  ];

  const sections = role === "admin" ? adminSections : doctorSections;

  return (
    <nav className="w-64 bg-white border-r border-[#c3c5d9] flex flex-col h-screen sticky top-0 z-50">
      {/* Brand */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#003ec7] flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div>
            <h1 className="text-[#003ec7] text-lg font-bold tracking-tight leading-none">Medha Health Intelligance</h1>
            <p className="text-[#505f76] text-[11px] font-medium tracking-wide">Clinician Portal</p>
          </div>
        </div>

        {/* New Patient Scan button */}
        <button
          onClick={() => onPanelChange("patients")}
          className="w-full mb-6 bg-[#003ec7] hover:bg-[#0038b6] text-white text-[12px] font-semibold tracking-wide py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Patient Scan
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <h5 className="px-3 pt-4 pb-1 text-[11px] font-medium text-[#434656] uppercase tracking-[0.03em]">
                {section.label}
              </h5>
            )}
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.link) {
                    navigate(item.link);
                  } else {
                    onPanelChange(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium tracking-tight transition-all duration-200",
                  activePanel === item.id 
                    ? "bg-blue-50 text-[#003ec7] shadow-sm font-semibold" 
                    : "text-[#505f76] hover:bg-[#f2f4f6]"
                )}
              >
                <item.icon size={20} strokeWidth={activePanel === item.id ? 2.2 : 1.8} />
                {item.text}
                {item.badge && (
                  <span className={cn(
                    "ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold",
                    activePanel === item.id ? "bg-white/60 text-[#003ec7]" : "bg-[#003ec7]/10 text-[#003ec7]"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Links */}
      <div className="mt-auto border-t border-[#c3c5d9] pt-3 pb-3 px-4 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-[#505f76] hover:bg-[#f2f4f6] transition-all duration-200">
          <HeadphonesIcon size={20} strokeWidth={1.8} />
          Support
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-[#505f76] hover:bg-[#f2f4f6] transition-all duration-200">
          <HelpCircle size={20} strokeWidth={1.8} />
          Help Center
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 mt-1"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}