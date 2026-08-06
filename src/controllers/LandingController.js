import '../style.css';
import { initSecurity } from '../utils/security.js';
import { 
  initExpenseSimulator, 
  initProjectionsCalculator, 
  initAccordion, 
  initCoupleSplitWidget, 
  initMobileMenu 
} from '../views/LandingView.js';
import { initAuthModalView, openAuthModal } from '../views/AuthModalView.js';
import { initAuthController } from './AuthController.js';
import { 
  createIcons, 
  Wallet, 
  LogIn, 
  Menu, 
  ShieldCheck, 
  ArrowRight, 
  PlayCircle, 
  Zap, 
  TrendingUp, 
  PiggyBank, 
  Sparkles, 
  PieChart, 
  Layers, 
  BellRing, 
  Repeat, 
  Target, 
  Calculator, 
  Lightbulb, 
  Shield, 
  CheckCircle2, 
  Lock, 
  ChevronDown, 
  Mail, 
  User, 
  Eye,
  Coins,
  Users,
  Heart,
  Link,
  Sliders
} from 'lucide';

export function initLandingPage() {
  initSecurity();
  
  createIcons({
    icons: {
      Wallet, LogIn, Menu, ShieldCheck, ArrowRight, PlayCircle, Zap, TrendingUp, PiggyBank, Sparkles, PieChart, Layers, BellRing, Repeat, Target, Calculator, Lightbulb, Shield, CheckCircle2, Lock, ChevronDown, Mail, User, Eye, Coins, Users, Heart, Link, Sliders
    }
  });

  initExpenseSimulator();
  initProjectionsCalculator(openAuthModal);
  initAccordion();
  initCoupleSplitWidget();
  initMobileMenu();
  
  initAuthModalView();
  initAuthController();
}
