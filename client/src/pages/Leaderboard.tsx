import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown, Medal, Zap, Moon, Target, Clock, TrendingUp, Timer, ShoppingCart, CheckCircle, Flame, Star, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isUserOnline } from "@/lib/onlineStatus";

interface GamificationProfile {
  id: number;
  userId: number;
  xpTotal: number;
  level: number;
  currentStreak: number;
  roleMultiplier: number;
  badges: string[];
  role?: string | null;
  username?: string | null;
  isOnline?: boolean;
  lastActiveAt?: string | null;
}

interface XpActivity {
  id: number;
  userId: number;
  actionType: string;
  xpGained: number;
  description: string;
  createdAt: string;
  username?: string | null;
}

interface TodayTime {
  userId: number;
  todayMinutes: number;
  formatted: string;
}

function getDisplayName(profile: GamificationProfile) {
  // Use username from database, fallback to User X
  const name = profile.username || `User ${profile.userId}`;
  const avatar = name.charAt(0).toUpperCase();
  return { name, avatar };
}

function getRoleLabel(role?: string | null, multiplier?: number) {
  if (role === 'admin') return { label: 'Admin', color: 'bg-gradient-to-r from-red-500/30 to-orange-500/30 text-orange-300 border-orange-400/40' };
  if (role === 'staff') return { label: 'Staff', color: 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border-purple-400/40' };
  if (role === 'model') return { label: 'Model', color: 'bg-gradient-to-r from-pink-500/30 to-rose-500/30 text-pink-300 border-pink-400/40' };
  if (multiplier && multiplier > 1) return { label: 'Staff', color: 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border-purple-400/40' };
  return { label: 'Member', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

function XpProgressBar({ xp, level }: { xp: number; level: number }) {
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className="w-full mt-3">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gold font-semibold flex items-center gap-1">
          <Star size={10} className="fill-gold" />
          Niveau {level}
        </span>
        <span className="text-white/60">{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
      </div>
      <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-gold/20 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-yellow-500 via-gold to-amber-400 rounded-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full" />
          <motion.div 
            className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/50"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function MyScoreCard({ profile, rank, todayTime }: { profile: GamificationProfile; rank: number; todayTime?: TodayTime }) {
  const displayInfo = getDisplayName(profile);
  const roleInfo = getRoleLabel(profile.role, profile.roleMultiplier);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <Card className="bg-gradient-to-br from-cyan-900/30 via-[#0A0A0A] to-blue-900/20 border-2 border-cyan-400/50 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-cyan-400" />
          <h3 className="text-cyan-400 font-black uppercase tracking-widest text-sm">Mon Score Actuel</h3>
          <span className="ml-auto text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
            Rang #{rank}
          </span>
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative shrink-0">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-600 text-black shadow-[0_0_30px_rgba(34,211,238,0.5)] ring-4 ring-cyan-500/30`}>
              {displayInfo.avatar}
            </div>
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-black ${
              isUserOnline(profile.lastActiveAt) 
                ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' 
                : 'bg-gray-500'
            }`} title={isUserOnline(profile.lastActiveAt) ? 'En ligne' : 'Hors ligne'} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-black text-white tracking-tight">{displayInfo.name}</h3>
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${roleInfo.color} border shadow-lg`}>
                {roleInfo.label} {profile.roleMultiplier > 1 && (
                  <span className="text-pink-400 ml-1">{profile.roleMultiplier}x</span>
                )}
              </span>
            </div>
            <XpProgressBar xp={profile.xpTotal} level={profile.level} />
          </div>
          
          <div className="text-right shrink-0">
            <motion.div 
              key={profile.xpTotal}
              initial={{ scale: 1.3, color: "#22d3ee" }}
              animate={{ scale: 1, color: "#c9a24d" }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-gold to-amber-400 bg-clip-text text-transparent"
            >
              {profile.xpTotal.toLocaleString()}
            </motion.div>
            <div className="text-xs text-white/50 uppercase tracking-widest font-semibold">XP Total</div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-5 flex-wrap">
          {todayTime && todayTime.todayMinutes > 0 && (
            <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-400 rounded-full flex items-center gap-1.5 border border-cyan-500/30 font-medium">
              <Timer size={12} /> Aujourd'hui: {todayTime.formatted}
            </span>
          )}
          {profile.currentStreak > 0 && (
            <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 rounded-full flex items-center gap-1.5 border border-orange-500/30 font-medium">
              <Flame size={12} className="text-orange-400" /> {profile.currentStreak} streak
            </span>
          )}
          {profile.badges?.includes("night_owl") && (
            <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 rounded-full flex items-center gap-1.5 border border-purple-500/30 font-medium">
              <Moon size={12} /> Night Owl
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function LeaderboardCard({ profile, rank, todayTime, isCurrentUser }: { profile: GamificationProfile; rank: number; todayTime?: TodayTime; isCurrentUser?: boolean }) {
  const displayInfo = getDisplayName(profile);
  const roleInfo = getRoleLabel(profile.role, profile.roleMultiplier);
  
  const getRankIcon = () => {
    switch (rank) {
      case 1: return <Crown size={32} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />;
      case 2: return <Medal size={28} className="text-gray-300 drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]" />;
      case 3: return <Medal size={28} className="text-amber-500 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />;
      default: return <span className="text-white/40 font-black text-2xl">#{rank}</span>;
    }
  };

  const getCardStyle = () => {
    if (isCurrentUser) return "bg-gradient-to-br from-cyan-900/20 via-[#0A0A0A] to-blue-900/10 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(34,211,238,0.15)]";
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-900/30 via-[#0A0A0A] to-amber-900/20 border-2 border-yellow-500/60 shadow-[0_0_40px_rgba(234,179,8,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]";
      case 2: return "bg-gradient-to-br from-gray-800/30 via-[#0A0A0A] to-gray-700/20 border-2 border-gray-400/40 shadow-[0_0_30px_rgba(156,163,175,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]";
      case 3: return "bg-gradient-to-br from-amber-900/30 via-[#0A0A0A] to-orange-900/20 border-2 border-amber-500/40 shadow-[0_0_30px_rgba(217,119,6,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]";
      default: return "bg-[#0A0A0A] border border-white/10 shadow-lg";
    }
  };

  const getAvatarStyle = () => {
    if (isCurrentUser) return "bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-600 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-4 ring-cyan-500/30";
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-600 text-black shadow-[0_0_30px_rgba(234,179,8,0.5)] ring-4 ring-yellow-500/30";
      case 2: return "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 text-black shadow-[0_0_20px_rgba(156,163,175,0.4)] ring-4 ring-gray-400/30";
      case 3: return "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)] ring-4 ring-amber-500/30";
      default: return "bg-gradient-to-br from-white/20 to-white/5 text-white ring-2 ring-white/10";
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`${getCardStyle()} rounded-2xl p-6 relative overflow-hidden`}>
        {rank === 1 && (
          <>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
          </>
        )}
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 flex justify-center shrink-0">
            {getRankIcon()}
          </div>
          
          <div className="relative shrink-0">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black ${getAvatarStyle()}`}>
              {displayInfo.avatar}
            </div>
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-black ${
              isUserOnline(profile.lastActiveAt) 
                ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' 
                : 'bg-gray-500'
            }`} title={isUserOnline(profile.lastActiveAt) ? 'En ligne' : 'Hors ligne'} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-black text-white tracking-tight">{displayInfo.name}</h3>
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${roleInfo.color} border shadow-lg`}>
                {roleInfo.label} {profile.roleMultiplier > 1 && (
                  <span className="text-pink-400 ml-1">{profile.roleMultiplier}x</span>
                )}
              </span>
              {isCurrentUser && (
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">Vous</span>
              )}
            </div>
            <XpProgressBar xp={profile.xpTotal} level={profile.level} />
          </div>
          
          <div className="text-right shrink-0">
            <motion.div 
              key={profile.xpTotal}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-4xl font-black bg-gradient-to-r from-gold via-yellow-300 to-amber-400 bg-clip-text text-transparent"
            >
              {profile.xpTotal.toLocaleString()}
            </motion.div>
            <div className="text-xs text-white/50 uppercase tracking-widest font-semibold">XP Total</div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-5 ml-20 flex-wrap">
          {todayTime && todayTime.todayMinutes > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-400 rounded-full flex items-center gap-1.5 border border-cyan-500/30 font-medium"
            >
              <Timer size={12} /> Aujourd'hui: {todayTime.formatted}
            </motion.span>
          )}
          {profile.currentStreak > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 rounded-full flex items-center gap-1.5 border border-orange-500/30 font-medium"
            >
              <Flame size={12} className="text-orange-400" /> {profile.currentStreak} streak
            </motion.span>
          )}
          {profile.badges?.includes("night_owl") && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 rounded-full flex items-center gap-1.5 border border-purple-500/30 font-medium"
            >
              <Moon size={12} /> Night Owl
            </motion.span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function ActivityFeed({ activities }: { activities: XpActivity[] }) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case "order_created": return <ShoppingCart size={16} className="text-blue-400" />;
      case "order_paid": return <CheckCircle size={16} className="text-green-400" />;
      case "lead_approved": return <Target size={16} className="text-green-400" />;
      case "work_session": return <Clock size={16} className="text-purple-400" />;
      default: return <Zap size={16} className="text-gold" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "order_created": return "from-blue-500/20 to-blue-600/10 border-blue-500/30";
      case "order_paid": return "from-green-500/20 to-green-600/10 border-green-500/30";
      case "lead_approved": return "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30";
      case "work_session": return "from-purple-500/20 to-purple-600/10 border-purple-500/30";
      default: return "from-gold/20 to-amber-600/10 border-gold/30";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#0A0A0A] to-[#111] border-2 border-gold/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      
      <h3 className="text-white font-black uppercase tracking-widest text-sm mb-5 flex items-center gap-3">
        <div className="p-2 bg-gold/20 rounded-lg">
          <TrendingUp size={18} className="text-gold" />
        </div>
        Activité Récente
        <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent ml-2" />
      </h3>
      
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucune activité pour le moment</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const userName = activity.username || `Membre #${activity.userId}`;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 bg-gradient-to-r ${getActionColor(activity.actionType)} rounded-xl border backdrop-blur-sm`}
              >
                <div className="p-2 bg-black/30 rounded-lg">
                  {getActionIcon(activity.actionType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-medium truncate">
                    <span className="text-gold font-bold">{userName}</span>
                    <span className="text-white/60">{" "}{activity.description}</span>
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {new Date(activity.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <motion.span 
                  className="text-green-400 font-black text-sm bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20 shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  +{activity.xpGained}
                </motion.span>
              </motion.div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function RulesCard() {
  const rules = [
    { icon: ShoppingCart, color: "blue", title: "Nouvelle Commande", xp: "+10 XP", desc: "Créer une commande" },
    { icon: CheckCircle, color: "green", title: "Commande Payée", xp: "+100 XP", desc: "Quand statut = Payé" },
    { icon: Clock, color: "purple", title: "Présence Active", xp: "+2 XP / 5min", desc: "Tracking automatique" },
    { icon: Moon, color: "yellow", title: "Night Owl", xp: "+50 XP", desc: "00h00 - 06h00" },
  ];

  const colorMap: Record<string, string> = {
    blue: "from-blue-500/30 to-blue-600/10 border-blue-500/40 text-blue-400",
    green: "from-green-500/30 to-green-600/10 border-green-500/40 text-green-400",
    purple: "from-purple-500/30 to-purple-600/10 border-purple-500/40 text-purple-400",
    yellow: "from-yellow-500/30 to-yellow-600/10 border-yellow-500/40 text-yellow-400",
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 via-[#0A0A0A] to-gold/10 border-2 border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.1)]">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      
      <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-gold/20 rounded-lg">
          <Trophy size={18} className="text-gold" />
        </div>
        Règles du Jeu
        <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent ml-2" />
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        {rules.map((rule, index) => (
          <motion.div 
            key={rule.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-5 bg-gradient-to-br ${colorMap[rule.color]} rounded-xl border backdrop-blur-sm`}
          >
            <rule.icon className="mb-3" size={24} />
            <p className="text-white font-bold text-sm">{rule.title}</p>
            <p className="text-2xl font-black mt-1">{rule.xp}</p>
            <p className="text-white/40 text-xs mt-2">{rule.desc}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery<GamificationProfile[]>({
    queryKey: ["/api/gamification/leaderboard"],
    refetchInterval: 5000,
  });

  const { data: activities = [] } = useQuery<XpActivity[]>({
    queryKey: ["/api/gamification/activity"],
    refetchInterval: 5000,
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

  const currentUserId = typeof user?.id === 'number' ? user.id : parseInt(user?.id as string) || null;
  const myProfile = leaderboard.find(p => p.userId === currentUserId);
  const myRank = myProfile ? leaderboard.findIndex(p => p.userId === currentUserId) + 1 : 0;

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="relative">
            <motion.div 
              className="absolute -inset-4 bg-gradient-to-r from-gold/20 via-transparent to-purple-500/20 blur-2xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="text-4xl font-black text-white flex items-center gap-4 relative">
              <div className="p-3 bg-gradient-to-br from-gold/30 to-amber-600/20 rounded-xl border border-gold/30 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <Trophy className="text-gold" size={36} />
              </div>
              <div>
                <span className="bg-gradient-to-r from-gold via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  SB HUNTER LEAGUE
                </span>
                <p className="text-white/40 text-sm font-medium mt-1 tracking-wide">
                  Classement Global - XP automatique via commandes
                </p>
              </div>
            </h1>
          </div>
        </motion.div>

        {myProfile && (
          <motion.div variants={itemVariants}>
            <MyScoreCard profile={myProfile} rank={myRank} todayTime={todayTimes[myProfile.userId]} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <h2 className="text-white/70 uppercase tracking-widest text-sm font-bold flex items-center gap-3 ml-2">
              <Crown size={18} className="text-gold" />
              Classement
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
            </h2>
            
            {loadingLeaderboard ? (
              <div className="flex justify-center py-16">
                <motion.div 
                  className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                {leaderboard.map((profile, index) => (
                    <LeaderboardCard 
                      key={profile.id} 
                      profile={profile} 
                      rank={index + 1} 
                      todayTime={todayTimes[profile.userId]}
                      isCurrentUser={profile.userId === currentUserId}
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
          <RulesCard />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
