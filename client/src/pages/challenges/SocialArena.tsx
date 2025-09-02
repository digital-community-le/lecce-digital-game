import React from 'react';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import SocialArenaChallenge from '@/components/challenges/SocialArena';

const SocialArenaPage: React.FC = () => {
  return (
    <ChallengeLayout challengeId="social-arena">
      <SocialArenaChallenge />
    </ChallengeLayout>
  );
};

export default SocialArenaPage;