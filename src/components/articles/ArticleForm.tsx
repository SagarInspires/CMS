'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Settings, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const WritingCanvas = dynamic(
  () => import('../editor/WritingCanvas').then(mod => mod.WritingCanvas),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-96 bg-muted/20 rounded-xl" />
  }
);

interface ArticleFormProps {
  id: string;
  initialTitle: string;
  initialContent: any;
  initialVersion: number;
}

export function ArticleForm({ id, initialTitle, initialContent, initialVersion }: ArticleFormProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [contentJson, setContentJson] = useState<any>(initialContent);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [stats, setStats] = useState({ chars: 0, words: 0, readingTime: 0 });
  const [version, setVersion] = useState(initialVersion);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Keyboard shortcut for Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFocusMode(false);
      // Cmd/Ctrl + Shift + F for focus mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Local Crash Recovery
  useEffect(() => {
    const localDraft = localStorage.getItem(`draft-${id}`);
    if (localDraft) {
      // Basic check, full conflict resolution UI can be added later
      console.log('Found local draft recovery data.');
    }
  }, [id]);

  // Handle Updates from TipTap
  const handleUpdate = useCallback((json: any, html: string, newStats: { chars: number; words: number; readingTime: number }) => {
    setContentJson(json);
    setHtmlContent(html);
    setStats(newStats);
    setSaveStatus('unsaved');
    
    // Store locally for crash recovery
    localStorage.setItem(`draft-${id}`, JSON.stringify({ title, json, timestamp: Date.now() }));
  }, [id, title]);

  // Debounced Autosave
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const response = await fetch(`/api/articles/${id}/autosave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, contentJson, htmlContent, version })
        });

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Autosave returned non-JSON response: ${response.status} ${text.slice(0, 120)}`
          );
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          if (response.status === 409) {
            setSaveStatus('conflict');
            setErrorMessage('Server has a newer version. Please refresh.');
            return;
          }
          throw new Error(result.error || `Autosave failed with ${response.status}`);
        }

        setVersion(result.version);
        setSaveStatus('saved');
        localStorage.removeItem(`draft-${id}`); // Clear local draft on success
      } catch (err: any) {
        console.error(err);
        setSaveStatus('error');
        setErrorMessage(err.message || 'Network error');
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [saveStatus, title, contentJson, htmlContent, version, id]);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      
      {/* Main Studio Column */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto scroll-smooth rounded-[2rem]">
        
        {/* Minimal App Chrome Header */}
        <header className={`sticky top-6 w-[95%] max-w-[1200px] flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md z-20 rounded-full border border-stone-200 transition-transform duration-300 ${isFocusMode ? '-translate-y-24 opacity-0' : 'translate-y-0 opacity-100 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/articles" className="text-sm font-bold tracking-tight text-stone-500 hover:text-black transition-colors">
              ← Drafts
            </Link>
            <div className="h-4 w-px bg-border" />
            <div 
              role="status"
              aria-live="polite"
              data-testid="editor-save-status"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {saveStatus === 'idle' && <span>Ready to write</span>}
              {saveStatus === 'saved' && <><CheckCircle2 className="w-4 h-4 text-green-500" /> <span>Saved</span></>}
              {saveStatus === 'unsaved' && <><AlertCircle className="w-4 h-4 text-amber-500" /> <span>Unsaved changes</span></>}
              {saveStatus === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> <span>Saving...</span></>}
              {saveStatus === 'error' && <><AlertCircle className="w-4 h-4 text-red-500" /> <span>Save failed</span></>}
              {saveStatus === 'conflict' && <><AlertCircle className="w-4 h-4 text-red-500" /> <span>Conflict detected</span></>}
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span 
              data-testid="editor-stats"
              className="text-sm text-muted-foreground hidden sm:inline-block"
            >
              {stats.words} words • {stats.chars} chars • {stats.readingTime} min read
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href={`/dashboard/review/${id}`}
              className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-full hover:scale-105 transition-transform"
            >
              Publish
            </Link>
            <button 
              type="button" 
              onClick={toggleSettings}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isSettingsOpen ? 'bg-stone-200 text-black' : 'text-stone-500 hover:bg-stone-100'}`}
              aria-label="Toggle settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        {/* Centered Readable Canvas */}
        <main className="w-full max-w-[760px] px-6 py-12 md:py-24 transition-all">
          
          {saveStatus === 'conflict' && (
            <div className="mb-8 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-bold mb-1">Version Conflict</h3>
                <p className="text-sm">
                  The server has a newer version of this article. Your editor is locked to prevent overwriting changes.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors"
                >
                  Reload from Server
                </button>
                <button 
                  onClick={() => setSaveStatus('unsaved')}
                  className="px-3 py-1.5 bg-background text-foreground border text-sm font-medium rounded-md hover:bg-muted transition-colors"
                >
                  Force Overwrite
                </button>
              </div>
            </div>
          )}

          <WritingCanvas 
            initialTitle={title} 
            initialContent={initialContent}
            articleId={id}
            isLocked={saveStatus === 'conflict'}
            onTitleChange={(newTitle) => {
              if (saveStatus !== 'conflict') {
                setTitle(newTitle);
                setSaveStatus('unsaved');
              }
            }}
            onUpdate={handleUpdate} 
          />
        </main>
      </div>

      {/* Collapsible Settings Panel */}
      <aside 
        className={`bg-stone-50 border-l border-stone-200 transition-all duration-300 ease-in-out z-30 ${isSettingsOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full border-l-0'} overflow-y-auto`}
      >
        <div className="w-80 p-8 flex flex-col gap-8">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <h2 className="text-xl font-bold tracking-tight text-black">Settings</h2>
            <button onClick={toggleSettings} className="p-2 text-stone-500 hover:bg-stone-200 hover:text-black rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold tracking-tight mb-2 text-black">URL Slug</label>
              <input type="text" className="w-full px-4 py-3 text-sm border border-stone-200 bg-white rounded-xl focus:border-black outline-none" placeholder="auto-generated-slug" />
            </div>
            
            <div>
              <label className="block text-sm font-bold tracking-tight mb-2 text-black">Excerpt</label>
              <textarea rows={3} className="w-full px-4 py-3 text-sm border border-stone-200 bg-white rounded-xl focus:border-black outline-none resize-none" placeholder="A brief summary..." />
            </div>

            <div>
              <label className="block text-sm font-bold tracking-tight mb-2 text-black">Category</label>
              <select className="w-full px-4 py-3 text-sm border border-stone-200 bg-white rounded-xl focus:border-black outline-none">
                <option value="">Select category...</option>
                <option value="tech">Technology</option>
                <option value="design">Design</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
