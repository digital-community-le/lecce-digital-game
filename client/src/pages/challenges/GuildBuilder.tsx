import React from 'react';
import ChallengeLayout from '@/components/layout/ChallengeLayout';
import GuildBuilderChallenge from '@/components/challenges/GuildBuilder';

const GuildBuilderPage: React.FC = () => {
  return (
    <ChallengeLayout challengeId="guild-builder">
      <GuildBuilderChallenge />
    </ChallengeLayout>
  );
};

export default GuildBuilderPage;
