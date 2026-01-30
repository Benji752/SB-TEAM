import { useStats } from "@/hooks/use-stats";
import { useTasks } from "@/hooks/use-tasks";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const recentTasks = tasks?.slice(0, 5) || [];
  const currentStats = stats?.[stats.length - 1]; // Get latest month

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your agency's performance.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard 
          title="Monthly Revenue"
          value={currentStats ? `$${currentStats.revenue.toLocaleString()}` : "$0"}
          icon={DollarSign}
          trend="+12.5%"
          trendUp={true}
          loading={statsLoading}
        />
        <StatCard 
          title="New Subscribers"
          value={currentStats ? `+${currentStats.newSubscribers}` : "0"}
          icon={Users}
          trend="+4.2%"
          trendUp={true}
          loading={statsLoading}
        />
        <StatCard 
          title="Churn Rate"
          value={currentStats ? `${(currentStats.churnRate / 100).toFixed(1)}%` : "0%"}
          icon={Activity}
          trend="-0.5%"
          trendUp={true} // Good because it went down (handled visually below though)
          inverseTrend // Green if down
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              {statsLoading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted/10 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value/1000}k`} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-lg)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="lg:col-span-3 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
               <div className="space-y-4">
                 {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
               </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active tasks
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{task.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {task.status.replace('_', ' ')} • {task.priority}
                      </span>
                    </div>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      task.status === 'completed' ? "bg-green-500" :
                      task.status === 'in_progress' ? "bg-blue-500" : "bg-orange-500"
                    )} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, inverseTrend, loading }: any) {
  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;
  
  const isPositive = inverseTrend ? !trendUp : trendUp;
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-all border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        <p className={cn(
          "text-xs flex items-center mt-1 font-medium",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
          {trend}
          <span className="text-muted-foreground font-normal ml-1">from last month</span>
        </p>
      </CardContent>
    </Card>
  );
}
