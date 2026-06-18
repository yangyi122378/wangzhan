import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Languages, Trash2, X, Send, Loader2, Sparkles, HelpCircle, Lock, Unlock, Key
} from 'lucide-react';

// --- TYPE SYSTEM ---
interface ProjectDetails {
  area: string;
  material: string;
  tectonics: string;
}

interface Project {
  id: string;
  title: string;
  titleEn: string;
  category: 'ARCHITECTURE' | 'INTERIOR' | 'OBJECTS';
  location: string;
  locationEn: string;
  year: string;
  image: string;
  images?: string[];
  details: ProjectDetails;
}

// --- ELEGANT ARCHITECTURAL RECORDS BY YANG YI ---
const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "超薄混凝土受弯双曲亭",
    titleEn: "Ultra-Thin Double-Curved Concrete Pavilion",
    category: "ARCHITECTURE",
    location: "伦敦",
    locationEn: "London",
    year: "2025",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800"],
    details: {
      area: "35㎡",
      material: "超高性能清水混凝土 (UHPC)",
      tectonics: "探索极薄壳体在双曲受拉状态下的自身力学自洽与重力传递规律。去除了内部的多余立柱支撑，荷载沿连续悬臂曲率传递至基础。"
    }
  },
  {
    id: "proj-2",
    title: "不锈钢多面体折板茶室",
    titleEn: "Folded Stainless-Steel Polyhedral Tea House",
    category: "ARCHITECTURE",
    location: "上海",
    locationEn: "Shanghai",
    year: "2026",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"],
    details: {
      area: "18㎡",
      material: "镜面与拉丝抛光不锈钢板",
      tectonics: "利用纤薄钢板拼合的刚性多面体自我承重。折叠界面消解了传统钢架梁柱结构，创造无支撑纯净内部空间，并在虚实交界处吸纳周围的光影变幻。"
    }
  },
  {
    id: "proj-3",
    title: "岩石负形黄铜置物架",
    titleEn: "Monolithic Brass Shelf With Rock Cutout",
    category: "OBJECTS",
    location: "米兰",
    locationEn: "Milan",
    year: "2024",
    image: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&q=80&w=800"],
    details: {
      area: "1.2m x 0.4m x 1.8m",
      material: "原色酸洗黄铜、天然玄武岩毛石",
      tectonics: "用未经打磨的原始矿石作为实体配重，抵抗精制黄铜板弯曲悬挑产生的倾覆弯矩。这是人工形态与自然力学的冲突碰撞实验。"
    }
  }
];

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

// Robust helper to sanitize a project loaded from external storage
function sanitizeProject(p: any): Project {
  const safeImg = typeof p?.image === 'string' && p.image ? p.image : 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800';
  return {
    id: typeof p?.id === 'string' && p.id ? p.id : `proj-${Math.random().toString(36).substring(2, 9)}`,
    title: typeof p?.title === 'string' && p.title ? p.title : '未命名项目',
    titleEn: typeof p?.titleEn === 'string' && p.titleEn ? p.titleEn : (p?.title || 'Untitled Project'),
    category: ['ARCHITECTURE', 'INTERIOR', 'OBJECTS'].includes(p?.category) ? p.category : 'ARCHITECTURE',
    location: typeof p?.location === 'string' ? p.location : '',
    locationEn: typeof p?.locationEn === 'string' ? p.locationEn : (p?.location || ''),
    year: typeof p?.year === 'string' ? p.year : '2026',
    image: safeImg,
    images: Array.isArray(p?.images) && p.images.length > 0 ? p.images : [safeImg],
    details: {
      area: typeof p?.details?.area === 'string' ? p.details.area : (typeof p?.area === 'string' ? p.area : ''),
      material: typeof p?.details?.material === 'string' ? p.details.material : (typeof p?.material === 'string' ? p.material : ''),
      tectonics: typeof p?.details?.tectonics === 'string' ? p.details.tectonics : (typeof p?.tectonics === 'string' ? p.tectonics : '')
    }
  };
}

export default function App() {
  const [lang, setLang] = useState<'ZH' | 'EN'>('ZH');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ARCHITECTURE' | 'INTERIOR' | 'OBJECTS' | 'ABOUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  
  // Projects state with robust deserialization and schema sanitization logic
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('unpolished_portfolio_projects_v20');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(sanitizeProject);
        }
      }
    } catch (e) {
      console.error("e-Studio: Failed parsing stored records from localStorage, resetting to defaults:", e);
    }
    return INITIAL_PROJECTS;
  });

  // Modal Interactive States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // New Project Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creationTitle, setCreationTitle] = useState('');
  const [creationTitleEn, setCreationTitleEn] = useState('');
  const [creationCategory, setCreationCategory] = useState<'ARCHITECTURE' | 'INTERIOR' | 'OBJECTS'>('ARCHITECTURE');
  const [creationLocation, setCreationLocation] = useState('');
  const [creationLocationEn, setCreationLocationEn] = useState('');
  const [creationYear, setCreationYear] = useState('2026');
  const [creationArea, setCreationArea] = useState('');
  const [creationMaterial, setCreationMaterial] = useState('');
  const [creationTectonics, setCreationTectonics] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>('');

  // Project detail editing states
  const [isEditingProj, setIsEditingProj] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLocationEn, setEditLocationEn] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editMaterial, setEditMaterial] = useState('');
  const [editTectonics, setEditTectonics] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Admin Verification States
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('unpolished_is_admin') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('unpolished_admin_password') || 'camberwell';
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showPinChangeModal, setShowPinChangeModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  // About Page Editing States
  const [aboutNameZh, setAboutNameZh] = useState<string>(() => {
    return localStorage.getItem('unpolished_about_name_zh') || '杨艺 (Yang Yi)';
  });
  const [aboutNameEn, setAboutNameEn] = useState<string>(() => {
    return localStorage.getItem('unpolished_about_name_en') || 'Yang Yi, Spatial Architect';
  });
  const [aboutBioZh, setAboutBioZh] = useState<string>(() => {
    return localStorage.getItem('unpolished_about_bio_zh') || '杨艺，本科毕业于伦敦艺术大学坎伯韦尔艺术学院。';
  });
  const [aboutBioEn, setAboutBioEn] = useState<string>(() => {
    return localStorage.getItem('unpolished_about_bio_en') || 'Yang Yi graduated from Camberwell College of Arts, University of the Arts London.';
  });
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [tempAboutNameZh, setTempAboutNameZh] = useState('');
  const [tempAboutNameEn, setTempAboutNameEn] = useState('');
  const [tempAboutBioZh, setTempAboutBioZh] = useState('');
  const [tempAboutBioEn, setTempAboutBioEn] = useState('');

  const executeAdminAction = (action: () => void) => {
    if (isAdmin) {
      action();
    } else {
      setPendingAction(() => action);
      setShowAuthModal(true);
      setAuthError(false);
      setAuthInput('');
    }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('unpolished_portfolio_projects_v20', JSON.stringify(projects));
  }, [projects]);

  // Reset password to default 'camberwell' if it was previously customized
  useEffect(() => {
    const saved = localStorage.getItem('unpolished_admin_password');
    if (saved && saved.toLowerCase() !== 'camberwell') {
      localStorage.setItem('unpolished_admin_password', 'camberwell');
      setAdminPassword('camberwell');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('unpolished_about_name_zh', aboutNameZh);
    localStorage.setItem('unpolished_about_name_en', aboutNameEn);
    localStorage.setItem('unpolished_about_bio_zh', aboutBioZh);
    localStorage.setItem('unpolished_about_bio_en', aboutBioEn);
  }, [aboutNameZh, aboutNameEn, aboutBioZh, aboutBioEn]);

  // Filters compilation
  const getCompiledList = () => {
    let list = projects;
    if (activeCategory !== 'ALL' && activeCategory !== 'ABOUT') {
      list = projects.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => {
        const title = (p.title || '').toLowerCase();
        const titleEn = (p.titleEn || '').toLowerCase();
        const loc = (p.location || '').toLowerCase();
        const locEn = (p.locationEn || '').toLowerCase();
        const mat = (p.details?.material || '').toLowerCase();
        const tec = (p.details?.tectonics || '').toLowerCase();
        return title.includes(q) || 
               titleEn.includes(q) ||
               loc.includes(q) ||
               locEn.includes(q) ||
               mat.includes(q) ||
               tec.includes(q);
      });
    }
    return list;
  };

  const openProjectOverview = (project: Project) => {
    setSelectedProject(project);
    setActivePhotoIndex(0);
    setIsEditingProj(false);
    
    const welcome = lang === 'ZH' 
      ? `我是杨艺。关于《${project.title}》，我们可以探讨其在参数化形态力学或材料学层面的构想。`
      : `I am Yang Yi. Let's discuss "${project.titleEn}" regarding its parametric forms and material calculations.`;
    
    setChatMessages([
      { sender: 'assistant', text: welcome }
    ]);
  };

  const handleQueryGemini = async (directQuestions?: string) => {
    const finalQuery = directQuestions || userInput;
    if (!finalQuery.trim() || !selectedProject) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: finalQuery }]);
    if (!directQuestions) setUserInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalQuery,
          projectTitle: selectedProject?.title || '',
          projectDetails: {
            location: selectedProject?.location || '',
            year: selectedProject?.year || '',
            category: selectedProject?.category || 'ARCHITECTURE',
            area: selectedProject?.details?.area || '',
            material: selectedProject?.details?.material || '',
            tectonics: selectedProject?.details?.tectonics || ''
          }
        })
      });

      const bodyData = await response.json();

      if (!response.ok) {
        if (bodyData.error === 'API_KEY_MISSING') {
          runLocalIntelligentTectonicFormula(finalQuery);
          return;
        }
        throw new Error(bodyData.message || 'Connection failure.');
      }

      setChatMessages(prev => [...prev, { sender: 'assistant', text: bodyData.text || 'Dialogue calculated successfully.' }]);
    } catch (e) {
      console.warn('Backend offline, running direct analytical rule engine:', e);
      runLocalIntelligentTectonicFormula(finalQuery);
    } finally {
      setIsChatLoading(false);
    }
  };

  const runLocalIntelligentTectonicFormula = (query: string) => {
    if (!selectedProject) return;
    const lower = query.toLowerCase();
    const p = selectedProject;
    let answerText = '';

    if (lower.includes('material') || lower.includes('材料') || lower.includes('材质')) {
      answerText = lang === 'ZH'
        ? `本案致力于材料的诚实运作。选用 “${p.details.material}”，其纯朴肌理能直接呈现岁月和环境的风雨刻痕。`
        : `This design operates on material honesty. We used "${p.details.material}" to reflect raw environmental elements directly.`;
    } else if (lower.includes('structure') || lower.includes('构造') || lower.includes('力') || lower.includes('受力')) {
      answerText = lang === 'ZH'
        ? `结构受力依循连续形态找形。去掉了多余支撑点，荷载曲线在清水体上完美流逝。`
        : `Force flows through catenary optimization. Eliminating redundant frames, the force resolves cleanly into the base support.`;
    } else {
      answerText = lang === 'ZH'
        ? `该作实践了结构本真（Tectonic Honesty）。在实体与阴影对立中，寻找简洁的空间秩序。`
        : `This design represents our research into pure spatial order without cosmetic envelopes. True load-bearing aesthetic.`;
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: answerText }]);
      setIsChatLoading(false);
    }, 350);
  };

  const handleCreateNewWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationTitle.trim()) {
      alert(lang === 'ZH' ? '请输入标题' : 'Empty Title.');
      return;
    }

    const customWork: Project = {
      id: `user-proj-${Date.now()}`,
      title: creationTitle,
      titleEn: creationTitleEn || creationTitle,
      category: creationCategory,
      location: creationLocation || (lang === 'ZH' ? '中国' : 'Shanghai'),
      locationEn: creationLocationEn || 'Shanghai',
      year: creationYear,
      image: selectedPresetImage,
      details: {
        area: creationArea || '90㎡',
        material: creationMaterial || (lang === 'ZH' ? '清水混凝土' : 'Raw Concrete'),
        tectonics: creationTectonics || (lang === 'ZH' ? '形态参数自洽测试。' : 'Experimental self-supporting study.')
      }
    };

    const sanitizedWork = sanitizeProject(customWork);
    setProjects(prev => [sanitizedWork, ...prev]);
    setIsCreateOpen(false);
    setSelectedPresetImage('');
    
    setCreationTitle('');
    setCreationTitleEn('');
    setCreationCategory('ARCHITECTURE');
    setCreationLocation('');
    setCreationLocationEn('');
    setCreationArea('');
    setCreationMaterial('');
    setCreationTectonics('');
  };

  const archiveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    executeAdminAction(() => {
      if (confirm(lang === 'ZH' ? '确认移除该研究项目？' : 'Archive this study?')) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (selectedProject?.id === id) setSelectedProject(null);
      }
    });
  };

  const handleSaveEdit = () => {
    if (!selectedProject) return;
    executeAdminAction(() => {
      const updated = {
        ...selectedProject,
        title: editTitle,
        titleEn: editTitleEn,
        year: editYear,
        location: editLocation,
        locationEn: editLocationEn,
        details: {
          area: editArea,
          material: editMaterial,
          tectonics: editTectonics
        }
      };
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
      setSelectedProject(updated);
      setIsEditingProj(false);
    });
  };

  const handleUploadProjectImage = (projectId: string, file: File, index?: number) => {
    executeAdminAction(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            if (typeof index === 'number' && p.images && p.images.length > 0) {
              const updatedImages = [...p.images];
              updatedImages[index] = dataUrl;
              return { ...p, image: index === 0 ? dataUrl : p.image, images: updatedImages };
            } else {
              const updatedImages = p.images && p.images.length > 0 ? [...p.images] : [dataUrl];
              updatedImages[0] = dataUrl;
              return {
                ...p,
                image: dataUrl,
                images: updatedImages
              };
            }
          }
          return p;
        }));

        // Update active selected modal project too
        setSelectedProject(prev => {
          if (!prev || prev.id !== projectId) return prev;
          if (typeof index === 'number' && prev.images && prev.images.length > 0) {
            const updatedImages = [...prev.images];
            updatedImages[index] = dataUrl;
            return { ...prev, image: index === 0 ? dataUrl : prev.image, images: updatedImages };
          } else {
            const updatedImages = prev.images && prev.images.length > 0 ? [...prev.images] : [dataUrl];
            updatedImages[0] = dataUrl;
            return {
              ...prev,
              image: dataUrl,
              images: updatedImages
            };
          }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const PRESETS = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&q=80&w=800'
  ];

  const QUICK_TOPICS = lang === 'ZH' ? [
    '它的受力与连续构造如何？',
    '材料的工艺和环境痕迹？'
  ] : [
    'Explain the tectonic forces?',
    'The choice of raw materiality?'
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#111112] font-sans antialiased flex flex-col selection:bg-[#111112] selection:text-white pb-20">
      
      {/* HEADER: STRICTLY MINIMAL, NO REDUNDANT BORDERS */}
      <header className="px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in">
        
        {/* LOGO TITLE */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 
              onClick={() => { setActiveCategory('ALL'); setSelectedProject(null); }}
              className="text-lg md:text-xl font-extrabold tracking-[0.2em] uppercase cursor-pointer text-[#111112] hover:opacity-85 transition-opacity"
            >
              ”不成器“ 研究所 <span className="font-light text-sm tracking-normal font-serif lowercase italic ml-1">unpolished studio</span>
            </h1>
          </div>
          <p className="text-[10px] text-[#8c887a] tracking-[0.15em] uppercase">
            {lang === 'ZH' ? '杨艺的作品与构造实践' : 'ARCHIVE OF YANG YI'}
          </p>
        </div>

        {/* NAVIGATION: TEXT-ONLY, GENEROUS TRACKING */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium tracking-[0.15em] uppercase font-mono">
          {[
            { id: 'ALL', label: 'ALL', labelZh: '全部' },
            { id: 'ARCHITECTURE', label: 'ARCHITECTURE', labelZh: '建筑' },
            { id: 'INTERIOR', label: 'INTERIOR', labelZh: '室内' },
            { id: 'OBJECTS', label: 'OBJECTS', labelZh: '器具' },
            { id: 'ABOUT', label: 'ABOUT', labelZh: '关于 • 杨艺' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => { setActiveCategory(opt.id as any); setSelectedProject(null); }}
              className={`transition-all duration-300 py-1 ${
                activeCategory === opt.id 
                  ? 'text-[#111112] font-semibold tracking-[0.2em]' 
                  : 'text-[#8c887a] hover:text-[#111112]'
              }`}
            >
              {lang === 'ZH' ? opt.labelZh : opt.label}
            </button>
          ))}
        </nav>

        {/* INTERACTION: LANG, LOCK & ADD */}
        <div className="flex items-center gap-3 text-[10px] tracking-widest font-semibold uppercase">
          
          <button
            onClick={() => {
              if (isAdmin) {
                setNewPinInput('');
                setConfirmPinInput('');
                setPinChangeError('');
                setShowPinChangeModal(true);
              } else {
                executeAdminAction(() => {});
              }
            }}
            className={`flex items-center gap-1 px-2 py-0.5 border transition-all ${
              isAdmin 
                ? 'text-emerald-700 bg-slate-100 border-emerald-300' 
                : 'text-[#8c887a] bg-[#faf9f6] border-black/5 hover:border-black/20'
            }`}
            title={isAdmin ? (lang === 'ZH' ? "管理员模式已解锁（点击修改密码）" : "Admin unlocked (Click to change password)") : (lang === 'ZH' ? "点击验证管理员口令" : "Click to authenticate")}
          >
            {isAdmin ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
            <span>{isAdmin ? (lang === 'ZH' ? '管理员' : 'ADMIN') : (lang === 'ZH' ? '访客' : 'GUEST')}</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                sessionStorage.removeItem('unpolished_is_admin');
                setIsAdmin(false);
              }}
              className="text-[#8c887a] hover:text-black transition-colors"
              title={lang === 'ZH' ? "登出管理员" : "Logout"}
            >
              [ {lang === 'ZH' ? '登出' : 'CLOSE'} ]
            </button>
          )}

          <span>/</span>

          <button 
            onClick={() => setLang(lang === 'ZH' ? 'EN' : 'ZH')}
            className="hover:opacity-70 transition-opacity flex items-center gap-1"
          >
            {lang === 'ZH' ? 'ENGLISH' : '中文'}
          </button>
          <span>/</span>
          <button
            onClick={() => executeAdminAction(() => setIsCreateOpen(true))}
            className="hover:opacity-70 transition-opacity flex items-center gap-1 text-[#111112] font-bold"
          >
            {lang === 'ZH' ? '新增研究' : 'ADD STUDY'}
          </button>
        </div>

      </header>

      {/* COMPACT FILTER SYSTEM: NO BORDERS, NO MESSY BOXES */}
      {activeCategory !== 'ABOUT' && (
        <div className="px-8 mb-6 flex justify-end items-center animate-fade-in text-xs">
          <div className="text-[10px] text-[#8c887a] tracking-[0.15em] uppercase font-mono">
            {lang === 'ZH' ? `存入研究：${getCompiledList().length} 组` : `INDEX COUNT: ${getCompiledList().length}`}
          </div>
        </div>
      )}

      {/* CORE VIEWPORT CANVAS */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-8">
        
        {/* VIEWPORT: BIOGRAPHY PROFILE */}
        {activeCategory === 'ABOUT' ? (
          <div className="max-w-3xl mx-auto flex flex-col gap-12 mt-6 animate-fade-in">
            
            {/* Typography Section */}
            <div className="flex flex-col gap-6 font-mono text-[11px] leading-relaxed text-[#706a5e]">
              <div className="flex justify-between items-baseline border-b border-black/10 pb-3">
                <span className="text-[#111112] font-semibold text-xs tracking-wider">
                  {lang === 'ZH' ? aboutNameZh : aboutNameEn}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (!isEditingAbout) {
                        setTempAboutNameZh(aboutNameZh);
                        setTempAboutNameEn(aboutNameEn);
                        setTempAboutBioZh(aboutBioZh);
                        setTempAboutBioEn(aboutBioEn);
                        setIsEditingAbout(true);
                      } else {
                        setIsEditingAbout(false);
                      }
                    }}
                    className="border border-[#111112]/20 hover:border-[#111112] hover:bg-[#111112]/5 px-2.5 py-1 text-[9px] uppercase tracking-wider font-extrabold select-none whitespace-nowrap transition-colors"
                  >
                    {isEditingAbout ? (lang === 'ZH' ? '退出编辑' : 'EXIT EDIT') : (lang === 'ZH' ? '修改个人简介' : 'EDIT BIO')}
                  </button>
                )}
              </div>

              {isEditingAbout ? (
                <div className="space-y-4 pt-2 font-mono text-[#111112]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">中文姓名 / 称呼 (Name CN)</label>
                      <input
                        type="text"
                        value={tempAboutNameZh}
                        onChange={(e) => setTempAboutNameZh(e.target.value)}
                        className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">英文姓名 / 称呼 (Name EN)</label>
                      <input
                        type="text"
                        value={tempAboutNameEn}
                        onChange={(e) => setTempAboutNameEn(e.target.value)}
                        className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">中文自述简介 (Bio CN)</label>
                    <textarea
                      value={tempAboutBioZh}
                      onChange={(e) => setTempAboutBioZh(e.target.value)}
                      rows={6}
                      className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-black outline-none font-mono resize-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">英文自述简介 (Bio EN)</label>
                    <textarea
                      value={tempAboutBioEn}
                      onChange={(e) => setTempAboutBioEn(e.target.value)}
                      rows={6}
                      className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-black outline-none font-mono resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingAbout(false)}
                      className="w-1/3 border border-black/15 py-2 text-[10px] hover:bg-black/5 uppercase tracking-widest font-bold"
                    >
                      {lang === 'ZH' ? '取消' : 'CANCEL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAboutNameZh(tempAboutNameZh);
                        setAboutNameEn(tempAboutNameEn);
                        setAboutBioZh(tempAboutBioZh);
                        setAboutBioEn(tempAboutBioEn);
                        setIsEditingAbout(false);
                      }}
                      className="flex-1 bg-black text-white hover:bg-black/90 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors"
                    >
                      {lang === 'ZH' ? '确认并保存关于说明' : 'SAVE ABOUT CHANGES'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-line leading-relaxed text-[11px] space-y-4">
                  {lang === 'ZH' ? (
                    <p className="whitespace-pre-line">{aboutBioZh}</p>
                  ) : (
                    <p className="whitespace-pre-line">{aboutBioEn}</p>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          
          /* THE CLEAN SCROLLING PORTFOLIO FLOW */
          <div className="flex flex-col gap-12">
            
            {projects.length === 0 ? (
              <div className="py-24 text-center font-mono text-xs text-[#8c887a] max-w-md mx-auto flex flex-col items-center gap-4 animate-fade-in">
                <span className="text-3xl font-light">⎔</span>
                <p className="tracking-widest leading-relaxed">
                  {lang === 'ZH' 
                    ? '“不成器”研究所目前暂无研究案卷。' 
                    : 'The "Unpolished Studio" currently has no research records.'}
                </p>
                <button 
                  onClick={() => executeAdminAction(() => setIsCreateOpen(true))}
                  className="mt-2 border border-black/10 hover:border-black text-black px-4 py-2 hover:bg-black/5 transition-all text-[10px] tracking-widest font-bold uppercase"
                >
                  {lang === 'ZH' ? '点击此处 新增研究' : 'CREATE FIRST STUDY'}
                </button>
              </div>
            ) : getCompiledList().length === 0 ? (
              <div className="py-24 text-center font-mono text-xs text-[#8c887a]">
                <p className="tracking-widest capitalize">{lang === 'ZH' ? '未找到匹配的研究项目。' : 'No matches located.'}</p>
                <button onClick={() => setSearchQuery('')} className="text-[#111112] underline mt-2 font-bold select-none uppercase">
                  {lang === 'ZH' ? '清除筛选' : 'RESET SEARCH'}
                </button>
              </div>
            ) : (
              
              /* SINGLE COLUMN OF ARCHITECTURAL WORK - LARGE, CENTERED, UNFILTERED CLUTTER */
              <div className="flex flex-col gap-20 md:gap-28 animate-fade-in items-center">
                {getCompiledList().map((proj) => {
                  if (!proj || !proj.id) return null;
                  const isUserProj = typeof proj.id === 'string' && proj.id.startsWith('user-proj-');
                  const canArchive = isUserProj || isAdmin;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => openProjectOverview(proj)}
                      className="group cursor-pointer flex flex-col gap-4 relative w-full max-w-2xl md:max-w-3xl"
                    >
                      
                      {/* Delete capability for administrators only to maintain pristine client experience for guests */}
                      {isAdmin && (
                        <button
                          onClick={(e) => archiveItem(proj.id, e)}
                          className="absolute top-4 right-4 bg-white/95 text-red-600 border border-red-500/10 hover:bg-red-500 hover:text-white px-2 py-1 transition-all z-20 font-mono text-[10px] tracking-widest font-semibold uppercase"
                          title={lang === 'ZH' ? "删除文章" : "Delete Article"}
                        >
                          {lang === 'ZH' ? '删除' : 'DELETE'}
                        </button>
                      )}

                      {/* Image visual without unnecessary borders or decorative boxes */}
                      <div className="aspect-[3/2] w-full overflow-hidden bg-[#f3f0e8] relative transition-transform duration-700 ease-out group-hover:scale-[1.01] flex items-center justify-center border border-black/5">
                        {proj.image ? (
                          <img 
                            src={proj.image} 
                            alt={proj.title || ''}
                            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-8 gap-3 text-[#8c887a]">
                            <span className="text-2xl font-light">＋</span>
                            <span className="text-[10px] uppercase tracking-widest font-mono font-bold">
                              {lang === 'ZH' ? '暂无效果图' : 'NO SCHEME RENDERING'}
                            </span>
                          </div>
                        )}

                        {/* Upload/Replace Button Overlay - admins only */}
                        {isAdmin && (
                          <label 
                            onClick={(e) => e.stopPropagation()} 
                            className="absolute right-3 bottom-3 bg-white/90 text-black hover:bg-black hover:text-white px-2 py-1 text-[9px] uppercase tracking-wider font-bold shadow-sm transition-all cursor-pointer select-none"
                          >
                            {proj.image ? (lang === 'ZH' ? '更换图片' : 'CHANGE IMAGE') : (lang === 'ZH' ? '选择图片' : 'SELECT IMAGE')}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadProjectImage(proj.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* CAPTION: TITLE + YEAR ONLY */}
                      <div className="flex justify-between items-baseline font-mono text-[11px] md:text-xs text-[#111112] px-1">
                        <h4 className="font-bold tracking-widest uppercase group-hover:opacity-75 transition-opacity">
                          {lang === 'ZH' ? (proj.title || '') : (proj.titleEn || '')}
                        </h4>
                        <span className="text-[#8c887a] font-normal tracking-widest pl-4">
                          {proj.year || ''}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>

            )}

          </div>
        )}

      </main>

      {/* MODAL: ADD / NEW RESEARCH (Minimalist & Simple fields) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#111112]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-8 flex flex-col gap-6 shadow-xl animate-fade-in font-mono text-xs">
            
            <div className="flex justify-between items-baseline">
              <h3 className="font-extrabold tracking-[0.15em] text-black uppercase">
                {lang === 'ZH' ? '录入新研究项目' : 'NEW SCHOLARLY STUDY'}
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-black/50 hover:text-black">
                [ × ]
              </button>
            </div>

            <form onSubmit={handleCreateNewWork} className="space-y-4">
              
              <div className="space-y-1">
                <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Title (中文)</label>
                <input 
                  type="text" required placeholder="例如：超薄混凝土受弯双曲亭"
                  value={creationTitle} onChange={(e) => setCreationTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Title (English)</label>
                <input 
                  type="text" placeholder="e.g. Sinusoidal Gravity Arch"
                  value={creationTitleEn} onChange={(e) => setCreationTitleEn(e.target.value)}
                  className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Category</label>
                  <select 
                    value={creationCategory} onChange={(e) => setCreationCategory(e.target.value as any)}
                    className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px]"
                  >
                    <option value="ARCHITECTURE">建筑 (ARCHITECTURE)</option>
                    <option value="INTERIOR">室内 (INTERIOR)</option>
                    <option value="OBJECTS">器具 (OBJECTS)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Year (时间)</label>
                  <input 
                    type="text" required value={creationYear}
                    onChange={(e) => setCreationYear(e.target.value)}
                    className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Material (工艺材料)</label>
                  <input 
                    type="text" placeholder="例如：清水粗玄武岩"
                    value={creationMaterial} onChange={(e) => setCreationMaterial(e.target.value)}
                    className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Scale (尺度)</label>
                  <input 
                    type="text" placeholder="例如：120㎡"
                    value={creationArea} onChange={(e) => setCreationArea(e.target.value)}
                    className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Thesis Detail (学术构造主旨)</label>
                <textarea 
                  rows={2} placeholder="写下一句话描述构造力学思想..."
                  value={creationTectonics} onChange={(e) => setCreationTectonics(e.target.value)}
                  className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Select Material Imagery</label>
                  <label className="text-[9px] text-black hover:underline cursor-pointer font-bold">
                    {lang === 'ZH' ? '[ 上传自定义图片 ]' : '[ UPLOAD PERSONAL ]'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setSelectedPresetImage(ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {selectedPresetImage?.startsWith('data:image/') && (
                  <div className="aspect-[3/1] overflow-hidden bg-gray-100 border border-black/10 relative">
                    <img src={selectedPresetImage} className="w-full h-full object-cover grayscale" />
                    <span className="absolute bottom-1 right-2 bg-black text-white text-[7px] tracking-widest px-1 py-0.5 uppercase">
                      {lang === 'ZH' ? '自定义图片已就绪' : 'CUSTOM UPLOAD ACTIVE'}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-5 gap-1">
                  {PRESETS.map((url, i) => (
                    <button
                      key={i} type="button" onClick={() => setSelectedPresetImage(url)}
                      className={`aspect-square overflow-hidden bg-gray-100 ${
                        selectedPresetImage === url ? 'ring-1 ring-black' : 'opacity-60'
                      }`}
                    >
                      <img src={url} className="w-full h-full object-cover grayscale" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 text-[10px] tracking-widest font-bold uppercase">
                <button
                  type="button" onClick={() => setIsCreateOpen(false)}
                  className="w-1/3 border border-black/20 py-2 hover:bg-black/5"
                >
                  {lang === 'ZH' ? '取消' : 'CANCEL'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white py-2 hover:bg-black/90"
                >
                  {lang === 'ZH' ? '存入案卷' : 'RECORD'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
        {/* DETAIL OVERVIEW PANEL - EXTREMELY MINIMAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-[#111112]/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#faf9f6] border border-black/10 max-h-[90vh] flex flex-col overflow-hidden animate-fade-in font-mono text-xs">
            
            {/* Blueprint specification section */}
            <div className="w-full p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              
              <div className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] text-[#8c887a] block tracking-wide">[ e-{String(selectedProject.id || '').substring(0,4)} ]</span>
                    {isEditingProj ? (
                      <span className="text-[10px] text-emerald-700 block font-bold tracking-widest uppercase mt-1">
                        {lang === 'ZH' ? '正在编辑文章文本信息...' : 'EDITING FIELD SPECIFICATIONS...'}
                      </span>
                    ) : (
                      <h3 className="text-sm font-bold text-black tracking-widest uppercase mt-0.5">
                        {lang === 'ZH' ? (selectedProject.title || '') : (selectedProject.titleEn || '')}
                      </h3>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (!isEditingProj) {
                          setEditTitle(selectedProject.title || '');
                          setEditTitleEn(selectedProject.titleEn || '');
                          setEditYear(selectedProject.year || '');
                          setEditLocation(selectedProject.location || '');
                          setEditLocationEn(selectedProject.locationEn || '');
                          setEditArea(selectedProject.details?.area || '');
                          setEditMaterial(selectedProject.details?.material || '');
                          setEditTectonics(selectedProject.details?.tectonics || '');
                          setIsEditingProj(true);
                        } else {
                          setIsEditingProj(false);
                        }
                      }}
                      className="border border-[#111112]/20 hover:border-[#111112] hover:bg-[#111112]/5 px-2.5 py-1 text-[9px] uppercase tracking-wider font-extrabold select-none whitespace-nowrap"
                    >
                      {isEditingProj ? (lang === 'ZH' ? '取消编辑' : 'CANCEL') : (lang === 'ZH' ? '修改文字' : 'EDIT TEXT')}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="aspect-[3/2] overflow-hidden bg-[#f3f0e8] relative group/img flex items-center justify-center border border-black/5">
                    {((selectedProject.images && selectedProject.images.length > 0) || selectedProject.image) ? (
                      <img 
                        src={selectedProject.images && selectedProject.images.length > 0 ? selectedProject.images[activePhotoIndex] : selectedProject.image} 
                        className="w-full h-full object-cover grayscale transition-all duration-300 hover:grayscale-0" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 gap-2 text-[#8c887a]">
                        <span className="text-xl font-light">＋</span>
                        <span className="text-[9px] uppercase tracking-widest font-mono font-bold">
                          {lang === 'ZH' ? '暂无平面/效果图，请在下方添加' : 'NO IMAGES YET. UPLOAD BELOW.'}
                        </span>
                      </div>
                    )}
                    
                    {selectedProject.images && selectedProject.images.length > 1 && (
                      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 z-10">
                        {selectedProject.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              activePhotoIndex === idx ? 'bg-black w-3' : 'bg-black/30 hover:bg-black/65'
                            }`}
                            title={`Slide ${idx + 1}`}
                          />
                        ))}
                       </div>
                    )}
                  </div>

                  {selectedProject.images && selectedProject.images.length > 1 && (
                    <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-[#8c887a] px-0.5 font-mono">
                      <span>{lang === 'ZH' ? '切换细节效果图' : 'SWITCH RENDERING DETAIL'}</span>
                      <span>{activePhotoIndex + 1} / {selectedProject.images.length}</span>
                    </div>
                  )}

                  {/* Multi-Photo Upload & Delete Controls in Detail Modal - admins only */}
                  {isAdmin && (
                    <div className="space-y-1.5 font-mono">
                      <div className="flex gap-2">
                        <label className="border border-black/10 hover:border-black px-2 py-1.5 text-[9px] uppercase tracking-wider cursor-pointer flex-1 text-center bg-white font-bold select-none text-black">
                          {lang === 'ZH' ? '+ 多选/上传自定义效果图' : '+ ADD PHOTOS (MULTI)'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="hidden" 
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                setUploadError('');
                                const filesArray = Array.from(files) as File[];
                                const MAX_SIZE = 1000 * 1024; // 1MB size threshold limit check
                                
                                // filter out oversize warning
                                const overSizedFiles = filesArray.filter(f => f.size > MAX_SIZE);
                                const eligibleFiles = filesArray.filter(f => f.size <= MAX_SIZE);
                                
                                if (overSizedFiles.length > 0) {
                                  const names = overSizedFiles.map(f => f.name).join(', ');
                                  setUploadError(lang === 'ZH' 
                                    ? `已忽略文件 (${names})。单张请勿超过 1MB，否则浏览器容易崩溃！`
                                    : `Skipped ${names} as it exceeds 1MB limit.`
                                  );
                                }
                                
                                if (eligibleFiles.length === 0) return;
                                
                                executeAdminAction(() => {
                                  const promises = eligibleFiles.map(file => {
                                    return new Promise<string>((resolve) => {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        resolve(ev.target?.result as string || '');
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                  });
                                  
                                  Promise.all(promises).then(dataUrls => {
                                    const validUrls = dataUrls.filter(url => !!url);
                                    if (validUrls.length === 0) return;
                                    
                                    setProjects(prev => prev.map(p => {
                                      if (p.id === selectedProject?.id) {
                                        const currentImages = p.images ? [...p.images] : (p.image ? [p.image] : []);
                                        const updated = [...currentImages, ...validUrls];
                                        return { ...p, image: p.image || validUrls[0], images: updated };
                                      }
                                      return p;
                                    }));
                                    
                                    setSelectedProject(prev => {
                                      if (!prev) return null;
                                      const currentImages = prev.images ? [...prev.images] : (prev.image ? [prev.image] : []);
                                      const updated = [...currentImages, ...validUrls];
                                      return { ...prev, image: prev.image || validUrls[0], images: updated };
                                    });
                                  });
                                });
                              }
                            }}
                          />
                        </label>
                        {((selectedProject.images && selectedProject.images.length > 0) || selectedProject.image) && (
                          <button
                            onClick={() => {
                              executeAdminAction(() => {
                                const updated = selectedProject.images ? selectedProject.images.filter((_, i) => i !== activePhotoIndex) : [];
                                setProjects(prev => prev.map(p => {
                                  if (p.id === selectedProject?.id) {
                                    return { ...p, image: updated[0] || '', images: updated };
                                  }
                                  return p;
                                }));
                                setSelectedProject(prev => {
                                  if (!prev) return null;
                                  return { ...prev, image: updated[0] || '', images: updated };
                                });
                                setActivePhotoIndex(0);
                              });
                            }}
                            className="border border-red-100 hover:border-red-500 text-red-500/80 hover:text-red-600 px-2 py-1.5 text-[9px] uppercase tracking-wider flex-1 text-center bg-white font-bold"
                          >
                            {lang === 'ZH' ? '删除当前页' : 'DELETE SLIDE'}
                          </button>
                        )}
                      </div>

                      <p className="text-[8px] text-[#8c887a] leading-relaxed font-mono">
                        {lang === 'ZH' 
                          ? '* 提示：已开启多选上传。建议单张限 1MB 以为佳（推荐 200KB-500KB 压缩格式），总数不限但受浏览器 5MB 限制限制。' 
                          : '* Tip: Multi-file selection is active. Max 1MB per image (200-500KB compressed is recommended) due to browser 5MB localStorage capacity.'}
                      </p>

                      {uploadError && (
                        <p className="text-[8px] text-red-600 font-bold bg-red-50 p-2 border border-red-200 leading-normal animate-fade-in font-mono mt-1">
                          {uploadError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                  {/* Plain list text fields or Interactive editor inputs */}
                  {isEditingProj ? (
                    <div className="space-y-4 pt-4 border-t border-black/10 font-mono text-[#111112]">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">中文标题 (Title CN)</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-black outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">英文标题 (Title EN)</label>
                          <input
                            type="text"
                            value={editTitleEn}
                            onChange={(e) => setEditTitleEn(e.target.value)}
                            className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-black outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">年份 (Year)</label>
                          <input
                            type="text"
                            value={editYear}
                            onChange={(e) => setEditYear(e.target.value)}
                            className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-black outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">中文地点 (Location CN)</label>
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-black outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">英文地点 (Location EN)</label>
                          <input
                            type="text"
                            value={editLocationEn}
                            onChange={(e) => setEditLocationEn(e.target.value)}
                            className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-black outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">材质机制 (Materiality)</label>
                        <input
                          type="text"
                          value={editMaterial}
                          onChange={(e) => setEditMaterial(e.target.value)}
                          className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-black outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">形态意图解释 (Tectonic Thesis)</label>
                        <textarea
                          value={editTectonics}
                          onChange={(e) => setEditTectonics(e.target.value)}
                          rows={4}
                          className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-black outline-none font-mono resize-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">体量大小 (Area)</label>
                          <input
                            type="text"
                            value={editArea}
                            onChange={(e) => setEditArea(e.target.value)}
                            className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-[#111112] focus:border-black outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditingProj(false)}
                          className="w-1/3 border border-black/15 py-2 text-[10px] hover:bg-black/5 uppercase tracking-widest font-bold"
                        >
                          {lang === 'ZH' ? '取消' : 'CANCEL'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="flex-1 bg-black text-white hover:bg-black/90 py-2 text-[10px] uppercase tracking-widest font-bold"
                        >
                          {lang === 'ZH' ? '确认并保存修改' : 'SAVE CHANGES'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-[#706a5e] leading-relaxed font-mono">
                      <div>
                        <span className="text-[9px] text-[#8c887a] block uppercase tracking-wider font-mono">Materiality (材质机制)</span>
                        <p className="text-[#111112] font-semibold">{selectedProject?.details?.material || ''}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8c887a] block uppercase tracking-wider font-mono">Tectonic Thesis (形态说明)</span>
                        <p className="text-[#111112] leading-relaxed text-[11px] mt-0.5">{selectedProject?.details?.tectonics || ''}</p>
                      </div>
                      <div className="text-[10px] text-[#8c887a] font-mono">
                        <span>{selectedProject?.details?.area || ''} — {lang === 'ZH' ? (selectedProject?.location || '') : (selectedProject?.locationEn || '')}</span>
                      </div>
                    </div>
                  )}
                </div>

              <button 
                onClick={() => setSelectedProject(null)}
                className="mt-6 border border-black/15 py-1.5 text-center text-black/60 hover:text-black hover:border-black text-[10px] uppercase tracking-widest"
              >
                {lang === 'ZH' ? '关闭' : 'CLOSE'}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADMIN AUTHENTICATION */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-[#111112]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white p-8 flex flex-col gap-6 shadow-xl animate-fade-in font-mono text-xs border border-black/10">
            <div className="flex justify-between items-baseline">
              <h3 className="font-extrabold tracking-[0.15em] text-black uppercase">
                {lang === 'ZH' ? '研究所管理员验证' : 'ADMIN AUTHENTICATION'}
              </h3>
              <button 
                onClick={() => { setShowAuthModal(false); setPendingAction(null); }} 
                className="text-black/50 hover:text-black font-bold"
              >
                [ × ]
              </button>
            </div>

            <p className="text-[#8c887a] text-[10px] leading-relaxed">
              {lang === 'ZH' 
                ? '仅管理员（杨艺本人）可执行新增、修改或删除研究案卷。请输入对应的学术管理密码进行解锁。' 
                : 'Only the administrator (Yang Yi) can add, modify, or archive research studies. Please enter the master password.'}
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">
                  {lang === 'ZH' ? '访问密码 (默认: camberwell)' : 'PASSWORD (Default: camberwell)'}
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={authInput} 
                  onChange={(e) => { setAuthInput(e.target.value); setAuthError(false); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const inputClean = authInput.trim().toLowerCase();
                      const targetClean = adminPassword.trim().toLowerCase();
                      if (inputClean === targetClean || inputClean === 'camberwell') {
                        sessionStorage.setItem('unpolished_is_admin', 'true');
                        setIsAdmin(true);
                        setShowAuthModal(false);
                        if (pendingAction) {
                          pendingAction();
                          setPendingAction(null);
                        }
                      } else {
                        setAuthError(true);
                      }
                    }
                  }}
                  className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[12px] tracking-widest text-[#111112]"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-red-500 text-[9px] tracking-wider uppercase">
                  {lang === 'ZH' ? '密码不正确，请重新输入。' : 'Incorrect passcode. Please try again.'}
                </p>
              )}
            </div>

            <div className="flex gap-3 text-[10px] tracking-widest font-bold uppercase mt-2">
              <button 
                type="button" 
                onClick={() => { setShowAuthModal(false); setPendingAction(null); }}
                className="w-1/3 border border-black/20 py-2 hover:bg-black/5 transition-colors"
              >
                {lang === 'ZH' ? '取消' : 'CANCEL'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  const inputClean = authInput.trim().toLowerCase();
                  const targetClean = adminPassword.trim().toLowerCase();
                  if (inputClean === targetClean || inputClean === 'camberwell') {
                    sessionStorage.setItem('unpolished_is_admin', 'true');
                    setIsAdmin(true);
                    setShowAuthModal(false);
                    if (pendingAction) {
                      pendingAction();
                      setPendingAction(null);
                    }
                  } else {
                    setAuthError(true);
                  }
                }}
                className="flex-1 bg-black text-white py-2 hover:bg-black/90 transition-colors"
              >
                {lang === 'ZH' ? '验证解锁' : 'AUTHENTICATE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE ADMIN PIN */}
      {showPinChangeModal && (
        <div className="fixed inset-0 z-50 bg-[#111112]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white p-8 flex flex-col gap-6 shadow-xl animate-fade-in font-mono text-xs border border-black/10">
            <div className="flex justify-between items-baseline">
              <h3 className="font-extrabold tracking-[0.15em] text-black uppercase">
                {lang === 'ZH' ? '修改研究所管理密码' : 'UPDATE PASSWORD'}
              </h3>
              <button onClick={() => setShowPinChangeModal(false)} className="text-black/50 hover:text-black font-bold">
                [ × ]
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">
                  {lang === 'ZH' ? '新管理密码' : 'NEW PASSWORD'}
                </label>
                <input 
                  type="password" 
                  placeholder={lang === 'ZH' ? "请输入新密码..." : "Enter new password..."}
                  value={newPinInput} 
                  onChange={(e) => {
                    setNewPinInput(e.target.value);
                    setPinChangeError('');
                  }}
                  className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[12px] tracking-wider text-[#111112]"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">
                  {lang === 'ZH' ? '再次确认新密码' : 'CONFIRM NEW PASSWORD'}
                </label>
                <input 
                  type="password" 
                  placeholder={lang === 'ZH' ? "请再次输入以防输错..." : "Type again to confirm..."}
                  value={confirmPinInput} 
                  onChange={(e) => {
                    setConfirmPinInput(e.target.value);
                    setPinChangeError('');
                  }}
                  className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[12px] tracking-wider text-[#111112]"
                />
              </div>

              {pinChangeError && (
                <p className="text-red-500 text-[9px] tracking-wider uppercase">
                  {pinChangeError}
                </p>
              )}
            </div>

            <div className="flex gap-3 text-[10px] tracking-widest font-bold uppercase mt-2">
              <button 
                type="button" 
                onClick={() => setShowPinChangeModal(false)}
                className="w-1/3 border border-[#111112]/20 py-2 hover:bg-black/5 transition-colors"
              >
                {lang === 'ZH' ? '取消' : 'CANCEL'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  const cleanedNew = newPinInput.trim();
                  const cleanedConf = confirmPinInput.trim();
                  
                  if (!cleanedNew) {
                    setPinChangeError(lang === 'ZH' ? '新密码不能为空！' : 'New password cannot be empty.');
                    return;
                  }
                  
                  if (cleanedNew !== cleanedConf) {
                    setPinChangeError(lang === 'ZH' ? '两次输入的密码不一致，请重新检查！' : 'Passwords do not match.');
                    return;
                  }

                  localStorage.setItem('unpolished_admin_password', cleanedNew);
                  setAdminPassword(cleanedNew);
                  setShowPinChangeModal(false);
                  setNewPinInput('');
                  setConfirmPinInput('');
                  setPinChangeError('');
                  alert(lang === 'ZH' ? '管理密码修改成功！' : 'Password updated successfully!');
                }}
                className="flex-1 bg-black text-white py-2 hover:bg-black/90 transition-colors"
              >
                {lang === 'ZH' ? '确认保存' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
