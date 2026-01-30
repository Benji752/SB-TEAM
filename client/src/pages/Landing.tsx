import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import heroImg from "@assets/hero.jpg"; // Placeholder, handled via CSS/Div if missing

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-display font-bold text-xl">AgencyFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/api/login">
                <Button variant="ghost" className="font-medium">Log In</Button>
              </a>
              <a href="/api/login">
                <Button className="font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  Get Started
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight mb-6">
              Manage your Talent <br />
              <span className="text-primary">Scale your Agency</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
              The all-in-one platform for modern talent agencies. Streamline tasks, manage models, and track revenue in one beautiful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/api/login">
                <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-primary/20">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto">
                View Demo
              </Button>
            </div>
            
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>14-day free trial</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
             {/* Abstract Dashboard Graphic */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card p-2 aspect-[4/3] group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="h-full w-full bg-muted/20 rounded-xl border border-border/50 p-6 flex flex-col gap-4">
                 {/* Fake UI Elements */}
                 <div className="h-8 w-1/3 bg-muted rounded-md animate-pulse" />
                 <div className="flex gap-4">
                    <div className="h-32 w-1/2 bg-white dark:bg-card rounded-lg shadow-sm border border-border/50 p-4">
                      <div className="h-8 w-8 rounded-full bg-primary/20 mb-2" />
                      <div className="h-4 w-12 bg-muted rounded mb-2" />
                      <div className="h-6 w-24 bg-muted rounded" />
                    </div>
                    <div className="h-32 w-1/2 bg-white dark:bg-card rounded-lg shadow-sm border border-border/50 p-4">
                      <div className="h-8 w-8 rounded-full bg-green-500/20 mb-2" />
                      <div className="h-4 w-12 bg-muted rounded mb-2" />
                      <div className="h-6 w-24 bg-muted rounded" />
                    </div>
                 </div>
                 <div className="flex-1 bg-white dark:bg-card rounded-lg shadow-sm border border-border/50 p-4">
                   <div className="flex justify-between items-center mb-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-8 w-24 bg-primary/10 rounded" />
                   </div>
                   <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 w-full bg-muted/30 rounded-md border border-border/30" />
                      ))}
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Everything you need to run your agency</h2>
            <p className="text-muted-foreground text-lg">Powerful tools built specifically for talent management agencies.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutDashboard,
                title: "Unified Dashboard",
                desc: "Track revenue, subscriber growth, and churn rates in real-time."
              },
              {
                icon: Users,
                title: "Model Management",
                desc: "Keep detailed profiles, contract info, and social stats for every talent."
              },
              {
                icon: ShieldCheck,
                title: "Secure Access",
                desc: "Role-based access control for Admins, Staff, and Models."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2024 AgencyFlow Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
