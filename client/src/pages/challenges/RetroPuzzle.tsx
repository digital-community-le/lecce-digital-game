import React from 'react';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import RetroPuzzleChallenge from '@/components/challenges/RetroPuzzle';

const RetroPuzzlePage: React.FC = () => {
  return (
    <ChallengeLayout challengeId="retro-puzzle" darkMode={true}>
      <RetroPuzzleChallenge />
    </ChallengeLayout>
  );
};

export default RetroPuzzlePage;