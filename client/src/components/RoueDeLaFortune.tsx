import React, { useState, useEffect, useRef } from 'react';

interface Lot {
  id: string;
  label: string;
  val: number;
  desc: string;
  color: string;
  text: string;
  prob: number;
  weight: number;
  needApproval?: boolean;
}

const LOTS_CONFIG: Lot[] = [
  { id: 'hotel', label: "Hôtel + Resto 🏨", val: 40000, desc: "Une nuit romantique à l'hôtel avec resto", color: "#111113", text: "#e6ad12", prob: 0.01, weight: 3, needApproval: true },
  { id: 'fellation', label: "Fellation 💋", val: 30000, desc: "Une surprise coquine réservée", color: "#2c1a30", text: "#cc66ff", prob: 0.02, weight: 4 },
  { id: 'calin', label: "Le Câlin 🤗", val: 27000, desc: "Un gros câlin plein de tendresse", color: "#1a2630", text: "#33ffff", prob: 0.05, weight: 6 },
  { id: 'bisou', label: "Un Bisou 😘", val: 24000, desc: "Un baiser doux et passionné", color: "#221d26", text: "#ff99ff", prob: 0.07, weight: 8 },
  { id: 'aleatoire', label: "Aléatoire 🎲", val: 20001, desc: "Un tirage au sort de la Roue de la Fortune", color: "#111113", text: "#33ffff", prob: 0.08, weight: 9 },
  { id: 'bouffe3', label: "Bouffe à 3 🍽️", val: 14000, desc: "Un resto partagé chaleureux", color: "#2c1a30", text: "#cc66ff", prob: 0.12, weight: 12 },
  { id: 'moto', label: "Tour en Moto 🏍️", val: 9000, desc: "Une balade à moto cheveux au vent", color: "#1a2630", text: "#33ffff", prob: 0.15, weight: 14 },
  { id: 'cafe', label: "Un Café ☕", val: 5000, desc: "Un moment de complicité autour d'un café", color: "#251f10", text: "#ffca28", prob: 0.15, weight: 14 },
  { id: 'uno', label: "Un Uno 🃏", val: 3000, desc: "Une partie animée de Uno", color: "#2c1a30", text: "#cc66ff", prob: 0.15, weight: 14 },
  { id: 'paye', label: "La Paye 💰", val: 2000, desc: "Une prime hebdomadaire directe", color: "#111113", text: "#e6ad12", prob: 0.20, weight: 16 }
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
  playUnlock() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [400, 600, 900];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.05, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.15);
    });
  }
  playWin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.07, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });
  }
  playMajestic() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [
      [261.63, 329.63, 392.00],
      [329.63, 392.00, 523.25],
      [392.00, 523.25, 659.25],
      [523.25, 659.25, 783.99, 1046.50]
    ];
    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + step * 0.25);
        gain.gain.setValueAtTime(0.03, now + step * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.005, now + step * 0.25 + 0.5);
        osc.start(now + step * 0.25);
        osc.stop(now + step * 0.25 + 0.5);
      });
    });
  }
  playFail() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(70, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

const audio = new AudioEngine();

interface RoueProps {
  pointsActuels: number;
  roleUtilisateur: 'admin' | 'model' | 'staff';
}

export default function RoueDeLaFortune({ pointsActuels, roleUtilisateur }: RoueProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [prize, setPrize] = useState<Lot | null>(null);
  const [hotelStatus, setHotelStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [manualPoints, setManualPoints] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = window.localStorage.getItem('hunterLeagueManualScore');
    if (!saved) return null;
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const pointsForWheel = manualPoints ?? pointsActuels;
  const manualScoreValue = String(manualPoints ?? pointsActuels);

  const getDirectPrize = (points: number): Lot | null => {
    for (const lot of LOTS_CONFIG) {
      if (points >= lot.val) return lot;
    }
    return null;
  };

  const activeLot = getDirectPrize(pointsForWheel);

  const getSliceAngles = () => {
    let currentAngle = 0;
    return LOTS_CONFIG.map(lot => {
      const angleSize = (lot.weight / 100) * 2 * Math.PI;
      const start = currentAngle;
      const end = currentAngle + angleSize;
      currentAngle = end;
      return { start, end };
    });
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const angles = getSliceAngles();

    for (let i = 0; i < LOTS_CONFIG.length; i++) {
      const startAngle = angles[i].start;
      const endAngle = angles[i].end;
      const midAngle = (startAngle + endAngle) / 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = LOTS_CONFIG[i].color;
      ctx.fill();

      ctx.strokeStyle = '#1d1d1f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = LOTS_CONFIG[i].text;

      const weight = LOTS_CONFIG[i].weight;
      const fontSize = weight <= 4 ? '8px' : '10px';
      ctx.font = `bold ${fontSize} Inter, sans-serif`;

      let label = LOTS_CONFIG[i].label;
      if (weight <= 4) {
        label = label.replace("Hôtel + Resto", "Hôtel").replace("Fellation", "Fellat.");
      }

      ctx.fillText(label, r - 15, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e6ad12';
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  useEffect(() => {
    if (activeLot?.id === 'aleatoire' && !hasSpun) {
      drawWheel();
    }
  }, [activeLot, hasSpun]);

  const spinTheWheel = () => {
    if (spinning || hasSpun || pointsForWheel !== 20001) return;

    setSpinning(true);
    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;

    for (let i = 0; i < LOTS_CONFIG.length; i++) {
      cumulative += LOTS_CONFIG[i].prob;
      if (rand <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const selectedPrize = LOTS_CONFIG[selectedIndex];
    const angles = getSliceAngles();
    const startAngleRad = angles[selectedIndex].start;
    const endAngleRad = angles[selectedIndex].end;
    const midAngleRad = (startAngleRad + endAngleRad) / 2;
    const midAngleDeg = (midAngleRad * 180) / Math.PI;

    const targetAngle = (270 - midAngleDeg + 360) % 360;
    const extraTurns = 360 * 6;
    const newRotation = rotation + extraTurns + targetAngle - (rotation % 360);

    setRotation(newRotation);

    const totalTicks = 60;
    for (let t = 0; t < totalTicks; t++) {
      const offset = Math.pow(t / totalTicks, 2.5) * 4500;
      setTimeout(() => {
        audio.playTick();
      }, offset);
    }

    setTimeout(() => {
      setSpinning(false);
      setHasSpun(true);
      setPrize(selectedPrize);
      setHotelStatus('pending');

      if (selectedPrize.id === 'hotel') {
        audio.playMajestic();
      } else if (['fellation', 'calin'].includes(selectedPrize.id)) {
        audio.playWin();
      } else {
        audio.playUnlock();
      }
    }, 4500);
  };

  const handleApprove = () => {
    setHotelStatus('approved');
    audio.playMajestic();
  };

  const handleReject = () => {
    setHotelStatus('rejected');
    audio.playFail();
  };

  const updateManualScore = (value: string) => {
    const parsed = Number(value);
    const nextScore = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
    setManualPoints(nextScore);
    setHasSpun(false);
    setPrize(null);
    setHotelStatus('pending');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hunterLeagueManualScore', String(nextScore));
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 text-white p-6 bg-[#0d0d0e] rounded-2xl border border-white/10 shadow-lg">
      <div className="lg:col-span-2 space-y-4">
        <div className="p-5 bg-[#111113] border border-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e6ad12]">
              🎯 Score Hunter manuel
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">
              {pointsForWheel.toLocaleString()} PTS
            </span>
          </div>

          {roleUtilisateur === 'admin' && (
            <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="number"
                min="0"
                value={manualScoreValue}
                onChange={(event) => updateManualScore(event.target.value)}
                className="h-10 flex-1 rounded-lg border border-[#e6ad12]/30 bg-black/40 px-3 text-sm font-bold text-white outline-none focus:border-[#e6ad12]"
                aria-label="Score Hunter manuel"
              />
              <button
                type="button"
                onClick={() => updateManualScore('20001')}
                className="h-10 rounded-lg bg-[#e6ad12] px-4 text-xs font-black uppercase tracking-wider text-black transition hover:bg-amber-400"
              >
                Activer roue
              </button>
            </div>
          )}

          <div className="w-full bg-[#1c1c1e] rounded-full h-3 overflow-hidden">
            <div 
              className="bg-[#e6ad12] h-full transition-all duration-500 shadow-[0_0_10px_rgba(230,173,18,0.5)]"
              style={{ width: `${Math.min(100, (pointsForWheel / 20000) * 100)}%` }}
            />
          </div>

          {pointsForWheel < 20000 ? (
            <p className="text-xs text-gray-400 mt-3">
              Encore <strong className="text-amber-400">{(20000 - pointsForWheel).toLocaleString()} pts</strong> requis pour débloquer l&#039;accès secret à la Roue.
            </p>
          ) : pointsForWheel === 20001 ? (
            <p className="text-xs text-emerald-400 mt-3 font-semibold flex items-center gap-1.5 animate-pulse">
              ✨ Score magique atteint ! La Roue de la Fortune est activée ci-contre.
            </p>
          ) : (
            <p className="text-xs text-[#cc66ff] mt-3 font-medium">
              Tu as dépassé le jalon de la roue. Tu bénéficies du gain direct de ton palier !
            </p>
          )}
        </div>

        <div className="p-5 bg-[#111113] border border-white/5 rounded-xl space-y-2">
          <span className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase block mb-2">
            Paliers de Gains Directs
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {LOTS_CONFIG.map((lot) => {
              const isReached = pointsForWheel >= lot.val;
              const isExact = activeLot?.id === lot.id;

              return (
                <div
                  key={lot.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all duration-300 ${
                    isExact
                      ? 'bg-amber-500/10 border-[#e6ad12] text-white shadow-[0_0_15px_rgba(230,173,18,0.15)]'
                      : isReached
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-gray-300'
                        : 'bg-[#161618]/40 border-transparent text-gray-500'
                  }`}
                >
                  <div>
                    <span className="font-bold block" style={{ color: isReached ? lot.text : undefined }}>
                      {lot.label} {lot.val === 20001 && '🎲'}
                    </span>
                    <span className="text-[10px] text-gray-500">{lot.desc}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold">
                    {lot.val.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-xl p-5 flex flex-col justify-center items-center min-h-[350px]">
        {!activeLot && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              🔒
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide">Aucun lot débloqué</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                Atteins au moins 2 000 points pour débloquer ton premier lot.
              </p>
            </div>
          </div>
        )}

        {activeLot?.id === 'aleatoire' && (
          <div className="w-full flex flex-col items-center space-y-5">
            {!hasSpun ? (
              <>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
                  🎰 Roue de la Fortune Débloquée !
                </span>

                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-3 z-30 filter drop-shadow-[0_2px_4px_rgba(230,173,18,0.5)] text-lg">
                    👇
                  </div>

                  <div className="p-1.5 bg-[#0d0d0e] rounded-full border-2 border-[#e6ad12] shadow-lg">
                    <canvas
                      ref={canvasRef}
                      width="200"
                      height="200"
                      className="rounded-full transition-transform"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transitionDuration: '4500ms',
                        transitionTimingFunction: 'cubic-bezier(0.1,0.85,0.15,1)',
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={spinTheWheel}
                  disabled={spinning}
                  className="w-full py-2.5 bg-[#e6ad12] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md shadow-amber-500/10 active:scale-95 disabled:opacity-50"
                >
                  {spinning ? 'Tirage...' : 'Lancer la Roue'}
                </button>
              </>
            ) : (
              <div className="text-center space-y-4 w-full">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                  ✓
                </div>
                <div>
                  <span className="text-[9px] text-[#e6ad12] font-black tracking-widest block uppercase">TIRAGE TERMINÉ</span>
                  <h4 className="text-sm font-bold mt-1 text-white">{prize?.label}</h4>
                  <p className="text-xs text-gray-400 px-2 mt-0.5">{prize?.desc}</p>
                </div>

                {prize?.id === 'hotel' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center space-y-2.5">
                    <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider block">
                      ⏳ VALIDATION ADMIN REQUISE
                    </span>
                    {roleUtilisateur === 'admin' ? (
                      <div className="flex gap-2 justify-center">
                        <button onClick={handleApprove} className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black rounded transition-colors">Valider</button>
                        <button onClick={handleReject} className="px-2.5 py-1 bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold rounded transition-colors">Refuser</button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        En attente d&#039;approbation manuelle par Ben.
                      </p>
                    )}

                    {hotelStatus === 'approved' && (
                      <div className="text-[10px] font-bold text-emerald-400 block mt-1">✓ validé par Ben !</div>
                    )}
                    {hotelStatus === 'rejected' && (
                      <div className="text-[10px] font-bold text-red-400 block mt-1">✗ Refusé par l&#039;admin</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeLot && activeLot.id !== 'aleatoire' && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-[#e6ad12]/30 flex items-center justify-center text-[#e6ad12] mx-auto">
              🎁
            </div>
            <div>
              <span className="text-[10px] text-[#e6ad12] font-bold tracking-widest block uppercase">GAIN DIRECT SANS ROUE</span>
              <h4 className="text-base font-extrabold text-white mt-1">{activeLot.label}</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">{activeLot.desc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
