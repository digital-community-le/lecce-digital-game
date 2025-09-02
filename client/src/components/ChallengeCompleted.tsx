import React from 'react';

type Props = {
  title?: string;
  message?: string;
  emoji?: string;
  className?: string;
  children?: React.ReactNode;
};

const ChallengeCompleted: React.FC<Props> = ({
  title = 'Challenge Completata!',
  message,
  emoji = '🏆',
  className = '',
  children,
}) => {
  return (
    <div className={`text-center ${className}`} data-testid="challenge-completed">
      <div className="nes-container is-success is-rounded p-4 mb-4">
        <div className="text-4xl mb-2">{emoji}</div>
        <h4 className="font-retro text-sm mb-2">{title}</h4>
        {message && <p className="text-sm mb-3">{message}</p>}
        {children}
      </div>
    </div>
  );
};

export default ChallengeCompleted;
