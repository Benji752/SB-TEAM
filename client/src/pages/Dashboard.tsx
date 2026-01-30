import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar as CalendarIcon,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  HardDrive,
  CheckSquare
} from "lucide-react";

const mockRevenueData = [
  { month: "Jan", revenue: 4500, users: 120 },
  { month: "Feb", revenue: 5200, users: 150 },
  { month: "Mar", revenue: 4800, users: 140 },
  { month: "Apr", revenue: 6100, users: 180 },
  { month: "May", revenue: 5900, users: 175 },
  { month: "Jun", revenue: 7200, users: 210 },
];

const mockStats = [
  { 
    title: "Revenu Total", 
    value: "24,500€", 
    change: "+12.5%", 
    trend: "up", 
    icon: DollarSign,
    color: "text-green-500" 
  },
  { 
    title: "Nouveaux Prospects", 
    value: "48", 
    change: "+18%", 
    trend: "up", 
    icon: Users,
    color: "text-blue-500" 
  },
  { 
    title: "Messages", 
    value: "156", 
    change: "-5%", 
    trend: "down", 
    icon: MessageSquare,
    color: "text-purple-500" 
  },
  { 
    title: "Taux de Conversion", 
    value: "24%", 
    change: "+2.4%", 
    trend: "up", 
    icon: TrendingUp,
    color: "text-orange-500" 
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Bonjour ! 👋</h1>
          <p className="text-muted-foreground">Voici ce qui se passe dans votre agence aujourd'hui.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockStats.map((stat) => (
            <Card key={stat.title} className="hover-card-effect">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={stat.color} size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs mt-1">
                  {stat.trend === "up" ? (
                    <span className="text-green-500 flex items-center">
                      <ArrowUpRight size={12} className="mr-1" /> {stat.change}
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <ArrowDownRight size={12} className="mr-1" /> {stat.change}
                    </span>
                  )}
                  <span className="text-muted-foreground ml-1">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Aperçu des Revenus</CardTitle>
              <CardDescription>Croissance mensuelle de l'agence.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        color: "hsl(var(--foreground))"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Activités Récentes</CardTitle>
              <CardDescription>Les dernières actions de l'équipe.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  { user: "Alice V.", action: "a téléchargé un nouveau média", time: "Il y a 2h", icon: HardDrive },
                  { user: "Staff Admin", action: "a validé le contrat de Bella", time: "Il y a 4h", icon: CheckSquare },
                  { user: "Prospect", action: "Nouveau message de @clara_m", time: "Il y a 5h", icon: MessageSquare },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        <span className="font-bold">{item.user}</span> {item.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
