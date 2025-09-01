// Avatar management system with local preset images - Full body characters
import maleDeveloper from '@assets/generated_images/Male_developer_full_body_af9636a7.png';
import femaleDeveloper from '@assets/generated_images/Female_developer_full_body_a80fea95.png';
import maleDesigner from '@assets/generated_images/Male_designer_full_body_01a6c883.png';
import femaleDesigner from '@assets/generated_images/Female_designer_full_body_098049d8.png';
import maleManager from '@assets/generated_images/Male_manager_full_body_8f494ac7.png';
import femaleManager from '@assets/generated_images/Female_manager_full_body_56be1c7f.png';
import maleScientist from '@assets/generated_images/Male_scientist_full_body_182cfd30.png';
import femaleScientist from '@assets/generated_images/Female_scientist_full_body_b1999dcf.png';

export const AVATAR_PRESETS = [
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