import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import NetworkingForestChallenge from '@/components/challenges/NetworkingForest';

const NetworkingForestPage: React.FC = () => {
  return (
    <AppLayout>
      <ChallengeLayout challengeId="networking-forest">
        <NetworkingForestChallenge />
      </ChallengeLayout>
    </AppLayout>
  );
};

export default NetworkingForestPage;