// Avatar management system with local preset images
import developer from '@assets/generated_images/Developer_avatar_pixel_art_a2515cc8.png';
import designer from '@assets/generated_images/Designer_avatar_pixel_art_50737636.png';
import manager from '@assets/generated_images/Manager_avatar_pixel_art_1555a05c.png';
import scientist from '@assets/generated_images/Scientist_avatar_pixel_art_eac1695c.png';
import astronaut from '@assets/generated_images/Astronaut_avatar_pixel_art_ccc99934.png';
import teacher from '@assets/generated_images/Teacher_avatar_pixel_art_c32e4d73.png';
import student from '@assets/generated_images/Student_avatar_pixel_art_285fb9d0.png';
import coder from '@assets/generated_images/Coder_avatar_pixel_art_a9e88700.png';

export const AVATAR_PRESETS = [
  { id: 'developer', name: 'Sviluppatore', url: developer },
  { id: 'designer', name: 'Designer', url: designer },
  { id: 'manager', name: 'Project Manager', url: manager },
  { id: 'scientist', name: 'Data Scientist', url: scientist },
  { id: 'astronaut', name: 'Astronauta', url: astronaut },
  { id: 'teacher', name: 'Insegnante', url: teacher },
  { id: 'student', name: 'Studente', url: student },
  { id: 'coder', name: 'Coder', url: coder },
];

export const getAvatarById = (id: string): string => {
  const avatar = AVATAR_PRESETS.find(a => a.id === id);
  return avatar?.url || developer; // Default fallback
};

export const getRandomAvatar = (): { id: string; url: string } => {
  const randomIndex = Math.floor(Math.random() * AVATAR_PRESETS.length);
  const avatar = AVATAR_PRESETS[randomIndex];
  return { id: avatar.id, url: avatar.url };
};