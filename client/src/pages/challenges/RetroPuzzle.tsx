import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import RetroPuzzleChallenge from '@/components/challenges/RetroPuzzle';

const RetroPuzzlePage: React.FC = () => {
  return (
    <AppLayout darkMode={true}>
      <ChallengeLayout challengeId="retro-puzzle">
        <RetroPuzzleChallenge />
      </ChallengeLayout>
    </AppLayout>
  );
};

export default RetroPuzzlePage;