import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, description, icon: Icon, trend, className }: KPICardProps) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-md bg-white transition-all hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 bg-primary/5 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-headline font-bold text-primary">{value}</div>
        <div className="flex items-center mt-2 space-x-2">
          {trend && (
            <span className={cn(
              "flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md",
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend.value)}%
            </span>
          )}
          <p className="text-xs text-muted-foreground font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}