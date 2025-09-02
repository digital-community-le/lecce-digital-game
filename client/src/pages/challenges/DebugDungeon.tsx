import React from 'react';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import DebugDungeonChallenge from '@/components/challenges/DebugDungeon';

const DebugDungeonPage: React.FC = () => {
  return (
    <ChallengeLayout challengeId="debug-dungeon" darkMode={true}>
      <DebugDungeonChallenge />
    </ChallengeLayout>
  );
};

export default DebugDungeonPage;