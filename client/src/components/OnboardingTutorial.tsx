import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export function OnboardingTutorial() {
  const [run, setRun] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && location === '/') {
      setRun(true);
    }
  }, [location]);

  const steps: Step[] = [
    {
      target: 'body',
      content: 'Bienvenue sur AgencyFlow ! Laissez-nous vous faire découvrir les fonctionnalités clés.',
      placement: 'center',
    },
    {
      target: '[data-testid="link-dashboard"]',
      content: 'Ici, vous avez une vue d\'ensemble de votre activité, vos revenus et vos tâches urgentes.',
      placement: 'right',
    },
    {
      target: '[data-testid="link-projects"]',
      content: 'Gérez vos projets en cours et suivez leur avancement.',
      placement: 'right',
    },
    {
      target: '[data-testid="link-orders"]',
      content: 'Suivez vos commandes et transactions financières.',
      placement: 'right',
    },
    {
      target: '[data-testid="link-messages"]',
      content: 'Communiquez avec vos modèles et votre équipe ici.',
      placement: 'right',
    },
    {
      target: '[data-testid="link-tasks"]',
      content: 'Organisez votre routine quotidienne avec cette checklist collaborative.',
      placement: 'right',
    },
    {
      target: '[data-testid="button-theme-toggle"]',
      content: 'Basculez entre le mode clair et sombre selon vos préférences.',
      placement: 'bottom',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: '#C9A24D',
          backgroundColor: '#0A0A0A',
          textColor: '#FFFFFF',
          arrowColor: '#0A0A0A',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        buttonNext: {
          backgroundColor: '#C9A24D',
          color: '#000000',
          fontWeight: 'bold',
          borderRadius: '8px',
        },
        buttonBack: {
          color: '#FFFFFF',
          marginRight: '10px',
        },
        buttonSkip: {
          color: 'rgba(255, 255, 255, 0.5)',
        }
      }}
      locale={{
        back: 'Retour',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer'
      }}
    />
  );
}
