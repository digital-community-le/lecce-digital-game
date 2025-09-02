import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import SocialArenaChallenge from '@/components/challenges/SocialArena';

const SocialArenaPage: React.FC = () => {
  return (
    <AppLayout>
      <ChallengeLayout challengeId="social-arena">
        <SocialArenaChallenge />
      </ChallengeLayout>
    </AppLayout>
  );
};

export default SocialArenaPage;