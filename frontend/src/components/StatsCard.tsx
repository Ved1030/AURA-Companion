import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

const StatsCard = ({
  icon: Icon,
  label,
  value,
  change,
  positive,
}: StatsCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Smooth counting animation (if numeric)
  useEffect(() => {
    const numeric = parseInt(value);
    if (!isNaN(numeric)) {
      let start = 0;
      const duration = 800;
      const stepTime = 20;
      const increment = numeric / (duration / stepTime);

      const counter = setInterval(() => {
        start += increment;
        if (start >= numeric) {
          clearInterval(counter);
          setDisplayValue(numeric);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, stepTime);

      return () => clearInterval(counter);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden glass rounded-[2rem] p-6"
    >
      {/* Soft top shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between mb-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#F8E0C2]/40 via-[#F5D6FF]/40 to-[#D5D2FD]/40 blur-md opacity-70" />
          <div className="relative p-3 rounded-xl bg-white/70 backdrop-blur-md">
            <Icon className="w-5 h-5 text-[hsl(var(--foreground))]" />
          </div>
        </div>

        {change && (
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              positive
                ? "bg-emerald-100 text-emerald-500"
                : "bg-rose-100 text-rose-400"
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <motion.p
        key={displayValue}
        initial={{ opacity: 0.5, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-heading font-bold tracking-tight"
      >
        {displayValue || value}
      </motion.p>

      {/* Label */}
      <p className="text-sm text-subtle-aura mt-1 font-medium tracking-wide">
        {label}
      </p>
    </motion.div>
  );
};

export default StatsCard;
