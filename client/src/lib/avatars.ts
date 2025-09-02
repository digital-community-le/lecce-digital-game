// Avatar management system with local preset images - Full body characters
import maleDeveloper from '@assets/avatars/male_developer.png';
import femaleDeveloper from '@assets/avatars/female_developer.png';
import maleDesigner from '@assets/avatars/male_designer.png';
import femaleDesigner from '@assets/avatars/female_designer.png';
import maleManager from '@assets/avatars/male_manager.png';
import femaleManager from '@assets/avatars/female_manager.png';
import maleScientist from '@assets/avatars/male_scientist.png';
import femaleScientist from '@assets/avatars/female_scientist.png';

export type AvatarPreset = { id: string; name: string; url: string };

// Exported as `let` so we can replace the presets at runtime when the
// application fetches `/game-data.json`. Other modules importing this
// binding will observe updates thanks to ES module live bindings.
export let AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'male-developer', name: 'Sviluppatore', url: maleDeveloper },
  { id: 'female-developer', name: 'Sviluppatrice', url: femaleDeveloper },
  { id: 'male-designer', name: 'Designer', url: maleDesigner },
  { id: 'female-designer', name: 'Designer', url: femaleDesigner },
  { id: 'male-manager', name: 'Project Manager', url: maleManager },
  { id: 'female-manager', name: 'Project Manager', url: femaleManager },
  { id: 'male-scientist', name: 'Data Scientist', url: maleScientist },
  { id: 'female-scientist', name: 'Data Scientist', url: femaleScientist },
];

export const getAvatarById = (id: string): string => {
  const avatar = AVATAR_PRESETS.find(a => a.id === id);
  return avatar?.url || maleDeveloper; // Default fallback
};

export const getRandomAvatar = (): { id: string; url: string } => {
  const randomIndex = Math.floor(Math.random() * AVATAR_PRESETS.length);
  const avatar = AVATAR_PRESETS[randomIndex];
  return { id: avatar.id, url: avatar.url };
};