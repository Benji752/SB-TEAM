import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Copy, 
  Loader2,
  Send,
  Paperclip,
  Bot,
  User,
  X,
  Wand2,
  Trash2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const bubbleVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const WELCOME_MESSAGE: ChatMessage = { 
  role: "assistant", 
  content: "NOVA en ligne.\n\nJ'ai accès à tout : commandes, revenus, modèles, stats Stripchat. En temps réel.\n\nEnvoie une photo, je l'analyse. Pose une question business, j'ai la réponse. Besoin d'un post qui convertit ? Je rédige.\n\nOn commence ?" 
};

export default function AITools() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Quick tools state
  const [quickSubject, setQuickSubject] = useState("");
  const [quickTone, setQuickTone] = useState("seductrice");
  const [quickPlatform, setQuickPlatform] = useState("instagram");
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false);

  // Load chat history from database on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/ai/chat/history");
        if (response.ok) {
          const history = await response.json();
          if (history.length > 0) {
            const loadedMessages: ChatMessage[] = [WELCOME_MESSAGE];
            for (const item of history) {
              loadedMessages.push({ role: "user", content: item.userMessage });
              loadedMessages.push({ role: "assistant", content: item.aiResponse });
            }
            setMessages(loadedMessages);
          }
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearHistory = async () => {
    try {
      await apiRequest("DELETE", "/api/ai/chat/history", {});
      setMessages([WELCOME_MESSAGE]);
      toast({
        title: "Historique effacé",
        description: "La mémoire de l'IA a été réinitialisée."
      });
    } catch (e) {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer l'historique.",
        variant: "destructive"
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 20 Mo.",
          variant: "destructive"
        });
        return;
      }

      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    const imageToSend = selectedImage;
    removeImage();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: userMessage.content,
        image: imageToSend,
        history: messages.slice(-10)
      });

      const data = await response.json();

      if (data.response) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.response
        }]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Désolé, une erreur est survenue. Vérifie que la clé API OpenAI est bien configurée."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickGenerate = async () => {
    if (!quickSubject.trim()) {
      toast({
        title: "Sujet requis",
        description: "Entre un sujet pour générer des légendes.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingQuick(true);

    try {
      const response = await apiRequest("POST", "/api/ai/generate", {
        subject: quickSubject,
        tone: quickTone,
        platform: quickPlatform
      });

      const data = await response.json();

      if (data.suggestions && Array.isArray(data.suggestions)) {
        const formattedSuggestions = data.suggestions.map((s: string, i: number) => 
          `**Option ${i + 1}:**\n${s}`
        ).join("\n\n");

        setMessages(prev => [...prev, 
          { role: "user", content: `Génère des légendes ${quickPlatform} sur : "${quickSubject}" (ton: ${quickTone})` },
          { role: "assistant", content: `Voici 3 propositions de légendes :\n\n${formattedSuggestions}` }
        ]);
        setQuickSubject("");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur de génération",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuick(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Le texte a été copié.",
    });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Zone de Chat Principale */}
        <div className="flex-1 flex flex-col bg-[#0A0A0A] rounded-2xl md:rounded-[2rem] border border-white/[0.05] overflow-hidden min-h-0">
          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/[0.05] flex items-center gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-black md:hidden" />
              <Bot size={20} className="text-black hidden md:block" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-sm md:text-base">NOVA</h2>
              <p className="text-white/40 text-[10px] md:text-xs truncate">Intelligence • Vision GPT-4o</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              title="Effacer la mémoire"
              data-testid="button-clear-history"
            >
              <Trash2 size={18} />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    variants={bubbleVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                    className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "bg-gold/20 text-gold"
                    }`}>
                      {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                      {msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Uploaded" 
                          className={`max-w-[300px] rounded-xl mb-2 border border-white/10 ${
                            msg.role === "user" ? "ml-auto" : ""
                          }`}
                        />
                      )}
                      <div 
                        className={`inline-block px-4 py-3 rounded-2xl max-w-full ${
                          msg.role === "user" 
                            ? "bg-blue-500/20 text-white" 
                            : "bg-white/[0.03] text-white/80"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content.split(/\*\*(.*?)\*\*/g).map((part, i) => 
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                          )}
                        </p>
                        {msg.role === "assistant" && msg.content.length > 50 && (
                          <motion.div whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(msg.content)}
                              className="mt-2 text-white/30 text-xs h-6 px-2"
                              data-testid="button-copy-message"
                            >
                              <Copy size={12} className="mr-1" /> Copier
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <Bot size={16} className="text-gold" />
                  </div>
                  <div className="bg-white/[0.03] px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Loader2 size={14} className="animate-spin" />
                      L'IA réfléchit...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="px-6 py-3 border-t border-white/[0.05] bg-white/[0.02]">
              <div className="relative inline-block">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="h-20 rounded-lg border border-white/10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                  data-testid="button-remove-image"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/[0.05]">
            <div className="flex gap-3 items-end max-w-3xl mx-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl"
                  data-testid="button-upload-image"
                >
                  <Paperclip size={20} />
                </Button>
              </motion.div>
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Pose ta question ou décris ton besoin..."
                  className="bg-white/[0.03] border-white/[0.1] text-white rounded-xl h-12 pr-12 focus:border-gold/50"
                  data-testid="input-chat-message"
                />
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                  size="icon"
                  className="bg-gold text-black rounded-xl"
                  data-testid="button-send-message"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Sidebar Outils Rapides - Hidden on mobile */}
        <div className="hidden md:block w-80 shrink-0">
          <Card className="bg-[#0A0A0A] border-white/[0.05] rounded-[2rem] p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-gold" />
                <h3 className="text-white font-bold uppercase tracking-wider text-sm">Outils Rapides</h3>
              </div>

              {/* Générateur de légendes */}
              <div className="space-y-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-gold" />
                  <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Générateur de légendes</span>
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={quickSubject}
                    onChange={(e) => setQuickSubject(e.target.value)}
                    placeholder="Sujet du post..."
                    className="bg-white/[0.03] border-white/[0.08] text-white text-sm rounded-lg min-h-[60px] resize-none"
                    data-testid="input-quick-subject"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={quickTone} onValueChange={setQuickTone}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white text-xs rounded-lg h-9" data-testid="select-quick-tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white">
                        <SelectItem value="seductrice">Séductrice</SelectItem>
                        <SelectItem value="humoristique">Drôle</SelectItem>
                        <SelectItem value="mysterieuse">Mystère</SelectItem>
                        <SelectItem value="domina">Domina</SelectItem>
                        <SelectItem value="gnd">GND</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={quickPlatform} onValueChange={setQuickPlatform}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white text-xs rounded-lg h-9" data-testid="select-quick-platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/[0.08] text-white">
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="onlyfans">OnlyFans</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleQuickGenerate}
                    disabled={isGeneratingQuick}
                    variant="outline"
                    className="w-full text-xs rounded-lg"
                    data-testid="button-quick-generate"
                  >
                    {isGeneratingQuick ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={14} className="mr-1" /> Générer
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Exemples de questions</span>
                <div className="space-y-2">
                  {[
                    "Analyse cette photo pour Stripchat",
                    "Comment régler un lag sur OBS ?",
                    "Ma room n'apparaît pas, que faire ?"
                  ].map((tip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(tip)}
                      className="w-full text-left text-xs text-white/50 hover:text-gold p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                      data-testid={`button-tip-${idx}`}
                    >
                      → {tip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
