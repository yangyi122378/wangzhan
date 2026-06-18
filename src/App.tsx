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

const PRESETS = [
  "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800"
];

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
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>(PRESETS[0]);

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
    return localStorage.getItem('unpolished_about_bio_zh') || '杨艺，本科毕业于伦敦艺术大学坎伯韦尔艺术学院。\n\n以建筑结构原真（Tectonic Honesty）与受力自洽为研究核心，探索极限曲率体量与原材料本原状态的高难度交叠。';
  });
  const [aboutBioEn, setAboutBioEn] = useState<string>(() => {
    return localStorage.getItem('unpolished_about_bio_en') || 'Yang Yi graduated from Camberwell College of Arts, University of the Arts London.\n\nHis practice centers on structural truth (Tectonic Honesty) and force self-consistency, testing critical curvature volumes integrated with the primordial properties of raw matter.';
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

  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.url) {
          return data.url;
        }
      }
    } catch (e) {
      console.warn("Cloudflare R2-upload failed or API not configured, falling back to base64 encoding", e);
    }
    // Fallback to FileReader base64 encoding
    return new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = ev => resolve(ev.target?.result as string);
      r.readAsDataURL(file);
    });
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('unpolished_portfolio_projects_v20', JSON.stringify(projects));
  }, [projects]);

  // Load from Cloudflare D1 on mount (with automatic pre-population if empty)
  useEffect(() => {
    const fetchRemoteProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const apiProjects = await res.json();
          if (Array.isArray(apiProjects)) {
            if (apiProjects.length > 0) {
              setProjects(apiProjects);
            } else {
              // Remote is connected but completely empty, let's pre-populate it with INITIAL_PROJECTS
              console.log("Remote D1 database is empty. Pre-populating with default architect portfolio items...");
              for (const p of INITIAL_PROJECTS) {
                await fetch('/api/projects', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(p)
                });
              }
              // Refetch populated data
              const freshRes = await fetch('/api/projects');
              if (freshRes.ok) {
                const freshProjects = await freshRes.json();
                if (Array.isArray(freshProjects) && freshProjects.length > 0) {
                  setProjects(freshProjects);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote projects from Cloudflare D1, falling back to local storage:", err);
      }
    };
    fetchRemoteProjects();
  }, []);

  useEffect(() => {
    localStorage.setItem('unpolished_about_name_zh', aboutNameZh);
    localStorage.setItem('unpolished_about_name_en', aboutNameEn);
    localStorage.setItem('unpolished_about_bio_zh', aboutBioZh);
    localStorage.setItem('unpolished_about_bio_en', aboutBioEn);
  }, [aboutNameZh, aboutNameEn, aboutBioZh, aboutBioEn]);

  const handleCreateNewWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationTitle.trim()) return;

    const newProj: Project = {
      id: `proj-${Math.random().toString(36).substring(2, 9)}`,
      title: creationTitle,
      titleEn: creationTitleEn || creationTitle,
      category: creationCategory,
      location: creationLocation || (lang === 'ZH' ? '伦敦' : 'London'),
      locationEn: creationLocationEn || creationLocation || 'London',
      year: creationYear,
      image: selectedPresetImage || PRESETS[0],
      images: [selectedPresetImage || PRESETS[0]],
      details: {
        area: creationArea || '30㎡',
        material: creationMaterial || '未设定 (Not Specified)',
        tectonics: creationTectonics || '这里是学术构造说明。'
      }
    };

    setProjects(prev => [newProj, ...prev]);
    setIsCreateOpen(false);

    // Sync to Cloudflare D1
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProj)
      });
    } catch (err) {
      console.warn("Could not sync added project to Cloudflare D1:", err);
    }
    
    // Reset inputs
    setCreationTitle('');
    setCreationTitleEn('');
    setCreationCategory('ARCHITECTURE');
    setCreationLocation('');
    setCreationLocationEn('');
    setCreationYear('2026');
    setCreationArea('');
    setCreationMaterial('');
    setCreationTectonics('');
    setSelectedPresetImage(PRESETS[0]);
  };

  const handleSaveEdit = async () => {
    if (!selectedProject || !editTitle.trim()) return;

    const updated: Project = {
      ...selectedProject,
      title: editTitle,
      titleEn: editTitleEn || editTitle,
      year: editYear,
      location: editLocation,
      locationEn: editLocationEn,
      details: {
        ...selectedProject.details,
        area: editArea,
        material: editMaterial,
        tectonics: editTectonics
      }
    };

    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
    setSelectedProject(updated);
    setIsEditingProj(false);

    // Sync to Cloudflare D1
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn("Could not sync edited project to Cloudflare D1:", err);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (confirm(lang === 'ZH' ? '确定要删除此研究案卷吗？' : 'Are you sure you want to delete this study record?')) {
      setProjects(prev => prev.filter(p => p.id !== projId));
      setSelectedProject(null);

      // Sync to Cloudflare D1
      try {
        await fetch(`/api/projects?id=${encodeURIComponent(projId)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn("Could not delete project from Cloudflare D1:", err);
      }
    }
  };

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

        {/* INTERACTION: LANG */}
        <div className="flex items-center gap-3 text-[10px] tracking-widest font-semibold uppercase font-mono">
          <button 
            onClick={() => setLang(lang === 'ZH' ? 'EN' : 'ZH')}
            className="hover:opacity-75 transition-opacity text-[#8c887a] hover:text-[#111112]"
          >
            {lang === 'ZH' ? 'ENGLISH' : '中文'}
          </button>
        </div>

      </header>

      {/* COMPACT FILTER SYSTEM: NO BORDERS, NO MESSY BOXES */}
      {activeCategory !== 'ABOUT' && (
        <div className="px-8 mb-6 flex flex-wrap justify-between items-center gap-4 animate-fade-in text-xs">
          {/* Admin Control Bar for high usability */}
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest text-[#8c887a] uppercase pb-1">
            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Unlock size={11} /> [ {lang === 'ZH' ? '研究模式' : 'ADMIN ACTIVE'} ]
                </span>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="text-black hover:underline font-bold"
                >
                  {lang === 'ZH' ? '[ + 录入新研究项目 ]' : '[ + NEW STUDY ]'}
                </button>
                <button
                  onClick={() => setShowPinChangeModal(true)}
                  className="text-[#8c887a] hover:text-black hover:underline font-bold"
                >
                  {lang === 'ZH' ? '[ 修改密码 ]' : '[ CHANGE PASSWORD ]'}
                </button>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('unpolished_is_admin');
                    setIsAdmin(false);
                  }}
                  className="text-red-600 hover:underline font-bold"
                >
                  {lang === 'ZH' ? '[ 退出模式 ]' : '[ LOCK & EXIT ]'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => executeAdminAction(() => {})}
                className="hover:text-black transition-colors flex items-center gap-1 hover:underline font-bold"
              >
                <Lock size={10} /> {lang === 'ZH' ? '解锁研究所管理通道' : 'ADMIN PANEL UNLOCK'}
              </button>
            )}
          </div>

          <div className="text-[10px] text-[#8c887a] tracking-[0.15em] uppercase font-mono ml-auto">
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
                {isEditingAbout ? (
                  <div className="flex-1 space-y-2 max-w-md">
                    <input
                      type="text"
                      value={tempAboutNameZh}
                      onChange={(e) => setTempAboutNameZh(e.target.value)}
                      placeholder="名字 (中文)"
                      className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                    />
                    <input
                      type="text"
                      value={tempAboutNameEn}
                      onChange={(e) => setTempAboutNameEn(e.target.value)}
                      placeholder="Name (English)"
                      className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                    />
                  </div>
                ) : (
                  <span className="text-[#111112] font-semibold text-xs tracking-wider">
                    {lang === 'ZH' ? aboutNameZh : aboutNameEn}
                  </span>
                )}
                
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (isEditingAbout) {
                        setIsEditingAbout(false);
                      } else {
                        setTempAboutNameZh(aboutNameZh);
                        setTempAboutNameEn(aboutNameEn);
                        setTempAboutBioZh(aboutBioZh);
                        setTempAboutBioEn(aboutBioEn);
                        setIsEditingAbout(true);
                      }
                    }}
                    className="border border-[#111112]/20 hover:border-[#111112] px-2.5 py-1 text-[9px] uppercase tracking-wider font-extrabold ml-4 whitespace-nowrap"
                  >
                    {isEditingAbout ? (lang === 'ZH' ? '取消' : 'CANCEL') : (lang === 'ZH' ? '修改文字' : 'EDIT BIOGRAPHY')}
                  </button>
                )}
              </div>

              {isEditingAbout ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block">中文自传</label>
                    <textarea
                      value={tempAboutBioZh}
                      onChange={(e) => setTempAboutBioZh(e.target.value)}
                      rows={5}
                      className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-[#111112] outline-none font-mono resize-none leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block">English Biography</label>
                    <textarea
                      value={tempAboutBioEn}
                      onChange={(e) => setTempAboutBioEn(e.target.value)}
                      rows={5}
                      className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-[#111112] outline-none font-mono resize-none leading-relaxed"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setAboutNameZh(tempAboutNameZh || aboutNameZh);
                      setAboutNameEn(tempAboutNameEn || aboutNameEn);
                      setAboutBioZh(tempAboutBioZh || aboutBioZh);
                      setAboutBioEn(tempAboutBioEn || aboutBioEn);
                      setIsEditingAbout(false);
                    }}
                    className="w-full bg-black text-white hover:bg-black/90 py-2 text-[10px] uppercase tracking-widest font-bold font-mono"
                  >
                    {lang === 'ZH' ? '保存自传' : 'SAVE BIOGRAPHY'}
                  </button>
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
                  return (
                    <div
                      key={proj.id}
                      onClick={() => openProjectOverview(proj)}
                      className="group cursor-pointer flex flex-col gap-4 relative w-full max-w-2xl md:max-w-3xl"
                    >
                      
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
                    <h3 className="text-sm font-bold text-black tracking-widest uppercase mt-0.5">
                      {lang === 'ZH' ? (selectedProject.title || '') : (selectedProject.titleEn || '')}
                    </h3>
                  </div>
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
                          {lang === 'ZH' ? '暂无平面/效果图' : 'NO IMAGES YET'}
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

                  {isAdmin && (
                    <div className="pt-2 flex flex-col gap-2 font-mono">
                      <div className="flex gap-2">
                        <label className="border border-black/10 hover:border-black px-2 py-1.5 text-[9px] uppercase tracking-wider cursor-pointer flex-1 text-center bg-white font-bold select-none text-black">
                          {lang === 'ZH' ? '+ 上传自定义细节效果图' : '+ ADD PHOTO SLIDE'}
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (files) {
                                try {
                                  const promises = Array.from(files).map((f: any) => uploadImageFile(f));
                                  const urls = await Promise.all(promises);
                                  
                                  const updatedProj = {
                                    ...selectedProject,
                                    images: [...(selectedProject.images || [selectedProject.image]), ...urls]
                                  };
                                  
                                  setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProj : p));
                                  setSelectedProject(updatedProj);
                                  setActivePhotoIndex((selectedProject.images?.length || 0));

                                  // Sync addition to Cloudflare D1
                                  await fetch('/api/projects', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(updatedProj)
                                  });
                                } catch (err) {
                                  console.error("Failed uploading details", err);
                                }
                              }
                            }}
                          />
                        </label>
                        {selectedProject.images && selectedProject.images.length > 1 && (
                          <button
                            onClick={async () => {
                              const curImages = [...selectedProject.images!];
                              curImages.splice(activePhotoIndex, 1);
                              const updatedProj = {
                                ...selectedProject,
                                image: curImages[0] || '',
                                images: curImages
                              };
                              setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProj : p));
                              setSelectedProject(updatedProj);
                              setActivePhotoIndex(Math.max(0, activePhotoIndex - 1));

                              // Sync slide removal to Cloudflare D1
                              try {
                                await fetch('/api/projects', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updatedProj)
                                });
                              } catch (err) {
                                console.error("Could not sync slide deletion to Cloudflare D1:", err);
                              }
                            }}
                            className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold"
                          >
                            {lang === 'ZH' ? '删除当前页' : 'DELETE SLIDE'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Plain list text fields or Interactive editor inputs */}
                {isEditingProj ? (
                  <div className="space-y-4 pt-4 border-t border-black/10 font-mono text-[#111112]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">中文标题</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">English Title</label>
                        <input
                          type="text"
                          value={editTitleEn}
                          onChange={(e) => setEditTitleEn(e.target.value)}
                          className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
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
                          className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">中文地点</label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">Location (En)</label>
                        <input
                          type="text"
                          value={editLocationEn}
                          onChange={(e) => setEditLocationEn(e.target.value)}
                          className="w-full bg-white border border-black/15 px-2 py-1 text-xs text-black focus:border-[#111112] outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">材质机制 (Materiality)</label>
                      <input
                        type="text"
                        value={editMaterial}
                        onChange={(e) => setEditMaterial(e.target.value)}
                        className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-[#111112] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">构造主旨阐述 (Tectonic Thesis)</label>
                      <textarea
                        value={editTectonics}
                        onChange={(e) => setEditTectonics(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-[#111112] outline-none font-mono resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-[#8c887a] uppercase tracking-wider block mb-1">体量尺寸 (Scale/Area)</label>
                      <input
                        type="text"
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="w-full bg-white border border-black/15 px-2 py-1.5 text-xs text-black focus:border-[#111112] outline-none font-mono"
                      />
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
                        {lang === 'ZH' ? '确认保存' : 'SAVE CHANGES'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-[#706a5e] leading-relaxed font-mono mt-4 pt-4 border-t border-black/10">
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

              <div className="mt-6 flex gap-2 w-full font-mono font-bold">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 border border-black/15 py-2 text-center text-black/60 hover:text-black hover:border-black text-[10px] uppercase tracking-widest"
                >
                  {lang === 'ZH' ? '关闭' : 'CLOSE'}
                </button>
                {isAdmin && !isEditingProj && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTitle(selectedProject.title || '');
                        setEditTitleEn(selectedProject.titleEn || '');
                        setEditYear(selectedProject.year || '');
                        setEditLocation(selectedProject.location || '');
                        setEditLocationEn(selectedProject.locationEn || '');
                        setEditArea(selectedProject.details?.area || '');
                        setEditMaterial(selectedProject.details?.material || '');
                        setEditTectonics(selectedProject.details?.tectonics || '');
                        setIsEditingProj(true);
                      }}
                      className="border border-black px-4 py-2 text-[10px] hover:bg-black hover:text-white transition-all text-black uppercase tracking-widest"
                    >
                      {lang === 'ZH' ? '编辑内容' : 'EDIT DETAIL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(selectedProject.id)}
                      className="border border-red-500 text-red-600 hover:bg-red-50 px-4 py-2 text-[10px] uppercase tracking-widest"
                    >
                      {lang === 'ZH' ? '物理删除' : 'DELETE'}
                    </button>
                  </>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD / NEW RESEARCH (Minimalist & Simple fields) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#111112]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-8 flex flex-col gap-6 shadow-xl animate-fade-in font-mono text-xs border border-black/10 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-baseline">
              <h3 className="font-extrabold tracking-[0.15em] text-black uppercase">
                {lang === 'ZH' ? '录入新研究项目' : 'NEW SCHOLARLY STUDY'}
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-black/50 hover:text-black font-bold">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">地点 (中文)</label>
                  <input 
                    type="text" placeholder="例如：伦敦"
                    value={creationLocation} onChange={(e) => setCreationLocation(e.target.value)}
                    className="w-full bg-transparent border-b border-black/10 py-1.5 focus:outline-none focus:border-black text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider">Location (English)</label>
                  <input 
                    type="text" placeholder="e.g. London"
                    value={creationLocationEn} onChange={(e) => setCreationLocationEn(e.target.value)}
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
                  <label className="block text-[9px] text-[#8c887a] uppercase tracking-wider font-bold">Select Preset Cover</label>
                  <label className="text-[9px] text-[#8c887a] hover:text-black hover:underline cursor-pointer font-bold">
                    {lang === 'ZH' ? '[ 上传自定义图片 ]' : '[ UPLOAD IMAGE ]'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await uploadImageFile(file);
                            setSelectedPresetImage(url);
                          } catch (err) {
                            console.error("Upload failed", err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {selectedPresetImage?.startsWith('data:image/') && (
                  <div className="aspect-[3/1] overflow-hidden bg-gray-100 border border-black/10 relative my-1">
                    <img src={selectedPresetImage} className="w-full h-full object-cover grayscale" />
                    <span className="absolute bottom-1 right-2 bg-black text-white text-[7px] tracking-widest px-1 py-0.5 uppercase">
                      {lang === 'ZH' ? '自定义图片已就绪' : 'CUSTOM UPLOAD ACTIVE'}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {PRESETS.map((url, i) => (
                    <button
                      key={i} type="button" onClick={() => setSelectedPresetImage(url)}
                      className={`aspect-square overflow-hidden bg-gray-100 border ${
                        selectedPresetImage === url ? 'border-black opacity-100 scale-[1.05]' : 'border-transparent opacity-60 hover:opacity-85'
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
                ? '仅管理员（杨艺本人）可执行新增、修改或物理删除案卷。请输入对应的密码解锁。' 
                : 'Only the administrator (Yang Yi) can modify, edit or add research studies. Please enter password.'}
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
