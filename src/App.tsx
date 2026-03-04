/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, ShieldAlert, Zap, Info, ChevronRight, Loader2, 
  ShieldCheck, HeartPulse, AlertTriangle, FileText, Users, 
  ZapOff, Lock, Tag, Activity, Flame, GraduationCap, PlayCircle
} from 'lucide-react';
import { generateImage, generateSpeech } from './services/gemini';
import { cn } from './lib/utils';

type Speaker = 'Rafael' | 'Carla' | 'Lucas' | 'Narrator';
type Voice = 'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr';

interface DialogueLine {
  speaker: Speaker;
  text: string;
  voice: Voice;
}

interface Scene {
  id: number;
  title: string;
  subtitle: string;
  imagePrompt: string;
  dialogue: DialogueLine[];
  layout: 'standard' | 'split' | 'drama' | 'closing';
  visualType?: 'graphics' | 'legal' | 'steps' | 'data' | 'none';
}

const SCENES: Scene[] = [
  {
    id: 1,
    title: "ABERTURA IMPACTANTE",
    subtitle: "O Risco Elétrico",
    imagePrompt: "3D animated industrial electrical substation, high voltage panels, warning signs, cinematic lighting, pixar style animation, dramatic atmosphere, worker approaching energized panel",
    layout: 'standard',
    dialogue: [
      { speaker: 'Narrator', text: "Você sabia que um segundo de descuido pode causar um acidente fatal?", voice: 'Charon' },
      { speaker: 'Rafael', text: "É exatamente por isso que existe a NR-10. Segurança em Instalações e Serviços em Eletricidade.", voice: 'Fenrir' }
    ]
  },
  {
    id: 2,
    title: "O QUE É A NR-10?",
    subtitle: "Definição e Requisitos",
    imagePrompt: "3D animated safety engineer explaining electrical safety, pixar style, industrial background, professional environment, warm cinematic lighting, close up on character",
    layout: 'standard',
    visualType: 'graphics',
    dialogue: [
      { speaker: 'Rafael', text: "A NR-10 é a Norma Regulamentadora que estabelece requisitos mínimos para garantir a segurança e a saúde dos trabalhadores que interagem com eletricidade.", voice: 'Fenrir' }
    ]
  },
  {
    id: 3,
    title: "BASE LEGAL",
    subtitle: "Origem e Validade",
    imagePrompt: "3D animated office environment, safety supervisor holding official Brazilian regulation document, professional setting, pixar style",
    layout: 'standard',
    visualType: 'legal',
    dialogue: [
      { speaker: 'Carla', text: "Ela foi criada pelo Ministério do Trabalho e faz parte das Normas Regulamentadoras previstas na Consolidação das Leis do Trabalho.", voice: 'Puck' }
    ]
  },
  {
    id: 4,
    title: "QUEM PRECISA CUMPRIR?",
    subtitle: "Abrangência da Norma",
    imagePrompt: "Split scene 3D animation showing industrial electrician, residential electrician and maintenance worker, pixar style, realistic lighting",
    layout: 'split',
    dialogue: [
      { speaker: 'Rafael', text: "Qualquer profissional que trabalhe direta ou indiretamente com eletricidade deve cumprir a NR-10.", voice: 'Fenrir' },
      { speaker: 'Lucas', text: "Mesmo quem faz manutenção simples?", voice: 'Kore' },
      { speaker: 'Carla', text: "Sim. Se há risco elétrico, há obrigatoriedade.", voice: 'Puck' }
    ]
  },
  {
    id: 5,
    title: "DRAMATIZAÇÃO DE ERRO",
    subtitle: "Análise de Risco",
    imagePrompt: "3D animated scene of worker attempting to open energized electrical panel without PPE, industrial setting, dramatic lighting, pixar style",
    layout: 'drama',
    visualType: 'steps',
    dialogue: [
      { speaker: 'Carla', text: "Pare!", voice: 'Puck' },
      { speaker: 'Rafael', text: "Antes de qualquer intervenção é obrigatória a análise de risco e a desenergização.", voice: 'Fenrir' }
    ]
  },
  {
    id: 6,
    title: "OBJETIVO DA NORMA",
    subtitle: "Salvando Vidas",
    imagePrompt: "3D animated safety engineer close up, technical background, professional environment, cinematic lighting, pixar style",
    layout: 'standard',
    visualType: 'data',
    dialogue: [
      { speaker: 'Rafael', text: "A NR-10 não é apenas burocracia. Ela salva vidas.", voice: 'Fenrir' }
    ]
  },
  {
    id: 7,
    title: "ENCERRAMENTO",
    subtitle: "Próximos Passos",
    imagePrompt: "3D animated industrial environment background, warm sunset lighting, cinematic atmosphere, pixar style",
    layout: 'closing',
    dialogue: [
      { speaker: 'Rafael', text: "No próximo episódio vamos falar sobre as Medidas de Controle previstas na NR-10.", voice: 'Fenrir' }
    ]
  }
];

interface AppState {
  currentSceneIndex: number;
  isLoading: boolean;
  progress: number;
  isStarted: boolean;
  sceneAssets: {
    imageUrl: string | null;
    audioUrls: (string | null)[];
  };
  currentDialogueIndex: number;
  isTransitioning: boolean;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    currentSceneIndex: 0,
    isLoading: false,
    progress: 0,
    isStarted: false,
    sceneAssets: { imageUrl: null, audioUrls: [] },
    currentDialogueIndex: 0,
    isTransitioning: false
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentScene = SCENES[state.currentSceneIndex];

  const loadSceneAssets = async (index: number) => {
    setState(prev => ({ ...prev, isLoading: true, progress: 0 }));
    const scene = SCENES[index];
    
    try {
      let completed = 0;
      const totalSteps = 1 + scene.dialogue.length;

      const updateProgress = () => {
        completed++;
        setState(prev => ({ ...prev, progress: Math.round((completed / totalSteps) * 100) }));
      };

      const imagePromise = generateImage(scene.imagePrompt).then(res => { updateProgress(); return res; });
      const audioPromises = scene.dialogue.map(d => 
        generateSpeech(d.text, d.voice).then(res => { updateProgress(); return res; })
      );

      const [imageUrl, ...audioUrls] = await Promise.all([imagePromise, ...audioPromises]);

      setState(prev => ({
        ...prev,
        sceneAssets: { imageUrl, audioUrls },
        isLoading: false,
        progress: 100,
        currentDialogueIndex: 0
      }));
    } catch (error) {
      console.error("Failed to load scene assets:", error);
      setState(prev => ({ ...prev, isLoading: false, progress: 0 }));
    }
  };

  const startScene = () => {
    setState(prev => ({ ...prev, isStarted: true }));
    playDialogue(0);
  };

  const playDialogue = (index: number) => {
    const audioUrl = state.sceneAssets.audioUrls[index];
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const nextDialogue = () => {
    const nextIndex = state.currentDialogueIndex + 1;
    if (nextIndex < currentScene.dialogue.length) {
      setState(prev => ({ ...prev, currentDialogueIndex: nextIndex }));
      playDialogue(nextIndex);
    } else {
      // End of scene dialogue
      if (state.currentSceneIndex < SCENES.length - 1) {
        handleNextScene();
      }
    }
  };

  const handleNextScene = async () => {
    const nextIndex = state.currentSceneIndex + 1;
    setState(prev => ({ ...prev, isTransitioning: true }));
    await loadSceneAssets(nextIndex);
    setState(prev => ({ 
      ...prev, 
      currentSceneIndex: nextIndex, 
      isTransitioning: false,
      currentDialogueIndex: 0
    }));
    // Auto-start next scene
    playDialogue(0);
  };

  const restartTraining = () => {
    setState({
      currentSceneIndex: 0,
      isLoading: false,
      progress: 0,
      isStarted: false,
      sceneAssets: { imageUrl: null, audioUrls: [] },
      currentDialogueIndex: 0,
      isTransitioning: false
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">NR-10 Interactive</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Segurança em Eletricidade</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-white/5">
              <div className="flex gap-1">
                {SCENES.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-500",
                      i === state.currentSceneIndex ? "bg-emerald-500 w-4" : "bg-zinc-700"
                    )} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 ml-2">CENA {state.currentSceneIndex + 1}/{SCENES.length}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
          <AnimatePresence mode="wait">
            {!state.isStarted || state.isLoading ? (
              <motion.div 
                key="loading-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 bg-[#0a0a0a]/80 backdrop-blur-md"
              >
                {state.isLoading ? (
                  <div className="space-y-8 w-full max-w-sm">
                    <div className="relative mx-auto w-16 h-16">
                      <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                      <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-light italic serif">Carregando Cena {state.currentSceneIndex + 1}</h2>
                        <p className="text-zinc-500 text-sm">{currentScene.title}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          <span>Sincronizando Ativos</span>
                          <span>{state.progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${state.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-5xl font-bold tracking-tighter leading-none uppercase">Treinamento<br/><span className="text-emerald-500">NR-10 Completo</span></h2>
                      <p className="text-zinc-400 max-w-xl mx-auto text-lg">Uma jornada interativa pelos requisitos de segurança e saúde em serviços de eletricidade.</p>
                    </div>
                    <button 
                      onClick={() => loadSceneAssets(0)}
                      disabled={state.isLoading}
                      className="group relative px-12 py-5 bg-white text-black rounded-full font-bold text-xl overflow-hidden transition-all hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        {state.sceneAssets.imageUrl ? "INICIAR AGORA" : "CARREGAR CURSO"}
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-emerald-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                    {state.sceneAssets.imageUrl && !state.isLoading && (
                      <button onClick={startScene} className="block mx-auto text-zinc-500 hover:text-white underline text-sm">Pular para o início</button>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key={`scene-${state.currentSceneIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black overflow-hidden"
              >
                {/* Background Image */}
                {state.sceneAssets.imageUrl && (
                  <motion.img 
                    key={`bg-${state.currentSceneIndex}`}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    src={state.sceneAssets.imageUrl}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-1000",
                      state.currentDialogueIndex > 0 || currentScene.visualType ? "brightness-[0.3] blur-sm" : "brightness-[0.6]"
                    )}
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Layouts and Visuals */}
                <div className="absolute inset-0 flex flex-col">
                  {/* Top Info Bar */}
                  <div className="p-8 flex justify-between items-start">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="space-y-1"
                    >
                      <span className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Cena {currentScene.id}</span>
                      <h2 className="text-3xl font-bold tracking-tight">{currentScene.title}</h2>
                      <p className="text-zinc-400 text-sm font-light italic serif">{currentScene.subtitle}</p>
                    </motion.div>
                  </div>

                  {/* Center Visuals Area */}
                  <div className="flex-1 flex items-center justify-center p-12">
                    <AnimatePresence mode="wait">
                      {currentScene.visualType === 'graphics' && (
                        <motion.div 
                          key="graphics"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="grid grid-cols-3 gap-8 w-full max-w-4xl"
                        >
                          {[
                            { icon: ShieldCheck, label: "Segurança", color: "text-blue-400" },
                            { icon: HeartPulse, label: "Saúde", color: "text-rose-400" },
                            { icon: AlertTriangle, label: "Prevenção", color: "text-amber-400" }
                          ].map((item, i) => (
                            <motion.div 
                              key={i}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: i * 0.2 }}
                              className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col items-center gap-4 text-center shadow-2xl"
                            >
                              <div className={cn("w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center", item.color)}>
                                <item.icon className="w-8 h-8" />
                              </div>
                              <span className="font-bold text-xl">{item.label}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {currentScene.visualType === 'legal' && (
                        <motion.div 
                          key="legal"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[40px] max-w-2xl w-full flex flex-col gap-8 shadow-2xl"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <FileText className="text-black w-10 h-10" />
                            </div>
                            <div>
                              <h3 className="text-3xl font-bold">Base Legal</h3>
                              <p className="text-zinc-400">Consolidação das Leis do Trabalho</p>
                            </div>
                          </div>
                          <div className="h-px bg-white/10 w-full" />
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">CLT</div>
                              <span className="text-lg">Artigos 154 a 201 da CLT</span>
                            </div>
                            <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">MTE</div>
                              <span className="text-lg">Portarias do Ministério do Trabalho</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {currentScene.layout === 'split' && (
                        <motion.div 
                          key="split"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid grid-cols-3 gap-4 w-full h-full max-h-[400px]"
                        >
                          {[
                            { label: "Indústria", img: "https://picsum.photos/seed/industry/400/600" },
                            { label: "Residência", img: "https://picsum.photos/seed/home/400/600" },
                            { label: "Manutenção", img: "https://picsum.photos/seed/maintenance/400/600" }
                          ].map((item, i) => (
                            <motion.div 
                              key={i}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="relative rounded-2xl overflow-hidden group border border-white/10"
                            >
                              <img src={item.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-6">
                                <span className="font-bold text-lg">{item.label}</span>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {currentScene.visualType === 'steps' && (
                        <motion.div 
                          key="steps"
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl"
                        >
                          {[
                            { icon: ZapOff, label: "Desligar", desc: "Seccionamento" },
                            { icon: Lock, label: "Bloquear", desc: "Impedimento" },
                            { icon: Tag, label: "Etiquetar", desc: "Sinalização" },
                            { icon: Activity, label: "Testar", desc: "Ausência de Tensão" }
                          ].map((step, i) => (
                            <motion.div 
                              key={i}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 1.5 + (i * 0.2) }}
                              className="bg-zinc-900/90 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-4 text-center"
                            >
                              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold mb-2">
                                {i + 1}
                              </div>
                              <step.icon className="w-10 h-10 text-emerald-500" />
                              <div>
                                <h4 className="font-bold text-lg">{step.label}</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{step.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {currentScene.visualType === 'data' && (
                        <motion.div 
                          key="data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col gap-6 w-full max-w-2xl"
                        >
                          {[
                            { label: "Choque Elétrico", value: 85, color: "bg-blue-500" },
                            { label: "Arco Elétrico", value: 65, color: "bg-amber-500" },
                            { label: "Incêndios", value: 45, color: "bg-rose-500" }
                          ].map((item, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-between text-sm font-bold">
                                <span>{item.label}</span>
                                <span className="text-zinc-500">Risco Crítico</span>
                              </div>
                              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.value}%` }}
                                  transition={{ delay: 1 + (i * 0.3), duration: 1.5, ease: "easeOut" }}
                                  className={cn("h-full rounded-full", item.color)}
                                />
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {currentScene.layout === 'closing' && (
                        <motion.div 
                          key="closing"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center space-y-12"
                        >
                          <div className="space-y-4">
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="inline-flex items-center gap-2 px-4 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest"
                            >
                              Fim do Capítulo 1
                            </motion.div>
                            <h2 className="text-7xl font-black tracking-tighter uppercase">Próximo<br/><span className="text-emerald-500">Episódio</span></h2>
                          </div>
                          
                          <motion.div 
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-md mx-auto"
                          >
                            <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2 font-mono">Capítulo 2</p>
                            <h3 className="text-2xl font-bold">Desenergização e Bloqueio</h3>
                            <div className="mt-6 flex justify-center">
                              <button 
                                onClick={restartTraining}
                                className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
                              >
                                <RotateCcw className="w-5 h-5" />
                                REINICIAR TREINAMENTO
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bottom Dialogue Area */}
                  <div className="p-12 pt-0">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={`${state.currentSceneIndex}-${state.currentDialogueIndex}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative group cursor-pointer"
                        onClick={nextDialogue}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                            <img 
                              src={
                                currentScene.dialogue[state.currentDialogueIndex].speaker === 'Rafael' 
                                ? "https://picsum.photos/seed/rafael/200/200"
                                : currentScene.dialogue[state.currentDialogueIndex].speaker === 'Carla'
                                ? "https://picsum.photos/seed/carla/200/200"
                                : currentScene.dialogue[state.currentDialogueIndex].speaker === 'Lucas'
                                ? "https://picsum.photos/seed/lucas/200/200"
                                : "https://picsum.photos/seed/narrator/200/200"
                              } 
                              alt="Speaker"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-500 font-bold text-sm uppercase tracking-widest">
                                {currentScene.dialogue[state.currentDialogueIndex].speaker}
                              </span>
                              <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <p className="text-xl leading-relaxed font-medium text-zinc-100 italic serif">
                              "{currentScene.dialogue[state.currentDialogueIndex].text}"
                            </p>
                          </div>
                          <div className="shrink-0 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                              <ChevronRight className="w-6 h-6" />
                            </div>
                            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">Clique para continuar</span>
                          </div>
                        </div>
                        
                        {/* Dialogue Progress */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 rounded-b-[32px] overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((state.currentDialogueIndex + 1) / currentScene.dialogue.length) * 100}%` }}
                          />
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <footer className="mt-8 flex justify-between items-center text-zinc-500 text-xs font-mono">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SISTEMA ATIVO
            </div>
            <div className="hidden sm:block">MODULE_NR10_INTRO_V1</div>
          </div>
          <div className="flex gap-4">
            <span>© 2024 SAFETY INTERACTIVE</span>
            <span className="text-zinc-800">|</span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{Math.floor(Math.random() * 100) + 50} ONLINE</span>
            </div>
          </div>
        </footer>
      </main>

      <audio ref={audioRef} hidden onEnded={nextDialogue} />
    </div>
  );
}
