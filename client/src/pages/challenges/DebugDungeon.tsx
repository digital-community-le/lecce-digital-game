import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import DebugDungeonChallenge from '@/components/challenges/DebugDungeon';

const DebugDungeonPage: React.FC = () => {
  return (
    <AppLayout darkMode={true}>
      <ChallengeLayout challengeId="debug-dungeon">
        <DebugDungeonChallenge />
      </ChallengeLayout>
    </AppLayout>
  );
};

export default DebugDungeonPage;