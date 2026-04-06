import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import Logo from "../ui/Logo";
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
  ChevronRight
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
      label: "My Practice",
      items: [
        { id: "overview", icon: LayoutDashboard, text: "My Dashboard" },
        { id: "schedule", icon: Calendar, text: "Today's Schedule", badge: "6" },
        { id: "patients", icon: Users, text: "My Patients" },
      ],
    },
    {
      label: "Clinical",
      items: [
        { id: "records", icon: FileText, text: "View Records" },
        { id: "prescribe", icon: Pill, text: "Prescriptions" },
      ],
    },
    {
      label: "Account",
      items: [{ id: "profile", icon: UserCircle, text: "My Profile" }],
    },
  ];

  const sections = role === "admin" ? adminSections : doctorSections;

  return (
    <div className="w-[280px] bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      {/* Brand & User Area */}
      <div className="p-8 pb-4">
        <Link to="/" className="block mb-10">
           <Logo className="scale-90 origin-left" />
        </Link>
        
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Logged in as</p>
           <h4 className="text-sm font-bold text-slate-900 truncate">{user?.name}</h4>
           <p className="text-[11px] font-bold text-primary uppercase tracking-tighter mt-0.5">{user?.userId}</p>
        </div>
      </div>

      {/* Nav Sections */}
      <div className="flex-grow overflow-y-auto px-4 space-y-8 pb-8">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            <h5 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              {section.label}
            </h5>
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onPanelChange(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                  activePanel === item.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} strokeWidth={activePanel === item.id ? 2.5 : 2} />
                  {item.text}
                </div>
                {item.badge ? (
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full",
                    activePanel === item.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight size={14} className={cn(
                    "opacity-0 transition-all",
                    activePanel === item.id ? "opacity-40" : "group-hover:opacity-40"
                  )} />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}