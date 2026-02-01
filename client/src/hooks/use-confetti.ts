import confetti from "canvas-confetti";

export function useLevelUpConfetti() {
  const triggerLevelUp = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ["#C9A24D", "#FFD700", "#FFA500", "#FF69B4", "#9370DB"];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const triggerSimple = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C9A24D", "#FFD700", "#FFA500"],
    });
  };

  return { triggerLevelUp, triggerSimple };
}
