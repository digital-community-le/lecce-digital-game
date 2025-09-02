import React from 'react';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import NetworkingForestChallenge from '@/components/challenges/NetworkingForest';

const NetworkingForestPage: React.FC = () => {
  return (
    <ChallengeLayout challengeId="networking-forest">
      <NetworkingForestChallenge />
    </ChallengeLayout>
  );
};

export default NetworkingForestPage;