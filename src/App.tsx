import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { FoodEntry } from './types';
import { 
  subscribeToDailyLogs, 
  addFoodEntry, 
  deleteFoodEntry,
  subscribeToUserSettings,
  updateUserSettings
} from './services/dbService';
import { getNutritionForFood } from './services/nutritionService';
import { getAiRecipeSuggestions, Recipe } from './services/aiRecipeService';
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
  Facebook,
  Settings,
  User as UserIcon,
  Camera,
  Scale
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState<number>(2500);
  const [tempCalorieGoal, setTempCalorieGoal] = useState<string>('2500');
  const [profileDisplayName, setProfileDisplayName] = useState<string>('');
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>('');
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>('metric');
  const [macroRatios, setMacroRatios] = useState({ protein: 30, carbs: 40, fats: 30 });
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    console.log("Auth initialized, current user:", auth.currentUser?.email);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u?.email);
      setUser(u);
      setLoading(false);
    });
    // Safety timeout to prevent infinite loading if Firebase hangs
    const timer = setTimeout(() => {
      setLoading(prev => {
        if (prev) console.warn("Auth state took too long, forcing loading off.");
        return false;
      });
    }, 5000);
    
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserSettings((settings) => {
        if (settings) {
          if (settings.calorieGoal) {
            setCalorieGoal(settings.calorieGoal);
            setTempCalorieGoal(settings.calorieGoal.toString());
          }
          if (settings.displayName) setProfileDisplayName(settings.displayName);
          if (settings.photoURL) setProfilePhotoURL(settings.photoURL);
          if (settings.unitPreference) setUnitPreference(settings.unitPreference);
          if (settings.macroRatios) setMacroRatios(settings.macroRatios);
        }
      });
      return unsubscribe;
    }
  }, [user]);

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    const newGoal = parseInt(tempCalorieGoal);
    if (isNaN(newGoal) || newGoal < 500 || newGoal > 10000) return;
    
    try {
      await updateUserSettings({ 
        calorieGoal: newGoal,
        displayName: profileDisplayName,
        photoURL: profilePhotoURL,
        unitPreference: unitPreference,
        macroRatios: macroRatios
      });
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateRecipes = async () => {
    setIsGeneratingRecipes(true);
    try {
      const recipes = await getAiRecipeSuggestions(calorieGoal, macroRatios);
      setAiRecipes(recipes);
    } catch (error) {
      console.error("Failed to generate recipes:", error);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    console.log("handleLogin triggered");
    try {
      setLoginError(null);
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login component error:", error);
      setLoginError(error.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

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
              <div className="flex flex-col items-end">
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoggingIn ? "Signing in..." : "Get Started"}
                </button>
                {loginError && <span className="text-[10px] text-red-500 mt-1">{loginError}</span>}
              </div>
            </div>
            <button className="md:hidden p-2 rounded-lg bg-slate-50" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-6 md:hidden z-40 shadow-xl"
              >
                <div className="flex flex-col gap-6">
                  <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-2">Features</a>
                  <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-2">About</a>
                  <a href="#blogs" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-2">Blogs</a>
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl text-lg font-bold hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                  >
                    {isLoggingIn ? "Signing in..." : "Get Started Now"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-48 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center text-center space-y-12 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em]">
                  <Zap className="w-3.5 h-3.5 fill-current" /> AI-Powered Nutrition Intelligence
                </div>
                <h1 className="text-7xl md:text-[7.5rem] font-display font-bold text-slate-900 leading-[0.85] tracking-[-0.04em]">
                  Eat Smarter <br />
                  <span className="text-emerald-500">Live Better.</span>
                </h1>
                <p className="max-w-xl mx-auto text-xl text-slate-500 font-medium leading-relaxed">
                  The most advanced AI nutrition tracker. Instantly analyze meals, track macros, and reach your goals with Gemini AI.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <button 
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-[2rem] text-lg font-bold hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Tracking Free"} <ArrowRight className="w-5 h-5" />
                    </button>
                    {loginError && <span className="text-xs text-red-500 mt-3 font-bold">{loginError}</span>}
                  </div>
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="User" />
                    ))}
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border-4 border-white flex items-center justify-center text-[10px] font-black text-emerald-600">+2k</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Floating Visual Elements */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-24 relative max-w-5xl mx-auto"
            >
              <div className="aspect-video bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative p-4 group">
                <div className="w-full h-full bg-slate-50 rounded-[2rem] overflow-hidden relative">
                   <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&auto=format&fit=crop" className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 transition-all duration-1000" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="glass p-8 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
                        <div className="w-20 h-20 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white">
                          <PieChart className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-none">Macro Analysis</span>
                          <h4 className="text-3xl font-bold text-slate-900">84% Clean Intake</h4>
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Background Gradient Orbs */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[120px] -z-10" />
          <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[100px] -z-10" />
        </section>

        {/* Brand Bar */}
        <section className="py-12 border-y border-slate-100/50">
          <div className="max-w-7xl mx-auto px-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale contrast-125">
              {['FORBES', 'TECHCRUNCH', 'WIRED', 'HEALTHLINE', 'THE VERGE'].map(brand => (
                <span key={brand} className="text-xl font-black tracking-tighter text-slate-400 whitespace-nowrap">{brand}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento */}
        <section id="features" className="py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 space-y-20">
            <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
              <span className="text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] leading-none mb-2 block">Our Intelligence</span>
              <h2 className="text-5xl md:text-6xl font-display font-bold text-slate-900 tracking-tight leading-[0.95]">Precision tracking for precision results.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 bento-card flex flex-col md:flex-row gap-12 items-center overflow-hidden group">
                <div className="flex-1 space-y-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-display font-bold text-slate-900 leading-tight">Instant AI Nutrition Extraction</h3>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">
                      Simply describe your meal. Our Gemini-powered AI identifies ingredients, estimates portions, and logs nutrition values in seconds.
                    </p>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-6 transform translate-y-8 group-hover:translate-y-4 transition-transform duration-700">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full" />
                      <span className="font-bold text-sm">"Bowl of poke with avocado"</span>
                    </div>
                    <div className="space-y-4">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[65%]" />
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>Protein</span>
                        <span className="text-white">28g</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[40%]" />
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>Carbs</span>
                        <span className="text-white">42g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bento-card bg-emerald-500 text-white flex flex-col justify-between hover:bg-emerald-600 transition-colors border-none group">
                <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-bold leading-none">Goal Centric.</h3>
                  <p className="text-white/70 font-medium leading-relaxed">
                    Set weight, muscle, or endurance targets and watch your macro-balance adapt dynamically.
                  </p>
                </div>
              </div>

              <div className="md:col-span-4 bento-card bg-slate-900 text-white flex flex-col justify-between border-none overflow-hidden relative border-none">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/5">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-display font-bold leading-none">Total Privacy.</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Your data, your journey. Everything is encrypted and private by default.
                    </p>
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
              </div>

              <div className="md:col-span-8 bento-card flex flex-col md:flex-row gap-12 items-center group">
                <div className="flex-1 w-full bg-slate-50 rounded-[2rem] p-10 flex flex-col justify-between min-h-[300px]">
                  <div className="flex items-end gap-2 h-full">
                    {[3,6,4,8,5,10,7].map((h, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h * 10}%` }}
                        className="flex-1 bg-emerald-400 rounded-t-lg group-hover:bg-emerald-500 transition-colors"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="w-16 h-16 bg-blue-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                    <BarChart2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-display font-bold text-slate-900 leading-tight">Insightful Analytics</h3>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">
                      Understand your patterns. Discover hidden calories and optimize your intake with beautiful, interactive visualizations.
                    </p>
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
      {/* Navigation Rail - Modern minimal style */}
      <nav className="fixed left-0 top-0 h-full w-24 glass flex flex-col items-center py-10 gap-12 z-50 border-r border-slate-200/50">
        <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
          <Leaf className="w-7 h-7 fill-current" />
        </div>
        <div className="flex-1 flex flex-col gap-8">
          <button className="w-14 h-14 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
            <PieChart className="w-6 h-6" />
          </button>
          <button className="w-14 h-14 rounded-3xl text-slate-400 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all">
            <Utensils className="w-6 h-6" />
          </button>
          <button className="w-14 h-14 rounded-3xl text-slate-400 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all">
            <BarChart2 className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-14 h-14 rounded-3xl text-slate-400 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-sm"
          >
            {profilePhotoURL || user.photoURL ? (
              <img src={profilePhotoURL || user.photoURL!} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                <UserIcon className="w-6 h-6" />
              </div>
            )}
          </button>
          <button 
            onClick={() => logout()}
            className="w-14 h-14 rounded-3xl text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute right-6 top-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-slate-900">Profile Settings</h3>
                  <p className="text-slate-500 font-medium">Customize your profile and preferences.</p>
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-8">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                        {profilePhotoURL ? (
                          <img src={profilePhotoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <UserIcon className="w-16 h-16" />
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2.5 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all transform group-hover:scale-110"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click to change avatar</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Name</label>
                      <input 
                        type="text"
                        value={profileDisplayName || user?.displayName || ''}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 focus:bg-white focus:border-emerald-500/20 transition-all font-bold text-lg text-slate-900"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Daily Calorie Goal</label>
                      <div className="relative">
                        <input 
                          type="number"
                          min="500"
                          max="10000"
                          value={tempCalorieGoal}
                          onChange={(e) => setTempCalorieGoal(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 focus:bg-white focus:border-emerald-500/20 transition-all font-bold text-lg text-slate-900"
                        />
                        <Target className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                       <PieChart className="w-3 h-3" /> Preferred Macro Ratio
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-[2rem]">
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Protein</span>
                          <span className="font-bold text-slate-900">{macroRatios.protein}%</span>
                        </div>
                        <input 
                          type="range"
                          min="10"
                          max="60"
                          step="5"
                          value={macroRatios.protein}
                          onChange={(e) => setMacroRatios(prev => ({ ...prev, protein: parseInt(e.target.value) }))}
                          className="w-full accent-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Carbs</span>
                          <span className="font-bold text-slate-900">{macroRatios.carbs}%</span>
                        </div>
                        <input 
                          type="range"
                          min="10"
                          max="70"
                          step="5"
                          value={macroRatios.carbs}
                          onChange={(e) => setMacroRatios(prev => ({ ...prev, carbs: parseInt(e.target.value) }))}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Fats</span>
                          <span className="font-bold text-slate-900">{macroRatios.fats}%</span>
                        </div>
                        <input 
                          type="range"
                          min="10"
                          max="50"
                          step="5"
                          value={macroRatios.fats}
                          onChange={(e) => setMacroRatios(prev => ({ ...prev, fats: parseInt(e.target.value) }))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium px-4">
                      Total: {macroRatios.protein + macroRatios.carbs + macroRatios.fats}% 
                      {macroRatios.protein + macroRatios.carbs + macroRatios.fats !== 100 && 
                        <span className="text-amber-500 ml-2">(Ideally should be 100%)</span>
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                       <Scale className="w-3 h-3" /> Units of Measurement
                    </label>
                    <div className="grid grid-cols-2 gap-4 p-2 bg-slate-50 rounded-3xl">
                      <button 
                        type="button"
                        onClick={() => setUnitPreference('metric')}
                        className={cn(
                          "py-3 rounded-2xl font-bold transition-all text-sm",
                          unitPreference === 'metric' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Metric (kg, cm)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setUnitPreference('imperial')}
                        className={cn(
                          "py-3 rounded-2xl font-bold transition-all text-sm",
                          unitPreference === 'imperial' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Imperial (lb, ft)
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                  >
                    Save Profile Changes
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Experience */}
      <main className="flex-1 ml-24 p-8 md:p-12 space-y-12 max-w-[1400px]">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Overview</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tighter">
              Morning, {profileDisplayName ? profileDisplayName.split(' ')[0] : user.displayName?.split(' ')[0]}.
            </h1>
            <p className="text-slate-500 font-medium italic text-lg opacity-60 font-serif">
              "Let food be thy medicine and medicine be thy food."
            </p>
          </div>
          
          <div className="flex items-center glass p-2 rounded-3xl border border-slate-200/50">
            <button 
              onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() - 1); return n; })}
              className="p-3 hover:bg-white rounded-2xl transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="px-8 text-center min-w-[160px]">
              <span className="font-bold text-slate-900">
                {currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() + 1); return n; })}
              className="p-3 hover:bg-white rounded-2xl transition-all"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* AI Intake Board - Large Bento */}
          <section className="lg:col-span-8 bento-card flex flex-col justify-between overflow-hidden relative group">
            <div className="space-y-8 relative z-10 w-full">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Active Logger</span>
                <h2 className="text-3xl font-display font-bold text-slate-900">Track and log your intake.</h2>
              </div>

              <form onSubmit={handleSearch} className="relative w-full">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Analyze a meal like 'Grilled salmon with asparagus'"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] py-6 pl-14 pr-40 focus:bg-white focus:border-emerald-500/20 focus:ring-0 transition-all font-medium text-lg text-slate-900 shadow-inner"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                <button 
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-10 py-3.5 rounded-[1.5rem] font-bold hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Ask AI'}
                </button>
              </form>

              <AnimatePresence mode="wait">
                {searchResults && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-slate-900 text-white rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-12 items-center shadow-2xl shadow-emerald-900/20"
                  >
                    <div className="flex-1 space-y-6 text-center md:text-left">
                      <div className="space-y-1">
                        <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">AI Estimation Result</span>
                        <h4 className="text-3xl font-display font-bold capitalize tracking-tight leading-none">{searchQuery}</h4>
                      </div>
                      <button 
                        onClick={handleAddEntry}
                        className="bg-emerald-500 text-white px-12 py-5 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 w-full md:w-auto"
                      >
                        <Plus className="w-6 h-6" /> Add to Journal
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                      {[
                        { label: 'CAL', val: searchResults.calories, color: 'text-white' },
                        { label: 'PRO', val: `${searchResults.protein}g`, color: 'text-emerald-400' },
                        { label: 'CARB', val: `${searchResults.carbs}g`, color: 'text-blue-400' },
                        { label: 'FAT', val: `${searchResults.fats}g`, color: 'text-amber-400' },
                      ].map((s) => (
                        <div key={s.label} className="bg-white/10 w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-1 backdrop-blur-md">
                          <span className={cn("text-xl font-black", s.color)}>{s.val}</span>
                          <span className="text-[10px] uppercase font-black opacity-40 tracking-widest">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-100 rounded-full blur-[100px] opacity-40 -z-0 group-hover:scale-125 transition-transform duration-1000" />
          </section>

          {/* Calorie Stats Card - Secondary Bento */}
          <section className="lg:col-span-4 bento-card bg-emerald-500 text-white flex flex-col justify-between overflow-hidden relative border-none">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em] block">Energy Balance</span>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white/60 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="70" className="stroke-white/20" strokeWidth="12" fill="none" />
                    <motion.circle 
                      cx="80" cy="80" r="70" 
                      className="stroke-white" 
                      strokeWidth="12" 
                      fill="none" 
                      strokeDasharray="440"
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (Math.min(totalCalories, calorieGoal) / calorieGoal) * 440 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="block text-4xl font-black leading-none">{totalCalories}</span>
                    <span className="text-[10px] font-black uppercase opacity-60">Kcal</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs uppercase font-black tracking-widest text-white/60">Target</span>
                    <span className="text-2xl font-black uppercase">{calorieGoal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase font-black tracking-widest text-white/60">Remaining</span>
                    <span className="text-2xl font-black uppercase">{Math.max(calorieGoal - totalCalories, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md">
              <p className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4" /> You're on track for your deficit.
              </p>
            </div>
          </section>

          {/* Daily Journal List */}
          <section className="lg:col-span-8 bento-card p-0 flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold text-slate-900">Food Journal</h3>
              <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                {entries.length} items logged
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-50">
              {entries.length === 0 ? (
                <div className="p-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                    <Utensils className="w-10 h-10 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold serif text-xl italic leading-none opacity-80">"Your journey starts with a single bite."</p>
                    <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Log your first meal above</p>
                  </div>
                </div>
              ) : (
                entries.map((entry) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={entry.id} 
                    className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 border border-slate-100 transition-all shadow-sm">
                        <Utensils className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-xl capitalize tracking-tight">{entry.foodName}</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.protein}g P</span>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.carbs}g C</span>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.fats}g F</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <span className="block text-3xl font-black text-slate-900 leading-none">{entry.calories}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kcal</span>
                      </div>
                      <button 
                        onClick={() => entry.id && deleteFoodEntry(entry.id)}
                        className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Macro Breakdown Visuals */}
          <section className="lg:col-span-4 space-y-8">
            <div className="bento-card space-y-8 bg-slate-900 text-white border-none min-h-[400px]">
              <div className="space-y-1">
                <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Macro Trends</span>
                <h3 className="text-2xl font-display font-bold">Daily Distribution</h3>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ borderRadius: '24px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {chartData.map(stat => (
                  <div key={stat.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: stat.color, backgroundColor: stat.color }} />
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.name}</span>
                    </div>
                    <span className="text-lg font-black text-white">{stat.value}g</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bento-card border-none bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-8">
               <div className="flex items-center gap-3 mb-6">
                 <div className="bg-white/20 p-3 rounded-xl border border-white/20">
                   <Zap className="w-6 h-6 text-emerald-300" />
                 </div>
                 <h4 className="font-bold text-xl tracking-tight uppercase text-xs opacity-60">Insight</h4>
               </div>
               <p className="text-2xl font-display font-medium tracking-tight leading-snug">
                 "You've hit 80% of your protein goal. A handful of nuts could bridge the gap."
               </p>
            </div>
          </section>
        </div>

        {/* AI Recipe Suggestions Section */}
        <section className="space-y-10 pt-12 pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                <Zap className="w-3 h-3 fill-current" /> AI Discovery
              </div>
              <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Personalized Suggestions.</h2>
              <p className="text-slate-500 font-medium max-w-xl">
                Generated based on your calorie goal of <span className="font-bold text-slate-900">{calorieGoal} Kcal</span> and macro ratios of <span className="text-blue-500 font-bold">{macroRatios.protein}% P</span>, <span className="text-emerald-500 font-bold">{macroRatios.carbs}% C</span>, <span className="text-amber-500 font-bold">{macroRatios.fats}% F</span>.
              </p>
            </div>
            <button 
              onClick={handleGenerateRecipes}
              disabled={isGeneratingRecipes}
              className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10"
            >
              {isGeneratingRecipes ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {aiRecipes.length > 0 ? "Refresh Suggestions" : "Generate Recipes"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiRecipes.length > 0 ? (
              aiRecipes.map((recipe, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between group hover:border-emerald-500/20 transition-all"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                        {recipe.difficulty}
                      </div>
                      <span className="text-xs font-bold text-slate-400">{recipe.prepTime}</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-display font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tighter">{recipe.name}</h4>
                      <p className="text-slate-500 text-sm font-medium line-clamp-3 italic leading-relaxed">"{recipe.description}"</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-50">
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Pro</p>
                        <p className="font-bold text-slate-900">{recipe.macros.protein}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Carb</p>
                        <p className="font-bold text-slate-900">{recipe.macros.carbs}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Fat</p>
                        <p className="font-bold text-slate-900">{recipe.macros.fats}g</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingredients</h5>
                      <ul className="space-y-1">
                        {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                          <li key={idx} className="text-xs font-medium text-slate-600 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" /> {ing}
                          </li>
                        ))}
                        {recipe.ingredients.length > 3 && <li className="text-[10px] text-slate-400 font-bold">+ {recipe.ingredients.length - 3} more</li>}
                      </ul>
                    </div>
                  </div>

                  <button className="w-full mt-8 py-4 rounded-2xl bg-slate-50 text-slate-900 font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    View Recipe Details <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <Zap className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-slate-900">No suggestions yet.</h4>
                  <p className="text-slate-500 font-medium">Click generate to discover AI-powered meals tailored to your goals.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );

}
