import { useState, useEffect, FormEvent } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { FoodEntry } from './types';
import { subscribeToDailyLogs, addFoodEntry, deleteFoodEntry } from './services/dbService';
import { getNutritionForFood } from './services/nutritionService';
import { formatDate, cn } from './lib/utils';
import { 
  Search, 
  Plus, 
  Trash2, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Utensils, 
  PieChart, 
  BarChart2,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Target,
  ShieldCheck,
  Zap,
  Leaf,
  Menu,
  X,
  Instagram,
  Twitter,
  Facebook
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const formattedDate = formatDate(currentDate);
      const unsubscribe = subscribeToDailyLogs(formattedDate, (newEntries) => {
        setEntries(newEntries);
      });
      return unsubscribe;
    }
  }, [user, currentDate]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const data = await getNutritionForFood(searchQuery);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddEntry = async () => {
    if (!searchResults) return;
    try {
      await addFoodEntry({
        foodName: searchQuery,
        calories: searchResults.calories,
        protein: searchResults.protein,
        carbs: searchResults.carbs,
        fats: searchResults.fats,
        date: formatDate(currentDate)
      });
      setSearchQuery('');
      setSearchResults(null);
    } catch (error) {
      console.error(error);
    }
  };

  const totalCalories = entries.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = entries.reduce((acc, curr) => acc + curr.protein, 0);
  const totalCarbs = entries.reduce((acc, curr) => acc + curr.carbs, 0);
  const totalFats = entries.reduce((acc, curr) => acc + curr.fats, 0);

  const chartData = [
    { name: 'Protein', value: totalProtein, color: '#3b82f6' },
    { name: 'Carbs', value: totalCarbs, color: '#10b981' },
    { name: 'Fats', value: totalFats, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center text-white">
                <Leaf className="w-5 h-5 fill-current" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tighter text-slate-900">NutriTrack</span>
            </div>
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Features</a>
              <a href="#about" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">About</a>
              <a href="#blogs" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Blogs</a>
              <button 
                onClick={() => loginWithGoogle()}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
              >
                Get Started
              </button>
            </div>
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-40 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-6xl md:text-8xl font-display font-bold text-slate-900 leading-[0.9] tracking-tighter">
                Empowering Health <br />
                <span className="text-emerald-500">Through Smart</span> <br />
                Nutrition Tracking.
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium">
                Your comprehensive solution for managing nutrition data and promoting healthier lifestyles, powered by state-of-the-art Gemini AI.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button 
                  onClick={() => loginWithGoogle()}
                  className="w-full sm:w-auto bg-emerald-500 text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  Log Your First Meal <ArrowRight className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">No credit card required</span>
              </div>
            </motion.div>
          </div>

          {/* Background Elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-100 rounded-full blur-[100px] opacity-30 -z-10" />
          <div className="absolute top-1/2 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-30 -z-10" />
        </section>

        {/* Features Bento */}
        <section id="features" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-4">
              <span className="text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs">Capabilities</span>
              <h2 className="text-4xl font-display font-bold text-slate-900">Why NutriTrack?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 fill-current" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">AI-Powered Analysis</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">Instantly analyze any food item with our Gemini-powered engine. No more manual database searching.</p>
                </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between hover:scale-[1.02] transition-all">
                <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight">Daily Goals</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">Set your targets and watch your progress in real-time with visual markers.</p>
                </div>
              </div>

              <div className="bg-emerald-500 p-10 rounded-[3rem] text-white flex flex-col justify-between hover:scale-[1.02] transition-all">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight">Secure & Private</h3>
                  <p className="text-emerald-50 leading-relaxed text-sm">Your health data is encrypted and stored securely within our Firebase infrastructure.</p>
                </div>
              </div>

              <div className="md:col-span-4 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Interactive Analytics</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">Deep dive into your macronutrient breakdowns. Understand where your calories are coming from and adjust your habits for better health.</p>
                </div>
                <div className="flex-1 w-full flex items-center justify-center bg-slate-50 rounded-3xl p-8">
                  <div className="w-full h-40 flex items-end gap-3 px-4">
                    {[40, 70, 45, 90, 65].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-400 rounded-t-xl" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blogs Section */}
        <section id="blogs" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <span className="text-emerald-600 font-bold uppercase tracking-[0.2em] text-xs">Articles & News</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tighter leading-tight">
                  Fuel Your Knowledge <br />
                  With Our Latest Blogs.
                </h2>
              </div>
              <button className="text-slate-900 font-bold text-sm uppercase tracking-widest flex items-center gap-2 group border-b-2 border-slate-900 pb-1">
                View all stories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  title: "How Gemini AI is Revolutionizing Nutrition Tracking",
                  category: "Technology",
                  image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop",
                  date: "May 2, 2026"
                },
                {
                  title: "The Importance of Macronutrients in Your Daily Diet",
                  category: "Health",
                  image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop",
                  date: "April 28, 2026"
                },
                {
                  title: "Top 10 Superfoods to Boost Your Energy Levels",
                  category: "Lifestyle",
                  image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop",
                  date: "April 24, 2026"
                }
              ].map((blog, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="space-y-6 group cursor-pointer"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-slate-100">
                    <img 
                      src={blog.image} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="space-y-3 px-2">
                    <span className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">{blog.category}</span>
                    <h4 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">{blog.title}</h4>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-tighter">{blog.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 py-20 text-white">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 fill-current" />
                </div>
                <span className="font-display font-bold text-2xl tracking-tighter">NutriTrack</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Empowering individuals to take control of their health through data-driven nutrition tracking.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-colors"><Facebook className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
            <span>© 2026 NUTRITRACK. ALL RIGHTS RESERVED.</span>
            <span>MADE WITH HEART FOR A HEALTHIER COMMUNITY.</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Modern Rail Style */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-slate-900 flex flex-col items-center py-8 gap-10 z-50">
        <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
          <Leaf className="w-6 h-6 fill-current" />
        </div>
        <div className="flex-1 flex flex-col gap-6">
          <button className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center transition-all hover:bg-white/20">
            <PieChart className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-2xl text-slate-400 flex items-center justify-center transition-all hover:bg-white/10 hover:text-white">
            <Utensils className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-2xl text-slate-400 flex items-center justify-center transition-all hover:bg-white/10 hover:text-white">
            <Zap className="w-6 h-6" />
          </button>
        </div>
        <button 
          onClick={() => logout()}
          className="w-12 h-12 rounded-2xl text-slate-500 flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8 space-y-8 max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Welcome back, {user.displayName?.split(' ')[0]}!</h1>
            <p className="text-slate-500 font-medium italic serif text-lg leading-none opacity-80">"Let food be thy medicine and medicine be thy food."</p>
          </div>
          <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <button 
                onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() - 1); return n; })}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="px-6 text-center">
              <span className="font-bold text-slate-900 whitespace-nowrap">
                {currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() + 1); return n; })}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </header>

        {/* Bento Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Search Panel */}
          <section className="lg:col-span-3 bento-card p-10 space-y-8 bg-gradient-to-br from-white to-slate-50">
            <div className="space-y-2">
              <span className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">Analyze & Log</span>
              <h2 className="text-3xl font-display font-bold text-slate-900">What are you eating?</h2>
            </div>

            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="E.g. A bowl of oatmeal with blueberries and honey"
                className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-6 pl-14 pr-40 focus:border-emerald-500 focus:ring-0 transition-all font-medium text-lg text-slate-900 shadow-sm group-hover:border-slate-200"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <button 
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-8 py-3.5 rounded-[1.5rem] font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Ask AI'}
              </button>
            </form>

            <AnimatePresence mode="wait">
              {searchResults && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-10 items-center"
                >
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="space-y-1">
                      <h4 className="text-2xl font-bold text-slate-900 capitalize tracking-tight">{searchQuery}</h4>
                      <p className="text-slate-400 font-semibold tracking-wide uppercase text-[10px]">AI Estimated Nutrition Facts</p>
                    </div>
                    <button 
                      onClick={handleAddEntry}
                      className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2 mx-auto md:mx-0"
                    >
                      <Plus className="w-5 h-5" /> Add to Your Day
                    </button>
                  </div>

                  <div className="flex gap-4">
                    {[
                      { label: 'Calories', val: searchResults.calories, unit: 'kcal', color: 'bg-slate-900 text-white' },
                      { label: 'Protein', val: searchResults.protein, unit: 'g', color: 'bg-blue-50 text-blue-700' },
                      { label: 'Carbs', val: searchResults.carbs, unit: 'g', color: 'bg-emerald-50 text-emerald-700' },
                      { label: 'Fats', val: searchResults.fats, unit: 'g', color: 'bg-amber-50 text-amber-700' },
                    ].map((stat) => (
                      <div key={stat.label} className={cn("w-24 h-32 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-sm", stat.color)}>
                        <span className="text-xl font-black">{stat.val}{stat.unit}</span>
                        <span className="text-[10px] uppercase font-black opacity-60 tracking-widest">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Calorie Stats Card */}
          <section className="lg:col-span-1 bento-card bg-slate-900 text-white flex flex-col items-center justify-center gap-6 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />
            <div className="space-y-1">
              <span className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.3em]">Total Intake</span>
              <div className="relative">
                <h3 className="text-7xl font-display font-black leading-none">{totalCalories}</h3>
                <span className="absolute -right-12 bottom-2 text-slate-500 font-bold uppercase text-[10px] rotate-90">Kcal</span>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalCalories / 2500) * 100, 100)}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
               />
            </div>
            <p className="text-slate-400 text-xs font-semibold">of your 2,500 kcal daily target</p>
          </section>

          {/* Food Journal */}
          <section className="lg:col-span-3 bento-card p-0 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold text-slate-900">Food Journal</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Utensils className="w-4 h-4" />
                {entries.length} items logged
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {entries.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <Utensils className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium italic serif">Your journal is empty for today.</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={entry.id} 
                    className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors shadow-sm">
                        <Utensils className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-lg capitalize">{entry.foodName}</h4>
                        <div className="flex items-center gap-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase">{entry.protein}g P</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase">{entry.carbs}g C</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-black uppercase">{entry.fats}g F</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="block text-2xl font-black text-slate-900">{entry.calories}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Kcal</span>
                      </div>
                      <button 
                        onClick={() => entry.id && deleteFoodEntry(entry.id)}
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Macro Breakdown */}
          <section className="lg:col-span-1 bento-card p-8 flex flex-col space-y-8">
            <div className="space-y-1">
              <span className="text-emerald-600 font-black uppercase text-[10px] tracking-widest">Analytics</span>
              <h3 className="text-2xl font-display font-bold text-slate-900">Macronutrients</h3>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {chartData.map(stat => (
                <div key={stat.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{stat.value}g</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
