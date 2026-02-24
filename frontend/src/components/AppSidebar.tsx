import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, MessageCircle, BarChart3, Sparkles, Settings, Brain } from "lucide-react";
import AuraOrb from "./AuraOrb";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Chat with AURA", url: "/chat", icon: MessageCircle },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Wellness", url: "/recommendations", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-[260px] min-h-screen bg-sidebar flex flex-col border-r border-border/50 shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <Brain className="w-8 h-8 text-cyan" />
        <div>
          <h1 className="text-xl font-bold gradient-cyan-lavender">AURA</h1>
          <p className="text-[10px] text-caption tracking-widest uppercase">Mental Wellness AI</p>
        </div>
      </div>

      {/* Mini Orb */}
      <div className="flex justify-center py-4">
        <AuraOrb size="sm" emotion="calm" />
      </div>
      <p className="text-center text-xs text-caption mb-6">Feeling: Calm</p>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
            activeClassName="bg-muted text-cyan font-medium glow-cyan/20"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="p-4 mx-3 mb-4 glass rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <span className="text-xs text-caption">AURA Active</span>
        </div>
        <p className="text-[11px] text-caption">Multimodal analysis ready</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
