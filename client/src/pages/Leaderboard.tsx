import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown, Medal, Zap, Moon, Target, Clock, TrendingUp, Timer } from "lucide-react";
import { LeadDeclarationForm } from "@/components/LeadDeclarationForm";

interface GamificationProfile {
  id: number;
  userId: number;
  xpTotal: number;
  level: number;
  currentStreak: number;
  roleMultiplier: number;
  badges: string[];
}

interface XpActivity {
  id: number;
  userId: number;
  actionType: string;
  xpGained: number;
  description: string;
  createdAt: string;
}

interface TodayTime {
  userId: number;
  todayMinutes: number;
  formatted: string;
}

const USER_NAMES: Record<number, { name: string; avatar: string; role: string }> = {
  1: { name: "Nico", avatar: "N", role: "Staff" },
  2: { name: "WildGirl", avatar: "W", role: "Model" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

function XpProgressBar({ xp, level }: { xp: number; level: number }) {
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>Niveau {level}</span>
        <span>{xp} / {nextLevelXp} XP</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-gold via-yellow-400 to-gold rounded-full"
        />
      </div>
    </div>
  );
}

function LeaderboardCard({ profile, rank, todayTime }: { profile: GamificationProfile; rank: number; todayTime?: TodayTime }) {
  const user = USER_NAMES[profile.userId] || { name: `User ${profile.userId}`, avatar: "?", role: "Unknown" };
  
  const getRankIcon = () => {
    switch (rank) {
      case 1: return <Crown size={24} className="text-yellow-400" />;
      case 2: return <Medal size={24} className="text-gray-300" />;
      case 3: return <Medal size={24} className="text-amber-600" />;
      default: return <span className="text-white/30 font-bold">#{rank}</span>;
    }
  };

  const getRankGlow = () => {
    switch (rank) {
      case 1: return "shadow-[0_0_30px_rgba(234,179,8,0.3)] border-yellow-500/50";
      case 2: return "shadow-[0_0_20px_rgba(156,163,175,0.2)] border-gray-400/30";
      case 3: return "shadow-[0_0_20px_rgba(180,83,9,0.2)] border-amber-600/30";
      default: return "border-white/10";
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className={`bg-[#0A0A0A] border ${getRankGlow()} rounded-2xl p-6 relative overflow-hidden`}>
        {rank === 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        )}
        
        <div className="flex items-center gap-4">
          <div className="w-12 flex justify-center">
            {getRankIcon()}
          </div>
          
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
            rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-black" :
            rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black" :
            rank === 3 ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white" :
            "bg-white/10 text-white"
          }`}>
            {user.avatar}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{user.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                profile.roleMultiplier > 1 
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}>
                {user.role} {profile.roleMultiplier > 1 && `(${profile.roleMultiplier}x)`}
              </span>
            </div>
            <XpProgressBar xp={profile.xpTotal} level={profile.level} />
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-gold">{profile.xpTotal}</div>
            <div className="text-xs text-white/50 uppercase tracking-wider">XP Total</div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 ml-16">
          {todayTime && todayTime.todayMinutes > 0 && (
            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1">
              <Timer size={12} /> Aujourd'hui: {todayTime.formatted}
            </span>
          )}
          {profile.currentStreak > 0 && (
            <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1">
              <Zap size={12} /> {profile.currentStreak} streak
            </span>
          )}
          {profile.badges?.includes("night_owl") && (
            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
              <Moon size={12} /> Night Owl
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function ActivityFeed({ activities }: { activities: XpActivity[] }) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case "lead_approved": return <Target size={14} className="text-green-400" />;
      case "work_session": return <Clock size={14} className="text-blue-400" />;
      default: return <Zap size={14} className="text-gold" />;
    }
  };

  return (
    <Card className="bg-[#0A0A0A] border-white/[0.05] rounded-2xl p-6">
      <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-gold" />
        Activité Récente
      </h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">Aucune activité pour le moment</p>
        ) : (
          activities.map((activity) => {
            const user = USER_NAMES[activity.userId] || { name: `User ${activity.userId}` };
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl"
              >
                {getActionIcon(activity.actionType)}
                <div className="flex-1">
                  <p className="text-white/80 text-sm">
                    <span className="text-gold font-medium">{user.name}</span>
                    {" "}{activity.description}
                  </p>
                  <p className="text-white/30 text-xs">
                    {new Date(activity.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span className="text-green-400 font-bold text-sm">+{activity.xpGained} XP</span>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default function Leaderboard() {
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery<GamificationProfile[]>({
    queryKey: ["/api/gamification/leaderboard"],
  });

  const { data: activities = [] } = useQuery<XpActivity[]>({
    queryKey: ["/api/gamification/activity"],
  });

  const { data: todayTime1 } = useQuery<TodayTime>({
    queryKey: ["/api/gamification/today-time", 1],
  });

  const { data: todayTime2 } = useQuery<TodayTime>({
    queryKey: ["/api/gamification/today-time", 2],
  });

  const todayTimes: Record<number, TodayTime> = {};
  if (todayTime1) todayTimes[1] = todayTime1;
  if (todayTime2) todayTimes[2] = todayTime2;

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="text-gold" size={32} />
              SB HUNTER LEAGUE
            </h1>
            <p className="text-white/50 mt-1">Compétition Staff vs Modèle</p>
          </div>
          
          <div className="flex items-center gap-4">
            <LeadDeclarationForm userId={1} />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <h2 className="text-white/70 uppercase tracking-wider text-sm font-medium flex items-center gap-2">
              <Crown size={16} className="text-gold" />
              Classement
            </h2>
            
            {loadingLeaderboard ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {leaderboard.map((profile, index) => (
                  <LeaderboardCard 
                    key={profile.id} 
                    profile={profile} 
                    rank={index + 1} 
                    todayTime={todayTimes[profile.userId]}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <ActivityFeed activities={activities} />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-purple-900/20 via-transparent to-gold/10 border-white/[0.05] rounded-2xl p-6">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">
              Règles du Jeu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-white/[0.02] rounded-xl">
                <Target className="text-green-400 mb-2" size={20} />
                <p className="text-white/80 font-medium">Chasse Réussie</p>
                <p className="text-white/50">100 XP × multiplicateur</p>
                <p className="text-white/30 text-xs mt-1">Staff: 200 XP | Modèle: 100 XP</p>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl">
                <Clock className="text-blue-400 mb-2" size={20} />
                <p className="text-white/80 font-medium">Présence Active</p>
                <p className="text-white/50">+2 XP / 5 min (~24 XP/h)</p>
                <p className="text-white/30 text-xs mt-1">Tracking automatique</p>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl">
                <Moon className="text-purple-400 mb-2" size={20} />
                <p className="text-white/80 font-medium">Bonus Night Owl</p>
                <p className="text-white/50">+50 XP</p>
                <p className="text-white/30 text-xs mt-1">Actions entre 00h00 et 06h00</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
