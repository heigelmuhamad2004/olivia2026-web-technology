"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Layers, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TechItem {
  id: number;
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  relatedIds: number[];
  color?: string;
}

interface RadialTechStackProps {
  techData: TechItem[];
}

export default function RadialTechStack({ techData }: RadialTechStackProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(180);

  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = techData.find((item) => item.id === id)?.relatedIds || [];
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
        
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  // Fungsi untuk memutar orbit agar node yang diklik berada tepat di atas (270 derajat)
  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = techData.findIndex((item) => item.id === nodeId);
    if (nodeIndex === -1) return;
    const totalNodes = techData.length;
    const targetAngle = 270 - (nodeIndex / totalNodes) * 360;
    setRotationAngle(targetAngle);
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => (prev + 0.2) % 360);
      }, 50);
    }

    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate]);

  useEffect(() => {
    const handleResize = () => {
      setRadius(window.innerWidth < 768 ? 120 : 180);
    };
    
    handleResize(); // Set radius yang tepat berdasarkan ukuran layar di client-side
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radian = (angle * Math.PI) / 180;

    // Dibulatkan menjadi 3 desimal untuk menghindari error presisi antara Node.js (Server) dan V8 (Browser)
    const x = Number((radius * Math.cos(radian)).toFixed(3));
    const y = Number((radius * Math.sin(radian)).toFixed(3));

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    // Ubah 0.3 di bawah ini untuk mengatur opacity minimal (saat node berada di belakang orbit)
    const opacity = Number(Math.max(1, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))).toFixed(3));

    return { x, y, zIndex, opacity };
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const activeItem = techData.find((item) => item.id === activeNodeId);
    return activeItem ? activeItem.relatedIds.includes(itemId) : false;
  };

  return (
    <div
      className="relative w-full h-[350px] md:h-[650px] flex flex-col items-center justify-center"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      {/* Cincin Orbit / Jalur Lintas */}
      <div className="absolute w-[240px] h-[240px] md:w-[360px] md:h-[360px] rounded-full border-2 border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.1)] pointer-events-none"></div>

      {/* Pusat Sistem (Core Engine) */}
      {/* Ubah z-10 di bawah ini menjadi z-0, z-50, dll. sesuai kebutuhan Anda */}
      <div className="absolute w-16 h-16 rounded-full bg-primary/10 animate-pulse flex items-center justify-center z-0 pointer-events-none">
        <div className="absolute w-24 h-24 rounded-full border border-primary/20 animate-ping opacity-50"></div>
        <div className="w-10 h-10 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center text-primary-foreground">
          <Layers size={20} />
        </div>
      </div>

      {/* Pembungkus Node Orbit */}
      <div
        className="absolute w-full h-full flex items-center justify-center"
        ref={orbitRef}
        style={{ perspective: "1000px" }}
      >
        {techData.map((item, index) => {
          const position = calculateNodePosition(index, techData.length);
          const isExpanded = expandedItems[item.id];
          const isRelated = isRelatedToActive(item.id);
          const isPulsing = pulseEffect[item.id];
          const Icon = item.icon;
          const itemColor = item.color || "hsl(var(--primary))";

          const nodeStyle = {
            transform: `translate(${position.x}px, ${position.y}px)`,
            zIndex: isExpanded ? 200 : position.zIndex,
            opacity: isExpanded || isRelated ? 1 : position.opacity,
          };

          return (
            <div
              key={item.id}
              className="absolute transition-all duration-700 cursor-pointer flex flex-col items-center"
              style={nodeStyle}
              onClick={(e) => {
                e.stopPropagation();
                toggleItem(item.id);
              }}
            >
              {/* Efek Pancaran Relasi */}
              {isPulsing && (
                <div className="absolute inset-0 rounded-full animate-ping bg-primary/30 opacity-75"></div>
              )}

              {/* Ikon Node */}
              <div
                className={`
                  w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform
                  ${
                    isExpanded
                      ? "scale-125 shadow-xl z-50 text-white"
                      : isRelated
                      ? "scale-110 z-40"
                      : "bg-card text-muted-foreground border-border hover:border-[var(--hover-color)] hover:text-[var(--hover-color)] hover:scale-110"
                  }
                `}
                style={
                  isExpanded
                    ? { backgroundColor: itemColor, borderColor: itemColor, boxShadow: `0 10px 25px -5px ${itemColor}80` }
                    : isRelated
                    ? { backgroundColor: `${itemColor}33`, borderColor: itemColor, color: itemColor }
                    : { "--hover-color": itemColor } as React.CSSProperties
                }
              >
                <Icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>

              {/* Judul Hover Kecil */}
              <div
                className={`
                  absolute top-14 md:top-16 whitespace-nowrap text-xs md:text-sm font-semibold tracking-wide
                  transition-all duration-300 px-2 py-1 rounded-md bg-background/90 backdrop-blur-sm border border-border shadow-sm
                  ${isExpanded ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"}
                `}
                style={isRelated ? { color: itemColor, borderColor: `${itemColor}50` } : {}}
              >
                {item.title}
              </div>

              {/* Kartu Informasi Pop-Up saat Diklik */}
              {isExpanded && (
                <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-64 md:w-[320px] bg-card/95 backdrop-blur-xl border-border shadow-2xl shadow-primary/10 overflow-visible z-50 animate-in fade-in zoom-in duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3" style={{ backgroundColor: itemColor }}></div>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex justify-between items-center mb-2">
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] uppercase tracking-wider border-transparent"
                        style={{ backgroundColor: `${itemColor}20`, color: itemColor }}
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Icon className="w-5 h-5" /> {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
                    <p className="leading-relaxed">{item.description}</p>

                    {item.relatedIds.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="flex items-center mb-2">
                          <LinkIcon size={12} className="text-muted-foreground mr-1.5" />
                          <h4 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            Terhubung dengan
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.relatedIds.map((relatedId) => {
                            const relatedItem = techData.find((i) => i.id === relatedId);
                            if (!relatedItem) return null;
                            return (
                              <Button
                                key={relatedId}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px] bg-background hover:bg-primary/10 hover:text-primary transition-colors border-border"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItem(relatedId);
                                }}
                              >
                                <relatedItem.icon className="w-3 h-3 mr-1" />
                                {relatedItem.title}
                                <ArrowRight size={10} className="ml-1 opacity-50" />
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}